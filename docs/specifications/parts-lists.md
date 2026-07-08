# 14. Parts List

**Product:** Maintenance of IO-Link Systems: Smart Sensors — Model IM4330
**Curriculum:** CP3723 & CP7395

This is the master parts list for the IM4330 training panel. It covers every major component fitted to the panel plus the reference datasheets held in this repository. Formal engineering drawing numbers have not yet been assigned (marked **TBC**) — see `docs/diagrams/IM4330 PID Schematic.docx` and `docs/diagrams/pid-schematic.html` for the current unofficial schematic/block diagrams used as drawing references until numbers are issued.

---

## 14.1 Main Assembly

| Drawing Ref | Description | Manufacturer | Part No. | Qty | CE / UL Status |
|---|---|---|---|---|---|
| TBC | IM4330 training panel assembly (baseplate, mounts, wiring) | Matrix Technology Solutions Ltd | IM4330 | 1 | CE (whole-unit declaration, LVD 2014/35/EU + RoHS 2011/65/EU) |
| TBC | 24 V DC DIN-rail power supply, w/ UK/EU/US plug adapters | TBC (supplier-sourced) | TBC | 1 | CE marked, overvoltage/short-circuit protected |
| TBC | Raspberry Pi 4 (2 GB) | Raspberry Pi Foundation | Pi 4 Model B, 2 GB | 1 | CE / FCC |
| TBC | WaveShare 1024×600 capacitive touchscreen (HDMI/USB) | WaveShare | 1024×600 (7") capacitive touch | 1 | CE / FCC |
| TBC | DC-to-DC converter module, 24 V → 5 V, ≥3 A | TBC (supplier-sourced) | TBC | 1 | CE |

## 14.2 IO-Link Master

| Drawing Ref | Description | Manufacturer | Part No. | Qty | CE / UL Status | Datasheet |
|---|---|---|---|---|---|---|
| TBC | AL1350 IO-Link master, IoT Core, 4-port, IP66/IP67 | ifm electronic | AL1350 | 1 | CE; see `docs/datasheets/Operating Manual.pdf` §"Approvals" | `docs/datasheets/Operating Manual.pdf` / `docs/datasheets/Operating Manual.txt` |

## 14.3 Field Devices (Sensors and Light Stack)

| Drawing Ref | Port | Description | Manufacturer | Part No. | Qty | CE / UL Status | Datasheet |
|---|---|---|---|---|---|---|---|
| TBC | 1 | Inductive proximity sensor, M18, IO-Link COM3 | Omron | E2E-X16MB1T12 | 1 | CE / cULus (confirm on unit label) | `docs/datasheets/e2e_iodd_temp/` (IODD set), `docs/datasheets/e2e[q]-xxbxxxx_io-link_iodd_file_en.zip` |
| TBC | 2 | Capacitive proximity sensor, M18, IO-Link | Carlo Gavazzi (RS PRO OEM) | CA18FAF08BP | 1 | CE (confirm cULus on unit label) | `docs/datasheets/Carlo Gavazzi CA18FAF08BP.pdf`, `docs/datasheets/Capacitive Proximity.pdf` / `.txt`, `docs/datasheets/Capacitive Proximity Family.pdf` / `.txt` |
| TBC | 3 | PT100 temperature sensor, IO-Link, dual switching output | ifm electronic | TV7105 | 1 | CE (confirm on unit label) | `docs/datasheets/TV7105.pdf` / `docs/datasheets/TV7105.txt` |
| TBC | 4 | RGB LED column light, PDout-only, IO-Link | Banner Engineering | CL50PKQ (CL50 Pro series) | 1 | CE / cULus | `docs/datasheets/CL50PKQ.pdf`, `docs/datasheets/CL50PKQ extra datasheet.pdf`, `docs/datasheets/CL50PKQ _ CL50 Pro Series 50 mm Programmable Column Lights.html` |

## 14.4 Cabling and Accessories

| Drawing Ref | Description | Manufacturer | Part No. | Qty | CE / UL Status |
|---|---|---|---|---|---|
| TBC | M12 5-pin IO-Link cable, 2 m, PUR jacket | TBC (supplier-sourced) | TBC | 4 (1 per port, +1 spare) | CE |
| TBC | Ethernet patch cable, Cat5e, 1 m | TBC (supplier-sourced) | TBC | 2 | CE |
| TBC | Unmanaged 4-port Ethernet switch | TBC (supplier-sourced) | TBC | 1 | CE / FCC |
| TBC | Raspberry Pi microSD card, 32 GB Class 10 / A1 | TBC (supplier-sourced) | TBC | 1 | — |

---

## 14.5 Spare / Replacement Parts List

Recommended critical spares to hold for uninterrupted training delivery (see also `docs/manuals/User Manual/user-manual.md` §10 for the full maintenance-manual version of this list).

| Item | Manufacturer / Part No. | Qty Recommended | Notes |
|---|---|---|---|
| Proximity sensor | Omron E2E-X16MB1T12 | 1 | Standard M18 inductive IO-Link |
| Capacitive sensor | Carlo Gavazzi CA18FAF08BP (RS PRO equivalent) | 1 | M18 capacitive IO-Link |
| Temperature sensor | ifm TV7105 | 1 | PT100 IO-Link — high value; replace only on failure |
| Light stack | Banner CL50 Pro (CL50PKQ or equivalent) | 1 | PDout RGB IO-Link; check firmware version on replacement — see CLAUDE.md "Intensity Sweep — Firmware Bug (v1.0.2)" |
| M12 5-pin IO-Link cable, 2 m | — | 2 | One per sensor type; replace if jacket damaged |
| Raspberry Pi microSD card, 32 GB Class 10 / A1 | — | 1 | Pre-imaged backup of the Pi system |
| DC-to-DC converter module, 24 V → 5 V, ≥3 A | — | 1 | Panel board Pi power converter |
| Ethernet patch cable, Cat5e, 1 m | — | 2 | Master-to-switch and Pi-to-switch |
| Unmanaged 4-port Ethernet switch | — | 1 | Replace if a port fails |
| 24 V DC DIN-rail PSU, 2 A minimum | — | 1 | Confirm voltage before connecting a replacement |

---

## 14.6 Open Items

- **Formal drawing numbers** for the panel assembly and all sub-components are **TBC** — this list currently references source documents in `docs/` rather than issued drawing numbers.
- **CE/UL status** above is drawn from each component's individual datasheet where stated; several entries are marked "confirm on unit label" because the datasheet on file does not explicitly print a certification mark for the exact ordered variant. Verify the physical label on each unit before final sign-off.
- **Cabling and accessories** part numbers are supplier-sourced and not yet recorded against a specific manufacturer/part number in this repository — update once sourcing is finalised.
