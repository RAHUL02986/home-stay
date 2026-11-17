# Project Memory

## Find Your Homestay — Dharamshala

**Last updated:** 2026-11-05  
**Current work:** MVP booking request/host confirmation flow, moderated guest reviews, and Authorize.Net Sandbox checkout; provider credentials and end-to-end payment testing remain outstanding.

## Purpose and Stack

Travelers discover stays in Dharamshala and nearby areas; hosts manage property listings; administrators moderate listings.

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS.
- MongoDB with Mongoose.
- NextAuth credentials sessions with guest, host, and admin roles.
- Zod request validation; Cloudinary, Authorize.Net, email, and map integrations require valid configuration before use.

## Architecture Decisions

- Root layout renders the server-authenticated navbar; its profile menu is a client component.
- Server pages and route handlers read identity from the NextAuth session.
- Public property search and details only expose approved listings.
- Host property ownership comes from the authenticated session, never a client-provided host ID.
- Admin bootstrap uses private environment credentials and a one-time random header secret. Never put credentials in source or public env vars.
- Host submissions are pending until an administrator approves them.
- Booking requests are guest-originated and pending until the property host confirms. Confirmed bookings can be paid through the Sandbox-only Authorize.Net Accept.js flow; the server computes the price and stores no card details.
- Authorize.Net credentials shared in chat must be rotated and must never be copied into source. Sandbox merchant support for INR is required.
- Confirmed room capacity is allocated in `RoomInventory` documents unique by room/date. Allocations are removed when eligible bookings are canceled or rejected.
- A guest can submit one review per confirmed booking after checkout. Reviews start pending moderation; only approved reviews on approved properties appear in the homepage carousel.

## Data Relationships

- `User` owns `Property` records as host and `Booking` records as guest.
- `Property` has many `Room` records and belongs to a host.
- `Booking` references guest, property, and room.
- `RoomInventory` tracks confirmed room allocations for a room and calendar day.
- Payment, Review, Coupon, Wishlist, Notification, HostPayout, and SupportTicket schemas exist; most related user workflows remain unfinished.

## Implemented Features

- Guest/host registration, login, role-directed dashboards, profile editing, and sign out.
- Private admin account bootstrap and pending property approval/rejection queue.
- Host property submission with rooms; host-specific listings and request review.
- Host listing management: core details editing, add/edit room types, room count and availability changes, and date-range blocks, with confirmed inventory conflict checks.
- Approved property search, filtering, details, and guest booking request/cancellation history.
- Eligible guests can submit or resubmit reviews from their dashboard; admins approve/reject reviews from the admin dashboard; the homepage slider uses approved database reviews.
- Server-side price calculation and per-night capacity allocation on host confirmation.

## Current API Highlights

- `POST/GET /api/properties` — create host listing / search approved listings.
- `GET /api/properties/[id]` — approved property details.
- `POST/GET /api/bookings` — guest request / current guest or host bookings.
- `PATCH /api/bookings/[id]` — guest cancel or host confirm/reject.
- `PATCH /api/admin/properties/[id]` — admin approval/rejection.
- `POST /api/reviews` — submit or resubmit a review after an eligible stay.
- `PATCH /api/admin/reviews/[id]` — admin approval/rejection for a pending review.
- `POST /api/admin/bootstrap` — one-time first-admin setup.
- `PATCH /api/account/profile` — update current user's name and phone.

## Not Yet Complete

- Authorize.Net Sandbox payment flow is implemented but not provider-tested; configure rotated keys, verify INR merchant support, and test approved/declined paths.
- Refund initiation, complete webhook reconciliation, receipts, and unresolved-transaction operations. Cancellation is blocked for pending or paid bookings until refunds are available.
- Booking expiry, invoices, and booking email notifications.
- Listing deletion, image uploads, visual date calendar, Cloudinary upload UI.
- Coupons, wishlist UI, support workflows, comprehensive admin operations and analytics.
- Automated integration/e2e tests, rate limiting, production/deployment and accessibility audits.

## Validation

Recent account, admin, booking, and payment changes need a production build, TypeScript, and targeted ESLint validation. External payment testing is pending rotated Sandbox credentials and merchant currency verification.

## Project Documents

- Product requirements: `prd.md`
- Architecture: `archetechture.md`
- Development rules: `rules.md`
- Phased roadmap: `phase.md`
- UI design: `design.md`
- Persistent project state: `memory.md`
