# CampusConnect

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/Status-Active-success)

CampusConnect is a production-oriented multi-campus SaaS event management platform built for universities and academic institutions. It provides tenant-isolated campus portals, role-based administration, real-time event discovery, QR-based attendance verification, broadcast notifications, and publicly verifiable participation certificates through a secure Firebase and Express architecture.

---

## 🚀 Key Features

*   **Multi-Campus Tenant Isolation:** Robust tenant-aware routing that separates events, announcements, and registrations by campus, with flexible provisions for cross-campus visibility.
*   **Role-Based Access Control (RBAC):** Distinct portals and customized workspaces for **Students**, **Coordinators**, and **Administrators** integrated with Firebase Authentication.
*   **Interactive Event Lifecycle:** Full pipeline support for event drafting, multi-stage coordinator approvals, registration cap enforcement, live seat counters, and countdown timers.
*   **Digital Pass System:** QR-code based ticket generation allowing offline/online event admission passes with secure scan-prevention logic.
*   **Coordinator Attendance Panel:** Built-in scanner dashboard for rapid check-ins, multi-scan prevention, and automated triggers to release participation certificates.
*   **QR-Enabled Certificate Verification:** Automatically generated professional PDF certificates embedded with unique verification QR codes, allowing public verification via `/verify/:verificationCode`.
*   **Real-Time Broadcast Engine:** Instant personal synchronization of read/unread notifications, emergency coordinator broadcasts, and administrative announcements.

---

## 🛠️ Tech Stack

### Frontend & Client Experience
*   **React 19 & TypeScript:** Strict typing, declarative state engines, and modern React hooks.
*   **Vite:** Fast builds and low-latency development server.
*   **Tailwind CSS v4:** Utility-first, highly responsive, modern component styling with standard CSS custom properties.
*   **Motion:** Smooth, physics-based UI transitions and elegant viewport scroll micro-interactions.
*   **jsPDF:** Clean client-side rendering of high-fidelity, professional academic participation certificates.

### Backend, Security & Persistence
*   **Express & Node.js:** High-throughput server-side API endpoints handling certificate cryptographic signatures and verification lookups.
*   **Firebase Firestore:** Scalable, low-latency NoSQL database configured with strict real-time listeners.
*   **Firebase Authentication:** Secure login, token handling, and multi-role identity management.
*   **Firestore Security Rules:** Sophisticated server-side security assertions verifying that users only write, read, or modify documents aligned with their assigned claims.

---

## 🏛️ Architecture Highlights

### 🔒 Strict Tenant Isolation & RBAC
Campus documents are strictly isolated at the schema and security levels. Firestore Security Rules enforce access control rules dynamically by verifying `request.auth.uid` and comparing user role fields before any write or read operation succeeds.

### ⚡ Race-Condition-Safe Seat Allocation
To prevent registration overbooking, CampusConnect leverages **Firestore atomic transactions (`runTransaction`)**. Seat allocation queries read the current availability, verify registration status, and decrement the seat counter atomically to ensure absolute synchronization even under massive concurrent load.

### 🔄 Real-Time Synchronization

CampusConnect uses Firestore `onSnapshot` listeners with tenant-scoped queries to provide live updates for events, registrations, notifications, attendance status, and certificate availability without requiring manual page refreshes.

### 🧾 Secure Certificate Verification API
When attendance is validated by a coordinator, a unique hash is generated on the server. The public-facing `/verify/:verificationCode` portal uses a robust Express endpoint to query and validate the certificate's authenticity, preventing digital certificate forgery.


---

## 🗺️ Project Roadmap

### Phase 1 — SaaS Foundation
*   [x] Multi-campus tenant isolation and onboarding architecture
*   [x] Tenant-aware routing and navigation
*   [x] Secure role-based authentication (Student / Coordinator / Admin)
*   [x] Production-optimized Firestore schema and indexes

### Phase 2 — Event Management
*   [x] Coordinator event creation and editing workspace
*   [x] Administrative multi-level approval/rejection workflows
*   [x] Global inter-campus vs. local visibility controls
*   [x] Absolute capacity enforcement and registration deadline management

