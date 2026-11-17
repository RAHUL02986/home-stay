# Product Requirements Document (PRD)

## Homestay & Hotel Booking Platform — Dharamshala, Himachal Pradesh

**Version:** 1.0 (MVP)
**Date:** 2026-04-11
**Owner:** Product / Engineering

---

## 1. Product Overview

A web platform that connects travelers visiting **Dharamshala, Himachal Pradesh** with local
homestay and small-hotel owners. The platform focuses on hyper-local discovery across
Dharamshala sub-regions (McLeodganj, Dharamkot, Naddi, Bhagsu, etc.) and empowers hosts to
self-manage their property listings and room inventory.

Built with **Next.js (App Router)**, **MongoDB (local)**, **Mongoose**, and **Tailwind CSS**.

---

## 2. Problem Statement

- Travelers struggle to find authentic, locally-run stays in Dharamshala with clear amenity
  and room details.
- Hosts have no simple, self-serve tool to publish and manage their properties online.
- Existing platforms are generic and lack sub-location granularity for the Dharamshala region.

---

## 3. Target Users

### 3.1 Guests (Travelers)
- Browse stays filtered by sub-region, price, amenities, and availability.
- View detailed property pages with rooms, amenities, images, and location.

### 3.2 Hosts (Property Owners)
- Register and manage their own properties.
- Add multiple room types per property with pricing and capacity.
- Update availability and amenities.

---

## 4. Core Features

### 4.1 Host / Owner Management

| ID | Feature | Description |
|----|---------|-------------|
| H-1 | Host Registration | Hosts can register an account (role = `host`). |
| H-2 | Host Dashboard | View and manage owned properties. |
| H-3 | Property Listing Form | Form with: Name, Description, Location (area), Address / Coordinates, Features & Amenities. |
| H-4 | Room Management | Add multiple room types: type, price/night, max guests, availability, individual features. |

### 4.2 User / Guest Functionality

| ID | Feature | Description |
|----|---------|-------------|
| G-1 | Location-Based Search | Browse listings filtered by Dharamshala sub-regions. |
| G-2 | Search Filters | Filter by price, availability, room features, sub-location. |
| G-3 | Property Detail View | Clean UI: images, description, room options, amenities, location. |
| G-4 | Booking Request | A signed-in guest requests an available room for a date range; the host must confirm. |
| G-5 | Booking History | Guests see request/confirmation status and may cancel eligible future stays. |

### 4.3 Admin Moderation

| ID | Feature | Description |
|----|---------|-------------|
| A-1 | Property Review | Administrators approve or reject host-submitted listings before public display. |
| A-2 | Admin Provisioning | The first admin is created through a protected one-time server-only bootstrap; public signup cannot grant admin access. |

---

## 5. User Stories

### Host
- As a host, I want to register so I can list my property.
- As a host, I want to add my property with location, amenities, and rooms.
- As a host, I want to edit availability and pricing of my rooms.

### Guest
- As a guest, I want to filter stays by area (McLeodganj, Dharamkot, ...).
- As a guest, I want to filter by price range and amenities (Wi-Fi, Mountain View, ...).
- As a guest, I want to see full property details before deciding.
- As a guest, I want to request dates and rooms and see the host's decision in my dashboard.

### Administrator
- As an administrator, I want to review and approve or reject host listings before guests can discover them.

---

## 6. Non-Functional Requirements

- **Performance:** API responses < 500ms for listing queries on local DB.
- **Responsiveness:** Mobile-first, works on phones/tablets/desktops.
- **Maintainability:** Modular code, TypeScript types, clear folder structure.
- **Error Handling:** Graceful errors with meaningful messages; no raw stack traces to users.
- **Security (MVP):** Zod validation, server-derived user identity, role-protected operations, approved-only public listings, and server-side price calculation.

---

## 7. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend / Backend | Next.js (Latest App Router) |
| Database | MongoDB (local `mongodb://localhost:27017/homestay_db`) |
| ODM | Mongoose |
| Styling | Tailwind CSS |
| Language | TypeScript |

---

## 8. Current Scope and Deferred Features

The current MVP includes guest/host authentication, profile editing, host listing submission with admin approval, approved-listing discovery, guest booking requests, host confirmations, per-night room capacity allocation, and guest cancellation before check-in.

The current booking request workflow does **not** collect payment. Razorpay, refunds, booking invoices/notifications, reviews, offers, full property editing, image uploads, analytics, and multi-language support remain deferred. Do not describe a pending request as a paid or instantly confirmed booking.

---

## 9. Success Metrics (MVP)

- Host can create a property with >=1 room end-to-end via UI.
- Guest can filter properties by sub-location and price.
- Property detail page renders all rooms and amenities.
- Zero unhandled server errors on happy paths.

---

## 10. Open Decisions

1. **Language:** TypeScript (recommended) vs JavaScript.
2. **Auth:** Include NextAuth.js/Auth.js now or later? (Schema is auth-ready either way.)
3. **Image hosting:** Cloudinary / S3 vs local URL strings for MVP.
4. **Map provider:** Google Maps vs Mapbox for coordinate display.

---

## 11. Glossary

- **Property:** A homestay/hotel listing owned by a host.
- **Room:** A bookable unit within a property with its own price and capacity.
- **Area / Sub-location:** Dharamshala sub-region (McLeodganj, Dharamkot, Naddi, Bhagsu, ...).
- **Amenity:** A feature tag (Wi-Fi, Mountain View, Kitchen, Parking, Pet-friendly, ...).

## 12. Current Decisions

These decisions supersede the original open questions above: TypeScript and NextAuth credentials are implemented; admin accounts are privately bootstrapped; listing images are currently URL-based; maps are still a placeholder; booking requests require host confirmation; payment capture remains deferred until Razorpay test credentials and webhooks are configured.
