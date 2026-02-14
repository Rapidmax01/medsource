# MedSource Nigeria

Healthcare marketplace PWA connecting hospitals and individuals with uncommon pharmaceuticals and blood products across Nigeria. Built for Xdosdev.

## Project Overview

MedSource solves the fragmented pharmaceutical supply chain problem in Nigeria. Hospitals and patients struggle to find specialty drugs, orphan medications, and specific blood types. This platform centralizes discovery, verification, and purchase.

**Two user types:**
- **Buyers** (individuals, hospitals, pharmacies) — search, inquire, and purchase products
- **Sellers** (licensed pharma companies, blood banks) — list products, manage orders, respond to inquiries

**Two product types:**
- **Pharmaceuticals** — uncommon/specialty medications with NAFDAC verification
- **Blood Products** — whole blood, packed red cells, plasma, platelets with cold chain tracking

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite | PWA with service worker, offline support |
| Styling | CSS (custom) | DM Sans + Instrument Serif fonts, green medical theme |
| Backend | Node.js 20 + Express | RESTful API |
| Database | PostgreSQL + Prisma ORM | Full-text search enabled |
| Auth | Phone OTP via Termii SMS | JWT tokens, role-based access (BUYER/SELLER/ADMIN) |
| Payments | Paystack (primary) + Flutterwave (fallback) | Webhook-based confirmation, Naira (NGN) |
| Notifications | Firebase Cloud Messaging (FCM) | Push + in-app notifications |
| NAFDAC | Custom verification service | Format validation, Green Book scraping, caching |
| File Storage | Cloudinary | Product images |

## Project Structure

```
medsource/
├── CLAUDE.md                    # This file
├── README.md                    # Project overview
├── backend/
│   ├── .env.example             # All required environment variables
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma        # Database schema (10 models)
│   └── src/
│       ├── server.js            # Express app entry point
│       ├── config/index.js      # Environment config
│       ├── models/index.js      # Prisma client singleton
│       ├── middleware/
│       │   ├── auth.js          # JWT verify, requireSeller, requireAdmin
│       │   ├── validate.js      # Request validation with schemas
│       │   └── rateLimit.js     # Rate limiting (general, OTP, webhook)
│       ├── routes/
│       │   ├── auth.js          # POST /otp/send, /otp/verify, /register
│       │   ├── products.js      # CRUD + search, categories, suggestions
│       │   ├── orders.js        # Create, status transitions, payment init
│       │   ├── inquiries.js     # Buyer-seller messaging
│       │   ├── sellers.js       # Registration, dashboard, profile
│       │   ├── payments.js      # Paystack + Flutterwave webhooks
│       │   ├── notifications.js # CRUD, mark read, unread count
│       │   └── nafdac.js        # Verify, bulk verify, format check
│       └── services/
│           ├── otp.js           # Termii SMS integration
│           ├── payment.js       # Paystack + Flutterwave unified service
│           ├── notification.js  # FCM push + in-app notifications
│           ├── nafdac.js        # NAFDAC number verification
│           └── search.js        # PostgreSQL full-text search
├── frontend/
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker (caching + push)
│   └── src/
│       ├── components/
│       │   └── seller/
│       │       └── SellerDashboard.jsx  # Complete seller management UI
│       └── services/
│           ├── api.js           # Axios client with all API methods
│           └── firebase.js      # FCM setup + permission handling
├── index.jsx                    # Buyer marketplace PWA (standalone React component)
└── docs/
    └── API.md                   # Full REST API documentation
```

## Key Commands

```bash
# Backend setup
cd backend
cp .env.example .env              # Fill in API keys
npm install
npx prisma migrate dev            # Create database tables
npx prisma db seed                # Seed sample data (needs seed file)
npm run dev                       # Start on port 4000

# Frontend setup
cd frontend
npm install
npm run dev                       # Start on port 5173

# Database
npx prisma studio                 # Visual database editor
npx prisma migrate reset          # Reset database
npx prisma generate               # Regenerate Prisma client
```

