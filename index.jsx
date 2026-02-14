import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================
// MEDSOURCE - Healthcare Marketplace PWA for Nigeria
// Uncommon Pharmaceuticals & Blood Products
// ============================================================

// --- DATA ---
const SAMPLE_PRODUCTS = [
  {
    id: "p1",
    type: "pharmaceutical",
    name: "Rituximab 500mg/50ml",
    generic: "Rituximab",
    category: "Oncology",
    seller: "PharmaCare Lagos",
    sellerId: "s1",
    price: 485000,
    currency: "NGN",
    inStock: true,
    quantity: 12,
    nafdacNo: "A4-0847",
    expiryDate: "2026-08-15",
    location: "Lagos, Ikeja",
    state: "Lagos",
    description: "Monoclonal antibody for non-Hodgkin's lymphoma and chronic lymphocytic leukemia.",
    verified: true,
    image: null,
  },
  {
    id: "p2",
    type: "pharmaceutical",
    name: "Eculizumab 300mg/30ml",
    generic: "Eculizumab",
    category: "Rare Disease",
    seller: "MedPlus Abuja",
    sellerId: "s2",
    price: 2150000,
    currency: "NGN",
    inStock: true,
    quantity: 4,
    nafdacNo: "B2-1193",
    expiryDate: "2026-05-20",
    location: "Abuja, Wuse",
    state: "FCT",
    description: "Complement inhibitor for paroxysmal nocturnal hemoglobinuria (PNH).",
    verified: true,
    image: null,
  },
  {
    id: "p3",
    type: "pharmaceutical",
    name: "Imatinib 400mg Tablets",
    generic: "Imatinib Mesylate",
    category: "Oncology",
    seller: "HealthBridge PH",
    sellerId: "s3",
    price: 125000,
    currency: "NGN",
    inStock: true,
    quantity: 30,
    nafdacNo: "C1-0562",
    expiryDate: "2027-01-10",
    location: "Port Harcourt, GRA",
    state: "Rivers",
    description: "Tyrosine kinase inhibitor for chronic myeloid leukemia (CML).",
    verified: true,
    image: null,
  },
  {
    id: "p4",
    type: "pharmaceutical",
    name: "Trastuzumab 440mg",
    generic: "Trastuzumab",
    category: "Oncology",
    seller: "PharmaCare Lagos",
    sellerId: "s1",
    price: 750000,
    currency: "NGN",
    inStock: false,
    quantity: 0,
    nafdacNo: "A4-0912",
    expiryDate: "2026-11-30",
    location: "Lagos, Ikeja",
    state: "Lagos",
    description: "HER2-targeted therapy for breast cancer treatment.",
    verified: true,
    image: null,
  },
  {
    id: "p5",
    type: "pharmaceutical",
    name: "Daptomycin 500mg IV",
    generic: "Daptomycin",
    category: "Anti-infective",
    seller: "MedPlus Abuja",
    sellerId: "s2",
    price: 95000,
    currency: "NGN",
    inStock: true,
    quantity: 18,
    nafdacNo: "B2-1204",
    expiryDate: "2026-09-25",
    location: "Abuja, Wuse",
    state: "FCT",
    description: "Lipopeptide antibiotic for complicated skin infections and bacteremia.",
    verified: true,
    image: null,
  },
  {
    id: "b1",
    type: "blood",
    name: "Whole Blood - O Negative",
    bloodType: "O-",
    bloodProduct: "Whole Blood",
    category: "Blood Products",
    seller: "National Blood Bank Lagos",
    sellerId: "s4",
    price: 35000,
    currency: "NGN",
    inStock: true,
    quantity: 8,
    screeningStatus: "Fully Screened",
    expiryDate: "2026-03-01",
    location: "Lagos, Yaba",
    state: "Lagos",
    description: "Universal donor whole blood. Fully screened for HIV, Hepatitis B & C, Syphilis.",
    verified: true,
    coldChain: true,
    image: null,
  },
  {
    id: "b2",
    type: "blood",
    name: "Packed Red Cells - AB Positive",
    bloodType: "AB+",
    bloodProduct: "Packed Red Cells",
    category: "Blood Products",
    seller: "RedCross Blood Center Abuja",
    sellerId: "s5",
    price: 42000,
    currency: "NGN",
    inStock: true,
    quantity: 3,
    screeningStatus: "Fully Screened",
    expiryDate: "2026-02-28",
    location: "Abuja, Garki",
    state: "FCT",
    description: "Packed red blood cells for transfusion. Fully screened and cross-matched.",
    verified: true,
    coldChain: true,
    image: null,
  },
  {
    id: "b3",
    type: "blood",
    name: "Fresh Frozen Plasma - B Negative",
    bloodType: "B-",
    bloodProduct: "Fresh Frozen Plasma",
    category: "Blood Products",
    seller: "National Blood Bank Lagos",
    sellerId: "s4",
    price: 38000,
    currency: "NGN",
    inStock: true,
    quantity: 5,
    screeningStatus: "Fully Screened",
    expiryDate: "2026-04-15",
    location: "Lagos, Yaba",
    state: "Lagos",
    description: "FFP for coagulation factor replacement. Stored at -18°C or below.",
    verified: true,
    coldChain: true,
    image: null,
  },
  {
    id: "b4",
    type: "blood",
    name: "Platelet Concentrate - A Positive",
    bloodType: "A+",
    bloodProduct: "Platelet Concentrate",
    category: "Blood Products",
    seller: "UCH Blood Bank Ibadan",
    sellerId: "s6",
    price: 28000,
    currency: "NGN",
    inStock: true,
    quantity: 10,
    screeningStatus: "Fully Screened",
    expiryDate: "2026-02-18",
    location: "Ibadan, UCH",
    state: "Oyo",
    description: "Platelet concentrate for thrombocytopenia management. 5-day shelf life.",
    verified: true,
    coldChain: true,
    image: null,
  },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "⊕" },
  { id: "oncology", label: "Oncology", icon: "◎" },
  { id: "rare-disease", label: "Rare Disease", icon: "◇" },
  { id: "anti-infective", label: "Anti-infective", icon: "⬡" },
  { id: "blood", label: "Blood Products", icon: "◉" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const NIGERIAN_STATES = [
  "All States", "Abia", "Abuja (FCT)", "Adamawa", "Akwa Ibom", "Anambra",
  "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi",
  "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara"
];

// --- UTILS ---
const formatNaira = (amount) => {
  return "₦" + amount.toLocaleString("en-NG");
};

const getTimeAgo = () => {
  const options = ["2 hours ago", "5 hours ago", "1 day ago", "3 days ago", "1 week ago"];
  return options[Math.floor(Math.random() * options.length)];
};

// --- ICONS (SVG Components) ---
const Icons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
  ),
  Home: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
  ),
  Cart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
  ),
  User: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
  ),
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  ),
  Verified: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A8F3C" stroke="white" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Location: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Snowflake: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  ),
  Message: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  Filter: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Minus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Blood: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z"/></svg>
  ),
  Pill: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/></svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
};

