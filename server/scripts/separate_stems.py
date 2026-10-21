import os
import sys
import json
import torch

script_dir = os.path.dirname(os.path.abspath(__file__))
# Check local server/node_modules/ffmpeg-static
ffmpeg_dir = os.path.abspath(os.path.join(script_dir, "..", "node_modules", "ffmpeg-static"))
if os.path.exists(ffmpeg_dir):
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

from demucs.separate import main as demucs_main

def separate_track(audio_path, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    track_basename = os.path.splitext(os.path.basename(audio_path))[0]
    
    # Run demucs with htdemucs on CPU with mp3 output
    print(f"[separate_stems] Starting HTDemucs stem separation for {audio_path}...")
    sys.argv = ["demucs", "-n", "htdemucs", "-d", "cpu", "--mp3", "-o", out_dir, audio_path]
    demucs_main()
    
    htdemucs_dir = os.path.join(out_dir, "htdemucs", track_basename)
    stems = {
        "other": os.path.join(htdemucs_dir, "other.mp3"),
        "bass": os.path.join(htdemucs_dir, "bass.mp3"),
        "vocals": os.path.join(htdemucs_dir, "vocals.mp3"),
        "drums": os.path.join(htdemucs_dir, "drums.mp3"),
    }
    
    print("[separate_stems] Success!")
    print(json.dumps(stems, indent=2))
    return stems

if __name__ == "__main__":
    if len(sys.argv) > 2:
        separate_track(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python separate_stems.py <audio_path> <out_dir>")
