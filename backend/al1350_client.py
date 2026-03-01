"""
AL1350 client manager with:
- shared AsyncClient capped at 3 max connections
- retry + jitter backoff
- circuit breaker
- protocol-service hooks (gettree/getdatamulti/subscribe) with safe fallback
- diagnostics metrics for admin observability
"""

from __future__ import annotations

import asyncio
import ipaddress
import logging
import math
import os
import random
import subprocess
import time
from collections import deque
from typing import Any, Dict, List, Optional, Tuple

import httpx

MODE_MAP = {0: "inactive", 1: "digital_in", 2: "digital_out", 3: "io-link"}


def _percentile(values: List[float], percentile: float) -> Optional[float]:
    if not values:
        return None
    if len(values) == 1:
        return float(values[0])
    rank = (len(values) - 1) * percentile
    lo = math.floor(rank)
    hi = math.ceil(rank)
    if lo == hi:
        return float(values[lo])
    return float(values[lo] + (values[hi] - values[lo]) * (rank - lo))


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_sec: float = 15.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_sec = recovery_sec
        self.state = "closed"
        self.failures = 0
        self.opened_at = 0.0

    def allow_request(self) -> bool:
        now = time.time()
        if self.state == "open":
            if now - self.opened_at >= self.recovery_sec:
                self.state = "half-open"
                return True
            return False
        return True

    def record_success(self) -> None:
        self.failures = 0
        self.state = "closed"

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.state = "open"
            self.opened_at = time.time()
        elif self.state == "half-open":
            self.state = "open"
            self.opened_at = time.time()


