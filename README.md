# CampusConnect

A production-oriented **multi-campus SaaS event management platform** built for universities and academic institutions. CampusConnect enables isolated campus portals, secure event workflows, QR-based attendance verification, real-time notifications, and cryptographically verifiable participation certificates.

## Features

### Multi-Campus SaaS Architecture

* Tenant-isolated university portals
* Separate student, coordinator, and administrator roles
* Campus-specific data boundaries enforced at the Firestore level

### Event Management

* Create and review academic, cultural, and technical events
* Approval workflow for administrators
* Capacity management and registration deadlines
* Inter-college and campus-exclusive visibility controls

### Digital Event Passes

* QR-based admission passes for every confirmed registration
* Dedicated ticket/pass pages with live countdown timers
* Secure registration identifiers without exposing personal data

### QR Attendance System

* Coordinator scanning dashboard
* Manual registration validation
* Duplicate scan prevention
* Real-time attendance updates

### Atomic Registration Transactions

* Firestore `runTransaction` workflows
* Race-condition-safe seat allocation
* Duplicate registration prevention
* Automatic participant counter synchronization

### Real-Time Notification Engine

* Personal notifications
* Coordinator event broadcasts
* Campus-wide administrator announcements
* Read/unread synchronization with Firestore

### Certificate & Verification System

* Professional PDF certificate generation
* Dynamic QR verification embedding
* Public verification portal (`/verify/:verificationCode`)
* Secure metadata exposure without leaking personal credentials

### Security

* Production-grade Firestore security rules
* Role-based access control
* Tenant isolation
* Query-level data filtering
* Coordinator event-scoped access

## Tech Stack

* **Frontend:** React 19 + TypeScript + Vite
* **Styling:** Tailwind CSS v4
* **Backend:** Express
* **Database:** Firebase Firestore
* **Authentication:** Firebase Authentication
* **Icons:** Lucide React
* **PDF:** jsPDF
* **Motion:** Motion (Framer Motion)

## Architecture Highlights

* Real-time Firestore subscriptions
* Chunked `in` queries for coordinator event data
* Event-scoped certificate retrieval
* Public verification API proxy using `firebase-admin`
* Multi-tenant SaaS onboarding flow for new institutions

## Current Status

CampusConnect has completed:

* Phase 5A — Digital Event Pass & QR Registration
* Phase 5B — QR Attendance & Student Check-In
* Phase 5C — Professional PDF Certificates & Public Verification
* Production Firestore Security Alignment
* Real-Time Notification & Broadcast System
* Premium Landing Page Visual Refinement

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Verification Portal

Example:

```
/verify/CC-VERT-AB12CD34
```

This endpoint validates certificate authenticity without requiring user login.

## Author

**Deepika Vetcha**
B.Tech Information Technology, ANITS (Affiliated to Andhra University)

