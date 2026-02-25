#!/usr/bin/env bash
# Build the Lambda zip package for the ski-app backend.
#
# Run this before every `cdk deploy ApiStack` (or any stack that uses the
# Lambda function).  Output goes to backend/lambda_pkg/ which CDK zips and
# uploads automatically.
#
# Usage:
#   ./scripts/build_lambda.sh           # from repo root
#   npm run build:lambda                # from cdk/ directory

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
PKG_DIR="$BACKEND_DIR/lambda_pkg"

echo "=== Building Lambda package ==="

# Clean previous build
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR"

# Install Python dependencies into the package directory.
# Use --platform to download Linux-compatible wheels (manylinux2014_x86_64)
# so compiled extensions like pydantic_core work on Lambda (Amazon Linux x86_64)
# even when building from macOS. --only-binary=:all: ensures no source compilation.
echo "Installing Python dependencies (targeting linux/amd64)..."
python3 -m pip install \
  -r "$BACKEND_DIR/requirements.txt" \
  -t "$PKG_DIR" \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 312 \
  --only-binary=:all: \
  --quiet \
  --upgrade

# Copy application source code
echo "Copying app source..."
cp -r "$BACKEND_DIR/app" "$PKG_DIR/"

# Remove unwanted files to keep the zip lean.
# Note: .dist-info directories are intentionally kept — pg8000's scramp dependency
# uses importlib.metadata at runtime and will fail with ImportModuleError if removed.
find "$PKG_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$PKG_DIR" -name "*.pyc" -delete 2>/dev/null || true

SIZE=$(du -sh "$PKG_DIR" | cut -f1)
echo ""
echo "Lambda package ready at: $PKG_DIR"
echo "Package size: $SIZE"
echo ""
echo "Next step: cd cdk && npx cdk deploy ApiStack"
