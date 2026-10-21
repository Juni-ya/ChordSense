import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { VideoMetadata } from '../types/index.js';

import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Resolve the path to the yt-dlp binary with fallbacks.
 */
function resolveYtDlp(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  
  // Windows Python Scripts fallback
  const userProfile = process.env.USERPROFILE || '';
  const pythonYtDlp = path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'Scripts', 'yt-dlp.exe');
  return pythonYtDlp;
}

const YTDLP = resolveYtDlp();

/**
 * Extract audio from a YouTube video and save directly as M4A/WebM/MP3.
 * Uses native stream download to avoid requiring an external ffmpeg installation.
 * Returns the path to the downloaded audio file.
 */
export async function extractAudio(videoId: string): Promise<string> {
  const outputDir = path.join(os.tmpdir(), 'chordsense-audio');
  await fs.mkdir(outputDir, { recursive: true });

  const outputTemplate = path.join(outputDir, `${videoId}.%(ext)s`);

  // Download best audio directly without requiring ffmpeg transcoding:
  // -f "ba[ext=m4a]/ba/b" prioritizes native AAC (.m4a)
  // --extractor-args "youtube:player_client=android,web" reliably bypasses YouTube 403 Forbidden errors
  const command = [
    `"${YTDLP}"`,
    '--extractor-args', '"youtube:player_client=android,web"',
    '-f', '"ba[ext=m4a]/ba/b"',
    '--no-playlist',
    '--no-warnings',
    '-o', `"${outputTemplate}"`,
    `"https://www.youtube.com/watch?v=${videoId}"`,
  ].join(' ');

  try {
    console.log(`[youtube] Downloading audio for ${videoId}...`);
    const { stdout, stderr } = await execAsync(command, { timeout: 120_000 });
    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`[youtube] yt-dlp stderr: ${stderr}`);
    }

    // Locate the actual downloaded file (could be .m4a, .webm, or .mp3)
    const files = await fs.readdir(outputDir);
    const downloaded = files.find((f) => f.startsWith(videoId));
    if (!downloaded) {
      throw new Error(`Audio file for ${videoId} not found in output directory`);
    }

    const finalPath = path.join(outputDir, downloaded);
    console.log(`[youtube] Audio saved to ${finalPath}`);
    return finalPath;
  } catch (error) {
    throw new Error(
      `Failed to extract audio: ${error instanceof Error ? error.message : 'Unknown error'}.`
    );
  }
}

/**
 * Get metadata for a YouTube video using yt-dlp.
 */
export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const command = [
    `"${YTDLP}"`,
    '--extractor-args', '"youtube:player_client=android,web"',
    '--dump-json',
    '--no-download',
    '--no-playlist',
    `"https://www.youtube.com/watch?v=${videoId}"`,
  ].join(' ');

  try {
    const { stdout } = await execAsync(command, { timeout: 30_000 });
    const info = JSON.parse(stdout);

    return {
      videoId,
      title: info.title || 'Unknown Title',
      artist: info.artist || info.uploader || undefined,
      duration: info.duration || 0,
    };
  } catch (error) {
    console.warn(`[youtube] Could not fetch metadata: ${error}`);
    // Return minimal fallback metadata
    return {
      videoId,
      title: 'Unknown Title',
      duration: 0,
    };
  }
}
