"""Structured, persistent alarm/event log.

Distinct from app.log (free-text application log, in `logs/`) and csv_logger.py
(raw sensor process-data history, 1-hour retention). This module exists to answer
"did an alarm/fault condition ever occur, and when" after the condition has
cleared and the in-memory diagnostics buffers (connection_events,
supervision_history, the log viewer's ring buffer) have rotated it out or been
wiped by a service restart.

Each event is one JSON line: {ts, type, severity, port, message, extra}.
Rotates at _MAX_FILE_BYTES, keeping _BACKUP_COUNT old files (same scheme as
the RotatingFileHandler used for app.log).
"""
import json
import time
from pathlib import Path
from collections import deque
from typing import Optional

_LOG_DIR = Path(__file__).parent.parent / "logs"
_LOG_PATH = _LOG_DIR / "alarms.jsonl"
_MAX_FILE_BYTES = 2 * 1024 * 1024   # 2 MB per file
_BACKUP_COUNT = 5                    # alarms.jsonl.1 .. .5
_BUFFER_SIZE = 500                   # in-memory tail for fast API reads

SEVERITY_INFO = "info"
SEVERITY_WARNING = "warning"
SEVERITY_ALARM = "alarm"


class AlarmLogger:
    def __init__(self):
        _LOG_DIR.mkdir(exist_ok=True)
        self._buffer: deque = deque(maxlen=_BUFFER_SIZE)
        self._preload_buffer()

    def _preload_buffer(self) -> None:
        """Seed the in-memory buffer from disk so a backend restart doesn't blank the viewer."""
        if not _LOG_PATH.exists():
            return
        try:
            with open(_LOG_PATH, "r", encoding="utf-8") as fh:
                lines = fh.readlines()[-_BUFFER_SIZE:]
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                try:
                    self._buffer.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
        except OSError:
            pass

    def _rotate_if_needed(self) -> None:
        try:
            if not _LOG_PATH.exists() or _LOG_PATH.stat().st_size < _MAX_FILE_BYTES:
                return
            oldest = _LOG_DIR / f"alarms.jsonl.{_BACKUP_COUNT}"
            if oldest.exists():
                oldest.unlink()
            for i in range(_BACKUP_COUNT - 1, 0, -1):
                src = _LOG_DIR / f"alarms.jsonl.{i}"
                if src.exists():
                    src.rename(_LOG_DIR / f"alarms.jsonl.{i + 1}")
            _LOG_PATH.rename(_LOG_DIR / "alarms.jsonl.1")
        except OSError:
            pass

    def log(self, event_type: str, severity: str, message: str,
            port: Optional[int] = None, extra: Optional[dict] = None) -> None:
        """Append one structured alarm/event record. Never raises — a logging
        failure must not take down the polling loop."""
        event = {
            "ts": round(time.time(), 3),
            "type": event_type,
            "severity": severity,
            "port": port,
            "message": message,
            "extra": extra or {},
        }
        self._buffer.append(event)
        try:
            self._rotate_if_needed()
            with open(_LOG_PATH, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(event) + "\n")
        except OSError:
            pass

    def recent(self, n: int = 200) -> list:
        items = list(self._buffer)
        return items[-n:]

    def file_path(self) -> Path:
        return _LOG_PATH
