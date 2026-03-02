# MedSource Nigeria

Healthcare marketplace PWA connecting hospitals and individuals with uncommon pharmaceuticals and blood products across Nigeria. Built for Xdosdev.

**Live site:** https://www.medsourceng.com
**API:** https://medsource-api.fly.dev

## Project Overview

MedSource solves the fragmented pharmaceutical supply chain problem in Nigeria. Hospitals and patients struggle to find specialty drugs, orphan medications, and specific blood types. This platform centralizes discovery, verification, and purchase.

**User roles:**
- **BUYER** (default) — search, inquire, and purchase products
- **SELLER** — list products, manage orders, respond to inquiries (requires admin approval)
- **SUB_ADMIN** — manage users, verify sellers, moderate products
- **SUPER_ADMIN** — full admin access including sub-admin management

**Two product types:**
- **Pharmaceuticals** — uncommon/specialty medications with NAFDAC verification
- **Blood Products** — whole blood, packed red cells, plasma, platelets with cold chain tracking

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite | PWA with service worker, offline support |
| Styling | CSS (custom) | Amazon-style dark header, DM Sans font, green medical theme |
| Backend | Node.js 20 + Express | RESTful API |
| Database | PostgreSQL + Prisma ORM | Full-text search, connection keep-alive + retry |
| Auth | Multi-auth (Email/Password + Google OAuth + Phone OTP) | JWT tokens, bcryptjs, google-auth-library |
| Payments | Paystack (primary) + Flutterwave (fallback) | Webhook-based confirmation, Naira (NGN) |
| Email | Brevo (Sendinblue) REST API | Password reset codes, sub-admin welcome emails |
| Notifications | Firebase Cloud Messaging (FCM) | Push + in-app notifications |
| NAFDAC | Custom verification service | Format validation, Green Book scraping, caching |
| File Storage | Cloudinary | Product images via upload route |
| Hosting | Fly.io | Backend (medsource-api), Frontend (medsource-ng), Postgres (medsource-db) |
| Domain | medsourceng.com | Custom domain via Fly.io, CNAME to medsource-ng.fly.dev |

## Project Structure

```
medsource/
├── CLAUDE.md                    # This file
├── README.md                    # Project overview
├── backend/
│   ├── .env.example             # All required environment variables
│   ├── fly.toml                 # Fly.io deployment config (medsource-api)
│   ├── Dockerfile               # Node.js 20 Alpine + Prisma generate
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (10 models)
│   │   └── seed.js              # Sample data seeder
│   └── src/
│       ├── server.js            # Express app entry point
│       ├── config/index.js      # Environment config
│       ├── models/index.js      # Prisma client with keep-alive ping + retry
│       ├── middleware/
│       │   ├── auth.js          # JWT verify, requireSeller, requireAdmin, requireSuperAdmin
│       │   ├── validate.js      # Request validation with schemas
│       │   └── rateLimit.js     # Rate limiting (general, OTP, webhook)
│       ├── routes/
│       │   ├── auth.js          # Multi-auth: OTP, email/password, Google OAuth, forgot/reset password, change password
│       │   ├── products.js      # CRUD + search, categories, suggestions
│       │   ├── orders.js        # Create, status transitions, payment init
│       │   ├── inquiries.js     # Buyer-seller messaging
│       │   ├── sellers.js       # Registration, dashboard, profile
│       │   ├── payments.js      # Paystack + Flutterwave webhooks
│       │   ├── notifications.js # CRUD, mark read, unread count
│       │   ├── admin.js         # User management, seller verification, sub-admin CRUD
│       │   ├── upload.js        # Cloudinary image upload
│       │   └── nafdac.js        # Verify, bulk verify, format check
│       └── services/
│           ├── otp.js           # Termii SMS integration
│           ├── email.js         # Brevo transactional emails (reset codes, welcome)
│           ├── payment.js       # Paystack + Flutterwave unified service
│           ├── notification.js  # FCM push + in-app notifications
│           ├── upload.js        # Cloudinary upload service
│           ├── nafdac.js        # NAFDAC number verification
│           └── search.js        # PostgreSQL full-text search
├── frontend/
│   ├── fly.toml                 # Fly.io deployment config (medsource-ng)
│   ├── Dockerfile               # Multi-stage: Node build → Nginx serve
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker (caching + push)
│   └── src/
│       ├── main.jsx             # App entry, GoogleOAuthProvider wrapper
│       ├── App.jsx              # React Router routes
│       ├── context/
│       │   ├── AuthContext.jsx   # Auth state, JWT, user roles (isSeller, isAdmin, isSuperAdmin)
│       │   ├── CartContext.jsx   # Shopping cart state
│       │   └── ToastContext.jsx  # Toast notification system
│       ├── hooks/
│       │   └── useApi.js        # API call hook with loading/error states
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Layout.jsx       # Amazon-style header, search bar, subnav, bottom nav
│       │   │   ├── Icons.jsx        # SVG icon components + formatNaira helper
│       │   │   └── PasswordInput.jsx # Reusable password field with show/hide toggle
│       │   └── seller/
│       │       └── SellerDashboard.jsx  # Legacy seller dashboard component
│       ├── pages/
│       │   ├── HomePage.jsx             # Product search, category filters, blood type filter
│       │   ├── ProductPage.jsx          # Product detail + inquiry form
│       │   ├── CartPage.jsx             # Shopping cart
│       │   ├── CheckoutPage.jsx         # Order checkout
│       │   ├── PaymentCallbackPage.jsx  # Paystack payment callback handler
│       │   ├── OrdersPage.jsx           # Order history
│       │   ├── LoginPage.jsx            # Multi-auth: Phone tab, Email tab, Google OAuth
│       │   ├── VerifyPage.jsx           # Phone OTP verification
│       │   ├── RegisterPage.jsx         # Phone-based registration
│       │   ├── EmailRegisterPage.jsx    # Email/password registration
│       │   ├── EmailVerifyPage.jsx      # Email verification
│       │   ├── ForgotPasswordPage.jsx   # 3-step: email → OTP code → new password
│       │   ├── ProfilePage.jsx          # User profile, change password, admin dashboard link
│       │   ├── SellerDashboardPage.jsx  # Seller dashboard (overview, products, orders, inquiries)
│       │   ├── SellerOnboardingPage.jsx # Multi-step seller registration
│       │   ├── AdminPage.jsx            # Admin panel (users, sellers, products, sub-admins)
│       │   └── NotificationsPage.jsx    # Notification center
│       ├── services/
│       │   ├── api.js           # Axios client with all API methods
│       │   └── firebase.js      # FCM setup + permission handling
│       ├── styles/
│       │   └── index.css        # All application styles
│       └── tests/               # Vitest + React Testing Library
│           ├── setup.js
│           ├── test-utils.jsx
│           ├── components/      # Layout, Icons tests
│           ├── context/         # AuthContext, CartContext tests
│           └── pages/           # HomePage, LoginPage, CartPage tests
```

