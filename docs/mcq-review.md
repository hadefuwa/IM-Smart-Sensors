# CP0001 & CP0002 — MCQ Quality Review

Review date: 2026-06-16  
Scope: All multiple-choice and scenario-diagnosis questions in `src/worksheets-page.js` (CP0001) and `src/cp0002-page.js` (CP0002).

---

## Summary

| Priority | Issue | Affected files |
|----------|-------|----------------|
| Critical | Correct answer is almost always option B | Both files — all worksheets |
| High | CP0002 WS3 Q4 says "decode" for a PDout-only device | cp0002-page.js |
| High | WS8 has no in-worksheet reference for hex decode or CL50 colour table | worksheets-page.js |
| High | WS7 has no recap of NC/NO logic before the scenario | worksheets-page.js |
| Low | WS2 Q1 wording is ambiguous ("digital sensor stops switching") | worksheets-page.js |
| Low | CP0002 WS1 Q2 has an obviously-wrong distractor (0.1 msg/sec) | cp0002-page.js |
| Low | WS5 Q3 feedback wording slightly imprecise for −40°C | worksheets-page.js |
| Low | CP0002 WS3 Q3 distractors don't cover the most instructive wrong answer | cp0002-page.js |
| Low | WS8 Task 4 Q2 distractor C is partially correct | worksheets-page.js |

---

## Issue 1 — Critical: Answer distribution (almost every correct answer is B)

### What the problem is

Across all CP0001 radio-button questions, the correct answer is B in every single case except:
- CP0001 WS3 Q1 (answer: A)

Across CP0002, the pattern is also heavily B, with only a handful of C answers:
- CP0002 WS1 Q1, Q3, Q4 (answer: C)
- CP0002 WS7 Q3 (answer: C)

Every scenario-diagnosis step in CP0001 is also B.

### Why this matters

A student doing their second worksheet — or anyone who notices the pattern after WS1 — will simply pick B and score full marks without engaging with the content. This completely undermines the assessment function of the questions.

### Fix

Reshuffle the option order in every question so the correct answer rotates across A, B, and C roughly evenly within each worksheet. Update the JS answer keys (`ANSWERS = {...}`) to match. A rough target: no single option should be correct more than 40% of the time within any one worksheet.

---

## Issue 2 — High: CP0002 WS3 Q4 says "decode" for a PDout-only device

### What the problem is

> "Why does the CL50 need a more complex **decode** than the proximity sensor?"

The CL50 is PDout-only — the master sends commands *to* it; nothing is received back. There is nothing to decode. The question should ask about *encoding* PDout, not decoding PDin.

### Fix

Rewrite the question:

> **Before:** "Why does the CL50 need a more complex decode than the proximity sensor?"

> **After:** "Why does building a PDout command for the CL50 require more care than reading a proximity sensor's PDin?"

Rewrite option B to match:

> **Before:** "Each colour channel has three states (on/flash/off) encoded in separate bit fields"

> **After:** "Multiple fields — colour, animation, intensity, and speed — must be packed into specific bit positions across 3 bytes. One wrong bit changes the entire behaviour."

---

## Issue 3 — High: WS8 (Final Assessment) has no in-worksheet answers for Tasks 2 and 3

### What the problem is

Two tasks in the final assessment require knowledge that is only taught in earlier worksheets, with no reference in WS8 itself:

| Task | Knowledge needed | Where it was taught |
|------|-----------------|---------------------|
| Task 2A — hex decode `01 F4` → 50.0°C | ISDU int16 decode formula | WS5 only |
| Task 3 — PDout `000109` → Blue | CL50 colour index table | WS6 only |

The user's requirement is that answers should ideally be findable within the same worksheet.

### Fix

Add a **Quick Reference** callout at the start of WS8 (collapsed by default, expandable with a toggle) containing:

