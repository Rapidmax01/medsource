# MedSource Complete App Test Plan

**Tester Role:** Sub-Admin
**App URL:** https://www.medsourceng.com
**API URL:** https://medsource-api.fly.dev

---

## Pre-Test Setup

You will need:
- Your sub-admin login credentials (email + password)
- A second device or incognito browser for buyer/seller testing
- A test phone number (Nigerian format: 08X XXXX XXXX)
- A test email address (to verify email notifications)
- Access to a Paystack test card (4084 0840 8408 4081, expiry any future date, CVV 408, OTP 123456)

---

## SECTION A: Authentication (Login Page)

### A1. Email/Password Login
1. Go to https://www.medsourceng.com/login
2. Select the **Email** tab
3. Enter your sub-admin email and password
4. Click **Log In**
- [ ] PASS: Redirects to homepage, user is logged in
- [ ] PASS: No console errors

### A2. Phone OTP Login
1. Log out first (Profile > Logout)
2. Go to /login
3. Select the **Phone** tab
4. Ensure "Nigeria (+234)" is selected in country dropdown
5. Enter a valid Nigerian phone number
6. Click **Send OTP**
- [ ] PASS: Shows "OTP sent" message, redirects to /verify
7. Enter the 6-digit code received via SMS
8. Click **Verify**
- [ ] PASS: Logs in successfully or prompts registration if new number

### A3. Google OAuth Login
1. Log out, go to /login
2. Click **Continue with Google**
3. Select a Google account
- [ ] PASS: Logs in and redirects to homepage
- [ ] PASS: If first time, shows "Account created!" toast

### A4. Email Registration (New Account)
1. Log out, go to /login
2. Click **Create new account** or go to /register/email
3. Fill in: First Name, Last Name, Email, Password, Confirm Password
4. Submit
- [ ] PASS: Shows verification page
- [ ] PASS: Verification email received
5. Enter verification code
- [ ] PASS: Account created, redirected to homepage

### A5. Forgot Password
1. Go to /login > Email tab > click **Forgot password?**
2. Enter an email with an existing account
3. Click **Send Reset Code**
- [ ] PASS: Reset code email received
4. Enter the code
- [ ] PASS: Proceeds to new password step
5. Enter new password + confirm
- [ ] PASS: Password reset, redirected to login
6. Log in with new password
- [ ] PASS: Login successful

### A6. Country Code Selector (Phone Tab)
1. On /login Phone tab, tap the country code dropdown
- [ ] PASS: Shows 12 countries (Nigeria, Ghana, Kenya, South Africa, US, UK, India, UAE, Saudi Arabia, Germany, France, China)
- [ ] PASS: Nigeria (+234) is default

---

## SECTION B: Homepage & Product Search

### B1. Homepage Load
1. Go to https://www.medsourceng.com
- [ ] PASS: Header with search bar visible
- [ ] PASS: Category pills displayed (All, Oncology, Rare Disease, Orphan Drugs, Anti-infective, Blood Products, Vaccines, Diagnostics)
- [ ] PASS: Quick Action cards visible (Pharmaceuticals, Blood Products, Urgent Needs, Verified)
- [ ] PASS: Product cards displayed

### B2. Text Search
1. Tap the search bar
2. Type a product name (e.g. "Imatinib")
3. Press Enter or tap search
- [ ] PASS: Results filtered to matching products
- [ ] PASS: Results show relevant products

### B3. Category Filtering
1. Tap **Oncology** category pill
- [ ] PASS: Only oncology products shown
2. Tap **Blood Products**
- [ ] PASS: Blood type filter row appears below categories
- [ ] PASS: Only blood products shown
3. Tap **All** to reset
- [ ] PASS: All products shown again

### B4. Blood Type Filter
1. Tap **Blood Products** category
2. Tap **O+** blood type filter
- [ ] PASS: Only O+ blood products shown
3. Tap **O+** again to deselect
- [ ] PASS: All blood products shown
4. Tap **All** category to reset
- [ ] PASS: Blood type filter row disappears

### B5. Diagnostics Submenu
1. Tap **Diagnostics** category
- [ ] PASS: Shows dropdown with subcategories (Diagnostics, Laboratories)
2. Tap **Laboratories**
- [ ] PASS: Filters to laboratory products

