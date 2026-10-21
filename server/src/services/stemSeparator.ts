import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';

export interface SeparatedStems {
  other: string; // Guitars, keys, piano, synths (100% free of bass, drums, vocals)
  bass: string;  // Isolated bass guitar & sub frequencies
  vocals: string;
  drums: string;
}

/**
 * Executes Meta AI's Hybrid Transformer Demucs (HTDemucs) on the audio.
 * Isolates the track into 4 pristine audio stems:
 * - other.mp3 (guitars and piano only)
 * - bass.mp3 (bass fundamental only)
 * - vocals.mp3
 * - drums.mp3
 *
 * Caches separated stems in temp storage by videoId so subsequent queries are instantaneous.
 */
export async function separateStems(audioPath: string, videoId: string): Promise<SeparatedStems> {
  const stemsBaseDir = path.join(os.tmpdir(), 'chordsense-stems', videoId);
  const trackBasename = path.basename(audioPath, path.extname(audioPath));
  const expectedDir = path.join(stemsBaseDir, 'htdemucs', trackBasename);

  const stems: SeparatedStems = {
    other: path.join(expectedDir, 'other.mp3'),
    bass: path.join(expectedDir, 'bass.mp3'),
    vocals: path.join(expectedDir, 'vocals.mp3'),
    drums: path.join(expectedDir, 'drums.mp3'),
  };

  // Check stem cache
  if (fsSync.existsSync(stems.other) && fsSync.existsSync(stems.bass)) {
    console.log(`[stemSeparator] Stem cache hit for ${videoId}! Reusing isolated stems.`);
    return stems;
  }

  await fs.mkdir(stemsBaseDir, { recursive: true });

  const scriptPath = path.resolve('scripts/separate_stems.py');
  const resolvedScript = fsSync.existsSync(scriptPath)
    ? scriptPath
    : path.resolve(process.cwd(), 'server/scripts/separate_stems.py');

  console.log(`[stemSeparator] Running Meta HTDemucs on ${audioPath} (saving to ${stemsBaseDir})...`);

  return new Promise((resolve, reject) => {
    const proc = spawn('python', [resolvedScript, audioPath, stemsBaseDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
    });

    let stderr = '';
    let stdout = '';

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      // Log progress lines
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.includes('%') || line.includes('HTDemucs') || line.includes('Separating')) {
          console.log(`[stemSeparator] ${line.trim()}`);
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && fsSync.existsSync(stems.other) && fsSync.existsSync(stems.bass)) {
        console.log(`[stemSeparator] HTDemucs separation finished successfully.`);
        resolve(stems);
      } else {
        console.warn(`[stemSeparator] Demucs failed with code ${code}. Stderr: ${stderr.slice(-500)}`);
        // Fallback: If demucs fails or cannot run, return original audio as 'other' and 'bass'
        console.warn(`[stemSeparator] Falling back to direct audio processing.`);
        resolve({
          other: audioPath,
          bass: audioPath,
          vocals: audioPath,
          drums: audioPath,
        });
      }
    });

    proc.on('error', (err) => {
      console.warn(`[stemSeparator] Could not spawn python demucs process: ${err.message}`);
      resolve({
        other: audioPath,
        bass: audioPath,
        vocals: audioPath,
        drums: audioPath,
      });
    });
  });
}
