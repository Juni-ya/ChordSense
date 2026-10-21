import fs from 'fs/promises';
import path from 'path';
import type { GeminiChordResponse, VideoMetadata } from '../types/index.js';
import type { TabGrounding } from './tabRetriever.js';

/**
 * Builds the HarmTrace-inspired tonal grammar prompt for Gemini.
 * Injects verified tab grounding if available for ultra-high accuracy score-to-audio alignment.
 */
function buildHarmTraceSystemPrompt(metadata?: VideoMetadata, tabGrounding?: TabGrounding | null): string {
  const metaContext = metadata
    ? `Track Context:
- Title: "${metadata.title}"
- Artist: "${metadata.artist || 'Unknown'}"`
    : '';

  const groundingSection = tabGrounding
    ? `
=== VERIFIED HARMONIC GROUND TRUTH (ULTIMATE-GUITAR / CHORDIFY) ===
- Song: "${tabGrounding.song}" by "${tabGrounding.artist}"
- Official Tonal Key: ${tabGrounding.key || 'Unknown'}
- Recommended Guitar Capo: ${tabGrounding.capo ?? 0}
- Tuning: ${tabGrounding.tuning || 'Standard'}
${tabGrounding.leadSheet ? `\nVerified Chord Chart:\n${tabGrounding.leadSheet}\n` : ''}

=== SCORE-TO-AUDIO ALIGNMENT INSTRUCTION ===
1. Use the verified harmonic score and key above as your gold-standard ground truth.
2. Listen to this specific audio performance and align each chord from the verified progression to the EXACT physical downbeats and timestamps (startTime, endTime in seconds).
3. Transcribe sounding concert chords in the key of ${tabGrounding.key || 'the song'}.
4. Set "detectedKey" to "${tabGrounding.key || 'Unknown'}" and "suggestedCapo" to ${tabGrounding.capo ?? 0}.
`
    : '';

  return `You are a world-class Automatic Chord Recognition (ACR) and Music Information Retrieval (MIR) engine, modeled after Chordify and Utrecht University's HarmTrace tonal harmony parser.
Your objective is to analyze the audio track and transcribe the exact musical chord progression with ultra-high precision.

${metaContext}
${groundingSection}
=== CRITICAL TONAL HARMONY & TIMING RULES ===
1. TITLE AS HARMONIC PRIOR:
   - If the track title or artist specifies a musical key or tempo (e.g. "C Major", "70 BPM", "Am backing track"), use this as a strong prior for the root key and meter.

2. AVOID FIRST-NOTE / INTRO ARPEGGIO ANCHORING BIAS (CRITICAL):
   - NEVER determine the global key of the song or the opening chord from the very first plucked note, single-string intro, or pickup lick!
   - SCALE DEGREE VS. ROOT DISTINCTION:
     * In guitar and keyboard intros, musicians routinely pluck or arpeggiate the 3rd (e.g., C# in an A Major triad: A-C#-E) or the 5th (E) first, or play an intro pickup note (anacrusis) before the downbeat root arrives.
     * Plucking C# DOES NOT mean the chord is C# or the key is C#! In the key of A Major, C# is merely the major third (scale degree 3).
   - TONIC RESOLUTION & CADENCE OVER OPENING NOTE:
     * Determine the global tonal key ("detectedKey") by examining where musical phrases resolve (e.g., V -> I, cadence closures), the lowest bass fundamental (below 250Hz) when the full rhythm enters, and the overall diatonic pitch-class collection across the first 4-8 measures.
     * If the progression cycles through A -> F#m -> Bm -> E, the tonal center is A Major, regardless of what single note is plucked first at t = 0.
   - INTRO ARPEGGIO / MONOPHONIC TREATMENT:
     * If the song begins with single-note plucks or an arpeggiated intro lick:
       - If it outlines the tonic chord, label that entire span with the TRUE tonic chord (e.g. "A", NOT separate chords like "C#" -> "E" -> "A").
       - If it is a purely monophonic melodic run or riff before the harmony begins, label it "N.C." until the harmonic downbeat lands.

3. HARMONIC DWELL TIME (DO NOT FORCE ARTIFICIAL LINEAR CHORD PROGRESSIONS):
   - CRITICAL: A song frequently holds the SAME chord for multiple consecutive measures (e.g. | A | A | D | E | or an intro/verse holding | A | A | A | A |).
   - If the music is currently playing A Major and the audio REMAINS on A Major, DO NOT advance to the next chord!
   - Only place a chord transition when the bass notes and rhythm harmony ACTUALLY transition to a new pitch center in the audio.
   - Do NOT force a mechanical 1-bar-per-chord linear cycle. Reflect the TRUE musical dwell time of each chord.

4. AUDIO-DRIVEN DOWNBEAT SYNCHRONIZATION:
   - Listen to the actual audio waveform for the physical start of the musical meter (the first kick drum, bass strum, or rhythm downbeat).
   - Account for any intro silence, count-in clicks, or spoken intro by marking it as "N.C." with its real duration.
   - Calculate measure lengths based on the true tempo (e.g., at 70 BPM in 4/4, 1 measure = 4 beats = ~3.43 seconds).
   - Ensure chord changes lock to the true downbeat transients in the audio so they sync perfectly with video playback.

5. RHYTHM SECTION FOCUS (SOLO & VOCAL CANCELLATION):
   - Determine chord roots from the low-frequency bass guitar / kick drum strikes (30Hz - 250Hz).
   - Determine chord quality from polyphonic rhythm accompaniment (rhythm guitar strums, piano chords, electric piano, organ).
   - Discard vocal vibrato, lead guitar solo licks, pentatonic blues bends, and single-note fills. Never turn a simple triad into an extension (like Cadd9 or Cmaj7) simply because a lead solo note or vocal passing tone plays over it.

6. DIATONIC HARMONY SANITY CHECK:
   - Verify that your detected chords belong to the diatonic family of the detected key (e.g., Key of A Major diatonic chords: A, Bm, C#m, D, E/E7, F#m, G#dim).
   - Do NOT output spurious roots that contradict the global tonal center.

Return ONLY valid JSON matching this exact schema:
{
  "bpm": number,
  "detectedKey": string,
  "timeSignature": string,
  "suggestedCapo": number,
  "chords": [
    {
      "startTime": number,
      "endTime": number,
      "chord": string,
      "confidence": number
    }
  ]
}

Lead Sheet Standards:
- Standard symbols: C, Am, G7, F#m7, Bbmaj7, Cmaj9, Dsus4, C/E, G/B, etc.
- Silence, drum breaks, or percussion-only intros = "N.C." (No Chord).
- Slash chords: "Root/Bass" format (e.g. "D/F#", "A/C#").`;
}

