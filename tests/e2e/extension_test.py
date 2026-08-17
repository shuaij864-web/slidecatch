#!/usr/bin/env python3
"""Placeholder entry point for full unpacked-extension validation.

Run a manual Chrome smoke test or extend this harness with Playwright on an unrestricted runner.
The repository does not attempt to bypass enterprise browser policies.
"""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[2]
subprocess.run(['npm','run','build'],cwd=ROOT,check=True)
print('Production extension build passed. Full unpacked-extension lifecycle requires an unrestricted Chromium runner.')
