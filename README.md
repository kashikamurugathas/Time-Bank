# Time Bank – Community Time Exchange Platform

> **Tagline:** *"Your Time Has Value. Share It. Earn It. Grow Together."*

Time Bank is a production-grade, responsive, full-stack microservices-based web application connecting people who need help with people who have useful skills. Members exchange services using digital time credits instead of money (1 Hour of any service = 1 Time Credit).

---

## 1. Microservices Architecture Diagram

```
                                      ┌────────────────────────────────┐
                                      │   React 19 Frontend Client     │
                                      │   (TypeScript + Tailwind CSS)  │
                                      └───────────────┬────────────────┘
                                                      │ HTTP REST / WebSocket
                                                      ▼
                       ┌─────────────────────────────────────────────────────────────┐
                       │                   API GATEWAY SERVICE                       │
                       │               (Port 3000 / Reverse Proxy)                   │
                       │     Health Aggregator, Rate Limiting & Auth Gatekeeper      │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
         ┌───────────────────┬────────────────────────┼────────────────────────┬───────────────────┐
         ▼                   ▼                        ▼                        ▼                   ▼
┌──────────────────┐┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ ┌───────────────────┐
│  Auth Service    ││ User Management  │    │  Admin Approval  │    │ Skill Management │ │   Location &      │
│  (Port 5001)     ││  (Port 5002)     │    │   (Port 5003)    │    │   (Port 5004)    │ │ Recommendation  │
│  [DB: auth.db]   ││ [DB: users.db]   │    │  [DB: admin.db]  │    │ [DB: skills.db]  │ │   (Port 5005)     │
└────────┬─────────┘└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘ │ [DB: location.db] │
         │                   │                       │                       │           └─────────┬─────────┘
         │                   │                       │                       │                     │
         ├───────────────────┴───────────────────────┼───────────────────────┴─────────────────────┤
         │                                           ▼                                             │
         │                    ┌──────────────────────────────────────────────┐                     │
         │                    │            DISTRIBUTED EVENT BUS             │                     │
         │                    │    (Pub/Sub for Inter-Service Events)        │                     │
         │                    └──────────────────────┬───────────────────────┘                     │
         │                                           │                                             │
         ├───────────────────┬───────────────────────┼───────────────────────┬─────────────────────┤
         │                   │                       │                       │                     │
         ▼                   ▼                       ▼                       ▼                     ▼
┌──────────────────┐┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ ┌───────────────────┐
│   Help Request   ││     Booking &    │    │   Time Credit    │    │    Messaging     │ │      Email        │
│     Service      ││    Scheduling    │    │  Wallet Service  │    │     Service      │ │   Notification    │
│   (Port 5006)    ││   (Port 5007)    │    │   (Port 5008)    │    │   (Port 5009)    │ │   (Port 5010)     │
│ [DB: requests.db]││[DB: bookings.db] │    │ [DB: wallet.db]  │    │ [DB: messages.db]│ │ [DB: email.db]    │
└──────────────────┘└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘ └─────────┬─────────┘
                             │                       │                       │                     │
         ┌───────────────────┴───────────────────────┼───────────────────────┴─────────────────────┤
         ▼                                           ▼                                             ▼
┌──────────────────┐                        ┌──────────────────┐                         ┌───────────────────┐
│   Subscription   │                        │     Payment      │                         │     AI Agent      │
│     Service      │                        │     Service      │                         │     Service       │
│   (Port 5011)    │                        │   (Port 5012)    │                         │   (Port 5013)     │
│[DB: subscriptions]                        │ [DB: payments.db]│                         │  [DB: ai.db]      │
└────────┬─────────┘                        └────────┬─────────┘                         └─────────┬─────────┘
         │                                           │                                             │
         ▼                                           ▼                                             ▼
┌──────────────────┐                        ┌──────────────────┐                         ┌───────────────────┐
│ Review & Rating  │                        │   Analytics &    │                         │  Gemini 3.8 Flash │
│  (Port 5014)     │                        │    Reporting     │                         │  Grounding API    │
│ [DB: reviews.db] │                        │   (Port 5015)    │                         │  (Server-Side)    │
└──────────────────┘                        │[DB: analytics.db]│                         └───────────────────┘
                                            └──────────────────┘
```