/**
 * Candidate models in priority order, determined by live probing.
 * Higher models (3.8-flash, 4-argon) are attempted first when available,
 * then falls back gracefully on 503 (high demand) or 429 (quota).
 * Only models that support audio multimodal are included.
 * gemini-3.6-flash is current primary: stable, multimodal, responds reliably.
 */
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-3.8-flash',      // Best quality — try first, 503s intermittently
  'gemini-3.6-flash',      // Stable primary: proven audio multimodal support
  'gemini-3.5-flash-lite', // Reliable fallback: fastest, always responds
];

/**
 * Analyze an audio file using Google Gemini's multimodal API.
 * Uses HarmTrace-inspired tonal grammar, score grounding, and multi-model cascade.
 */
export async function analyzeWithGemini(
  audioFilePath: string,
  metadata?: VideoMetadata,
  tabGrounding?: TabGrounding | null,
  customApiKey?: string
): Promise<GeminiChordResponse> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please enter your API key in the application settings or set it in server/.env.'
    );
  }

  // Read the audio file as base64
  const audioBuffer = await fs.readFile(audioFilePath);
  const audioBase64 = audioBuffer.toString('base64');
  
  const ext = path.extname(audioFilePath).toLowerCase();
  const mimeTypeMap: Record<string, string> = {
    '.mp3': 'audio/mp3',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
    '.flac': 'audio/flac',
  };
  const mimeType = mimeTypeMap[ext] || 'audio/mp4';

  console.log(`[analyzer] Audio size: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB (${mimeType})`);
  if (tabGrounding) {
    console.log(`[analyzer] Score Grounding Active: Key ${tabGrounding.key || 'N/A'}, Capo ${tabGrounding.capo ?? 0}`);
  }

  const systemPrompt = buildHarmTraceSystemPrompt(metadata, tabGrounding);

  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    console.log(`[analyzer] Querying model: ${model}...`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: audioBase64,
                    },
                  },
                  {
                    text: tabGrounding
                      ? `Align the verified chords of "${tabGrounding.song}" to this audio track. Return JSON.`
                      : 'Analyze this audio track and return the chord progression as JSON. Be precise with timestamps.',
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 0.8,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`[analyzer] ${model} returned HTTP ${response.status}: ${errorBody.slice(0, 150)}...`);
        // If high demand (503) or rate limit (429) or not found (404), fall back to next model
        if (response.status === 503 || response.status === 429 || response.status === 404) {
          lastError = new Error(`${model} unavailable (${response.status})`);
          continue;
        }
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
      }

      const result = await response.json();
      const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        console.warn(`[analyzer] ${model} returned empty response, trying next candidate...`);
        continue;
      }

      // Parse JSON
      let jsonStr = textContent.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed: GeminiChordResponse = JSON.parse(jsonStr);

      if (!Array.isArray(parsed.chords)) {
        throw new Error('Gemini response missing chords array');
      }
      if (typeof parsed.bpm !== 'number') {
        parsed.bpm = 120;
      }
      if (!parsed.detectedKey || parsed.detectedKey === 'Unknown') {
        parsed.detectedKey = tabGrounding?.key || 'Unknown';
      }
      if (typeof parsed.suggestedCapo !== 'number' && typeof tabGrounding?.capo === 'number') {
        parsed.suggestedCapo = tabGrounding.capo;
      }
      if (!parsed.timeSignature) {
        parsed.timeSignature = '4/4';
      }

      console.log(`[analyzer] [${model}] Detected ${parsed.chords.length} chords in key of ${parsed.detectedKey} at ${parsed.bpm} BPM`);
      return parsed;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[analyzer] Error with ${model}: ${lastError.message}`);
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to analyze the track.');
}
