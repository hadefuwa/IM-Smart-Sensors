"""Rolling CSV data logger for IO-Link sensor readings.

Rotates files at _MAX_FILE_BYTES; deletes files older than _RETAIN_SECONDS on
each rotation so the log directory stays bounded to roughly one hour of data.
"""
import csv
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

_LOG_DIR = Path(__file__).parent / "data_logs"
_MAX_FILE_BYTES = 100 * 1024   # 100 KB per file
_RETAIN_SECONDS = 3600         # keep last hour

# One timestamp column + 8 fields per port (ports 1-4) + 3 supervision fields
_HEADER = [
    "timestamp",
    "p1_mode", "p1_temp_c", "p1_out1", "p1_out2",
    "p1_detected", "p1_signal_quality", "p1_analogue", "p1_led_on",
    "p2_mode", "p2_temp_c", "p2_out1", "p2_out2",
    "p2_detected", "p2_signal_quality", "p2_analogue", "p2_led_on",
    "p3_mode", "p3_temp_c", "p3_out1", "p3_out2",
    "p3_detected", "p3_signal_quality", "p3_analogue", "p3_led_on",
    "p4_mode", "p4_temp_c", "p4_out1", "p4_out2",
    "p4_detected", "p4_signal_quality", "p4_analogue", "p4_led_on",
    "sup_voltage", "sup_current", "sup_temp",
]


def _port_row(port: dict) -> list:
    d = port.get("pdin_decoded") or {}
    pdout = port.get("pdout_decoded") or {}
    return [
        port.get("mode", ""),
        d.get("temperature_c", ""),
        (int(d["out1"]) if "out1" in d else ""),
        (int(d["out2"]) if "out2" in d else ""),
        (int(d["object_detected"]) if "object_detected" in d else ""),
        d.get("signal_quality_percent", ""),
        d.get("analogue_value", ""),
        (int(pdout["led_on"]) if "led_on" in pdout else ""),
    ]


class CSVLogger:
    def __init__(self):
        _LOG_DIR.mkdir(exist_ok=True)
        self._fh = None
        self._writer = None
        self._current_path: Optional[Path] = None
        self._open_new_file()

    def _open_new_file(self) -> None:
        if self._fh:
            try:
                self._fh.close()
            except OSError:
                pass
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        self._current_path = _LOG_DIR / f"iolink_{ts}.csv"
        # buffering=1 → line-buffered: each row is flushed immediately
        self._fh = open(self._current_path, "w", newline="", buffering=1)
        self._writer = csv.writer(self._fh)
        self._writer.writerow(_HEADER)
        self._cleanup_old()

    def _cleanup_old(self) -> None:
        cutoff = time.time() - _RETAIN_SECONDS
        for f in _LOG_DIR.glob("iolink_*.csv"):
            try:
                if f.stat().st_mtime < cutoff:
                    f.unlink()
            except OSError:
                pass

    def log(self, state: dict) -> None:
        """Append one row for the current system_state snapshot."""
        try:
            # Rotate when current file reaches the size limit
            if self._fh and self._fh.tell() >= _MAX_FILE_BYTES:
                self._open_new_file()

            ports_map = {p["port"]: p for p in (state.get("ports") or []) if isinstance(p, dict)}
            sup = state.get("supervision") or {}

            row = [round(time.time(), 3)]
            for n in (1, 2, 3, 4):
                row.extend(_port_row(ports_map.get(n, {})))
            row += [
                sup.get("voltage", ""),
                sup.get("current", ""),
                sup.get("temperature", ""),
            ]
            self._writer.writerow(row)
        except Exception:
            pass  # never crash the caller over a logging failure

    def clear(self) -> None:
        """Delete all log files and start a fresh one."""
        if self._fh:
            try:
                self._fh.close()
            except OSError:
                pass
            self._fh = None
        for f in _LOG_DIR.glob("iolink_*.csv"):
            try:
                f.unlink()
            except OSError:
                pass
        self._open_new_file()

    def read_history(self, minutes: int = 60, port_labels: dict = None) -> dict:
        """Return downsampled (10 s buckets) time-series for all sensor types."""
        cutoff = time.time() - minutes * 60
        files = sorted(_LOG_DIR.glob("iolink_*.csv"))

        raw_rows: list[dict] = []
        for f in files:
            try:
                with open(f, newline="") as fh:
                    for row in csv.DictReader(fh):
                        try:
                            if float(row["timestamp"]) >= cutoff:
                                raw_rows.append(row)
                        except (ValueError, KeyError):
                            pass
            except OSError:
                pass

        if not raw_rows:
            return {}

        # Group into 10-second buckets
        bucket_size = 10
        buckets: dict[int, list[dict]] = {}
        for row in raw_rows:
            key = int(float(row["timestamp"]) // bucket_size)
            buckets.setdefault(key, []).append(row)

        def _avg(field: str, rows: list[dict]):
            vals = [float(r[field]) for r in rows if r.get(field) not in ("", None)]
            return round(sum(vals) / len(vals), 3) if vals else None

        def _build_series(field: str) -> dict:
            labels, values = [], []
            for bk in sorted(buckets):
                br = buckets[bk]
                avg_ts = sum(float(r["timestamp"]) for r in br) / len(br)
                labels.append(datetime.fromtimestamp(avg_ts).strftime("%H:%M"))
                values.append(_avg(field, br))
            return {"labels": labels, "values": values}

        # Map device_type_hint → port prefix (e.g. "temperature" → "p3")
        pl = port_labels or {}
        type_port: dict[str, str] = {}
        for port_str, cfg in pl.items():
            hint = cfg.get("device_type_hint", "")
            if hint:
                type_port[hint] = f"p{port_str}"

        def port_series(hint: str, field_suffix: str):
            prefix = type_port.get(hint)
            return _build_series(f"{prefix}_{field_suffix}") if prefix else None

        result: dict = {}

        s = port_series("temperature", "temp_c")
        if s:
            result["temperature"] = s

        s = port_series("photo_electric", "detected")
        if s:
            result["photo_detected"] = s

        s = port_series("photo_electric", "signal_quality")
        if s:
            result["photo_signal_quality"] = s

        s = port_series("capacitive", "detected")
        if s:
            result["cap_detected"] = s

        s = port_series("capacitive", "analogue")
        if s:
            result["cap_analogue"] = s

        result["sup_voltage"] = _build_series("sup_voltage")
        result["sup_current"] = _build_series("sup_current")
        result["sup_temp"]    = _build_series("sup_temp")

        return result