---

## 2. Microservices Directory & Responsibilities

| # | Service Name | Dedicated Port | Database File | Core Responsibilities |
|---|---|---|---|---|
| **1** | **API Gateway Service** | 3000 | *Stateless* | Reverse proxy, endpoint routing, JWT authentication guard, health check aggregator. |
| **2** | **Authentication Service** | 5001 | `auth.db` | User registration, password hashing (bcrypt), JWT generation/validation, password reset. |
| **3** | **User Management Service** | 5002 | `users.db` | User accounts, profiles, bio, avatar photo storage, address privacy shielding. |
| **4** | **Admin Approval Service** | 5003 | `admin.db` | Mandatory approval workflow for new members, suspensions, and immutable audit logs. |
| **5** | **Skill Management Service** | 5004 | `skills.db` | Skill taxonomy catalog, member skill profiles, My Learning Journey, certificate proofs. |
| **6** | **Location & Recommendation Service** | 5005 | `location.db` | Geospatial coordinates, Haversine formula distance calculation, proximity-based helper matching. |
| **7** | **Help Request Service** | 5006 | `requests.db` | Request creation, categorisation, helper offer submissions, request cancellation. |
| **8** | **Booking & Scheduling Service** | 5007 | `bookings.db` | Direct bookings, offer-to-booking conversions, rescheduling, dual-party completion confirmation. |
| **9** | **Time Credit Wallet Service** | 5008 | `wallet.db` | Non-monetary time credit ledger (1 hour = 1 credit), transfers, welcome bonus, admin adjustments. |
| **10** | **Messaging Service** | 5009 | `messages.db` | Socket.IO real-time direct chat, conversation threads, message read tracking. |
| **11** | **Email Notification Service** | 5010 | `email.db` | SMTP email dispatch, email logging, and in-app member notification inbox. |
| **12** | **Subscription Service** | 5011 | `subscriptions.db` | Community, organization, and premium tiers, plan feature configurations, auto-renewal. |
| **13** | **Payment Service** | 5012 | `payments.db` | Sri Lankan PayHere gateway integration, invoice generation (`INV-2026-XXXX`). |
| **14** | **AI Agent Service** | 5013 | `ai.db` | Time Bank assistant powered by Google Gemini, grounded in live skills, requests, and helper data. |
| **15** | **Review & Rating Service** | 5014 | `reviews.db` | 1-to-5 star ratings, member feedback reviews, rating average aggregation. |
| **16** | **Analytics & Reporting Service** | 5015 | `analytics.db` | Platform impact KPIs, volunteer hours exchanged, SDG impact metrics, local chapters. |

---

## 3. Database Structure Per Microservice

Each microservice strictly owns its isolated SQLite database file inside `server/data/`:

### `auth.db` (Auth Service)
- `roles`: `id`, `name`, `description`, `created_at`
- `auth_users`: `id`, `email`, `password_hash`, `account_type`, `role_id`, `status`, `rejection_reason`, `requires_password_change`, `failed_login_attempts`, `locked_until`, `created_at`, `updated_at`
- `password_resets`: `id`, `user_id`, `token`, `expires_at`, `used`, `created_at`

### `users.db` (User Management Service)
- `user_accounts`: `id`, `email`, `account_type`, `role_id`, `status`, `created_at`
- `user_profiles`: `user_id`, `full_name`, `phone_number`, `bio`, `country`, `district`, `city`, `address_privacy`, `profile_photo_url`, `membership_tier`, `rating_avg`, `rating_count`, `completed_services_count`, `created_at`, `updated_at`
- `profile_photos`: `id`, `user_id`, `filename`, `mime_type`, `size_bytes`, `data_base64`, `created_at`

