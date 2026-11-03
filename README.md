# Time Bank – Community Time Exchange Platform

> **Tagline:** *"Your Time Has Value. Share It. Earn It. Grow Together."*

Time Bank is a modern, responsive, full-stack microservices-based web application connecting people who need help with people who have useful skills. Members exchange services using digital time credits instead of money (1 Hour = 1 Time Credit).

---

## 1. Technology Stack

- **Frontend:** React 19 with TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Node.js with Express.js microservices architecture.
- **Database:** SQLite with `better-sqlite3`, WAL mode, foreign key enforcement, and strict ACID transaction ledgers.
- **API Communication:** RESTful Web Services via API Gateway (`/api/*`).
- **Real-Time Messaging:** Socket.IO for live peer-to-peer messaging and typing events.
- **Authentication:** JWT tokens with bcrypt password hashing (cost factor 10) and lockout protection.
- **AI Agent:** Server-side Google Gemini 3.8 Flash (`@google/genai`) grounded in real approved SQLite database records.
- **Email Notifications:** Nodemailer SMTP with responsive purple/white branded HTML templates (with graceful simulation logging when unconfigured).
- **Payment Layer:** Sri Lankan PayHere payment gateway integration (sandbox / test simulation mode with official PDF/HTML invoices in LKR).

---

## 2. Microservices Architecture

```
                               ┌────────────────────────────────┐
                               │   React Frontend Application   │
                               └───────────────┬────────────────┘
                                               │ HTTP / WebSocket
                                               ▼
                               ┌────────────────────────────────┐
                               │      API Gateway Router        │
                               └───────────────┬────────────────┘
                                               │
    ┌──────────────────┬───────────────────────┼────────────────────────┬──────────────────┐
    ▼                  ▼                       ▼                        ▼                  ▼
┌──────────────┐ ┌──────────────┐     ┌──────────────────┐    ┌──────────────────┐ ┌───────────────┐
│ Authentication│ │User Profile  │     │ Admin Approval   │    │Skill Management  │ │ Location &    │
│ Service      │ │Service       │     │ Service          │    │Service & Journey │ │ Recommendation│
└──────────────┘ └──────────────┘     └──────────────────┘    └──────────────────┘ └───────────────┘
    │                  │                       │                        │                  │
    ▼                  ▼                       ▼                        ▼                  ▼
┌──────────────┐ ┌──────────────┐     ┌──────────────────┐    ┌──────────────────┐ ┌───────────────┐
│ Help Request │ │ Booking &    │     │ Time Credit      │    │ Real-Time        │ │ Email         │
│ Service      │ │ Scheduling   │     │ Wallet Ledger    │    │ Messaging Socket │ │ Notification  │
└──────────────┘ └──────────────┘     └──────────────────┘    └──────────────────┘ └───────────────┘
    │                  │                       │                        │                  │
    ▼                  ▼                       ▼                        ▼                  ▼
┌──────────────┐ ┌──────────────┐     ┌──────────────────┐    ┌──────────────────┐ ┌───────────────┐
│ Subscription │ │ PayHere      │     │ Gemini AI Agent  │    │ Review & Rating  │ │ Analytics &   │
│ Service (LKR)│ │ Payment SL   │     │ Assistant        │    │ Service          │ │ Reports       │
└──────────────┘ └──────────────┘     └──────────────────┘    └──────────────────┘ └───────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │    SQLite Database Engine      │
                               │     (server/data/timebank.db)  │
                               └────────────────────────────────┘
```

### The 15 Microservices:

