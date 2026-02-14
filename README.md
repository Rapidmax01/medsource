# MedSource Nigeria 🏥

> Healthcare marketplace connecting hospitals and individuals with uncommon pharmaceuticals and blood products across Nigeria.

## Architecture Overview

```
medsource/
├── backend/                    # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (PostgreSQL)
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js        # Environment & app config
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT + OTP verification
│   │   │   ├── validate.js      # Request validation
│   │   │   └── rateLimit.js     # Rate limiting
│   │   ├── models/              # Prisma client
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── auth.js          # OTP login/register
│   │   │   ├── products.js      # Product CRUD + search
│   │   │   ├── orders.js        # Order management
│   │   │   ├── inquiries.js     # Buyer-seller inquiries
│   │   │   ├── sellers.js       # Seller dashboard
│   │   │   ├── payments.js      # Paystack/Flutterwave webhooks
│   │   │   ├── notifications.js # Push notification management
│   │   │   └── nafdac.js        # NAFDAC verification
│   │   ├── services/
│   │   │   ├── otp.js           # Termii SMS OTP service
│   │   │   ├── payment.js       # Payment processing
│   │   │   ├── notification.js  # FCM push notifications
│   │   │   ├── nafdac.js        # NAFDAC number lookup
│   │   │   └── search.js        # Full-text search
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── server.js            # Express app entry
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React PWA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # Login, OTP verification
│   │   │   ├── buyer/           # Product browsing, cart, checkout
│   │   │   ├── seller/          # Seller dashboard, listings
│   │   │   └── shared/          # Header, Nav, Toast, etc.
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state management
│   │   │   └── CartContext.jsx   # Cart state management
│   │   ├── hooks/
│   │   │   └── useApi.js        # API request hooks
│   │   ├── pages/               # Route-level pages
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance
│   │   │   └── firebase.js      # FCM setup
│   │   └── App.jsx              # Root component + routing
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker
│   └── package.json
│
└── docs/
    └── API.md                   # API documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, TailwindCSS, React Router |
| Backend | Node.js 20 + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | Phone OTP via Termii SMS |
| Payments | Paystack (primary) + Flutterwave (fallback) |
| Notifications | Firebase Cloud Messaging (FCM) |
| Search | PostgreSQL full-text search |
| File Storage | Cloudinary (product images) |
| Hosting | Render / Railway (backend), Vercel (frontend) |

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env    # Fill in your keys
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

See `backend/.env.example` for all required keys including:
- Database URL
- Paystack keys
- Termii API key
- Firebase service account
- Cloudinary credentials
