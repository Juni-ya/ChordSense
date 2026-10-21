import os
import sys
import subprocess
import torch

print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")

# Path to ffmpeg-static
ffmpeg_dir = os.path.abspath("server/node_modules/ffmpeg-static")
if os.path.exists(ffmpeg_dir):
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
    print(f"Added ffmpeg to PATH: {ffmpeg_dir}")

# Check demucs CLI
res = subprocess.run(["demucs", "--help"], capture_output=True, text=True)
print(f"Demucs exit code: {res.returncode}")
print("Demucs is ready to separate stems!")
