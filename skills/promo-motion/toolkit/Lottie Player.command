#!/bin/bash
# Double-click to start the Lottie player. Keep this window open while you use it; close it to stop.
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null; then
  echo "python3 not found. Install Xcode Command Line Tools: xcode-select --install"
  read -n1 -p "Press any key to close"; exit 1
fi
python3 player/serve.py
echo; read -n1 -p "Player stopped. Press any key to close"