1. **Authentication Service:** JWT token lifecycle, bcrypt hashing, lockout protection, remember me, forgot/reset password.
2. **User Management Service:** Profile updates, photo uploads, address privacy shielding.
3. **Admin Approval Service:** Enforces mandatory approval for all newly registered accounts before granting access.
4. **Skill Management Service:** Skill catalog and member registry + **My Learning Journey** milestone tracking.
5. **Location & Recommendation Service:** Haversine formula distance calculation in kilometers, radius filtering, residential coordinate shielding.
6. **Help Request Service:** Public request publishing, offer submissions from helpers, and automatic booking on offer acceptance.
7. **Booking & Scheduling Service:** Mutual session confirmation (both members must confirm before credits transfer), rescheduling, duplicate booking prevention.
8. **Time Credit Wallet Service:** Double-entry ledger (1 hour = 1 credit), zero cash conversion, duplicate transfer prevention.
9. **Messaging Service:** Socket.IO real-time one-to-one chat, conversation threading, unread counter.
10. **Email Notification Service:** SMTP dispatcher with templates for approvals, rejections, requests, and bookings.
11. **Subscription Service:** Community Plans (Free & LKR 3,000/mo), Organization Plans (LKR 7,500 & LKR 15,000/mo). Configurable prices in LKR.
12. **Premium Membership Service:** Individual Premium at LKR 500/mo with verified profile badge, portfolio showcase, priority support.
13. **Payment Service:** PayHere Sri Lankan gateway integration layer, sandbox verification, invoice generation (`INV-2026-XXXX`).
14. **AI Agent Service:** Time Bank Assistant powered by Gemini 3.8 Flash, grounded in real approved SQLite member records.
15. **Review & Rating Service:** 5-star ratings, written feedback, aggregated scores.
16. **Analytics & Reporting Service:** Community impact metrics, volunteer hours, district breakdown.

---

## 3. Initial Administrator Account

A Super Admin account is pre-seeded securely on first database initialization:

- **Email:** `kashikamurugathas@gmail.com`
- **Initial Password:** `kashi123`
- **Role:** `SUPER_ADMIN`
- **First Login Security:** The administrator is prompted to replace the initial password immediately upon first login.
- **Storage:** Only stored as a secure bcrypt hash (never in plaintext).

---

## 4. Environment Variables (`.env`)

Configure the following variables in `.env` (or through the AI Studio Secrets panel):

```env
# Gemini API Key (injected automatically in AI Studio)
GEMINI_API_KEY="your_gemini_api_key"

# Port (default 3000)
PORT="3000"

# JWT Secret
JWT_SECRET="timebank_community_jwt_secret_key_2026_secure"

# SMTP Settings for live email delivery (optional - graceful fallback logging when empty)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="notifications@timebank.community"
SMTP_PASS="your_smtp_password"
SMTP_FROM="Time Bank Platform <notifications@timebank.community>"

# Sri Lankan PayHere Payment Gateway
PAYHERE_MERCHANT_ID="1225501"
PAYHERE_SECRET="sandbox_merchant_secret_key"
PAYHERE_MODE="sandbox"
```

---

## 5. Quick Start Instructions

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Run database migration, seed and start full-stack server
npm run dev
```

The application runs on `http://localhost:3000`.

---

## 6. API Endpoint Summary

| Service | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | POST | `/api/auth/register` | Register new account (status: PENDING) |
| **Auth** | POST | `/api/auth/login` | Login with email and password |
| **Auth** | GET | `/api/auth/me` | Fetch active user profile |
| **Admin** | GET | `/api/admin/pending-approvals` | List registrations awaiting approval |
| **Admin** | POST | `/api/admin/approve-user` | Approve member and dispatches approval email |
| **Admin** | POST | `/api/admin/reject-user` | Reject registration with reason |
| **Skills** | GET | `/api/skills/catalog` | Get complete skills taxonomy |
| **Learning** | POST | `/api/skills/learning-journey` | Add new learning milestone & certificate |
| **Location** | GET | `/api/location/nearby-helpers` | Haversine proximity recommendations |
| **Requests** | POST | `/api/requests` | Post new help request |
| **Requests** | POST | `/api/requests/:id/offers` | Submit help offer |
| **Bookings** | POST | `/api/bookings/:id/confirm-completion` | Mutual completion confirmation |
| **Wallet** | GET | `/api/wallet` | View available credits and ledger |
| **Wallet** | POST | `/api/wallet/transfer` | Transfer time credits |
| **Payments** | POST | `/api/payments/process` | PayHere checkout and invoice creation |
| **AI Agent** | POST | `/api/ai/chat` | Chat with Time Bank AI Assistant |
