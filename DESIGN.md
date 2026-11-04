# Korean 4-Cut Photobooth — Design System Specification

## 1. Visual World & Aesthetic POV

**Aesthetic Direction:** Korean Minimalist Self-Photo Studio (인생네컷 / 포토이즘 / 하루필름 감성)
**Target Personality:** Warm, elegant, calm, tactile, joyful, uncluttered.
**Mode:** Operate (Photobooth Capture Tool) & Experience (Shared Photo & Video Memories).

### Design Dials
- **VARIANCE: 6** — Balanced structure with intentional breathing room and asymmetry where appropriate.
- **MOTION: 4** — Restrained, physics-grounded transitions (shutter flash 220ms, paper dispense 850ms, SVG countdown rings).
- **DENSITY: 3** — Generous whitespace (24–48px gutters, comfortable 44px+ touch targets).

---

## 2. Color Palette & Semantic Tokens

### Base & Surface Tokens
- `--color-bg-base`: `#FAF8F5` (Warm Rice Paper)
- `--color-bg-surface`: `#FFFFFF` (Pure Studio White)
- `--color-bg-surface-subdued`: `#F4F1EC` (Soft Linen)
- `--color-bg-surface-warm`: `#EFECE6` (Warm Sand)

### Brand Accent Tokens
- `--color-brand-primary`: `#FF4D6D` (Korean Coral Rose)
- `--color-brand-hover`: `#E11D48` (Deep Crimson Rose)
- `--color-brand-subtle`: `#FFF0F3` (Rose Petal Tint)
- `--color-brand-border`: `rgba(255, 77, 109, 0.25)`

### Typography & Border Tokens
- `--color-text-main`: `#1C1917` (Warm Ink Charcoal)
- `--color-text-muted`: `#78716C` (Warm Stone)
- `--color-text-subtle`: `#A8A29E` (Soft Muted Grey)
- `--color-border-subtle`: `rgba(28, 25, 23, 0.06)`
- `--color-border-strong`: `rgba(28, 25, 23, 0.12)`

### Functional / Status Tokens
- `--color-status-success`: `#059669` (Subtle Emerald Green)
- `--color-status-success-bg`: `#ECFDF5`
- `--color-status-error`: `#DC2626`
- `--color-status-warning`: `#D97706`

---

## 3. Typography Scale & Hierarchy

- **Hero Title:** 36px–48px / Bold (700) / Tracking Tight (-0.02em)
- **Section Heading:** 20px–24px / SemiBold (600) / Tracking Tight (-0.015em)
- **Card / Stage Title:** 15px–16px / SemiBold (600)
- **Body Regular:** 13px–14px / Regular (400) / Leading Relaxed (1.6)
- **Label / Caption:** 10px–11px / Medium (500) / Untracked sentence case
- **Figures / Monospace:** 11px–13px / Font-Mono / Bold (Countdown numbers, Passcode `CODE: 1234`)

---

## 4. 7-Stage Photobooth User Journey

```
[ 1. Filter ] ➔ [ 2. Frame ] ➔ [ 3. Timer ] ➔ [ 4. Camera ] ➔ [ 5. Shoot ] ➔ [ 6. Preview ] ➔ [ 7. Download ]
```

1. **Stage 1 (Filter Selection):** Live 4:3 camera viewfinder with real-time CSS filter processing, 0–100% intensity slider, and 40 categorized filter swatches.
2. **Stage 2 (Frame Selection):** 1:3 vertical composition canvas previewing the active filter and full frame artwork (40 Christmas holiday frames, classics, creative editions).
3. **Stage 3 & 4 (Timer & Camera Prep):** 3 selectable countdown cards (**3s**, **5s**, **10s**) + auto-adjusted BTS duration indicators (`~4–5s`, `~6–7s`, `~11–12s`), face alignment guide silhouette, and 4-pill session summary.
4. **Stage 5 (Photo Session):** Undisputed camera hero, SVG animated countdown ring (`countdown-number`), discrete `● REC BTS ({seconds}s)`, rolling filmstrip, and authentic studio strobe flash.
5. **Stage 6 & 7 (Preview & Download):** Mechanical printer dispenser slot, Output A (Traditional Photo Strip) vs Output B (Animated BTS Photo Strip), download actions (PNG & MP4), and scan-to-watch QR code modal.

---

## 5. Interaction & Anti-AI-Slop Discipline

- **No Generic AI Tells:** Zero emojis used as icons (Lucide vector icons throughout: `Heart`, `Camera`, `Film`, `Video`, `QrCode`, `Download`, `Check`, `RotateCcw`).
- **Focus Rings:** Instantaneous `outline: 2px solid var(--color-brand-primary); outline-offset: 2px;` on all interactive buttons and inputs.
- **Hardware Acceleration:** Animations restricted to `transform` and `opacity` (never `transition: all`).
- **Reduced Motion:** Complete `@media (prefers-reduced-motion: reduce)` block with safe zeroed durations.
