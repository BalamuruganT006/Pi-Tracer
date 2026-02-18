#!/usr/bin/env bash
# Setup script for PyTutor Backend

set -euo pipefail

echo "🔧 Setting up PyTutor Backend..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements/dev.txt

echo "✅ Setup complete!"
echo "   Activate with: source venv/bin/activate"
echo "   Run with:      uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
