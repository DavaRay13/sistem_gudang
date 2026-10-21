# Design System: Sistem Gudang Logistik & Distribusi (SG-WMS)
**Skill:** stitch-design-taste  
**Target Environment:** Web & Mobile Web (PWA), Google Stitch Component Generation  
**Last Updated:** 2026-10-21  

---

## Configuration — Dial Settings
Controlled dials that calibrate visual density, variance, creativity, and motion for a mission-critical logistics and multi-store distribution system.

| Dial | Level | Calibration Rationale |
|------|-------|-----------------------|
| **Creativity** | `6` | Functional Swiss-utilitarian aesthetic. Clear hierarchy, high-contrast operational tags, and zero decorative AI slop. |
| **Density** | `7` | Warehouse & ledger views require high information density with tabular figures; mobile store views maintain thumb-friendly touch targets (min 44px). |
| **Variance** | `5` | Structured, predictable workflows. Order of operations (Minta → Setujui → Kirim → Terima) remains consistent across all views. |
| **Motion Intent** | `5` | Tactile touch responses (`active:scale-95`), spring-physics bottom sheets, and live status pulses on critical stock alerts. |

---

## 1. Visual Theme & Atmosphere
A clean, industrial-grade operational control center inspired by precision logistics software and Swiss typographic clarity. The interface feels dependable, fast, and tactical — like high-end flight telemetry combined with intuitive consumer mobile banking.

Every pixel serves an operational function: stock levels are readable at a glance under harsh warehouse lighting or on a sunny loading dock, action buttons are weighted for thumb ergonomics, and critical anomalies (stockouts, discrepancies, damage) trigger unmistakable visual signals without cluttered sensory overload.

---

## 2. Color Palette & Functional Roles
All colors use strictly calibrated hex values with contrast ratios exceeding WCAG AAA standards. No oversaturated neon glows or arbitrary violet gradients.

### Core Neutral Surfaces
- **Canvas App Background (Light):** `#FBFBFA` — Warm chalk neutral, prevents eye fatigue during long warehouse shifts.
- **Canvas App Background (Dark):** `#0F1012` — Deep obsidian charcoal; never pure `#000000`.
- **Card Surface (Light):** `#FFFFFF` — Elevated crisp card container with subtle 1px border.
- **Card Surface (Dark):** `#16171A` — Low-reflection graphite surface for dark mode.
- **Primary Ink (Light):** `#111111` — Deep off-black for headlines, SKU codes, and critical figures.
- **Primary Ink (Dark):** `#ECECED` — High-clarity off-white for low-light legibility.
- **Subtle Metadata (Light):** `#787774` — Category pills, unit labels, secondary descriptions.
- **Subtle Metadata (Dark):** `#A1A09E` — Secondary text in dark mode.
- **Border Structural Line:** `#EAEAEA` (Light) / `#26282E` (Dark) — 1px hairline divider.

### Semantic Telemetry Signals
- **Emerald Growth / Stock Inbound / Sesuai:** `#10B981` (Accent: `#059669`, Background Tint: `#EDF3EC`)  
  *Role:* Inbound supplier receipts, available safe stock, verified 100% receipt handshakes.
- **Logistics Blue / In-Transit / Dispatch:** `#1F6C9F` (Accent: `#2563EB`, Background Tint: `#E1F3FE`)  
  *Role:* Active truck dispatches, Surat Jalan (DO) documents, goods currently on the road.
- **Warning Amber / Pending Review / Menipis:** `#D97706` (Accent: `#F59E0B`, Background Tint: `#FBF3DB`)  
  *Role:* Store requests awaiting warehouse manager authorization, inventory below safety stock.
- **Rose Alert / Stockout / Scrap / Selisih:** `#DC2626` (Accent: `#E11D48`, Background Tint: `#FDEBEC`)  
  *Role:* Zero stock (out of stock), damage/scrap writes, discrepancies reported by store receivers.

### Strictly Banned Colors
- **AI Purple/Violet Glows** (`#8B5CF6`, `#A855F7`) — strictly forbidden.
- **Pure Black** (`#000000`) — causes harsh OLED contrast vibrating against white text.
- **High-saturation fluorescent accents** (> 80% saturation).

---

## 3. Typographic Architecture
Typography prioritizes rapid scanning of numeric values, SKUs, and transaction IDs.

### Font Stacks
- **Interface & Display:** `Plus Jakarta Sans`, `Geist`, or `Satoshi`  
  *Characteristics:* Tight tracking (`-0.02em`), robust medium (500) and bold (700) weights, excellent readability at 11px–14px.
- **Data, Quantities, & Identifiers (Mandatory):** `Geist Mono`, `JetBrains Mono`, or `ui-monospace`  
  *Characteristics:* Monospace with fixed-width numerals (`tabular-nums`). Prevents visual jumping when quantities fluctuate. Used for all numbers, SKU codes, DO numbers, Rupiah values, and timestamps.