## Key Commands

```bash
# Backend
cd backend
cp .env.example .env              # Fill in API keys
npm install
npx prisma migrate dev            # Create/update database tables
npx prisma db seed                # Seed sample data
npm run dev                       # Start on port 4000
npm test                          # Run API tests

# Frontend
cd frontend
npm install
npm run dev                       # Start on port 5173
npx vite build                    # Production build (outputs to dist/)
npm test                          # Run component tests

# Database
npx prisma studio                 # Visual database editor
npx prisma migrate reset          # Reset database
npx prisma generate               # Regenerate Prisma client

# Deployment (from respective directories)
cd backend && fly deploy --app medsource-api
cd frontend && fly deploy          # Builds via Dockerfile, serves with Nginx
fly logs --app medsource-api --no-tail  # Check backend logs
fly ssh console --app medsource-api     # SSH into backend machine
```

## Authentication System

Three auth methods, all returning JWT tokens:

1. **Phone OTP** — `POST /auth/otp/send` → `POST /auth/otp/verify` → (optional) `POST /auth/register`
2. **Email/Password** — `POST /auth/email/register` or `POST /auth/email/login`
3. **Google OAuth** — `POST /auth/google` with access token from @react-oauth/google

Additional auth endpoints:
- `GET /auth/me` — Get current user (includes seller relation)
- `PUT /auth/profile` — Update profile
- `PUT /auth/change-password` — Change password (all users, from profile)
- `POST /auth/email/forgot-password` — Send reset code via Brevo email
- `POST /auth/email/reset-password` — Verify code + set new password

## Database Models (Prisma)

- **User** — email, phone (optional), passwordHash, googleId, role (BUYER/SELLER/SUB_ADMIN/SUPER_ADMIN), accountType, location, FCM token
- **Seller** — businessName, NAFDAC license, CAC number, isVerified, verification status, ratings
- **Product** — type (PHARMACEUTICAL/BLOOD_PRODUCT), pricing, stock, NAFDAC number, expiry, cold chain, blood type
- **Order** — orderNumber (MSN-YYYYMMDD-XXXX), status lifecycle, payment tracking, delivery info
- **OrderItem** — product, quantity, pricing per item
- **Payment** — Paystack/Flutterwave reference, webhook data, status
- **Inquiry** — buyer-seller messaging with urgency levels
- **Notification** — push + in-app, typed (ORDER_PLACED, INQUIRY_RECEIVED, etc.)
- **Review** — seller ratings (1-5), one per user per seller
- **OtpCode** — verification codes with expiry and purpose

## API Routes Summary

All routes prefixed with `/api`:

**Auth:**
- `POST /auth/otp/send` — Send OTP to phone
- `POST /auth/otp/verify` — Verify OTP, get JWT
- `POST /auth/register` — Complete registration (phone-based)
- `POST /auth/email/register` — Email/password registration
- `POST /auth/email/login` — Email/password login
- `POST /auth/google` — Google OAuth login
- `GET /auth/me` — Get current user profile
- `PUT /auth/profile` — Update profile
- `PUT /auth/change-password` — Change password
- `POST /auth/email/forgot-password` — Send password reset code
- `POST /auth/email/reset-password` — Reset password with code