### B6. Quick Actions
1. Tap **Pharmaceuticals** quick action card
- [ ] PASS: Filters to pharmaceutical products only
2. Tap **Blood Products** quick action card
- [ ] PASS: Filters to blood products only
3. Tap **Verified** quick action card
- [ ] PASS: Searches for "verified" products

### B7. Product Card Display
1. Look at any product card
- [ ] PASS: Shows product type badge (Pharma/Blood)
- [ ] PASS: Shows product name
- [ ] PASS: Shows price in Naira format
- [ ] PASS: Shows stock status (In Stock / Out of Stock)
- [ ] PASS: Shows seller location
- [ ] PASS: Blood products show blood type badge
- [ ] PASS: Verified products show NAFDAC badge

### B8. Pagination
1. Scroll to bottom of product list
2. Click **Load More** (if available)
- [ ] PASS: More products load below existing ones
- [ ] PASS: Button disappears when all products loaded

### B9. No Results
1. Search for something that won't match (e.g. "xyznonexistent")
- [ ] PASS: Shows empty state message
- [ ] PASS: "Clear Filters" button visible
2. Click **Clear Filters**
- [ ] PASS: Returns to full product list

---

## SECTION C: Product Detail Page

### C1. Navigate to Product
1. From homepage, tap any product card
- [ ] PASS: Navigates to /products/:id
- [ ] PASS: Product name, description displayed
- [ ] PASS: Price shown in Naira
- [ ] PASS: Stock status visible
- [ ] PASS: Product type badge visible

### C2. Pharmaceutical Product Details
1. Open a pharmaceutical product
- [ ] PASS: Shows generic name (if available)
- [ ] PASS: Shows NAFDAC number (if available)
- [ ] PASS: Shows NAFDAC verified badge (if verified)
- [ ] PASS: Shows expiry date (if set)
- [ ] PASS: Shows available quantity

### C3. Blood Product Details
1. Open a blood product
- [ ] PASS: Shows blood type badge (e.g. O+)
- [ ] PASS: Shows screening status
- [ ] PASS: Shows cold chain indicator (if applicable)
- [ ] PASS: Shows collection date (if set)
- [ ] PASS: Shows storage temperature (if set)

### C4. Seller Info Card
1. On any product detail page, find the seller info section
- [ ] PASS: Shows seller business name
- [ ] PASS: Shows seller location
- [ ] PASS: Shows rating (if available)
- [ ] PASS: Call button visible (if phone number available)
- [ ] PASS: Message button visible

### C5. Add to Cart
1. On an in-stock product, click **Add to Cart**
- [ ] PASS: Toast "Added to cart" appears
- [ ] PASS: Cart badge count updates in navigation
2. On an out-of-stock product
- [ ] PASS: Add to Cart button is disabled

### C6. Inquiry Form
1. Click the **Message** / **Inquire** button on a product
- [ ] PASS: Inquiry modal opens
- [ ] PASS: Name and phone are pre-filled if logged in
2. Fill in: Quantity Needed, Message
3. Click **Submit** / **Send Inquiry**
- [ ] PASS: Success toast appears
- [ ] PASS: Modal closes
- [ ] PASS: Seller receives notification (check seller dashboard)
- [ ] PASS: Email sent to seller (check seller email)

---

## SECTION D: Shopping Cart

### D1. View Cart
1. Navigate to /cart (via bottom nav or cart icon)
- [ ] PASS: Shows all items added to cart
- [ ] PASS: Each item shows name, price, quantity

### D2. Update Quantity
1. Tap the **+** button on a cart item
- [ ] PASS: Quantity increases by 1
- [ ] PASS: Subtotal updates
2. Tap the **-** button
- [ ] PASS: Quantity decreases by 1
- [ ] PASS: When quantity reaches 0, item is removed

### D3. Remove Item
1. Remove an item from cart (tap - until 0, or remove button)
- [ ] PASS: Item disappears from cart
- [ ] PASS: Total updates correctly

### D4. Cart Persistence
1. Add items to cart
2. Close the browser tab
3. Re-open https://www.medsourceng.com/cart
- [ ] PASS: Cart items are still there (persisted in localStorage)

### D5. Empty Cart
1. Remove all items from cart
- [ ] PASS: Shows empty cart message
- [ ] PASS: "Browse Products" button visible

