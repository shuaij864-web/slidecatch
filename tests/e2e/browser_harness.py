#!/usr/bin/env python3
"""Lightweight CI smoke harness for the published source tree.

The full authenticated/live-site validation is intentionally not automated here.
"""
from pathlib import Path
import json
import subprocess

ROOT=Path(__file__).resolve().parents[2]
subprocess.run(['npm','run','build'],cwd=ROOT,check=True)
manifest=json.loads((ROOT/'dist/manifest.json').read_text(encoding='utf-8'))
assert manifest['manifest_version']==3
for name in ['background.js','content.js','popup.js','library.js','options.js']:
    path=ROOT/'dist'/name
    assert path.exists() and path.stat().st_size>100
print('SlideCatch build/browser-surface smoke harness passed.')
