# Documentation

The `docs/` folder is organised into subfolders by purpose:

| Folder | Contents |
|--------|----------|
| [manuals/](manuals/) | Operational and maintenance guides — Pi SSH/deploy reference, port troubleshooting, sidebar fix notes, the full User Manual, and the photoelectric sensor replacement note |
| [datasheets/](datasheets/) | Vendor datasheets and IODD files for every device in the kit (AL1350, TV7105, capacitive, photoelectric, CL50 Pro, Omron E2E IODD set) |
| [specifications/](specifications/) | Formal product documentation — CE technical file, electrical test procedure, parts list, and the master product specification |
| [diagrams/](diagrams/) | Architecture, data-flow, and PID schematic diagrams |
| [dev-notes/](dev-notes/) | Architecture/protocol guide and archived design notes |
| [Curriculum/](Curriculum/) | CP3723 / CP7395 curriculum documents, teachers' notes, and MCQ files |

## Manuals & Operations

| Document | Description |
|----------|-------------|
| [manuals/User Manual/user-manual.md](manuals/User%20Manual/user-manual.md) | Full user manual — safety, startup, operation, maintenance, spares |
| [manuals/PI_SSH.md](manuals/PI_SSH.md) | Pi SSH/SCP reference, deploy commands, network layout |
| [manuals/PI_OPERATIONS.md](manuals/PI_OPERATIONS.md) | Git → Pi workflow, rollback, health checks |
| [manuals/port-config.md](manuals/port-config.md) | IO-Link port mode troubleshooting and AL1350 API examples |
| [manuals/SIDEBAR_SCROLL_FIX.md](manuals/SIDEBAR_SCROLL_FIX.md) | Sidebar flex constraint diagnosis (kiosk touchscreen) |
| [manuals/PHOTOELECTRIC-SENSOR-REPLACEMENT.md](manuals/PHOTOELECTRIC-SENSOR-REPLACEMENT.md) | Current photoelectric sensor ISDU limitation + recommended replacements with full IO-Link parameter access |

## Sensor Datasheets

| Document | Device |
|----------|--------|
| [datasheets/TV7105.pdf](datasheets/TV7105.pdf) | IFM TV7105 temperature sensor |
| [datasheets/Capacitive Proximity.pdf](datasheets/Capacitive%20Proximity.pdf) | RS PRO / Carlo Gavazzi CA18FAF08BP M18 capacitive sensor |
| [datasheets/Capacitive Proximity Family.pdf](datasheets/Capacitive%20Proximity%20Family.pdf) | RS PRO capacitive proximity sensor family |
| [datasheets/LTR-M18PA-PM.pdf](datasheets/LTR-M18PA-PM.pdf) | Contrinex LTR-M18PA-PMS-603 diffuse photoelectric sensor — sold as RS PRO 284-9794 |
| [datasheets/RS PRO Photoelectric Sensor.pdf](datasheets/RS%20PRO%20Photoelectric%20Sensor.pdf) | RS PRO photoelectric sensor (older RS branded spec sheet) |
| [datasheets/CL50PKQ.pdf](datasheets/CL50PKQ.pdf) | Banner CL50 Pro RGB light stack (IO-Link data reference) |
| [datasheets/e2e_iodd_temp/](datasheets/e2e_iodd_temp/) | Omron E2E NEXT family IODD set (Port 1 proximity sensor) |
| [datasheets/photoelectric/](datasheets/photoelectric/) | Contrinex LTR-M18PA-PMx-603 IODD + icons |

## AL1350 Reference

| Document | Description |
|----------|-------------|
| [datasheets/Operating Manual.pdf](datasheets/Operating%20Manual.pdf) | IFM AL1350 operating manual (full) |
| [datasheets/Operating Manual.txt](datasheets/Operating%20Manual.txt) | Plain-text extract for quick search |

## Specifications

| Document | Description |
|----------|-------------|
| [specifications/CE-Technical-Documentation.md](specifications/CE-Technical-Documentation.md) | CE Technical Construction File — directives, standards, safety assessment |
| [specifications/LD0013-electrical-test-procedure.md](specifications/LD0013-electrical-test-procedure.md) | Electrical test procedure (LD0013) |
| [specifications/parts-lists.md](specifications/parts-lists.md) / [.xlsx](specifications/parts-lists.xlsx) | Master parts list — drawing refs, manufacturers, part numbers, CE/UL status, spares |
| [specifications/spec doc/](specifications/spec%20doc/) | IM4330 product specification (source doc + generated .md) |

## Diagrams

| Document | Description |
|----------|-------------|
| [diagrams/architecture.html](diagrams/architecture.html) | System architecture diagram |
| [diagrams/data flow.html](diagrams/data%20flow.html) | Data flow diagram |
| [diagrams/pid-schematic.html](diagrams/pid-schematic.html) | PID schematic (HTML) |
| [diagrams/IM4330 PID Schematic.docx](diagrams/IM4330%20PID%20Schematic.docx) | PID schematic (source doc, component tag register) |

## Dev Notes

| Document | Description |
|----------|-------------|
| [dev-notes/IO-LINK-COMMS-GUIDE.md](dev-notes/IO-LINK-COMMS-GUIDE.md) | Full IO-Link + MQTT architecture guide — primary reference for how the system works |
| [dev-notes/Archived/IO-LINK-COMMS-GUIDE-ARCHIVED-http-polling.md](dev-notes/Archived/IO-LINK-COMMS-GUIDE-ARCHIVED-http-polling.md) | Previous HTTP polling architecture (superseded by MQTT) |
| [dev-notes/Archived/MQTT-MIGRATION-PLAN-COMPLETED.md](dev-notes/Archived/MQTT-MIGRATION-PLAN-COMPLETED.md) | MQTT migration plan (completed — kept for reference) |

## Curriculum

| Document | Description |
|----------|-------------|
| [Curriculum/CP3723-curriculum.md](Curriculum/CP3723-curriculum.md) | CP3723 — Maintenance on Smart Sensors |
| [Curriculum/CP7395-curriculum.md](Curriculum/CP7395-curriculum.md) | CP7395 — Industry 4.0 IO-Link |
| [Curriculum/teachers-notes.md](Curriculum/teachers-notes.md) | Teachers' notes |
| [Curriculum/mcq-questions-answers.md](Curriculum/mcq-questions-answers.md) | MCQ question bank |
| [Curriculum/mcq-review.md](Curriculum/mcq-review.md) | MCQ review notes |