---

## SECTION E: Checkout & Payment

### E1. Navigate to Checkout
1. With items in cart, click **Checkout** / **Proceed**
- [ ] PASS: Redirects to /checkout (or /login if not logged in)
- [ ] PASS: Order summary shows all cart items

### E2. Delivery Form Validation
1. Leave all fields empty and try to submit
- [ ] PASS: Shows validation errors for required fields
2. Enter an invalid phone number (e.g. "12345")
- [ ] PASS: Shows phone format error
3. Enter valid Nigerian phone (e.g. 08012345678)
- [ ] PASS: No phone error

### E3. Delivery Form Fields
1. Fill in:
   - Delivery Address: "123 Test Street, Ikeja"
   - State: Select "Lagos"
   - City: "Ikeja"
   - Phone: "08012345678"
   - Delivery Notes: "Please call before delivery" (optional)
- [ ] PASS: All fields accept input
- [ ] PASS: State dropdown shows 37 Nigerian states

### E4. Price Breakdown
1. Review the price section at bottom
- [ ] PASS: Subtotal matches sum of (item price x quantity)
- [ ] PASS: Service fee shows 2.5% of subtotal
- [ ] PASS: Total = Subtotal + Service Fee
- [ ] PASS: All amounts in Naira format

### E5. Place Order & Payment
1. Fill all required fields and click **Place Order**
- [ ] PASS: Shows loading state
- [ ] PASS: Redirects to Paystack checkout page
2. On Paystack, use test card: 4084 0840 8408 4081
   - Expiry: any future date
   - CVV: 408
   - OTP: 123456
3. Complete payment
- [ ] PASS: Redirects back to app
- [ ] PASS: Payment verified, order confirmed
- [ ] PASS: Cart is cleared
- [ ] PASS: Order confirmation email received (check inbox/spam)
- [ ] PASS: Payment receipt email received
- [ ] PASS: Notification appears in /notifications

### E6. Empty Cart Checkout
1. Navigate to /checkout with empty cart
- [ ] PASS: Shows empty state with "Browse Products" button

---

## SECTION F: Orders Page

### F1. View Orders
1. Navigate to /orders (via bottom nav or Profile > My Orders)
- [ ] PASS: Shows list of your orders
- [ ] PASS: Most recent order at top

