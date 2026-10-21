import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { extractAudio, getVideoMetadata } from '../services/youtube.js';
import { analyzeWithGemini } from '../services/analyzer.js';
import { analyzeWithBTC } from '../services/btcAnalyzer.js';
import { analyzeWithHybrid } from '../services/hybridAnalyzer.js';
import { analyzeStudioMaster } from '../services/studioMasterAnalyzer.js';
import { searchTabChords } from '../services/tabRetriever.js';
import type { SongAnalysisResponse, ChordSegment } from '../types/index.js';

const router = Router();

/**
 * POST /api/analyze
 * Body: { url: string; refresh?: boolean; engine?: 'studio_master' | 'hybrid' | 'btc' | 'gemini' }
 *
 * Extracts audio from a YouTube video and analyzes its chord progression.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, refresh, engine } = req.body as { url?: string; refresh?: boolean; engine?: 'studio_master' | 'hybrid' | 'btc' | 'gemini' };

    if (!url) {
      res.status(400).json({ error: 'Missing "url" in request body' });
      return;
    }

    // 1. Extract videoId from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      res.status(400).json({ error: 'Invalid YouTube URL' });
      return;
    }

    const selectedEngine: 'studio_master' | 'hybrid' | 'btc' | 'gemini' =
      engine === 'btc' ? 'btc' : engine === 'gemini' ? 'gemini' : engine === 'hybrid' ? 'hybrid' : 'studio_master';

    console.log(`[analyze] Starting analysis for video: ${videoId} (engine: ${selectedEngine})${refresh ? ' (refresh forced)' : ''}`);

    // 2. Check cache (namespaced by engine so Studio Master, Hybrid, BTC, and Gemini don't collide)
    const cacheDir = path.join(os.tmpdir(), 'chordsense-cache');
    const cachePath = path.join(cacheDir, `${videoId}_${selectedEngine}.json`);
    if (!refresh) {
      try {
        const cached = await fs.readFile(cachePath, 'utf-8');
        console.log(`[analyze] Cache hit for ${videoId} (${selectedEngine})`);
        res.json(JSON.parse(cached));
        return;
      } catch {
        // Cache miss
      }
    } else {
      console.log(`[analyze] Cache bypassed for ${videoId} (${selectedEngine})`);
    }

    // 3. Get video metadata
    console.log(`[analyze] Fetching metadata...`);
    const metadata = await getVideoMetadata(videoId);

    // 3.5 Retrieve verified chord score (Ultimate-Guitar grounding)
    console.log(`[analyze] Searching verified tab score for "${metadata.title}"...`);
    const tabGrounding = await searchTabChords(metadata.title, metadata.artist);

    // 4. Extract audio to temp file
    console.log(`[analyze] Extracting audio...`);
    const audioPath = await extractAudio(videoId);

    let response: SongAnalysisResponse;

    if (selectedEngine === 'studio_master') {
      // Option 4: The Studio Master Pipeline (Meta Demucs + BTC on clean harmony + Bass tracking + Gemini)
      console.log(`[analyze] Running STUDIO MASTER PIPELINE (Demucs + BTC + Bass Inversions + Gemini)...`);
      response = await analyzeStudioMaster(audioPath, videoId, metadata, tabGrounding);
    } else if (selectedEngine === 'hybrid') {
      // Dual-Layer Hybrid Consensus (BTC + Gemini ensembled)
      console.log(`[analyze] Running Dual-Layer Consensus Engine (BTC + Gemini)...`);
      response = await analyzeWithHybrid(audioPath, metadata, tabGrounding);
    } else if (selectedEngine === 'gemini') {
      // Direct Gemini analysis
      console.log(`[analyze] Running Gemini multimodal audio recognition directly...`);
      const geminiResult = await analyzeWithGemini(audioPath, metadata, tabGrounding);
      const chords: ChordSegment[] = geminiResult.chords.map((c) => {
        const parsed = parseChordSymbol(c.chord);
        return {
          id: uuidv4(),
          startTime: c.startTime,
          endTime: c.endTime,
          chord: c.chord,
          root: parsed.root,
          quality: parsed.quality,
          bass: parsed.bass,
          confidence: c.confidence,
        };
      });
      response = {
        videoId,
        title: metadata.title,
        artist: metadata.artist,
        bpm: geminiResult.bpm,
        key: geminiResult.detectedKey,
        timeSignature: geminiResult.timeSignature,
        suggestedCapo: geminiResult.suggestedCapo || tabGrounding?.capo || 0,
        chords,
        engine: 'gemini',
      };
    } else {
      // Run BTC Transformer chord recognition
      console.log(`[analyze] Running BTC Transformer trained model analysis...`);
      try {
        response = await analyzeWithBTC(audioPath, metadata, tabGrounding);
        response.engine = 'btc';
      } catch (btcErr) {
        console.warn('[analyze] BTC model encountered error, falling back to Gemini:', btcErr);
        const geminiResult = await analyzeWithGemini(audioPath, metadata, tabGrounding);
        const chords: ChordSegment[] = geminiResult.chords.map((c) => {
          const parsed = parseChordSymbol(c.chord);
          return {
            id: uuidv4(),
            startTime: c.startTime,
            endTime: c.endTime,
            chord: c.chord,
            root: parsed.root,
            quality: parsed.quality,
            bass: parsed.bass,
            confidence: c.confidence,
          };
        });
        response = {
          videoId,
          title: metadata.title,
          artist: metadata.artist,
          bpm: geminiResult.bpm,
          key: geminiResult.detectedKey,
          timeSignature: geminiResult.timeSignature,
          suggestedCapo: geminiResult.suggestedCapo || tabGrounding?.capo || 0,
          chords,
          engine: 'btc',
        };
      }
    }

    // 7. Cache result
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(response, null, 2));

    // 8. Cleanup temp audio
    try {
      await fs.unlink(audioPath);
    } catch {
      // Non-critical
    }

    console.log(`[analyze] Analysis complete. ${response.chords.length} chords detected.`);
    res.json(response);
  } catch (error) {
    console.error('[analyze] Error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ── Helpers ──────────────────────────────────────────────

function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If user passed raw 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    // 1. Check ?v= query param (e.g., watch?v=... or watch?si=123&v=...)
    const vParam = url.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // 2. Check path segments (e.g., youtu.be/..., /embed/..., /shorts/..., /live/...)
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const last = pathParts[pathParts.length - 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(last)) {
        return last;
      }
    }
  } catch {
    // Non-standard URL format, try regex fallback
  }

  // Fallback regex matching 11-char ID after v=, youtu.be/, embed/, shorts/, or live/
  const match = trimmed.match(/(?:[?&]v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function parseChordSymbol(chord: string): { root: string; quality: string; bass?: string } {
  if (!chord || chord === 'N.C.') return { root: chord, quality: '' };

  let main = chord;
  let bass: string | undefined;

  const slashIdx = chord.lastIndexOf('/');
  if (slashIdx > 0) {
    const afterSlash = chord.slice(slashIdx + 1);
    if (/^[A-G]/.test(afterSlash)) {
      bass = afterSlash;
      main = chord.slice(0, slashIdx);
    }
  }

  const match = main.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return { root: chord, quality: '' };

  return { root: match[1], quality: match[2] || '', bass };
}

export default router;
