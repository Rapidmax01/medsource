# MedSource API Documentation

Base URL: `https://api.medsource.ng/api`

## Authentication

All authenticated endpoints require: `Authorization: Bearer <token>`

### Send OTP
```
POST /auth/otp/send
Body: { "phone": "+2348012345678" }
Response: { "success": true, "isNewUser": false }
```

### Verify OTP
```
POST /auth/otp/verify
Body: { "phone": "+2348012345678", "code": "123456" }
Response: { "success": true, "token": "jwt...", "user": {...} }
```

### Register (new users after OTP verification)
```
POST /auth/register
Body: { "tempToken": "...", "firstName": "Obinna", "lastName": "Okafor", "accountType": "HOSPITAL" }
Response: { "success": true, "token": "jwt...", "user": {...} }
```

### Get Current User
```
GET /auth/me
Response: { "user": {..., "seller": {...}} }
```

---

## Products

### Search Products (Public)
```
GET /products?q=rituximab&type=PHARMACEUTICAL&bloodType=O-&state=Lagos&inStock=true&sortBy=price_asc&page=1&limit=20
Response: { "products": [...], "pagination": { "total": 42, "page": 1, "pages": 3, "hasMore": true } }
```

### Get Product Detail
```
GET /products/:id
Response: { "product": {..., "seller": {...}}, "related": [...] }
```

### Create Product (Seller)
```
POST /products
Body: {
  "name": "Rituximab 500mg/50ml",
  "type": "PHARMACEUTICAL",
  "price": 485000,
  "quantity": 12,
  "genericName": "Rituximab",
  "category": "Oncology",
  "nafdacNumber": "B2-1193",
  "expiryDate": "2026-08-15"
}
Response: { "product": {...} }
```

### Update Product (Seller, own products)
```
PUT /products/:id
Body: { "price": 500000, "quantity": 10 }
Response: { "product": {...} }
```

### Delete Product (Soft delete)
```
DELETE /products/:id
Response: { "success": true }
```

---

## Orders

### Create Order
```
POST /orders
Body: {
  "items": [{ "productId": "abc123", "quantity": 2 }],
  "deliveryAddress": "123 Hospital Road, Ikeja",
  "deliveryState": "Lagos",
  "deliveryPhone": "+2348012345678"
}
Response: { "orders": [{ "id": "...", "orderNumber": "MSN-20260213-A1B2", "totalAmount": 970000 }] }
```

### Get My Orders
```
GET /orders?status=PENDING&page=1
Response: { "orders": [...], "pagination": {...} }
```

### Get Order Detail
```
GET /orders/:id
Response: { "order": {..., "items": [...], "seller": {...}, "payment": {...}} }
```

### Update Order Status (Seller)
```
PUT /orders/:id/status
Body: { "status": "CONFIRMED" }
Valid transitions: PENDING→CONFIRMED→PROCESSING→READY_FOR_PICKUP→IN_TRANSIT→DELIVERED
Response: { "order": {...} }
```

### Initialize Payment
```
POST /orders/:id/pay
Body: { "provider": "PAYSTACK" }
Response: { "paymentUrl": "https://checkout.paystack.com/...", "reference": "MSN-..." }
```

---

## Inquiries

### Send Inquiry
```
POST /inquiries
Body: {
  "productId": "abc123",
  "buyerName": "Dr. Obi",
  "buyerPhone": "+2348012345678",
  "message": "Do you have 10 units available?",
  "urgency": "urgent"
}
Response: { "inquiry": {...} }
```

### Get My Inquiries (Buyer)
```
GET /inquiries
Response: { "inquiries": [...] }
```

### Get Received Inquiries (Seller)
```
GET /inquiries/seller
Response: { "inquiries": [...] }
```

### Respond to Inquiry (Seller)
```
PUT /inquiries/:id/respond
Body: { "response": "Yes, we have 10 units available." }
Response: { "inquiry": {...} }
```

---

## Sellers

### Register as Seller
```
POST /sellers/register
Body: {
  "businessName": "PharmaCare Lagos",
  "businessType": "PHARMACY",
  "state": "Lagos",
  "city": "Ikeja",
  "businessPhone": "+2348012345678",
  "nafdacLicense": "NAFDAC/PHM/2024/001"
}
Response: { "seller": {...} }
```

### Get Dashboard Stats
```
GET /sellers/dashboard
Response: { "stats": { "products": {...}, "orders": {...}, "revenue": {...} }, "recentOrders": [...] }
```

### Get Seller's Products
```
GET /sellers/products?status=active&type=PHARMACEUTICAL
Response: { "products": [...] }
```

### Get Seller's Orders
```
GET /sellers/orders?status=PENDING
Response: { "orders": [...] }
```

---

## Payments

### Paystack Webhook
```
POST /payments/webhook/paystack
Headers: x-paystack-signature: <hash>
```

### Flutterwave Webhook
```
POST /payments/webhook/flutterwave
Headers: verif-hash: <hash>
```

### Verify Payment
```
GET /payments/verify/:reference
Response: { "payment": {...}, "verified": true }
```

---

## NAFDAC Verification

### Verify Number
```
GET /nafdac/verify/B2-1193
Response: { "verified": true, "status": "VERIFIED", "nafdacNumber": "B2-1193" }
```

### Bulk Verify
```
POST /nafdac/verify-bulk
Body: { "numbers": ["B2-1193", "A4-0847"] }
Response: { "results": [...] }
```

### Validate Format Only
```
GET /nafdac/validate-format/B2-1193
Response: { "valid": true, "formatted": "B2-1193" }
```

---

## Notifications

### Get Notifications
```
GET /notifications?unread=true
Response: { "notifications": [...], "unreadCount": 5 }
```

### Mark as Read
```
PUT /notifications/:id/read
PUT /notifications/read-all
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Human-readable error message",
  "details": ["field1 is required", "field2 must be a number"]
}
```

Status Codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Rate Limited, 500 Server Error