// --- STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Instrument+Serif:ital@0;1&display=swap');
  
  :root {
    --green-900: #052E16;
    --green-800: #0A3D1F;
    --green-700: #0F5132;
    --green-600: #157347;
    --green-500: #198754;
    --green-400: #3DAA6D;
    --green-300: #71C891;
    --green-200: #A3D9B1;
    --green-100: #D1ECDA;
    --green-50: #EEFAF2;
    
    --white: #FFFFFF;
    --gray-50: #F8F9FA;
    --gray-100: #F0F2F4;
    --gray-200: #E2E5E9;
    --gray-300: #CDD1D7;
    --gray-400: #9DA3AB;
    --gray-500: #6C757D;
    --gray-600: #4A5056;
    --gray-700: #343A40;
    --gray-800: #212529;
    --gray-900: #0D1117;
    
    --red-500: #DC3545;
    --red-50: #FFF5F5;
    --red-100: #FDE8E8;
    --red-700: #9B1C1C;
    
    --amber-500: #F59E0B;
    --amber-50: #FFFBEB;
    
    --blue-500: #3B82F6;
    --blue-50: #EFF6FF;
    
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 100px;
    
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 30px rgba(0,0,0,0.1);
    --shadow-xl: 0 20px 50px rgba(0,0,0,0.12);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: var(--gray-50);
    color: var(--gray-800);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  .app-container {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    background: var(--white);
    position: relative;
    box-shadow: var(--shadow-xl);
  }

  /* --- HEADER --- */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--green-900);
    padding: 16px 20px 12px;
    color: white;
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-mark {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--green-400), var(--green-300));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: var(--green-900);
  }

  .logo-text {
    font-family: 'Instrument Serif', serif;
    font-size: 24px;
    font-weight: 400;
    letter-spacing: -0.5px;
  }

  .logo-sub {
    font-size: 10px;
    opacity: 0.6;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: -2px;
  }

  .header-actions {
    display: flex;
    gap: 6px;
  }

  .header-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.08);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .header-btn:active { background: rgba(255,255,255,0.15); }

  .cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 18px;
    height: 18px;
    background: var(--red-500);
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  /* --- SEARCH BAR --- */
  .search-container {
    position: relative;
  }

  .search-bar {
    width: 100%;
    height: 44px;
    border-radius: var(--radius-full);
    border: none;
    background: rgba(255,255,255,0.12);
    color: white;
    padding: 0 44px 0 44px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: all 0.2s;
  }

  .search-bar::placeholder { color: rgba(255,255,255,0.45); }
  .search-bar:focus { background: rgba(255,255,255,0.18); }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
  }

  .filter-btn {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* --- CATEGORIES --- */
  .categories-strip {
    display: flex;
    gap: 8px;
    padding: 14px 20px;
    overflow-x: auto;
    background: var(--white);
    border-bottom: 1px solid var(--gray-100);
    scrollbar-width: none;
  }

  .categories-strip::-webkit-scrollbar { display: none; }

  .cat-chip {
    flex-shrink: 0;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--gray-200);
    background: var(--white);
    font-size: 13px;
    font-weight: 500;
    color: var(--gray-600);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'DM Sans', sans-serif;
  }

  .cat-chip.active {
    background: var(--green-900);
    color: white;
    border-color: var(--green-900);
  }

  /* --- PRODUCT CARDS --- */
  .products-section {
    padding: 16px 20px 120px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--gray-900);
  }

  .section-count {
    font-size: 13px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .product-card {
    background: var(--white);
    border: 1px solid var(--gray-100);
    border-radius: var(--radius-lg);
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .product-card:active { transform: scale(0.985); }
  .product-card:hover { box-shadow: var(--shadow-md); }

  .product-card.blood-type {
    border-left: 4px solid var(--red-500);
  }

  .product-card.pharma-type {
    border-left: 4px solid var(--green-500);
  }

  .product-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .product-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .badge-pharma {
    background: var(--green-50);
    color: var(--green-700);
  }

  .badge-blood {
    background: var(--red-50);
    color: var(--red-700);
  }

  .badge-verified {
    background: var(--green-50);
    color: var(--green-600);
  }

  .stock-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .stock-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .in-stock .stock-dot { background: var(--green-500); }
  .in-stock { color: var(--green-600); }
  .out-stock .stock-dot { background: var(--red-500); }
  .out-stock { color: var(--red-500); }

  .product-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-900);
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .product-generic {
    font-size: 13px;
    color: var(--gray-400);
    margin-bottom: 10px;
  }

  .product-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--gray-500);
  }

  .product-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid var(--gray-100);
  }

  .product-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--green-800);
    font-family: 'DM Sans', sans-serif;
  }

  .product-seller {
    font-size: 12px;
    color: var(--gray-500);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cold-chain-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    background: var(--blue-50);
    color: var(--blue-500);
    font-size: 11px;
    font-weight: 600;
  }

  .blood-type-badge {
    font-family: 'DM Sans', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--red-500);
    background: var(--red-50);
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* --- PRODUCT DETAIL --- */
  .detail-view {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    height: 100vh;
    background: var(--white);
    z-index: 200;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(30px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }

  .detail-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--white);
    border-bottom: 1px solid var(--gray-100);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .back-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--gray-700);
  }

  .detail-body {
    padding: 20px;
    padding-bottom: 200px;
  }

  .detail-type-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .detail-type-icon.pharma {
    background: linear-gradient(135deg, var(--green-50), var(--green-100));
    color: var(--green-600);
  }

  .detail-type-icon.blood {
    background: linear-gradient(135deg, var(--red-50), var(--red-100));
    color: var(--red-500);
  }

  .detail-name {
    font-size: 22px;
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .detail-generic {
    font-size: 14px;
    color: var(--gray-400);
    margin-bottom: 16px;
  }

  .detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  .detail-description {
    font-size: 14px;
    line-height: 1.7;
    color: var(--gray-600);
    margin-bottom: 24px;
  }

  .detail-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  .info-card {
    padding: 14px;
    border-radius: var(--radius-md);
    background: var(--gray-50);
    border: 1px solid var(--gray-100);
  }

  .info-label {
    font-size: 11px;
    color: var(--gray-400);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    font-weight: 600;
  }

  .info-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--gray-800);
  }

  .seller-card {
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--gray-50);
    border: 1px solid var(--gray-100);
    margin-bottom: 24px;
  }

  .seller-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-900);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .seller-location {
    font-size: 13px;
    color: var(--gray-500);
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
  }

  .seller-actions {
    display: flex;
    gap: 8px;
  }

  .seller-action-btn {
    flex: 1;
    padding: 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--white);
    font-size: 13px;
    font-weight: 500;
    color: var(--gray-700);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }

  .detail-price-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    padding: 16px 20px;
    background: var(--white);
    border-top: 1px solid var(--gray-100);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }

  .detail-price {
    font-size: 24px;
    font-weight: 700;
    color: var(--green-800);
  }

  .detail-price-unit {
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 400;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .btn-inquiry {
    padding: 12px 20px;
    border-radius: var(--radius-full);
    border: 2px solid var(--green-600);
    background: transparent;
    color: var(--green-600);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }

  .btn-inquiry:active { background: var(--green-50); }

  .btn-purchase {
    padding: 12px 24px;
    border-radius: var(--radius-full);
    border: none;
    background: var(--green-600);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }

  .btn-purchase:active { background: var(--green-700); }
  .btn-purchase:disabled {
    background: var(--gray-300);
    cursor: not-allowed;
  }

  /* --- FILTER PANEL --- */
  .filter-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 300;
    display: flex;
    align-items: flex-end;
  }

  .filter-panel {
    width: 100%;
    background: var(--white);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: 24px 20px 40px;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .filter-handle {
    width: 40px;
    height: 4px;
    background: var(--gray-300);
    border-radius: 2px;
    margin: 0 auto 20px;
  }

  .filter-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .filter-close {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--gray-100);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--gray-600);
  }

  .filter-section {
    margin-bottom: 20px;
  }

  .filter-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-chip {
    padding: 8px 14px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--gray-200);
    background: var(--white);
    font-size: 13px;
    font-weight: 500;
    color: var(--gray-600);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }

  .filter-chip.active {
    background: var(--green-900);
    color: white;
    border-color: var(--green-900);
  }

  .filter-apply-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-full);
    border: none;
    background: var(--green-600);
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    margin-top: 10px;
  }

  /* --- CART VIEW --- */
  .cart-empty {
    text-align: center;
    padding: 60px 20px;
  }

  .cart-empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--gray-50);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: var(--gray-300);
  }

  .cart-empty-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-700);
    margin-bottom: 4px;
  }

  .cart-empty-sub {
    font-size: 13px;
    color: var(--gray-400);
  }

  .cart-item {
    display: flex;
    gap: 14px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--gray-100);
  }

  .cart-item-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .cart-item-icon.pharma {
    background: var(--green-50);
    color: var(--green-600);
  }

  .cart-item-icon.blood {
    background: var(--red-50);
    color: var(--red-500);
  }

  .cart-item-info { flex: 1; }

  .cart-item-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 2px;
  }

  .cart-item-seller {
    font-size: 12px;
    color: var(--gray-400);
    margin-bottom: 8px;
  }

  .cart-item-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cart-qty {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cart-qty-btn {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--gray-200);
    background: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--gray-600);
  }

  .cart-qty-val {
    font-size: 14px;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
  }

  .cart-item-price {
    font-size: 15px;
    font-weight: 700;
    color: var(--green-800);
  }

  .cart-remove {
    font-size: 12px;
    color: var(--red-500);
    cursor: pointer;
    border: none;
    background: none;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    margin-top: 4px;
  }

  .cart-summary {
    position: fixed;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    padding: 16px 20px;
    background: var(--white);
    border-top: 1px solid var(--gray-100);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
  }

  .cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .cart-total-label {
    font-size: 14px;
    color: var(--gray-500);
  }

  .cart-total-val {
    font-size: 22px;
    font-weight: 700;
    color: var(--green-800);
  }

  .cart-checkout-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-full);
    border: none;
    background: var(--green-600);
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }

  /* --- BOTTOM NAV --- */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: var(--white);
    border-top: 1px solid var(--gray-100);
    display: flex;
    z-index: 50;
    padding: 6px 0 env(safe-area-inset-bottom, 8px);
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 0;
    cursor: pointer;
    color: var(--gray-400);
    transition: all 0.2s;
    border: none;
    background: none;
    font-family: 'DM Sans', sans-serif;
    position: relative;
  }

  .nav-item.active { color: var(--green-600); }

  .nav-label {
    font-size: 11px;
    font-weight: 600;
  }

  /* --- QUICK FILTERS --- */
  .quick-blood-filters {
    padding: 12px 20px;
    background: var(--red-50);
    border-bottom: 1px solid var(--red-100);
  }

  .quick-blood-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--red-700);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .blood-type-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .blood-chip {
    padding: 6px 12px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--red-100);
    background: var(--white);
    font-size: 13px;
    font-weight: 700;
    color: var(--red-500);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }

  .blood-chip.active {
    background: var(--red-500);
    color: white;
    border-color: var(--red-500);
  }

  /* --- TOAST --- */
  .toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 360px;
    padding: 12px 20px;
    border-radius: var(--radius-full);
    background: var(--gray-900);
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 500;
    animation: toastIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: var(--shadow-xl);
  }

  @keyframes toastIn {
    from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }

  /* --- INQUIRY MODAL --- */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal {
    width: 100%;
    background: var(--white);
    border-radius: var(--radius-xl);
    padding: 24px;
    animation: modalIn 0.3s ease-out;
  }

  @keyframes modalIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .modal-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .modal-sub {
    font-size: 13px;
    color: var(--gray-400);
    margin-bottom: 20px;
  }

  .modal-input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--gray-200);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 12px;
    outline: none;
    transition: border 0.2s;
    color: var(--gray-800);
    background: var(--white);
  }

  .modal-input:focus { border-color: var(--green-500); }

  .modal-textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--gray-200);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 16px;
    outline: none;
    resize: vertical;
    min-height: 100px;
    transition: border 0.2s;
    color: var(--gray-800);
    background: var(--white);
  }

  .modal-textarea:focus { border-color: var(--green-500); }

  .modal-actions {
    display: flex;
    gap: 10px;
  }

  .modal-cancel {
    flex: 1;
    padding: 12px;
    border-radius: var(--radius-full);
    border: 1.5px solid var(--gray-200);
    background: var(--white);
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-600);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }

  .modal-submit {
    flex: 1;
    padding: 12px;
    border-radius: var(--radius-full);
    border: none;
    background: var(--green-600);
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }

  /* --- PROFILE / ACCOUNT --- */
  .profile-section {
    padding: 24px 20px 120px;
  }

  .profile-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .profile-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--green-400), var(--green-600));
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    font-size: 28px;
    font-weight: 700;
    color: white;
  }

  .profile-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: 2px;
  }

  .profile-role {
    font-size: 13px;
    color: var(--gray-400);
  }

  .profile-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--gray-100);
    cursor: pointer;
  }

  .profile-menu-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .profile-menu-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--gray-50);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .profile-menu-text {
    font-size: 15px;
    font-weight: 500;
    color: var(--gray-800);
  }

  .profile-menu-arrow {
    color: var(--gray-300);
    font-size: 18px;
  }

  /* --- EMPTY STATE --- */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.3;
  }

  .empty-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--gray-600);
    margin-bottom: 4px;
  }

  .empty-sub {
    font-size: 13px;
    color: var(--gray-400);
  }

  /* --- SUCCESS STATE --- */
  .success-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    height: 100vh;
    background: rgba(255,255,255,0.97);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
    animation: fadeIn 0.3s;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .success-check {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--green-500);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: white;
  }

  .success-check svg { width: 36px; height: 36px; }

  .success-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: 8px;
  }

  .success-msg {
    font-size: 14px;
    color: var(--gray-500);
    line-height: 1.6;
    margin-bottom: 30px;
  }

  .success-btn {
    padding: 14px 40px;
    border-radius: var(--radius-full);
    border: none;
    background: var(--green-600);
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }
`;

// ============================================================
// COMPONENTS
// ============================================================

// --- Toast ---
function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div className="toast">
      <Icons.Check /> {message}
    </div>
  );
}

// --- Inquiry Modal ---
function InquiryModal({ product, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Send Inquiry</div>
        <div className="modal-sub">Contact {product.seller} about {product.name}</div>
        <input className="modal-input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="modal-input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <textarea className="modal-textarea" placeholder="Your message (e.g. quantity needed, urgency, delivery location...)" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-submit" onClick={() => onSubmit({ name, phone, msg })}>Send Inquiry</button>
        </div>
      </div>
    </div>
  );
}

// --- Success Screen ---
function SuccessScreen({ type, onClose }) {
  return (
    <div className="success-overlay">
      <div>
        <div className="success-check"><Icons.Check /></div>
        <div className="success-title">
          {type === "inquiry" ? "Inquiry Sent!" : "Order Placed!"}
        </div>
        <div className="success-msg">
          {type === "inquiry"
            ? "The seller has been notified and will respond to you shortly via phone or SMS."
            : "Your order has been confirmed. The seller will contact you with delivery details and payment instructions."}
        </div>
        <button className="success-btn" onClick={onClose}>Continue Shopping</button>
      </div>
    </div>
  );
}

// --- Product Card ---
function ProductCard({ product, onClick }) {
  const isBlood = product.type === "blood";
  return (
    <div className={`product-card ${isBlood ? "blood-type" : "pharma-type"}`} onClick={onClick}>
      <div className="product-top">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`product-badge ${isBlood ? "badge-blood" : "badge-pharma"}`}>
            {isBlood ? "🩸 Blood" : "💊 Pharma"}
          </span>
          {product.verified && (
            <span className="product-badge badge-verified"><Icons.Verified /> Verified</span>
          )}
        </div>
        <div className={`stock-indicator ${product.inStock ? "in-stock" : "out-stock"}`}>
          <span className="stock-dot" />
          {product.inStock ? "In Stock" : "Out of Stock"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {isBlood && <div className="blood-type-badge">{product.bloodType}</div>}
        <div style={{ flex: 1 }}>
          <div className="product-name">{product.name}</div>
          <div className="product-generic">
            {isBlood ? product.bloodProduct : product.generic}
          </div>
        </div>
      </div>

      <div className="product-meta">
        <span className="meta-item"><Icons.Location /> {product.location}</span>
        <span className="meta-item"><Icons.Clock /> Exp: {product.expiryDate}</span>
        {product.coldChain && (
          <span className="cold-chain-badge"><Icons.Snowflake /> Cold Chain</span>
        )}
      </div>

      <div className="product-bottom">
        <span className="product-price">{formatNaira(product.price)}</span>
        <span className="product-seller">
          <Icons.Shield /> {product.seller}
        </span>
      </div>
    </div>
  );
}

// --- Product Detail ---
function ProductDetail({ product, onBack, onAddToCart, onInquiry }) {
  const isBlood = product.type === "blood";
  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}><Icons.ArrowLeft /></button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Product Details</span>
      </div>
      <div className="detail-body">
        <div className={`detail-type-icon ${isBlood ? "blood" : "pharma"}`}>
          {isBlood
            ? <span style={{ fontSize: 28 }}><Icons.Blood /></span>
            : <span style={{ fontSize: 28 }}><Icons.Pill /></span>
          }
        </div>
        <div className="detail-name">{product.name}</div>
        <div className="detail-generic">
          {isBlood ? `${product.bloodProduct} · ${product.bloodType}` : product.generic}
        </div>
        <div className="detail-badges">
          <span className={`product-badge ${isBlood ? "badge-blood" : "badge-pharma"}`}>
            {isBlood ? "🩸 Blood Product" : `💊 ${product.category}`}
          </span>
          {product.verified && (
            <span className="product-badge badge-verified"><Icons.Verified /> NAFDAC Verified</span>
          )}
          {product.coldChain && (
            <span className="cold-chain-badge"><Icons.Snowflake /> Cold Chain Required</span>
          )}
          <span className={`stock-indicator ${product.inStock ? "in-stock" : "out-stock"}`}>
            <span className="stock-dot" />
            {product.inStock ? `${product.quantity} units available` : "Out of Stock"}
          </span>
        </div>

        <div className="detail-description">{product.description}</div>

        <div className="detail-info-grid">
          <div className="info-card">
            <div className="info-label">Location</div>
            <div className="info-value">{product.location}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Expiry Date</div>
            <div className="info-value">{product.expiryDate}</div>
          </div>
          {!isBlood && (
            <div className="info-card">
              <div className="info-label">NAFDAC No.</div>
              <div className="info-value">{product.nafdacNo}</div>
            </div>
          )}
          {isBlood && (
            <div className="info-card">
              <div className="info-label">Screening</div>
              <div className="info-value">{product.screeningStatus}</div>
            </div>
          )}
          <div className="info-card">
            <div className="info-label">Quantity</div>
            <div className="info-value">{product.quantity} units</div>
          </div>
        </div>

        <div className="seller-card">
          <div className="seller-name">
            {product.seller}
            {product.verified && <Icons.Verified />}
          </div>
          <div className="seller-location"><Icons.Location /> {product.location}</div>
          <div className="seller-actions">
            <button className="seller-action-btn"><Icons.Phone /> Call Seller</button>
            <button className="seller-action-btn"><Icons.Message /> Message</button>
          </div>
        </div>
      </div>

      <div className="detail-price-bar">
        <div>
          <div className="detail-price">{formatNaira(product.price)}</div>
          <div className="detail-price-unit">per unit</div>
        </div>
        <div className="action-buttons">
          <button className="btn-inquiry" onClick={() => onInquiry(product)}>Inquire</button>
          <button
            className="btn-purchase"
            disabled={!product.inStock}
            onClick={() => onAddToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Filter Panel ---
function FilterPanel({ filters, setFilters, onClose, onApply }) {
  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-handle" />
        <div className="filter-title">
          Filters
          <button className="filter-close" onClick={onClose}><Icons.Close /></button>
        </div>

        <div className="filter-section">
          <div className="filter-label">Product Type</div>
          <div className="filter-chips">
            {["All", "Pharmaceuticals", "Blood Products"].map((t) => (
              <button
                key={t}
                className={`filter-chip ${filters.productType === t ? "active" : ""}`}
                onClick={() => setFilters({ ...filters, productType: t })}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-label">Blood Type</div>
          <div className="filter-chips">
            {["Any", ...BLOOD_TYPES].map((bt) => (
              <button
                key={bt}
                className={`filter-chip ${filters.bloodType === bt ? "active" : ""}`}
                onClick={() => setFilters({ ...filters, bloodType: bt })}
              >{bt}</button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-label">State</div>
          <div className="filter-chips">
            {["All States", "Lagos", "FCT", "Rivers", "Oyo"].map((s) => (
              <button
                key={s}
                className={`filter-chip ${filters.state === s ? "active" : ""}`}
                onClick={() => setFilters({ ...filters, state: s })}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-label">Availability</div>
          <div className="filter-chips">
            {["All", "In Stock Only"].map((a) => (
              <button
                key={a}
                className={`filter-chip ${filters.availability === a ? "active" : ""}`}
                onClick={() => setFilters({ ...filters, availability: a })}
              >{a}</button>
            ))}
          </div>
        </div>

        <button className="filter-apply-btn" onClick={onApply}>Apply Filters</button>
      </div>
    </div>
  );
}

// --- Cart View ---
function CartView({ cart, updateQty, removeItem, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon"><Icons.Cart /></div>
        <div className="cart-empty-text">Your cart is empty</div>
        <div className="cart-empty-sub">Browse products and add items to your cart</div>
      </div>
    );
  }

  return (
    <div>
      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <div className={`cart-item-icon ${item.type === "blood" ? "blood" : "pharma"}`}>
            {item.type === "blood" ? <Icons.Blood /> : <Icons.Pill />}
          </div>
          <div className="cart-item-info">
            <div className="cart-item-name">{item.name}</div>
            <div className="cart-item-seller">{item.seller}</div>
            <div className="cart-item-bottom">
              <div className="cart-qty">
                <button className="cart-qty-btn" onClick={() => updateQty(item.id, -1)}><Icons.Minus /></button>
                <span className="cart-qty-val">{item.qty}</span>
                <button className="cart-qty-btn" onClick={() => updateQty(item.id, 1)}><Icons.Plus /></button>
              </div>
              <span className="cart-item-price">{formatNaira(item.price * item.qty)}</span>
            </div>
            <button className="cart-remove" onClick={() => removeItem(item.id)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="cart-summary">
        <div className="cart-total">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-val">{formatNaira(total)}</span>
        </div>
        <button className="cart-checkout-btn" onClick={onCheckout}>Proceed to Checkout</button>
      </div>
    </div>
  );
}

// --- Profile View ---
function ProfileView() {
  const menuItems = [
    { icon: "📦", label: "My Orders" },
    { icon: "📋", label: "My Inquiries" },
    { icon: "🏥", label: "Saved Sellers" },
    { icon: "📍", label: "Delivery Addresses" },
    { icon: "💳", label: "Payment Methods" },
    { icon: "🔔", label: "Notifications" },
    { icon: "⚙️", label: "Settings" },
    { icon: "📞", label: "Help & Support" },
  ];

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">U</div>
        <div className="profile-name">User Account</div>
        <div className="profile-role">Buyer · Hospital / Individual</div>
      </div>
      {menuItems.map((item) => (
        <div key={item.label} className="profile-menu-item">
          <div className="profile-menu-left">
            <div className="profile-menu-icon">{item.icon}</div>
            <span className="profile-menu-text">{item.label}</span>
          </div>
          <span className="profile-menu-arrow">›</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function MedSourceApp() {
  const [currentTab, setCurrentTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showInquiry, setShowInquiry] = useState(null);
  const [showSuccess, setShowSuccess] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [selectedBloodType, setSelectedBloodType] = useState(null);
  const [filters, setFilters] = useState({
    productType: "All",
    bloodType: "Any",
    state: "All States",
    availability: "All",
  });

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2500);
  }, []);

  const filteredProducts = useMemo(() => {
    let results = [...SAMPLE_PRODUCTS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.generic && p.generic.toLowerCase().includes(q)) ||
          (p.bloodType && p.bloodType.toLowerCase().includes(q)) ||
          (p.bloodProduct && p.bloodProduct.toLowerCase().includes(q)) ||
          p.seller.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "all") {
      if (activeCategory === "blood") {
        results = results.filter((p) => p.type === "blood");
      } else {
        results = results.filter(
          (p) => p.category.toLowerCase().replace(/\s+/g, "-") === activeCategory
        );
      }
    }

    if (selectedBloodType) {
      results = results.filter((p) => p.type === "blood" && p.bloodType === selectedBloodType);
    }

    if (filters.productType === "Pharmaceuticals") results = results.filter((p) => p.type === "pharmaceutical");
    if (filters.productType === "Blood Products") results = results.filter((p) => p.type === "blood");
    if (filters.bloodType !== "Any") results = results.filter((p) => p.type !== "blood" || p.bloodType === filters.bloodType);
    if (filters.state !== "All States") results = results.filter((p) => p.state === filters.state);
    if (filters.availability === "In Stock Only") results = results.filter((p) => p.inStock);

    return results;
  }, [searchQuery, activeCategory, selectedBloodType, filters]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast("Added to cart");
    setSelectedProduct(null);
  }, [showToast]);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed");
  }, [showToast]);

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <Toast message={toast.message} visible={toast.visible} />

        {showSuccess && (
          <SuccessScreen
            type={showSuccess}
            onClose={() => { setShowSuccess(null); setCurrentTab("home"); }}
          />
        )}

        {showInquiry && (
          <InquiryModal
            product={showInquiry}
            onClose={() => setShowInquiry(null)}
            onSubmit={() => {
              setShowInquiry(null);
              setSelectedProduct(null);
              setShowSuccess("inquiry");
            }}
          />
        )}

        {showFilter && (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onClose={() => setShowFilter(false)}
            onApply={() => setShowFilter(false)}
          />
        )}

        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={addToCart}
            onInquiry={(p) => setShowInquiry(p)}
          />
        )}

        {/* HEADER */}
        <div className="header">
          <div className="header-top">
            <div className="logo">
              <div className="logo-mark">M</div>
              <div>
                <div className="logo-text">MedSource</div>
                <div className="logo-sub">Nigeria</div>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-btn" style={{ position: "relative" }} onClick={() => setCurrentTab("cart")}>
                <Icons.Cart />
                {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
              </button>
            </div>
          </div>
          <div className="search-container">
            <span className="search-icon"><Icons.Search /></span>
            <input
              className="search-bar"
              placeholder="Search medications, blood type..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentTab("home"); }}
            />
            <button className="filter-btn" onClick={() => setShowFilter(true)}><Icons.Filter /></button>
          </div>
        </div>

        {/* BODY */}
        {currentTab === "home" && (
          <>
            <div className="categories-strip">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-chip ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => { setActiveCategory(cat.id); setSelectedBloodType(null); }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {(activeCategory === "all" || activeCategory === "blood") && (
              <div className="quick-blood-filters">
                <div className="quick-blood-title"><Icons.Blood /> Quick Blood Type Search</div>
                <div className="blood-type-chips">
                  {BLOOD_TYPES.map((bt) => (
                    <button
                      key={bt}
                      className={`blood-chip ${selectedBloodType === bt ? "active" : ""}`}
                      onClick={() => setSelectedBloodType(selectedBloodType === bt ? null : bt)}
                    >{bt}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="products-section">
              <div className="section-header">
                <span className="section-title">
                  {searchQuery ? "Search Results" : "Available Products"}
                </span>
                <span className="section-count">{filteredProducts.length} items</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <div className="empty-text">No products found</div>
                  <div className="empty-sub">Try adjusting your search or filters</div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {currentTab === "cart" && (
          <>
            <div style={{ padding: "20px 20px 8px", fontWeight: 700, fontSize: 20, color: "#0D1117" }}>
              Shopping Cart
              <span style={{ fontSize: 14, fontWeight: 400, color: "#9DA3AB", marginLeft: 8 }}>
                ({cart.length} {cart.length === 1 ? "item" : "items"})
              </span>
            </div>
            <CartView
              cart={cart}
              updateQty={updateQty}
              removeItem={removeItem}
              onCheckout={() => {
                setCart([]);
                setShowSuccess("order");
              }}
            />
          </>
        )}

        {currentTab === "profile" && <ProfileView />}

        {/* BOTTOM NAV */}
        <div className="bottom-nav">
          <button className={`nav-item ${currentTab === "home" ? "active" : ""}`} onClick={() => setCurrentTab("home")}>
            <Icons.Home />
            <span className="nav-label">Home</span>
          </button>
          <button className={`nav-item ${currentTab === "search" ? "active" : ""}`} onClick={() => { setCurrentTab("home"); document.querySelector('.search-bar')?.focus(); }}>
            <Icons.Search />
            <span className="nav-label">Search</span>
          </button>
          <button className={`nav-item ${currentTab === "cart" ? "active" : ""}`} onClick={() => setCurrentTab("cart")} style={{ position: "relative" }}>
            <Icons.Cart />
            <span className="nav-label">Cart</span>
            {cart.length > 0 && <span className="cart-badge" style={{ top: 2, right: "calc(50% - 20px)" }}>{cart.length}</span>}
          </button>
          <button className={`nav-item ${currentTab === "profile" ? "active" : ""}`} onClick={() => setCurrentTab("profile")}>
            <Icons.User />
            <span className="nav-label">Account</span>
          </button>
        </div>
      </div>
    </>
  );
}
