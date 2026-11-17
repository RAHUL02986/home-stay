# Design System & UI/UX Specification

## Homestay Platform — Dharamshala

**Version:** 1.0 (MVP)
**Date:** 2026-04-11

---

## 1. Design Theme

**Concept:** "Himalayan Calm" — clean, airy, mountain-inspired.
- Generous whitespace, soft shadows, rounded corners.
- Imagery of mountains and pine forests as visual anchors.
- Warm accents against cool slate/emerald base.

---

## 2. Color Palette (Tailwind)

Configure in `tailwind.config.ts` under `theme.extend.colors`.

| Token | Hex | Tailwind usage | Purpose |
|-------|-----|----------------|---------|
| `primary` | `#059669` (emerald-600) | `bg-emerald-600`, `text-emerald-600` | Primary actions, success |
| `primary-dark` | `#047857` (emerald-700) | `hover:bg-emerald-700` | Hover states |
| `accent` | `#D97706` (amber-600) | `text-amber-600` | Highlights, ratings |
| `neutral-900` | `#0F172A` (slate-900) | `text-slate-900` | Headings |
| `neutral-700` | `#334155` (slate-700) | `text-slate-700` | Body text |
| `neutral-500` | `#64748B` (slate-500) | `text-slate-500` | Secondary text |
| `neutral-200` | `#E2E8F0` (slate-200) | `border-slate-200` | Borders/dividers |
| `neutral-100` | `#F1F5F9` (slate-100) | `bg-slate-100` | Subtle backgrounds |
| `surface` | `#FFFFFF` | `bg-white` | Cards, panels |
| `error` | `#DC2626` (red-600) | `text-red-600` | Errors |
| `success` | `#16A34A` (green-600) | `text-green-600` | Success messages |

**Background:** `bg-slate-50` for page background; white cards on top.

---

## 3. Typography

- **Font family:** `Inter` (sans) for UI; optional `Playfair Display` for hero headings.
- Load via `next/font/google` in `app/layout.tsx`.

| Role | Size | Weight | Tailwind |
|------|------|--------|----------|
| Hero H1 | 48px | 700 | `text-5xl font-bold` |
| Section H2 | 30px | 600 | `text-3xl font-semibold` |
| Card title | 20px | 600 | `text-xl font-semibold` |
| Body | 16px | 400 | `text-base` |
| Small / caption | 14px | 400 | `text-sm` |
| Tiny (badges) | 12px | 500 | `text-xs font-medium` |

---

## 4. Spacing & Radius

- Base spacing unit: 4px (Tailwind default).
- Card padding: `p-4` (mobile) / `p-6` (desktop).
- Section vertical rhythm: `py-12` to `py-20`.
- Border radius: `rounded-xl` for cards, `rounded-lg` for inputs/buttons, `rounded-full` for pills/badges.
- Shadow: `shadow-sm` default, `shadow-lg` for elevated cards/modals.

---

## 5. Component Specifications

### 5.1 Navbar
- Sticky top, white background, subtle bottom border.
- Logo (left), nav links (center), CTA "List your property" (right, emerald button).
- Mobile: hamburger menu.

### 5.2 Property Card
```
┌────────────────────────────┐
│  [Image 16:9]              │
│  ★ 4.5  (optional)         │
├────────────────────────────┤
│  Property Name             │
│  📍 McLeodganj             │
│  From ₹2,500 / night       │
│  [Wi-Fi] [Mountain View]   │
└────────────────────────────┘
```
- Image: `aspect-video`, `object-cover`, `rounded-t-xl`.
- Area badge: slate pill.
- Amenity chips: small outlined pills.
- Hover: subtle shadow lift (`hover:shadow-md transition`).

### 5.3 Search & Filter Bar
- Horizontal on desktop, stacked on mobile.
- Controls: Area dropdown, Price range (min/max), Amenity checkboxes (collapsible), Availability toggle.
- "Apply Filters" button (emerald) + "Reset" link.

### 5.4 Host Property Form (Multi-Step)
- Step indicator: 3 progress bars at top (emerald when complete).
- Step 1 — Basic Info: name, description, area, address, lat/lng.
- Step 2 — Amenities & Images: toggle chips + image URL textarea.
- Step 3 — Rooms: repeatable room cards with add/remove.
- Navigation: Back (text) / Next (emerald button). Submit shows spinner.

### 5.5 Property Detail Page
- Hero image gallery (main + thumbnails).
- Title + area + address.
- Description block.
- Amenities grid (icons + labels).
- Room table: Type | Price/night | Max guests | Availability | Features.
- Location: address + map embed placeholder with coordinates.

### 5.6 Buttons
| Variant | Classes |
|---------|---------|
| Primary | `bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg px-5 py-2` |
| Secondary | `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg` |
| Ghost | `text-slate-600 hover:text-slate-900` |
| Danger | `bg-red-600 text-white hover:bg-red-700` |

### 5.7 Inputs
- `border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none`.

### 5.8 Account and Booking States

- The authenticated navbar shows a profile icon/menu with the signed-in name, role dashboard, booking history or host listings, profile editing, and sign out.
- Guest property details offer a date/room booking-request form. Show a server-calculated estimate and clearly state that the host must confirm and no payment is collected yet.
- Guest dashboard shows pending, confirmed, and cancelled booking statuses; hosts see guest requests and can confirm or decline pending requests.
- Admin review UI shows pending listings with approve/reject actions. Keep empty, loading, success, and error states explicit and consistent with slate/emerald/red/amber styling.
- Labels: `text-sm font-medium text-slate-700 mb-1`.
- Error text: `text-xs text-red-500 mt-1`.

### 5.8 Badges / Chips
- Amenity chip: `px-3 py-1 rounded-full border text-sm bg-white text-slate-700`.
- Selected chip: `bg-emerald-600 text-white border-emerald-600`.
- Area badge: `px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs`.

---

## 6. Responsive Breakpoints

Follow Tailwind defaults:
- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)

**Strategy:** Mobile-first. Stack vertically on mobile; grid on `md`+.
- Property grid: 1 col (mobile) -> 2 cols (md) -> 3 cols (lg).
- Filter bar: stacked (mobile) -> horizontal (md).

---

## 7. Accessibility

- All images have `alt` text (property name + area).
- Interactive elements have visible focus rings.
- Color contrast >= 4.5:1 for body text (slate-700 on white passes).
- Forms use proper `<label>` associations.
- Error messages linked via `aria-describedby`.
- Keyboard navigation supported for chips/toggles (use `<button>`).
- Respect `prefers-reduced-motion`.

---

## 8. Empty & Loading States

- **Loading:** Skeleton cards (pulsing gray blocks) matching card layout.
- **Empty results:** Illustration + "No stays found. Try adjusting filters." + reset link.
- **Error:** "Something went wrong. Please try again." with retry button.

---

## 9. Motion

- Subtle transitions: `transition-colors`, `transition-shadow`, `transition-transform`.
- Duration: 150-200ms.
- Avoid heavy animations; keep it snappy.

---

## 10. Iconography

- Use `lucide-react` icons (consistent, tree-shakeable).
- Common icons: `MapPin`, `Wifi`, `Car`, `Utensils`, `PawPrint`, `Mountain`, `Users`, `BedDouble`.
- Icon size: 16-20px, `strokeWidth={1.5}`.
