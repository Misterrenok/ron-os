#!/usr/bin/env python3
"""Run the System controller authorization regression contract."""

from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name("system_controller_routing_guard.py")), run_name="__main__")
