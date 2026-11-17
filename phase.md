# Implementation Roadmap

## Homestay Platform — Dharamshala

The project is implemented in independently testable phases. Existing UI and completed workflows should remain functional while each phase is delivered. Do not represent an unconfigured integration (such as payment) as working.

## Phase 1 — Project Setup and Documentation

**Status: Complete**

- Next.js App Router, TypeScript, Tailwind CSS, ESLint, MongoDB, and Mongoose configured.
- Product, architecture, development, design, phase, and memory documents exist.
- Environment secrets are kept in the ignored `.env.local` file.

## Phase 2 — Authentication and User Management

**Status: Complete for MVP**

- Guest and host registration, credential login, role-aware sessions, and protected dashboards.
- Profile name and phone editing.
- Admin is provisioned privately; public registration cannot create admins.
- Follow-up: verification emails and account recovery.

## Phase 3 — Host Dashboard and Property Management

**Status: Host management MVP implemented**

- Hosts create properties with room types; each listing is owned by the authenticated host.
- Hosts can edit core listing information, edit room rates/capacity, add room types, toggle room availability, and block date ranges. Changes take effect immediately.
- Room count reductions and date blocks are rejected if they conflict with confirmed room allocations.
- Host dashboard shows the host's listings and booking requests.
- New listings start pending and can be previewed after admin approval.
- Host can accept or decline booking requests.
- Follow-up: listing deletion, image uploads, visual inventory calendar, and payout views.

## Phase 4 — Guest Website, Search, and Property Details

**Status: Partial**

- Responsive homepage, destination links, search listing and filters, and property detail pages.
- Only approved properties are discoverable through search and detail routes.
- Follow-up: URL-backed search, sort and pagination, map view, date/occupancy search, and recommendations.

## Phase 5 — Booking Engine

**Status: MVP request flow implemented**

- Signed-in guests can request a room for future dates.
- Price is calculated on the server from the selected room; client prices are not trusted.
- Hosts can confirm or decline requests. Confirmations allocate room inventory per night, preventing capacity from being exceeded for overlapping stays.
- Guests can see their booking history and cancel eligible future bookings.
- Payment is not collected in this phase; a request is not represented as a paid booking.
- Follow-up: expiry/cleanup policy, booking confirmation numbers, invoice, and booking notifications.

## Phase 6 — Payments and Refunds

**Status: Authorize.Net Sandbox MVP implemented; credentials and provider testing required**

- Guest payment is available for host-confirmed bookings through Authorize.Net Accept.js.
- The server derives the amount from the booking record, records gateway status, prevents duplicate payment attempts, and verifies signed webhook events.
- Sandbox only. INR merchant support and rotated Sandbox credentials must be configured and verified before checkout can be tested.
- Follow-up: verify against the configured Sandbox account, implement refund initiation/reconciliation, receipts, and operational handling for unresolved pending transactions. Cancellation is blocked while payment is pending or successful until refunds are supported.

## Phase 7 — Reviews, Offers, and Notifications

**Status: Reviews MVP implemented**

- Guests can review their confirmed stays after checkout; reviews are moderated before publication.
- Administrators can approve or reject pending reviews; guests can resubmit rejected reviews.
- The homepage carousel displays approved reviews from actual guests and properties.
- Coupon validity, usage limits, and server-side discounts.
- Booking, account, and host notification delivery.

## Phase 8 — Admin Dashboard

**Status: Property and guest-review moderation MVP implemented**

- Secure one-time environment-backed admin bootstrap.
- Admin can review pending property submissions and approve or reject them.
- Follow-up: user/host management, bookings, payments/refunds, payouts, coupons, support, and analytics.

## Phase 9 — Testing, Security, Optimization, and Deployment

**Status: In progress**

- Production build, TypeScript, and targeted ESLint checks are run for changes.
- Add automated unit/integration/e2e coverage, rate limits, production configuration checks, accessibility and responsive audits, monitoring, and deployment documentation.

## Dependencies and Next Work

- Phases 1–4 provide the identity, listings, and discovery used by booking.
- Phase 5 request/confirmation flow is in place; Phase 6 payment flow requires valid rotated Sandbox credentials and provider testing before it can be considered end-to-end verified.
- Phase 7 depends on completed bookings and payment/cancellation policy.
- Phase 8 admin capabilities grow alongside listings, bookings, reviews, and payments.
- Next: configure and test Authorize.Net Sandbox credentials and INR merchant support; then implement payment reconciliation/refunds.