1. **ISDU decode formula:** `decoded value = raw decimal × scale factor`. Note: int16 values above 32767 are negative (two's complement).
2. **CL50 Octet2 colour index table** (the 16-entry table from WS6 — Green=0, Red=1, Orange=2, Amber=3, Yellow=4, Lime=5, Spring Green=6, Cyan=7, Sky Blue=8, Blue=9, Violet=10, Magenta=11, Rose=12, White=13).

---

## Issue 4 — High: WS7 has no in-worksheet recap of NC/NO logic

### What the problem is

The WS7 maintenance scenario asks the student to diagnose a Port 1 fault where the sensor output logic is set to NC (inverted). The correct diagnosis (NC output logic) and the concept of NO vs NC were first introduced in WS3. WS7 contains no recap, so a student who hasn't done WS3 recently won't have the answer available.

### Fix

Add a short callout box immediately before the WS7 scenario:

> **Recall — Switching Output Logic**  
> IO-Link sensors can be configured with **Normal Open (NO)** or **Normal Closed (NC)** output logic via ISDU parameter index 61 / sub 1.  
> - **NO (value 0):** Output is ON when object is detected. *(Factory default)*  
> - **NC (value 1):** Output is ON when NO object is detected. *(Inverted — causes permanent "object present" signal when nothing is in front)*

---

## Issue 5 — Low: CP0001 WS2 Q1 ambiguous wording

### What the problem is

> "A digital sensor stops switching. What can a technician find out from it?"

"Stops switching" is ambiguous — it could describe a sensor that has malfunctioned, or it could be misread as describing a sensor type (a sensor without a switching output). The lesson context is about basic binary digital sensors that fail silently.

### Fix

> **Before:** "A digital sensor stops switching. What can a technician find out from it?"

> **After:** "A basic digital (on/off) proximity sensor fails and its output goes silent. What diagnostic information can a technician retrieve from it?"

---

## Issue 6 — Low: CP0002 WS1 Q2 has a weak distractor

### What the problem is

> "The AL1350 pushes every 500 ms. How many WebSocket messages per second?"
>
> - A: 20 messages/sec  
> - B: 0.1 messages/sec  ← obviously wrong; no student will pick this
> - C: 2 messages/sec ✓

0.1 messages/sec (one message every 10 seconds) is so obviously wrong that it gives the question away by elimination. The distractors should represent real mistakes students might make.

### Fix

Replace option B:

> **Before B:** "0.1 messages/sec"

> **After B:** "500 messages/sec — 500 ms equals 500 per second"

This catches students who confuse the period (500 ms) with the frequency (500 Hz), which is a genuine mistake.

---

## Issue 7 — Low: CP0001 WS5 Q3 feedback imprecise about −40°C

### What the problem is

The correct-answer feedback says "−40°C is a common default error value" — implying the sensor is programmed to output −40°C on fault. In fact, −40°C appears because it is the bottom of the TV7105's measurement range, produced when the sensing element is open-circuit.

### Fix

> **Before feedback:** "−40°C is a common default error value"

> **After feedback:** "−40°C is the bottom of the TV7105's measurement range. It appears when the sensing element is open-circuit — typically a broken probe or disconnected cable."

---

## Issue 8 — Low: CP0002 WS3 Q3 missing the most instructive wrong answer

### What the problem is

> "Raw PDin 0x02EE decodes to what temperature?"
>
> - A: 7.5°C  
> - B: 750.0°C  
> - C: 75.0°C ✓

The current options include both 7.5°C and 750.0°C but one of the most instructive wrong answers — **75°C (no decimal)** or confusing the scale factor — is not represented.

More importantly, 7.5°C is already a scale-confusion error (÷100 instead of ÷10), but 750.0°C (the raw number, no scaling) is also listed. Having both scale-confusion distractors in one question is redundant and the student can rule both out too easily.

### Fix

Replace one distractor to make the choices more distinct:

> - A: **750.0°C** — no scaling applied (raw decimal value)
> - B: **7.5°C** — wrong scale factor (÷100 instead of ÷10)
> - C: **75.0°C** ✓ — correct (750 ÷ 10)

This is only a minor reorder; the content is already correct. The key is that both distractors now test *different* misconceptions.

---

## Issue 9 — Low: CP0001 WS8 Task 4 Q2 distractor C is partially correct

### What the problem is

> Q2: After replacing the capacitive sensor on Port 2, output is always ON. Most likely cause?
>
> - C: "Sensitivity setpoint (SP1) is too low and needs increasing"

SP1 too low does cause always-on behaviour (sensor triggers too easily), and increasing it *would* fix it. This makes C a partially correct answer, which undermines the question.

### Fix

Replace with a clearly wrong distractor:

> **Before C:** "Sensitivity setpoint (SP1) is too low and needs increasing"

> **After C:** "The IO-Link cable polarity is reversed — swap Pin 2 and Pin 4 at the master connector"

Cable polarity reversal is a plausible real-world concern during replacement but does not cause an always-on output on an IO-Link port.

---

## Accuracy & Coverage Summary

All questions were checked against the lesson content. Beyond the issues above, every question is factually accurate and the correct answer is clearly taught within the lesson content of the same or a prior worksheet.

The scenario-diagnosis steps in WS3, WS5, WS6, and WS7 are particularly well-designed: they are hands-on, inject a real fault into the physical sensor, and require the student to read ISDU parameters to confirm their diagnosis before writing the fix. These are the strongest assessments in the course.

---

## Fix Checklist

- [ ] **[Critical]** Reshuffle option order in all CP0001 radio MCQs + update JS answer keys
- [ ] **[Critical]** Reshuffle option order in all CP0002 radio MCQs + update JS answer keys
- [ ] **[High]** Rewrite CP0002 WS3 Q4 (decode → encode)
- [ ] **[High]** Add Quick Reference callout in CP0001 WS8 (ISDU formula + CL50 colour table)
- [ ] **[High]** Add NC/NO recap callout in CP0001 WS7 before scenario
- [ ] **[Low]** Rewrite CP0001 WS2 Q1 question text
- [ ] **[Low]** Replace CP0002 WS1 Q2 distractor B
- [ ] **[Low]** Update CP0001 WS5 Q3 feedback text
- [ ] **[Low]** Review CP0002 WS3 Q3 distractors
- [ ] **[Low]** Replace CP0001 WS8 Task 4 Q2 distractor C