### `admin.db` (Admin Approval Service)
- `admin_logs`: `id`, `admin_id`, `action`, `target_type`, `target_id`, `details`, `ip_address`, `created_at`

### `skills.db` (Skill Management Service)
- `skills_catalog`: `id`, `name`, `category`, `description`, `is_active`, `created_at`
- `user_skills`: `id`, `user_id`, `skill_id`, `experience_level`, `description`, `hourly_rate_credits`, `availability_status`, `preferred_locations`, `qualification_proof_url`, `work_samples`, `is_verified`, `created_at`, `updated_at`
- `learning_records`: `id`, `user_id`, `skill_name`, `category`, `status`, `progress_percentage`, `description`, `learning_institution`, `completion_date`, `certificate_url`, `project_image_url`, `work_samples`, `is_verified_by_admin`, `created_at`, `updated_at`
- `skill_certificates`: `id`, `learning_record_id`, `user_id`, `title`, `issuer`, `issue_date`, `certificate_data`, `verified_at`, `verified_by_admin_id`

### `location.db` (Location & Recommendation Service)
- `user_locations`: `user_id`, `latitude`, `longitude`, `formatted_address`, `city`, `district`, `search_radius_km`, `is_current_location`, `updated_at`

### `requests.db` (Help Request Service)
- `help_requests`: `id`, `requester_id`, `title`, `category`, `skill_id`, `skill_name`, `description`, `preferred_date`, `preferred_time`, `duration_hours`, `credits_offered`, `location_name`, `latitude`, `longitude`, `additional_notes`, `status`, `created_at`, `updated_at`
- `help_responses`: `id`, `request_id`, `helper_id`, `proposed_date`, `proposed_time`, `message`, `status`, `created_at`

### `bookings.db` (Booking & Scheduling Service)
- `bookings`: `id`, `booking_code`, `request_id`, `requester_id`, `helper_id`, `skill_name`, `service_date`, `service_time`, `duration_hours`, `credit_amount`, `location_name`, `status`, `requester_confirmed_completion`, `helper_confirmed_completion`, `reschedule_proposed_date`, `reschedule_proposed_time`, `reschedule_reason`, `cancellation_reason`, `created_at`, `updated_at`
- `booking_history`: `id`, `booking_id`, `action`, `actor_id`, `notes`, `created_at`

### `wallet.db` (Time Credit Wallet Service)
- `wallets`: `user_id`, `available_credits`, `earned_credits`, `spent_credits`, `pending_credits`, `updated_at`
- `time_transactions`: `id`, `reference_no`, `from_user_id`, `to_user_id`, `amount_credits`, `transaction_type`, `related_booking_id`, `description`, `status`, `created_at`

### `messages.db` (Messaging Service)
- `conversations`: `id`, `user1_id`, `user2_id`, `related_booking_id`, `last_message_at`, `created_at`
- `messages`: `id`, `conversation_id`, `sender_id`, `recipient_id`, `content`, `is_read`, `read_at`, `created_at`

### `email.db` (Email Notification Service)
- `email_logs`: `id`, `recipient_email`, `subject`, `template_type`, `status`, `error_message`, `sent_at`
- `notifications`: `id`, `user_id`, `title`, `content`, `type`, `link_url`, `is_read`, `created_at`

### `subscriptions.db` (Subscription Service)
- `subscription_plans`: `id`, `name`, `category`, `price_lkr`, `duration_days`, `features_json`, `is_active`, `updated_at`
- `subscriptions`: `id`, `user_id`, `plan_id`, `community_id`, `organization_id`, `status`, `start_date`, `end_date`, `auto_renew`, `created_at`

### `payments.db` (Payment Service)
- `payments`: `id`, `transaction_ref`, `user_id`, `plan_id`, `amount_lkr`, `currency`, `gateway`, `status`, `payment_method`, `gateway_response_json`, `created_at`
- `invoices`: `id`, `invoice_number`, `payment_id`, `user_id`, `amount_lkr`, `tax_lkr`, `description`, `pdf_data`, `issued_at`