### Typographic Scale
- **Header Large:** `clamp(1.25rem, 3vw, 1.5rem)` / Weight: 900 (Black) / Line height: 1.2
- **Card Title / SKU:** `0.875rem` (14px) / Weight: 700 (Bold) / Line height: 1.3
- **Body & Controls:** `0.75rem` (12px) / Weight: 500 (Medium) / Line height: 1.5
- **Micro Metadata & Badges:** `0.625rem`–`0.6875rem` (10px–11px) / Weight: 700 / Uppercase tracking: `+0.05em`
- **Metric Highlight (Stock Quantity):** `1.125rem`–`1.5rem` / Weight: 900 / Font: Monospace

---

## 4. Component Stylings & Interaction Specifications

### Buttons
- **Touch Targets:** Minimum 44px height on mobile (`py-2.5` to `py-3.5`).
- **Tactile Feedback:** Hardware-accelerated scale down (`active:scale-95` or `active:scale-[0.98]`).
- **Primary Action (Affirmative):** Solid fill with high-contrast label (e.g., `#111111` with `#FFFFFF` text or `#10B981` for stock entry).
- **Destructive Action:** `#DC2626` with rose tinted container (`bg-rose-50 hover:bg-rose-100`).
- **Zero Outer Glow:** No box-shadow neon blur. Flat surfaces or crisp `0 1px 2px rgba(0,0,0,0.05)` elevation.

### Mobile Stock Cards (Master & Toko)
- **Container:** Rounded `1rem` (16px), 1px structural border, clean white surface.
- **Header:** Item name (truncate 1 line) + semantic pill badge (e.g., green dot "Tersedia", pulse red "Kosong").
- **3-Zone Telemetry Bar:**
  - Left: *Tersedia* (Large mono quantity).
  - Center: *Disiapkan* (Reserved for pending dispatch).
  - Right: *Di Jalan* (In-transit to branches).
- **Direct Action Split:** Instant "Masuk (+)" and "Keluar (-)" buttons accessible in 1 tap without opening sub-menus.

### M-Banking Transaction Rows (Mutation Ledger)
- **Container:** Clean vertical list with 1px hairlines dividing rows.
- **Leading Indicator:** 36×36px squircle with directional icon (Diagonal Down-Right for inbound, Diagonal Up-Right for dispatch/outbound).
- **Amount Label:** Monospace with explicit sign (`+100 PCS` in emerald or `-25 PCS` in indigo/rose).
- **Trailing Metadata:** Reference number (DO/Req) and relative timestamp in muted monospace.

### Receiving Handshake Modal (Two-Way Handshake)
- **1-Click Verification Hero Button:** Full-width thumb button ("✓ Semua Sesuai & Lengkap") in emerald green.
- **Quick Discrepancy Chips:** Instant selectors for "Barang Rusak", "Kurang Jumlah", "Salah Kirim" to eliminate keyboard typing.

---

## 5. Layout & Responsive Principles

### Mobile-First Viewport Rules (< 768px)
- **Strict Single Column:** Grid layouts revert to 1 column with `gap-2.5` to `gap-3.5`.
- **Zero Horizontal Overflow:** `max-w-full overflow-x-hidden` on all parent wrappers. Any unintended scrollbar is a defect.
- **Fixed Thumb-Zone Bottom Navigation:**
  - Floats at the base of the screen with `backdrop-blur-md`.
  - Icon size: 18px–20px with active squircle indicator.
  - Safe-area bottom padding (`pb-[max(0.375rem,env(safe-area-inset-bottom))]`) for bezel-less devices.
- **Content Clearance:** Main content has `pb-24` clearance to ensure floating bars never obscure bottom action buttons.

### Desktop & Tablet Scaling (>= 768px)
- Multi-column grids (2-column on tablet, 3-column on desktop).
- Left-rail persistent navigation (Sidebar) with badge counters.
- Max-width containment: `max-w-7xl` centered.

---

## 6. Motion Philosophy & Micro-Interactions
*Stitch screen generation creates visual blueprints; this documents implementation behavior for the AI coding harness:*

- **Spring Dynamics:** Fast, responsive springs with zero floaty delay: `stiffness: 300, damping: 25`.
- **Active State:** Immediate visual feedback (`active:scale-95`).
- **Urgent Pulses:** Subtle 1.5s infinite opacity pulse on zero-stock indicators (`animate-pulse`).
- **GPU-Only Animation:** Animate strictly via `transform` and `opacity`. Never animate layout geometry (`height`, `width`, `top`, `left`).

---

## 7. Anti-Patterns (Forbidden in this System)
1. **No Emojis as UI Icons:** Use Lucide icons exclusively (`CheckCircle2`, `Truck`, `Package`, `ArrowDownRight`).
2. **No Pure Black (`#000000`):** Use `#0F1012` or `#111111`.
3. **No Decorative Purple/Cyan Neon Gradients:** This is a physical logistics platform, not a Web3 crypto casino.
4. **No Small Mobile Touch Targets:** Every clickable button, pill, or stepper must be ≥ 44px on mobile viewports.
5. **No Required Keyboard Typing for Routine Actions:** Steppers (`-`, `+`, `+5`, `+10`, `Semua`) must precede manual number inputs.
6. **No Ambiguous Status Labels:** Never use "Processing" or "Pending" without specifying who holds the action (e.g., "Menunggu Persetujuan Admin Gudang" vs "Dalam Perjalanan").
7. **No Destruction of Historical Data:** Hard deleting items is banned; soft delete (`is_archived = true`) ensures financial audit trail continuity.