class AL1350ClientManager:
    def __init__(self, config_loader, logger: Optional[logging.Logger] = None) -> None:
        self._load_config = config_loader
        self._logger = logger or logging.getLogger(__name__)
        self._client: Optional[httpx.AsyncClient] = None
        self._client_lock = asyncio.Lock()
        self._sem = asyncio.Semaphore(3)
        self._timeout_sec = 4.0
        self._base_url = "http://192.168.7.4"
        self._scheme = "http"
        self._master_ip = "192.168.7.4"
        self._master_port = 80
        self._breaker = CircuitBreaker(failure_threshold=5, recovery_sec=15.0)

        self.tree_cache: Optional[Dict[str, Any]] = None
        self.tree_last_refresh_ts: float = 0.0
        self.tree_refresh_interval_sec: float = 300.0

        self.subscription_enabled: bool = False
        self.subscription_last_ok_ts: float = 0.0
        self.subscription_failures: int = 0
        self.subscription_reconnect_count: int = 0
        self.degraded_mode: bool = True
        self.degraded_reason: str = "boot"
        self.last_good_data_ts: float = 0.0
        self.last_error: Optional[str] = None
        self.port_freshness_ts: Dict[int, Optional[float]] = {1: None, 2: None, 3: None, 4: None}

        self.request_latencies_ms: deque = deque(maxlen=500)
        self.request_successes: int = 0
        self.request_failures: int = 0
        self._multi_supported: Optional[bool] = None
        self._next_multi_probe_ts: float = 0.0

        self._configure_from_file()

    def _configure_from_file(self) -> None:
        cfg = self._load_config().get("io_link", {})
        self._master_ip = str(cfg.get("master_ip", "192.168.7.4"))
        self._master_port = int(cfg.get("port", 80))
        self._timeout_sec = float(cfg.get("timeout_sec", 4.0))
        self._scheme = "https" if bool(cfg.get("use_https", False)) else "http"
        default_port = 443 if self._scheme == "https" else 80
        self._base_url = (
            f"{self._scheme}://{self._master_ip}"
            if self._master_port == default_port
            else f"{self._scheme}://{self._master_ip}:{self._master_port}"
        )

    async def on_config_changed(self) -> None:
        old_base = self._base_url
        old_timeout = self._timeout_sec
        self._configure_from_file()
        if old_base != self._base_url or old_timeout != self._timeout_sec:
            await self._reset_client()

    async def _reset_client(self) -> None:
        async with self._client_lock:
            if self._client is not None:
                await self._client.aclose()
                self._client = None

    async def close(self) -> None:
        await self._reset_client()

    async def _get_client(self) -> httpx.AsyncClient:
        async with self._client_lock:
            if self._client is None:
                limits = httpx.Limits(max_connections=3, max_keepalive_connections=0)
                timeout = httpx.Timeout(
                    connect=min(2.0, max(0.5, self._timeout_sec)),
                    read=self._timeout_sec,
                    write=self._timeout_sec,
                    pool=self._timeout_sec,
                )
                self._client = httpx.AsyncClient(limits=limits, timeout=timeout, http2=False)
            return self._client

    async def _request_json(
        self,
        method: str,
        path: str,
        *,
        json_body: Optional[Dict[str, Any]] = None,
        retries: int = 3,
        allow_circuit: bool = True,
    ) -> Dict[str, Any]:
        if allow_circuit and not self._breaker.allow_request():
            raise RuntimeError("Circuit breaker is open")

        client = await self._get_client()
        url = path if path.startswith("http://") or path.startswith("https://") else f"{self._base_url}{path}"
        last_exc: Optional[Exception] = None

        for attempt in range(1, retries + 1):
            started = time.perf_counter()
            try:
                async with self._sem:
                    if method == "GET":
                        resp = await client.get(url)
                    else:
                        resp = await client.post(url, json=json_body)
                resp.raise_for_status()
                payload = resp.json() if resp.content else {}
                latency_ms = (time.perf_counter() - started) * 1000.0
                self.request_latencies_ms.append(latency_ms)
                self.request_successes += 1
                self._breaker.record_success()
                return payload if isinstance(payload, dict) else {"value": payload}
            except Exception as exc:  # noqa: BLE001
                latency_ms = (time.perf_counter() - started) * 1000.0
                self.request_latencies_ms.append(latency_ms)
                self.request_failures += 1
                self._breaker.record_failure()
                self.last_error = str(exc)
                last_exc = exc
                if attempt < retries:
                    # jittered exponential backoff, capped
                    await asyncio.sleep(min(1.5, (2 ** (attempt - 1)) * 0.2 + random.uniform(0.0, 0.15)))
                continue
        raise RuntimeError(f"{method} {url} failed after {retries} attempts: {last_exc}")

    async def _service_request(self, adr: str, data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        payload: Dict[str, Any] = {"code": "request", "cid": -1, "adr": adr}
        if data is not None:
            payload["data"] = data

        # AL1350 documentation states a POST request; path varies by setup.
        for path in ("/", "/iotcore"):
            try:
                res = await self._request_json("POST", path, json_body=payload, retries=2, allow_circuit=False)
                if isinstance(res, dict):
                    return res
            except Exception:
                continue
        return None

    async def refresh_gettree(self, force: bool = False) -> Optional[Dict[str, Any]]:
        now = time.time()
        if not force and self.tree_cache and (now - self.tree_last_refresh_ts) < self.tree_refresh_interval_sec:
            return self.tree_cache
        tree = await self._service_request("gettree")
        if tree:
            self.tree_cache = tree
            self.tree_last_refresh_ts = now
        return self.tree_cache

    async def _try_getdatamulti(self, paths: List[str]) -> Optional[Dict[str, Any]]:
        if not paths:
            return {}
        now = time.time()
        if self._multi_supported is False and now < self._next_multi_probe_ts:
            return None
        # Different AL1350 firmware variants expose slightly different payload shapes.
        payload_candidates = [
            {"datatosend": paths},
            {"items": [{"adr": p} for p in paths]},
            {"adr": paths},
        ]
        for data in payload_candidates:
            res = await self._service_request("getdatamulti", data=data)
            if not isinstance(res, dict):
                continue
            out: Dict[str, Any] = {}
            if isinstance(res.get("data"), dict):
                maybe = res["data"]
                if isinstance(maybe.get("items"), list):
                    for item in maybe["items"]:
                        if isinstance(item, dict) and item.get("adr") is not None:
                            out[str(item["adr"])] = item.get("value")
                elif isinstance(maybe.get("values"), dict):
                    out = {str(k): v for k, v in maybe["values"].items()}
            if out:
                self._multi_supported = True
                self.degraded_mode = False
                self.degraded_reason = ""
                return out
        self._multi_supported = False
        self._next_multi_probe_ts = now + 120.0
        self.degraded_mode = True
        self.degraded_reason = "getdatamulti unavailable"
        return None

    async def ensure_subscription(self) -> None:
        # Best-effort subscription heartbeat. If unsupported, remain in fallback mode.
        now = time.time()
        if self.subscription_enabled and (now - self.subscription_last_ok_ts) < 15:
            return
        if now - self.subscription_last_ok_ts < 1:
            return
        res = await self._service_request("subscribe", data={"interval": 1000})
        if res:
            if not self.subscription_enabled:
                self.subscription_reconnect_count += 1
            self.subscription_enabled = True
            self.subscription_last_ok_ts = now
            self.subscription_failures = 0
            if self.degraded_reason in ("subscription unavailable", "boot"):
                self.degraded_reason = ""
        else:
            self.subscription_enabled = False
            self.subscription_failures += 1
            self.degraded_mode = True
            self.degraded_reason = "subscription unavailable"

    async def get_port_info(self, port_number: int, include_static: bool = True) -> Dict[str, Any]:
        port_data: Dict[str, Any] = {
            "port": port_number,
            "mode": "inactive",
            "comm_mode": "",
            "master_cycle_time": "",
            "vendor_id": "",
            "device_id": "",
            "name": "",
            "serial": "",
            "pdin": "",
            "pdout": "",
            "source": "fallback",
        }

        endpoints: List[Tuple[str, str]] = [
            (f"/iolinkmaster/port[{port_number}]/mode/getdata", "mode"),
            (f"/iolinkmaster/port[{port_number}]/comcode/getdata", "comm_mode"),
            (f"/iolinkmaster/port[{port_number}]/mastercycle/getdata", "master_cycle_time"),
            (f"/iolinkmaster/port[{port_number}]/iolinkdevice/pdin/getdata", "pdin"),
            (f"/iolinkmaster/port[{port_number}]/iolinkdevice/pdout/getdata", "pdout"),
        ]
        if include_static:
            endpoints.extend(
                [
                    (f"/iolinkmaster/port[{port_number}]/iolinkdevice/vendorid/getdata", "vendor_id"),
                    (f"/iolinkmaster/port[{port_number}]/iolinkdevice/deviceid/getdata", "device_id"),
                    (f"/iolinkmaster/port[{port_number}]/iolinkdevice/productname/getdata", "name"),
                    (f"/iolinkmaster/port[{port_number}]/iolinkdevice/serialnumber/getdata", "serial"),
                ]
            )

        # First, try getdatamulti for this set, then fallback endpoint GETs.
        multi_values = await self._try_getdatamulti([e[0] for e in endpoints])
        if multi_values:
            for endpoint, key in endpoints:
                value = multi_values.get(endpoint)
                if key == "mode" and isinstance(value, int):
                    value = MODE_MAP.get(value, str(value))
                if value is not None:
                    port_data[key] = value
            port_data["source"] = "getdatamulti"
            self.port_freshness_ts[port_number] = time.time()
            return port_data

        # Safe fallback path
        tasks = [self._request_json("GET", endpoint, retries=2) for endpoint, _ in endpoints]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for idx, response in enumerate(responses):
            if isinstance(response, Exception):
                continue
            if response.get("code") == 200:
                value = response.get("data", {}).get("value", "")
                key = endpoints[idx][1]
                if key == "mode" and isinstance(value, int):
                    value = MODE_MAP.get(value, str(value))
                port_data[key] = value
        self.port_freshness_ts[port_number] = time.time()
        return port_data

    async def poll_ports(self, include_static: bool = True) -> List[Dict[str, Any]]:
        tasks = [self.get_port_info(i, include_static=include_static) for i in range(1, 5)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        ports: List[Dict[str, Any]] = []
        for idx, result in enumerate(results, start=1):
            if isinstance(result, Exception):
                ports.append(
                    {
                        "port": idx,
                        "mode": "error",
                        "comm_mode": "",
                        "master_cycle_time": "",
                        "vendor_id": "",
                        "device_id": "",
                        "name": "",
                        "serial": "",
                        "pdin": "",
                        "pdout": "",
                        "source": "error",
                    }
                )
            else:
                ports.append(result)
        return ports

    async def get_device_info(self) -> Dict[str, Any]:
        info = {"device_name": "IO-Link Master", "software": {}, "device_icon_url": None}
        try:
            name_res = await self._request_json("GET", "/devicetag/applicationtag/getdata", retries=2)
            if name_res.get("code") == 200:
                info["device_name"] = name_res.get("data", {}).get("value") or "IO-Link Master"
        except Exception:
            pass

        software_paths = [
            ("deviceinfo/software/getdata", "Firmware"),
            ("deviceinfo/bootloaderrevision/getdata", "Bootloader"),
            ("software/firmware/getdata", "Firmware"),
            ("software/container/getdata", "Container"),
            ("software/bootloader/getdata", "Bootloader"),
            ("software/fieldbusfirmware/getdata", "Fieldbus Firmware"),
        ]
        tasks = [self._request_json("GET", f"/{path}", retries=2) for path, _ in software_paths]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for idx, response in enumerate(responses):
            if isinstance(response, Exception):
                continue
            if response.get("code") == 200:
                value = response.get("data", {}).get("value")
                key = software_paths[idx][1]
                if value and key not in info["software"]:
                    info["software"][key] = value

        try:
            icon_res = await self._request_json("GET", "/deviceinfo/deviceicon/getdata", retries=2)
            if icon_res.get("code") == 200:
                info["device_icon_url"] = icon_res.get("data", {}).get("value")
        except Exception:
            pass
        return info

    async def poll_snapshot(self, include_static: bool = True) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        await self.refresh_gettree(force=False)
        await self.ensure_subscription()
        ports = await self.poll_ports(include_static=include_static)
        device_info = await self.get_device_info() if include_static else {"device_name": "", "software": {}, "device_icon_url": None}
        self.last_good_data_ts = time.time()
        self.degraded_mode = self.degraded_mode or (not self.subscription_enabled)
        return ports, device_info

    async def write_iot_network_setblock(
        self,
        *,
        dhcp: Optional[bool] = None,
        ipaddress_value: Optional[str] = None,
        subnetmask: Optional[str] = None,
        gateway: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Write IoT network settings atomically through iotsetup/network/setblock.
        This is best-effort because firmware payload shape can vary.
        """
        block: Dict[str, Any] = {}
        if dhcp is not None:
            block["dhcp"] = 1 if dhcp else 0
        if ipaddress_value:
            block["ipaddress"] = ipaddress_value
        if subnetmask:
            block["subnetmask"] = subnetmask
        if gateway:
            block["ipdefaultgateway"] = gateway
        if not block:
            return {"success": False, "error": "No values provided"}

        payload_candidates = [
            {"network": block},
            block,
            {"data": block},
        ]
        for data in payload_candidates:
            response = await self._service_request("iotsetup/network/setblock", data=data)
            if response:
                return {"success": True, "response": response}
        return {"success": False, "error": "setblock request failed"}

    def _read_linux_cpu_temp_c(self) -> Optional[float]:
        thermal_path = "/sys/class/thermal/thermal_zone0/temp"
        if not os.path.exists(thermal_path):
            return None
        try:
            with open(thermal_path, "r", encoding="utf-8") as f:
                return round(int(f.read().strip()) / 1000.0, 1)
        except Exception:
            return None

    def _read_linux_mem(self) -> Tuple[Optional[float], Optional[float]]:
        try:
            with open("/proc/meminfo", "r", encoding="utf-8") as f:
                lines = f.readlines()
            values = {}
            for line in lines:
                parts = line.split(":")
                if len(parts) != 2:
                    continue
                key = parts[0].strip()
                value = float(parts[1].strip().split()[0])
                values[key] = value
            total = values.get("MemTotal")
            avail = values.get("MemAvailable")
            if not total or avail is None:
                return None, None
            used_pct = round(((total - avail) / total) * 100.0, 1)
            used_mb = round((total - avail) / 1024.0, 1)
            return used_pct, used_mb
        except Exception:
            return None, None

    def _read_linux_load(self) -> Optional[float]:
        try:
            load1, _, _ = os.getloadavg()
            return round(float(load1), 2)
        except Exception:
            return None

    def _read_linux_cpu_usage_pct(self) -> Optional[float]:
        stat_path = "/proc/stat"
        try:
            with open(stat_path, "r", encoding="utf-8") as f:
                first = f.readline()
            fields = [float(x) for x in first.split()[1:8]]
            idle = fields[3] + fields[4]
            total = sum(fields)
            time.sleep(0.08)
            with open(stat_path, "r", encoding="utf-8") as f:
                first2 = f.readline()
            fields2 = [float(x) for x in first2.split()[1:8]]
            idle2 = fields2[3] + fields2[4]
            total2 = sum(fields2)
            total_delta = total2 - total
            idle_delta = idle2 - idle
            if total_delta <= 0:
                return None
            usage = 100.0 * (1.0 - (idle_delta / total_delta))
            return round(usage, 1)
        except Exception:
            return None

    def _detect_direct_link(self) -> Dict[str, Any]:
        # Best effort for Linux hosts (Pi). Non-Linux returns unknown fields.
        out = {
            "platform": os.name,
            "iface": None,
            "carrier_up": None,
            "operstate": None,
            "has_route_to_master": None,
        }
        if os.name != "posix":
            return out
        try:
            # Detect route interface for master IP
            cmd = ["sh", "-c", f"ip route get {self._master_ip} 2>/dev/null | awk '{{print $5; exit}}'"]
            iface = subprocess.check_output(cmd, text=True, timeout=1.5).strip() or None
            out["iface"] = iface
            out["has_route_to_master"] = bool(iface)
            if iface:
                carrier = f"/sys/class/net/{iface}/carrier"
                operstate = f"/sys/class/net/{iface}/operstate"
                if os.path.exists(carrier):
                    with open(carrier, "r", encoding="utf-8") as f:
                        out["carrier_up"] = f.read().strip() == "1"
                if os.path.exists(operstate):
                    with open(operstate, "r", encoding="utf-8") as f:
                        out["operstate"] = f.read().strip()
        except Exception:
            pass
        return out

    def _is_unclutter_running(self) -> Optional[bool]:
        if os.name != "posix":
            return None
        try:
            subprocess.check_output(["pgrep", "-f", "unclutter -idle 0 -root"], timeout=1.5)
            return True
        except Exception:
            return False

    def diagnostics_snapshot(self) -> Dict[str, Any]:
        lats = sorted(self.request_latencies_ms)
        success_total = self.request_successes + self.request_failures
        success_rate = round((self.request_successes / success_total) * 100.0, 1) if success_total else None
        now = time.time()
        freshness_age: Dict[str, Optional[float]] = {}
        for port, ts in self.port_freshness_ts.items():
            freshness_age[str(port)] = None if ts is None else round(max(0.0, now - ts), 1)

        cpu_pct = self._read_linux_cpu_usage_pct()
        mem_pct, mem_used_mb = self._read_linux_mem()
        payload = {
            "request_success_rate_pct": success_rate,
            "request_rtt_p50_ms": round(_percentile(lats, 0.50), 1) if lats else None,
            "request_rtt_p95_ms": round(_percentile(lats, 0.95), 1) if lats else None,
            "request_successes": self.request_successes,
            "request_failures": self.request_failures,
            "circuit_state": self._breaker.state,
            "circuit_failures": self._breaker.failures,
            "subscription_enabled": self.subscription_enabled,
            "subscription_failures": self.subscription_failures,
            "reconnect_count": self.subscription_reconnect_count,
            "degraded_mode": self.degraded_mode,
            "degraded_reason": self.degraded_reason,
            "last_good_data_ts": self.last_good_data_ts or None,
            "port_freshness_age_sec": freshness_age,
            "master_target": {
                "ip": self._master_ip,
                "port": self._master_port,
                "scheme": self._scheme,
                "is_link_local": self._is_link_local(self._master_ip),
            },
            "link": self._detect_direct_link(),
            "system": {
                "cpu_pct": cpu_pct,
                "mem_pct": mem_pct,
                "mem_used_mb": mem_used_mb,
                "load_1m": self._read_linux_load(),
                "cpu_temp_c": self._read_linux_cpu_temp_c(),
                "unclutter_running": self._is_unclutter_running(),
            },
        }
        return payload

    @staticmethod
    def _is_link_local(ip_text: str) -> bool:
        try:
            return ipaddress.ip_address(ip_text).is_link_local
        except Exception:
            return False