### `ai.db` (AI Agent Service)
- `ai_conversations`: `id`, `user_id`, `title`, `created_at`
- `ai_messages`: `id`, `conversation_id`, `sender`, `content`, `metadata_json`, `created_at`

### `reviews.db` (Review & Rating Service)
- `reviews`: `id`, `booking_id`, `reviewer_id`, `reviewed_user_id`, `rating`, `comment`, `created_at`

### `analytics.db` (Analytics & Reporting Service)
- `communities`: `id`, `name`, `description`, `leader_id`, `district`, `city`, `plan_tier`, `created_at`
- `community_members`: `id`, `community_id`, `user_id`, `role`, `joined_at`
- `organizations`: `id`, `name`, `description`, `owner_id`, `registration_no`, `plan_tier`, `created_at`
- `organization_members`: `id`, `organization_id`, `user_id`, `role`, `hours_contributed`, `joined_at`

---

## 4. API Endpoints Documentation

All requests route through the unified API Gateway (`/api/*`):

### Health Check & Service Discovery
- `GET /health` or `GET /api/health` — Aggregated health status of all 16 microservices.

### Authentication Service (`/api/auth`)
- `POST /api/auth/register` — Register new user (status: PENDING).
- `POST /api/auth/login` — Authenticate and receive JWT.
- `POST /api/auth/change-password` — Change password.
- `POST /api/auth/forgot-password` — Dispatch password reset link.
- `POST /api/auth/reset-password` — Reset password via token.

### User Management Service (`/api/users`)
- `GET /api/users/profile` — Get full authenticated user profile.
- `PUT /api/users/profile` — Update member profile information.
- `POST /api/users/profile-photo` — Upload member profile picture (Base64).
- `DELETE /api/users/profile-photo` — Remove profile picture.
- `GET /api/users/public/:id` — Public profile.

### Admin Approval Service (`/api/admin`)
- `GET /api/admin/pending-approvals` — List pending member registrations.
- `GET /api/admin/users` — List and filter all users.
- `POST /api/admin/approve-user` — Approve member and emit approval event.
- `POST /api/admin/reject-user` — Reject registration with reason.
- `POST /api/admin/suspend-user` — Suspend or reinstate account.
- `GET /api/admin/audit-logs` — Administrative audit logs.

### Skill Management Service (`/api/skills`)
- `GET /api/skills/catalog` — Get skills taxonomy catalog.
- `GET /api/skills/categories` — Get unique skill categories.
- `POST /api/skills/catalog` — Create new catalog skill (Admin).
- `GET /api/skills/my-skills` — Get authenticated member's skills.
- `POST /api/skills/my-skills` — Add new skill to profile.
- `DELETE /api/skills/my-skills/:id` — Remove skill from profile.
- `POST /api/skills/learning-journey` — Add learning record and certificate.
- `POST /api/skills/verify-certificate` — Verify skill certificate.

### Location & Recommendation Service (`/api/location`)
- `GET /api/location/nearby-helpers` — Query helpers by latitude, longitude, and radius using Haversine calculation.
- `PUT /api/location/update-location` — Update member coordinates.

### Help Request Service (`/api/requests`)
- `GET /api/requests` — List help requests with filters.
- `GET /api/requests/:id` — Get request details and helper offers.
- `POST /api/requests` — Create a new help request.
- `POST /api/requests/:id/offers` — Helper submits help offer.
- `POST /api/requests/:id/accept-offer` — Accept offer (triggers Booking Service).
- `POST /api/requests/:id/cancel` — Cancel help request.

### Booking & Scheduling Service (`/api/bookings`)
- `GET /api/bookings` — Get member bookings.
- `GET /api/bookings/:id` — Get booking details and history.
- `POST /api/bookings/direct` — Book a helper directly.
- `POST /api/bookings/:id/confirm-completion` — Confirm completion (both parties required; triggers Wallet Service).
- `POST /api/bookings/:id/reschedule` — Propose new session date/time.
- `POST /api/bookings/:id/accept-reschedule` — Confirm proposed reschedule.
- `POST /api/bookings/:id/cancel` — Cancel booking.