### F2. Order Card Display
1. Look at any order card
- [ ] PASS: Shows order number (e.g. #MSN-20260215-XXXX)
- [ ] PASS: Shows status badge with correct color
- [ ] PASS: Shows items summary
- [ ] PASS: Shows order date
- [ ] PASS: Shows total amount in Naira

### F3. Status Filter Tabs
1. Tap **Pending** tab
- [ ] PASS: Only pending orders shown
2. Tap **Confirmed** tab
- [ ] PASS: Only confirmed orders shown
3. Tap **Delivered** tab
- [ ] PASS: Only delivered orders shown
4. Tap **All** tab
- [ ] PASS: All orders shown again

### F4. Pagination
1. If you have more than 20 orders, scroll down
- [ ] PASS: "Load More" button visible
- [ ] PASS: Clicking loads more orders

---

## SECTION G: Seller Registration & Onboarding

> Test this with a NEW buyer account (not the sub-admin account)

### G1. Start Seller Registration
1. Log in as a buyer account
2. Go to Profile > **Become a Seller** (or navigate to /seller/onboarding)
- [ ] PASS: Shows Step 1 of 3 with progress indicator

### G2. Step 1 - Business Information
1. Fill in:
   - Business Name: "Test Pharmacy"
   - Business Type: Select "Pharmacy"
   - Description: "A test pharmacy" (optional)
2. Click **Next**
- [ ] PASS: Advances to Step 2
3. Try clicking Next with empty Business Name
- [ ] PASS: Shows validation error

### G3. Step 2 - Verification
1. Fill in:
   - NAFDAC License: "A4-0123"
   - CAC Number: "RC-123456"
2. Click **Next**
- [ ] PASS: Advances to Step 3
- [ ] PASS: Info alert shown about 1-2 day verification

### G4. Step 3 - Contact & Location
1. Fill in:
   - Business Phone: "08012345678"
   - Business Email: "test@test.com" (optional)
   - WhatsApp: "08012345678" (optional)
   - State: Select "Lagos"
   - City: "Ikeja"
   - Address: "123 Test Street"
2. Click **Submit**
- [ ] PASS: Success toast
- [ ] PASS: Redirects to /seller

### G5. Pending Approval Screen
1. As the newly registered seller, go to /seller
- [ ] PASS: Shows "Account Pending Approval" screen
- [ ] PASS: Shows "What happens next?" info box
- [ ] PASS: "Back to Marketplace" button works

### G6. Step Navigation
1. On Step 2 or 3, click **Back**
- [ ] PASS: Returns to previous step with form data preserved

---

## SECTION H: Admin Panel (Sub-Admin)

### H1. Access Admin Panel
1. Log in with your sub-admin credentials
2. Go to Profile > **Admin Dashboard** (or navigate to /admin)
- [ ] PASS: Admin Panel loads
- [ ] PASS: Header shows "Sub-Admin - MedSource Platform"
- [ ] PASS: Two tabs visible: **Sellers** and **Analytics**
- [ ] PASS: NO "Users" tab (that's Super Admin only)

### H2. Sellers Tab - Pending Verifications
1. Click **Sellers** tab (default)
- [ ] PASS: Shows list of pending seller verifications (or "All caught up" if none)
2. If there are pending sellers, verify a card shows:
- [ ] PASS: Business Name
- [ ] PASS: PENDING badge
- [ ] PASS: Registration date
- [ ] PASS: Business Type
- [ ] PASS: Location (City, State)
- [ ] PASS: NAFDAC License number
- [ ] PASS: CAC Number
- [ ] PASS: Owner name and phone
- [ ] PASS: **Verify** button (green)
- [ ] PASS: NO **Reject** button (that's Super Admin only)

### H3. Verify a Seller
1. Find a pending seller (from test G above)
2. Click **Verify**
- [ ] PASS: Toast "Seller verified successfully"
- [ ] PASS: Seller disappears from pending list
3. Log in as that seller account and go to /seller
- [ ] PASS: Full seller dashboard loads (no longer pending)

### H4. Analytics Tab
1. Click **Analytics** tab
- [ ] PASS: Shows "Platform Analytics" heading
- [ ] PASS: Shows 6 stat cards:
  - Total Users (number)
  - Total Sellers (number)
  - Pending Sellers (number)
  - Total Orders (number)
  - Total Revenue (Naira format)
  - Active Products (number)
- [ ] PASS: Numbers are reasonable and not zero (unless fresh database)

### H5. Home Button
1. Click the home icon in the admin header
- [ ] PASS: Navigates to homepage (/)

---

## SECTION I: Seller Dashboard (Full Access)

> Log in as a verified seller account for these tests

### I1. Dashboard Load
1. Navigate to /seller
- [ ] PASS: Green header with "Seller Dashboard"
- [ ] PASS: Business name shown
- [ ] PASS: 4 tabs: Overview, Products, Orders, Inquiries

### I2. Overview Tab
1. Click **Overview** (default tab)
- [ ] PASS: Shows 4 stat cards: Monthly Revenue, Total Revenue, Active Products, Rating
- [ ] PASS: Alerts section (if low stock or expiring products)
- [ ] PASS: Recent Orders section with order cards

### I3. Products Tab - View Products
1. Click **Products** tab
- [ ] PASS: Shows product count in header
- [ ] PASS: **Add Product** button visible
- [ ] PASS: Each product card shows: type badge, name, stock status, NAFDAC badge, view count, price, Edit button, Delete button

### I4. Products Tab - Add New Product (Pharmaceutical)
1. Click **Add Product**
- [ ] PASS: Navigates to /seller/products/new
- [ ] PASS: Green header "Add Product"
- [ ] PASS: Back arrow returns to /seller
2. Select **Pharmaceutical** type (default)
3. Fill in:
   - Name: "Test Drug 500mg"
   - Description: "Test pharmaceutical product"
   - Price: 5000
   - Quantity: 10
   - Generic Name: "Testdrug"
   - Category: Select "Oncology"
   - Dosage Form: Select "Tablet"
   - Strength: "500mg"
   - Manufacturer: "Test Pharma Ltd"
   - NAFDAC Number: "A4-0123"
4. Click **Verify** button next to NAFDAC number
- [ ] PASS: Shows "Verifying..." state
- [ ] PASS: Shows "Verified" (green) or "not found" message
5. Fill in:
   - Batch Number: "BN-2026-001"
   - Expiry Date: Select a future date
6. Upload 1-2 images
- [ ] PASS: Shows uploading spinner
- [ ] PASS: Thumbnail appears after upload
- [ ] PASS: Remove (x) button on each thumbnail
7. Add tags: "oncology, test, tablet"
8. Click **Create Product**
- [ ] PASS: Toast "Product created"
- [ ] PASS: Redirects to /seller
- [ ] PASS: New product appears in Products tab

### I5. Products Tab - Add New Product (Blood Product)
1. Click **Add Product**
2. Select **Blood Product** type
3. Fill in:
   - Name: "O+ Packed Red Cells"
   - Price: 25000
   - Quantity: 5
   - Blood Type: Select "O+"
   - Blood Product: Select "Packed Red Cells"
   - Screening Status: "Fully Screened"
   - Collection Date: Today's date
   - Storage Temp: "2-6C"
   - Check "Requires Cold Chain"
4. Click **Create Product**
- [ ] PASS: Toast "Product created"
- [ ] PASS: Redirects to /seller
- [ ] PASS: Product appears with "Blood" badge

### I6. Products Tab - Edit Product
1. On a product card, click **Edit**
- [ ] PASS: Navigates to /seller/products/:id/edit
- [ ] PASS: Header shows "Edit Product"
- [ ] PASS: All fields are pre-filled with existing data
2. Change the price to a new value
3. Click **Update Product**
- [ ] PASS: Toast "Product updated"
- [ ] PASS: Redirects to /seller
4. Verify the price changed on the product card

### I7. Products Tab - Delete Product
1. On a product card, click **Delete**
- [ ] PASS: Inline confirmation appears: "Remove?" with **Yes** and **Cancel** buttons
2. Click **Cancel**
- [ ] PASS: Confirmation disappears, product still visible
3. Click **Delete** again, then click **Yes**
- [ ] PASS: Toast "Product removed"
- [ ] PASS: Product disappears from list
- [ ] PASS: Product no longer appears on homepage

### I8. Products Tab - Validation
1. Click Add Product
2. Leave name empty, click **Create Product**
- [ ] PASS: Toast error "Product name is required"
3. Enter name, set price to 0
- [ ] PASS: Toast error "Price must be greater than 0"
4. For Pharmaceutical: leave category empty
- [ ] PASS: Toast error "Category is required for pharmaceuticals"
5. Switch to Blood Product: leave blood type empty
- [ ] PASS: Toast error "Blood type is required"

### I9. Products Tab - Image Upload
1. On Add Product page, click the "+" image upload area
2. Select multiple images (more than 5)
- [ ] PASS: Only first 5 are uploaded (max 5)
- [ ] PASS: Toast error if trying to add more
3. Click the "x" on a thumbnail
- [ ] PASS: Image is removed
4. Upload again
- [ ] PASS: New image appears

### I10. Orders Tab
1. Click **Orders** tab
- [ ] PASS: Shows order list with order number, status badge, buyer info, items, total

### I11. Orders Tab - Status Updates
1. Find a PENDING order
2. Click **Confirm**
- [ ] PASS: Toast "Order confirmed"
- [ ] PASS: Status badge updates
- [ ] PASS: Buyer receives status update email
3. Find a CONFIRMED order, click **Ship**
- [ ] PASS: Status changes to IN_TRANSIT
4. Find an IN_TRANSIT order, click **Mark Delivered**
- [ ] PASS: Status changes to DELIVERED

### I12. Orders Tab - Cancel Order
1. Find a PENDING or CONFIRMED order
2. Click **Cancel**
- [ ] PASS: Order status becomes CANCELLED
- [ ] PASS: Product stock is restored

### I13. Inquiries Tab
1. Click **Inquiries** tab
- [ ] PASS: Shows inquiry list
- [ ] PASS: Each inquiry shows: buyer name, urgency badge, product name, message, time ago

### I14. Inquiries Tab - Reply
1. Find an unanswered inquiry
2. Type a reply in the text area
3. Click **Reply**
- [ ] PASS: Toast "Reply sent"
- [ ] PASS: Reply appears as "Your reply:" in green
- [ ] PASS: Buyer receives email notification about the response
4. Try submitting empty reply
- [ ] PASS: Toast error "Please enter a reply"

---

## SECTION J: Notifications

### J1. View Notifications
1. Navigate to /notifications (via bottom nav bell icon)
- [ ] PASS: Shows notification list
- [ ] PASS: Unread count in header
- [ ] PASS: Each notification has icon, title, body, time ago

### J2. Notification Types
After completing tests above, verify these notification types appeared:
- [ ] PASS: Order placed notification (after checkout)
- [ ] PASS: Order confirmed notification (after seller confirms)
- [ ] PASS: Payment received notification (after payment)
- [ ] PASS: Inquiry received notification (seller side, after buyer inquiry)
- [ ] PASS: Inquiry responded notification (buyer side, after seller reply)

### J3. Mark Read
1. Tap an unread notification (has green dot)
- [ ] PASS: Green dot disappears (marked as read)
- [ ] PASS: Unread count decreases

### J4. Mark All Read
1. Click **Mark all read** button
- [ ] PASS: All green dots disappear
- [ ] PASS: Unread count becomes 0
- [ ] PASS: Button disappears

---

## SECTION K: Profile Page

### K1. View Profile
1. Navigate to /profile (via bottom nav)
- [ ] PASS: Shows avatar with initial
- [ ] PASS: Shows full name
- [ ] PASS: Shows role badge (Sub-Admin / Seller / Buyer)
- [ ] PASS: Shows email
- [ ] PASS: Shows phone number
- [ ] PASS: Shows state and city

### K2. Menu Links
1. Verify these menu items are present and work:
- [ ] PASS: **Admin Dashboard** link (only if admin) -> navigates to /admin
- [ ] PASS: **My Orders** link -> navigates to /orders
- [ ] PASS: **Notifications** link -> navigates to /notifications
- [ ] PASS: **Seller Dashboard** link (if seller) -> navigates to /seller
  OR **Become a Seller** (if buyer) -> navigates to /seller/register

### K3. Change Password
1. Scroll to "Change Password" section and expand it
2. Enter Current Password (if not Google OAuth user)
3. Enter New Password (min 6 characters)
4. Enter Confirm New Password (must match)
5. Click **Change Password**
- [ ] PASS: Toast "Password changed"
6. Try with mismatched passwords
- [ ] PASS: Error "Passwords don't match"
7. Try with password less than 6 characters
- [ ] PASS: Error about minimum length

### K4. Logout
1. Click **Logout** button
- [ ] PASS: Redirected to homepage
- [ ] PASS: User is logged out
- [ ] PASS: Protected pages redirect to /login

---

## SECTION L: Email Notifications

### L1. Order Confirmation Email
1. After placing an order (Section E5)
- [ ] PASS: Email received with subject "MedSource - Order MSN-XXXXX Confirmed"
- [ ] PASS: Contains order number, item table, total amount, seller info

### L2. Order Status Update Email
1. After seller updates order status (Section I11)
- [ ] PASS: Email received with subject "MedSource - Order MSN-XXXXX [Status]"
- [ ] PASS: Shows new status in colored badge
- [ ] PASS: Shows order total

### L3. Payment Receipt Email
1. After successful payment (Section E5)
- [ ] PASS: Email received with subject "MedSource - Payment Receipt for MSN-XXXXX"
- [ ] PASS: Contains reference number, amount, provider, date

### L4. Inquiry Notification Email (to Seller)
1. After buyer sends inquiry (Section C6)
- [ ] PASS: Seller receives email "MedSource - New Inquiry Received"
- [ ] PASS: Contains product name, buyer name, urgency, message

### L5. Inquiry Response Email (to Buyer)
1. After seller replies to inquiry (Section I14)
- [ ] PASS: Buyer receives email "MedSource - Seller Responded to Your Inquiry"
- [ ] PASS: Contains seller name, product name, response text

---

## SECTION M: Push Notifications (FCM)

### M1. Permission Request
1. On first login, browser should prompt for notification permission
- [ ] PASS: Permission dialog appears
2. Click **Allow**
- [ ] PASS: No errors in console

### M2. Foreground Notification
1. Keep the app open in the foreground
2. Trigger a notification event (e.g. have another user place an order)
- [ ] PASS: Blue info toast appears at top of screen
- [ ] PASS: Toast shows notification title and body

---

## SECTION N: PWA & Offline Features

### N1. PWA Install
1. On mobile Chrome, check for "Add to Home Screen" prompt
- [ ] PASS: Install prompt appears (or available in browser menu)
2. Install the app
- [ ] PASS: App icon appears on home screen
- [ ] PASS: Opens in standalone mode (no browser URL bar)

### N2. Service Worker
1. Open browser DevTools > Application > Service Workers
- [ ] PASS: sw.js is registered and active

---

## SECTION O: Edge Cases & Error Handling

### O1. Network Error Handling
1. Turn off internet, try to load products
- [ ] PASS: Shows error state or cached content
2. Turn internet back on, retry
- [ ] PASS: Content loads

### O2. Session Expiry
1. Log in, then delete the medsource_token from localStorage (DevTools > Application > Local Storage)
2. Try to access /orders
- [ ] PASS: Redirected to /login

### O3. Invalid Routes
1. Navigate to /nonexistent-page
- [ ] PASS: Redirected to homepage (catch-all route)

### O4. Direct URL Access
1. While logged in, paste https://www.medsourceng.com/orders directly
- [ ] PASS: Orders page loads
2. While logged out, paste https://www.medsourceng.com/orders
- [ ] PASS: Redirected to /login

---

## SECTION P: Cross-Cutting Concerns

### P1. Responsive Design
1. Test on mobile (or Chrome DevTools mobile view, 375px width)
- [ ] PASS: All pages render correctly
- [ ] PASS: No horizontal overflow
- [ ] PASS: Bottom navigation visible and functional
- [ ] PASS: Forms are usable on small screens

### P2. Bottom Navigation
1. Verify 5 bottom nav items:
- [ ] PASS: Home (/)
- [ ] PASS: Cart (/cart) with badge count
- [ ] PASS: Search functionality
- [ ] PASS: Notifications (/notifications) with badge
- [ ] PASS: Profile (/profile)

### P3. Toast Notifications
1. Throughout testing, verify toasts:
- [ ] PASS: Green toast for success actions
- [ ] PASS: Red toast for errors
- [ ] PASS: Blue toast for info (FCM foreground)
- [ ] PASS: Toasts auto-dismiss after ~3 seconds
- [ ] PASS: Toasts can be manually dismissed (x button)

---

## Test Summary Checklist

| Section | Tests | Pass | Fail | Notes |
|---------|-------|------|------|-------|
| A. Authentication | 6 | | | |
| B. Homepage & Search | 9 | | | |
| C. Product Detail | 6 | | | |
| D. Shopping Cart | 5 | | | |
| E. Checkout & Payment | 6 | | | |
| F. Orders | 4 | | | |
| G. Seller Registration | 6 | | | |
| H. Admin Panel | 5 | | | |
| I. Seller Dashboard | 14 | | | |
| J. Notifications | 4 | | | |
| K. Profile | 4 | | | |
| L. Email Notifications | 5 | | | |
| M. Push Notifications | 2 | | | |
| N. PWA | 2 | | | |
| O. Edge Cases | 4 | | | |
| P. Cross-Cutting | 3 | | | |
| **TOTAL** | **85** | | | |

---

## Recommended Test Order

For the most efficient testing flow that avoids switching accounts repeatedly:

1. **Login as Sub-Admin** -> Sections A1, K1-K2, H1-H5
2. **Create a test buyer account** (incognito) -> Sections A2 or A4
3. **As Buyer**: B1-B9, C1-C6, D1-D5, E1-E6, F1-F4, J1-J4
4. **As Buyer**: G1-G6 (register as seller)
5. **Switch to Sub-Admin**: H3 (verify the new seller)
6. **As Verified Seller**: I1-I14 (full seller dashboard)
7. **As Buyer**: Place order for seller's product -> verify emails (L1-L5)
8. **As Seller**: Process order, reply to inquiry -> verify emails
9. **Both accounts**: M1-M2 (push notifications)
10. **Any account**: N1-N2, O1-O4, P1-P3

**Estimated Time:** 90-120 minutes for complete test pass