**Products:**
- `GET /products?q=&type=&bloodType=&category=&state=` — Search products
- `POST /products` — Create product (seller)
- `GET /products/:id` — Get product detail
- `PUT /products/:id` — Update product (seller)

**Orders:**
- `POST /orders` — Place order
- `GET /orders` — Get user's orders
- `POST /orders/:id/pay` — Initialize payment
- `PUT /orders/:id/status` — Update order status (seller)

**Sellers:**
- `POST /sellers/register` — Register as seller
- `GET /sellers/dashboard` — Seller dashboard stats
- `GET /sellers/products` — Seller's own products
- `GET /sellers/orders` — Seller's received orders
- `PUT /sellers/profile` — Update seller profile
- `GET /sellers/:id/public` — Public seller profile

**Admin:**
- `GET /admin/users` — List users (sub-admins can't see super admins)
- `PUT /admin/sellers/:id/verify` — Approve/reject seller
- `GET /admin/sub-admins` — List sub-admins
- `POST /admin/sub-admins` — Create sub-admin (email + temp password, sends welcome email)
- `DELETE /admin/sub-admins/:id` — Remove sub-admin

**Other:**
- `POST /inquiries` — Send inquiry to seller
- `PUT /inquiries/:id/respond` — Seller responds
- `POST /payments/webhook/paystack` — Paystack webhook
- `GET /nafdac/verify/:number` — Verify NAFDAC registration
- `GET /notifications` — Get user notifications
- `POST /upload` — Upload image to Cloudinary

## Product Categories

- Oncology
- Rare Disease
- Orphan Drugs
- Anti-infective
- Blood Products
- Vaccines
- Diagnostics (dropdown: All Diagnostics, Laboratories)

## Seller Verification Flow

1. User registers as seller → `POST /sellers/register` → role set to SELLER, `isVerified: false`
2. Seller sees "Account Pending Approval" screen on dashboard (cannot list products)
3. Admin approves via Admin Panel → `PUT /admin/sellers/:id/verify`
4. Seller profile refreshes → full dashboard access granted

## Order Status Lifecycle

```
PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP → IN_TRANSIT → DELIVERED
                                                                  ↗
PENDING → CANCELLED (at any point before delivery)
```

## Payment Flow

1. Buyer creates order → `POST /orders`
2. Buyer initiates payment → `POST /orders/:id/pay` → returns Paystack checkout URL
3. Buyer completes payment on Paystack
4. Paystack sends webhook → `POST /payments/webhook/paystack`
5. Backend verifies, updates order to CONFIRMED, notifies seller
6. Frontend can also verify → `GET /payments/verify/:reference`

## Database Connection Resilience

Fly.io Postgres drops idle connections after ~5 minutes. Handled via:
- **Keep-alive ping**: `SELECT 1` every 4 minutes prevents idle disconnects
- **Retry with backoff**: Up to 3 retries with exponential backoff (500ms, 1s, 2s) for P1017 errors
- **Connection pool params**: `connection_limit=10&pool_timeout=20&connect_timeout=10` on DATABASE_URL

## Nigeria-Specific Considerations

- **Phone numbers**: Format +234XXXXXXXXXX, validate with pattern `/^(\+234|0)[789]\d{9}$/`
- **SMS**: Termii is the primary provider; handles DND (Do-Not-Disturb) numbers via fallback channel
- **Payments**: Paystack is dominant in Nigeria; supports card, bank transfer, USSD, mobile money
- **Currency**: Nigerian Naira (NGN), Paystack uses kobo (multiply by 100)
- **NAFDAC**: National drug regulator; no official API exists yet — we validate format + scrape Green Book
- **States**: 36 states + FCT (Abuja)
- **Blood banking**: Falls under National Blood Transfusion Service (NBTS)

## Environment Variables

See `backend/.env.example` for full list. Critical ones:
- `DATABASE_URL` — PostgreSQL connection string (with pool params)
- `JWT_SECRET` — Random secret for token signing
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `PAYSTACK_SECRET_KEY` — From paystack.com dashboard
- `TERMII_API_KEY` — From termii.com dashboard
- `BREVO_API_KEY` — From brevo.com dashboard (transactional emails)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Image uploads
- Firebase credentials — For push notifications
- `FRONTEND_URL` — https://www.medsourceng.com (CORS + email links)

## Code Style

- Backend: CommonJS (require/module.exports), Express middleware pattern
- Frontend: ES modules, React functional components with hooks
- Database: Prisma ORM with PostgreSQL
- Error handling: Express global error handler, Prisma error codes
- Naming: camelCase for JS, SCREAMING_SNAKE for enums, kebab-case for URLs
- Passwords: bcryptjs with 10 salt rounds
- Auth tokens: JWT with configurable expiry