### Time Credit Wallet Service (`/api/wallet`)
- `GET /api/wallet` — View available credits and transaction ledger.
- `POST /api/wallet/transfer` — Transfer time credits peer-to-peer.
- `GET /api/admin/transactions` — Platform-wide transaction audit.
- `POST /api/admin/wallet-adjust` — Admin credit balance adjustment.

### Messaging Service (`/api/messages`)
- `GET /api/messages/conversations` — List active conversations.
- `GET /api/messages/conversations/:id` — Get chat message thread.
- `POST /api/messages/send` — Send direct message (triggers Socket.IO and Email Notification).
- `GET /api/messages/unread-count` — Count unread messages.

### Email Notification Service (`/api/notifications`)
- `GET /api/notifications` — Get user notifications.
- `POST /api/notifications/:id/read` — Mark notification read.
- `POST /api/notifications/read-all` — Mark all notifications read.
- `GET /api/email/email-logs` — Audit sent/simulated emails.

### Subscription Service (`/api/subscriptions`)
- `GET /api/subscriptions/plans` — List available subscription tiers.
- `GET /api/subscriptions/my-subscription` — Get active user subscription.
- `PUT /api/subscriptions/admin/plans/:id` — Admin updates plan pricing.
- `POST /api/subscriptions/cancel` — Cancel auto-renewal.

### Payment Service (`/api/payments`)
- `POST /api/payments/initiate` — Generate PayHere payment payload.
- `POST /api/payments/process` — Process and verify payment transaction.
- `GET /api/payments/my-payments` — List user payments.
- `GET /api/admin/payments` — Admin financial records.

### AI Agent Service (`/api/ai`)
- `POST /api/ai/chat` — Send prompt to Time Bank AI Assistant with live grounding data.
- `GET /api/ai/history/:convId` — Retrieve conversation history.

### Review & Rating Service (`/api/reviews`)
- `POST /api/reviews` — Submit 1-5 star review and comment.
- `GET /api/reviews/user/:id` — Get member reviews.

### Analytics Service (`/api/analytics`)
- `GET /api/analytics/community-impact` — Real-time community impact summary.
- `GET /api/analytics/platform-report` — Admin platform metrics report.
- `GET /api/communities/:id` — Get community chapter details.
- `GET /api/organizations/:id` — Get partner organization details.

---

## 5. Docker & Docker Compose Instructions

### Running with Docker Compose (All 16 Services)

To run the complete microservices suite with independent containers and SQLite volume persistence:

```bash
# Build images and start all 16 microservices in isolated containers
docker-compose up -d --build

# Inspect the status of all microservices
docker-compose ps

# View unified logs or logs for a specific service
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f wallet-service

# Stop all microservices
docker-compose down
```

---

## 6. Local Development & Testing Instructions

### Single-Command Start (Development)

```bash
# Start the full-stack application with API Gateway and all microservices
npm run dev
```

### Running Microservices Concurrently on Independent Ports

```bash
# Start all 15 microservices independently on dedicated ports 5001-5015
npm run microservices:start
```

### Running an Individual Microservice Standalone

```bash
# Start Auth Service independently on port 5001
npm run microservices:auth

# Start User Management Service independently on port 5002
npm run microservices:users

# Start Time Credit Wallet Service independently on port 5008
npm run microservices:wallet

# Start Booking Service independently on port 5007
npm run microservices:bookings

# Start API Gateway on port 3000
npm run microservices:gateway
```

### Testing the Microservices Health Endpoint

```bash
curl http://localhost:3000/api/health
```

### Super Admin Credentials (Pre-seeded & Preserved)

- **Email:** `kashikamurugathas@gmail.com`
- **Initial Password:** `kashi123`
- **Role:** `SUPER_ADMIN`