## Database Models (Prisma)

- **User** — phone, role (BUYER/SELLER/ADMIN), accountType, location, FCM token
- **Seller** — businessName, NAFDAC license, CAC number, verification status, ratings
- **Product** — type (PHARMACEUTICAL/BLOOD_PRODUCT), pricing, stock, NAFDAC number, expiry, cold chain
- **Order** — orderNumber (MSN-YYYYMMDD-XXXX), status lifecycle, payment tracking
- **OrderItem** — product, quantity, pricing per item
- **Payment** — Paystack/Flutterwave reference, webhook data, status
- **Inquiry** — buyer-seller messaging with urgency levels
- **Notification** — push + in-app, typed (ORDER_PLACED, INQUIRY_RECEIVED, etc.)
- **Review** — seller ratings
- **OtpCode** — phone verification codes with expiry

## API Routes Summary

All routes prefixed with `/api`:

- `POST /auth/otp/send` — Send OTP to phone
- `POST /auth/otp/verify` — Verify OTP, get JWT
- `POST /auth/register` — Complete registration
- `GET /products?q=&type=&bloodType=&state=` — Search products
- `POST /products` — Create product (seller)
- `POST /orders` — Place order (auto-splits by seller)
- `POST /orders/:id/pay` — Initialize Paystack/Flutterwave payment
- `PUT /orders/:id/status` — Update order status (seller)
- `POST /inquiries` — Send inquiry to seller
- `PUT /inquiries/:id/respond` — Seller responds
- `POST /sellers/register` — Become a seller
- `GET /sellers/dashboard` — Seller stats and recent orders
- `POST /payments/webhook/paystack` — Paystack webhook
- `GET /nafdac/verify/:number` — Verify NAFDAC registration
- `GET /notifications` — Get user notifications

Full documentation: `/docs/API.md`

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

## Nigeria-Specific Considerations

- **Phone numbers**: Format +234XXXXXXXXXX, validate with pattern `/^(\+234|0)[789]\d{9}$/`
- **SMS**: Termii is the primary provider; handles DND (Do-Not-Disturb) numbers via fallback channel
- **Payments**: Paystack is dominant in Nigeria; supports card, bank transfer, USSD, mobile money
- **Currency**: Nigerian Naira (NGN), Paystack uses kobo (multiply by 100)
- **NAFDAC**: National drug regulator; no official API exists yet — we validate format + scrape Green Book
- **States**: 36 states + FCT (Abuja)
- **Blood banking**: Falls under National Blood Transfusion Service (NBTS)

## What Still Needs Building

Priority order for remaining work:

1. **Frontend scaffolding** — Set up Vite + React Router, connect the existing buyer (index.jsx) and seller (SellerDashboard.jsx) components into a proper app with routing
2. **OTP login screens** — Phone input → OTP verification → Registration flow UI
3. **Prisma seed file** — Sample sellers, products, and orders for development
4. **Image upload** — Cloudinary integration for product photos
5. **Paystack checkout UI** — Payment modal/redirect flow on frontend
6. **Notification center UI** — Bell icon, notification list, mark as read
7. **Seller onboarding flow** — Multi-step registration with business verification
8. **Admin panel** — Seller verification, product moderation, analytics
9. **Deployment** — Render/Railway for backend, Vercel for frontend, Supabase/Neon for PostgreSQL
10. **Testing** — API integration tests, component tests

## Environment Variables Needed

See `backend/.env.example` for full list. Critical ones:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Random secret for token signing
- `PAYSTACK_SECRET_KEY` — From paystack.com dashboard
- `TERMII_API_KEY` — From termii.com dashboard
- Firebase credentials — For push notifications

## Code Style

- Backend: CommonJS (require/module.exports), Express middleware pattern
- Frontend: ES modules, React functional components with hooks
- Database: Prisma ORM with PostgreSQL
- Error handling: Express global error handler, Prisma error codes
- Naming: camelCase for JS, SCREAMING_SNAKE for enums, kebab-case for URLs
