#!/bin/bash
# Sumsub Design Skills — macOS installer
# Double-click to install or update all design skills into ~/.claude/skills/

set -e

REPO="https://github.com/SumsubProductDesign/sumsub-design-skills"
TARGET="$HOME/.claude/skills"
TMP_DIR="$(mktemp -d)"

cd "$(dirname "$0")"

echo ""
echo "======================================"
echo "  Sumsub Design Skills — Installer"
echo "======================================"
echo ""

# Check if we're already in the repo (ran from cloned dir) or need to download
if [ -d "skills" ] && [ -f "README.md" ]; then
  echo "[1/3] Using local skills from $(pwd)"
  SOURCE_SKILLS="$(pwd)/skills"
else
  echo "[1/3] Downloading latest skills from GitHub..."
  if command -v git &> /dev/null; then
    git clone --depth 1 "$REPO" "$TMP_DIR/repo" > /dev/null 2>&1
  else
    # Fallback to curl + tar if no git
    curl -fsSL "$REPO/archive/refs/heads/main.tar.gz" -o "$TMP_DIR/repo.tar.gz"
    mkdir -p "$TMP_DIR/repo"
    tar -xzf "$TMP_DIR/repo.tar.gz" -C "$TMP_DIR/repo" --strip-components=1
  fi
  SOURCE_SKILLS="$TMP_DIR/repo/skills"
fi

# Make sure target directory exists
mkdir -p "$TARGET"

echo "[2/3] Installing skills into $TARGET"
# Copy each skill (merge — don't touch unrelated skills in $TARGET)
for SKILL_DIR in "$SOURCE_SKILLS"/*/; do
  SKILL_NAME="$(basename "$SKILL_DIR")"
  echo "       - $SKILL_NAME"
  rm -rf "$TARGET/$SKILL_NAME"
  cp -R "$SKILL_DIR" "$TARGET/$SKILL_NAME"
done

echo "[3/3] Cleaning up"
rm -rf "$TMP_DIR"

echo ""
echo "======================================"
echo "  Done!"
echo "======================================"
echo ""
echo "Installed skills:"
ls -1 "$TARGET"
echo ""
echo "Restart Claude Desktop to pick up the new skills."
echo "Then in the Code tab, type /mockup or /specs-docs to use them."
echo ""
read -n 1 -s -r -p "Press any key to close..."
echo ""
