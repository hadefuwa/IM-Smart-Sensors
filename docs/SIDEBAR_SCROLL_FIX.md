# Sidebar Scroll Fix

## Problem

On the Raspberry Pi WaveShare touchscreen (1024×600), the left sidebar menu could not be scrolled. Tapping an item would hover/highlight it, but dragging produced no scroll movement.

## Root Cause

The sidebar `<aside>` element had both `flex flex-col` and `md:block` in its Tailwind class list:

```html
<aside id="sidebar" class="... flex flex-col overflow-hidden min-h-0 md:block">
```

At 1024px viewport width, Tailwind's `md:` breakpoint (≥768px) applies, so `md:block` sets `display: block` — **overriding `flex`**. This silently broke the flex column layout inside the sidebar:

- The sidebar itself was still 414px tall (sized as a flex *item* by the outer row)
- But its children were now laid out in **block mode**, not flex mode
- The scroll container `<div class="flex-1 overflow-y-auto">` had no flex constraint, so it grew to its full content height (507px)
- With `scrollHeight === clientHeight`, `overflow-y: auto` never activated — nothing to scroll

Confirmed via Chrome DevTools Protocol (CDP):

```
sidebarDisplay: "block"         ← should be "flex"
scrollElH:      507             ← container grew to content size
scrollElSH:     507             ← no overflow, so no scroll
scrollElCH:     507
```

## Fix

Two changes in `src/main.js`:

**1. Remove `md:block` from the sidebar** — keeps the sidebar as `display: flex` at all viewport sizes:

```html
<!-- Before -->
<aside id="sidebar" class="... flex flex-col overflow-hidden min-h-0 md:block">

<!-- After -->
<aside id="sidebar" class="... flex flex-col overflow-hidden min-h-0">
```

**2. Add `min-h-0` to the scroll container** — standard flexbox fix; prevents the flex child from overflowing its parent even when content is taller:

```html
<!-- Before -->
<div class="flex-1 overflow-y-auto overscroll-contain">

<!-- After -->
<div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
```

After the fix, CDP confirmed:

```
sidebarDisplay: "flex"          ← correct
scrollElH:      414             ← constrained to sidebar height
scrollElSH:     507             ← content taller than container → scrolls
scrollElCH:     414
scrollTop after drag: 58        ← SUCCESS
```

## Deploy Path

Nginx serves the frontend from `/var/www/im-sensors/`, **not** from `/home/hamed/IM-Smart-Sensors/dist/`.

When deploying a new build, copy to the nginx root:

```bash
# From Windows (PuTTY pscp)
pscp -pw ummah123 dist\assets\index-*.js  hamed@iolink.local:/var/www/im-sensors/assets/
pscp -pw ummah123 dist\assets\index-*.css hamed@iolink.local:/var/www/im-sensors/assets/
pscp -pw ummah123 dist\index.html          hamed@iolink.local:/var/www/im-sensors/
```

Note: Vite uses content-hashed filenames (e.g. `index-gZa-Ib0_.js`), so each build produces different filenames. Always copy both the new assets **and** the new `index.html` together.

## CDP Diagnostic Tooling

Two Python scripts in the project root can be used for closed-loop testing via Chrome DevTools Protocol:

| Script | Purpose |
|--------|---------|
| `cdp_test.py` | Check sidebar dimensions and item heights |
| `cdp_reload_test.py` | Force hard-reload then check computed styles and `sidebarDisplay` |
| `cdp_scroll_test.py` | Simulate a mouse drag and verify `scrollTop` changes |

Run them from the Pi over SSH:

```bash
python3 /tmp/cdp_scroll_test.py
```

Chromium must be running with `--remote-debugging-port=9222` (already in `/home/pi/kiosk.sh`).