### Phase 3 — Real-Time Platform Core
*   [x] Live database listeners and responsive real-time metrics
*   [x] Dynamic campus-wide discovery feeds with sorting/filtering
*   [x] Student registration dashboards and real-time history trackers
*   [x] Dynamic countdown timers and broadcast infrastructure

### Phase 4 — Student Experience
*   [x] Persistent dashboard layouts and sidebar navigation hubs
*   [x] Rich detail pages featuring real-time seat availability tracking
*   [x] Interactive registration state engine
*   [x] Integrated notification center and certificate request workflows

### Phase 5A — Digital Pass System
*   [x] Secure QR-based digital ticket generation
*   [x] Dedicated ticket display panels for easy presentation
*   [x] Unique registration identifiers (UUID mapping)

### Phase 5B — Attendance & Check-In
*   [x] Coordinator mobile-first scanning dashboard
*   [x] Instant, secure QR code ticket verification
*   [x] Duplicate scan prevention and validation feedback
*   [x] Attendance transitions triggering automated certificate eligibility

### Phase 5C — Certificate & Verification
*   [x] Dynamic PDF certificate rendering with high-resolution layout configurations
*   [x] Automated QR-code embedding on certificate canvases
*   [x] Public verification portal at `/verify/:verificationCode`
*   [x] Secure verification REST API routing

### Production Security, Notifications & UI Refinement
*   [x] Production-ready Firestore security rules and index definitions
*   [x] Comprehensive real-time notification broadcast and read-state sync systems
*   [x] Metallic Chic aesthetic design system with a premium, focused navy landing hero
*   [x] Fully responsive, mobile-optimized layouts for cross-device usability

---

### Upcoming Milestones

#### Phase 6 — Campus Map & Navigation
*   [ ] Interactive vector-based campus map integration
*   [ ] Google Maps API integration with local department geofences
*   [ ] Live route guidance to event venues

#### Phase 7 — Analytics & Insights
*   [ ] Event registration trends and coordinator analytics dashboard
*   [ ] Interactive department engagement charts
*   [ ] Exportable analytics reports (CSV, Excel)

#### Phase 8 — Deployment & Production Operations
*   [ ] Custom domain configuration and automated SSL integration
*   [ ] Server-side performance optimization and localized caching
*   [ ] SEO optimization and unified monitoring setups

#### Phase 9 — Advanced Collaboration
*   [ ] University club profile management panels
*   [ ] Multi-organizer event collaboration features
*   [ ] Live event discussion boards and community media galleries

#### Phase 10 — Final Launch
*   [ ] Portfolio-ready public showcase assets and recruiter documentation
*   [ ] Polished demonstration credentials and sandbox data profiles

---

## 💻 Local Development

Follow these steps to run the CampusConnect application locally:

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed on your machine.

### 2. Installation
Clone the repository and install the dependencies:
```bash
# Navigate to the workspace root
cd campusconnect

# Install package dependencies
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in your root directory matching `.env.example` configurations.

### 4. Run Development Server
Boot up the development environment:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 📦 Build & Production

To generate a production-ready static build, compile the assets using the production scripts:

```bash
# Build optimized client and server bundles
npm run build

# Preview the production build locally
npm run preview
```

The client assets will be optimized and compiled into the `/dist` directory.

---

## 🔗 Verification Portal Example

Universities and future employers can instantly verify student achievements using our secure verification system:

*   **Endpoint Path:** `/verify/:verificationCode`
*   **Sample Link Structure:** `https://campusconnect.edu/verify/CERT-9A82-F13B`
*   **Verification Result Payload:**
    ```json
    {
      "verified": true,
      "recipient": "Student Name",
      "institution": "Andhra University",
      "event": "Annual Web Engineering Summit 2026",
      "date": "2026-07-21",
      "status": "Authenticated & Verified"
    }
    ```

---

## 🧑‍💻 Author

**Deepika Vetcha**  
*B.Tech in Information Technology*  
ANITS (Affiliated to Andhra University)
