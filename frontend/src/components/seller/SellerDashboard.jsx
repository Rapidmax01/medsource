import { useState, useEffect, useMemo } from "react";

// ============================================================
// MEDSOURCE SELLER DASHBOARD
// Complete seller management interface
// ============================================================

const formatNaira = (n) => "₦" + (n || 0).toLocaleString("en-NG");

// Sample seller data
const SAMPLE_STATS = {
  products: { total: 12, active: 9, outOfStock: 2, expiring: 1 },
  orders: { total: 47, pending: 3 },
  inquiries: { pending: 5 },
  revenue: { total: 8750000, monthly: 1250000 },
  rating: { average: 4.7, count: 23 },
};

const SAMPLE_SELLER_PRODUCTS = [
  { id: "sp1", name: "Rituximab 500mg/50ml", type: "PHARMACEUTICAL", category: "Oncology", price: 485000, quantity: 12, inStock: true, nafdacNumber: "A4-0847", nafdacVerified: true, expiryDate: "2026-08-15", viewCount: 234 },
  { id: "sp2", name: "Eculizumab 300mg/30ml", type: "PHARMACEUTICAL", category: "Rare Disease", price: 2150000, quantity: 4, inStock: true, nafdacNumber: "B2-1193", nafdacVerified: true, expiryDate: "2026-05-20", viewCount: 156 },
  { id: "sp3", name: "Whole Blood - O Negative", type: "BLOOD_PRODUCT", bloodType: "O-", price: 35000, quantity: 0, inStock: false, screeningStatus: "Fully Screened", coldChain: true, viewCount: 312 },
  { id: "sp4", name: "Packed Red Cells - AB+", type: "BLOOD_PRODUCT", bloodType: "AB+", price: 42000, quantity: 3, inStock: true, screeningStatus: "Fully Screened", coldChain: true, viewCount: 89 },
];

const SAMPLE_SELLER_ORDERS = [
  { id: "so1", orderNumber: "MSN-20260213-A1B2", buyer: "Dr. Adaeze Obi", buyerPhone: "+2348012345678", status: "PENDING", totalAmount: 970000, items: [{ name: "Rituximab 500mg/50ml", qty: 2 }], createdAt: "2026-02-13T10:30:00", paymentStatus: "PAID" },
  { id: "so2", orderNumber: "MSN-20260212-C3D4", buyer: "Lagos General Hospital", buyerPhone: "+2348098765432", status: "CONFIRMED", totalAmount: 42000, items: [{ name: "Packed Red Cells - AB+", qty: 1 }], createdAt: "2026-02-12T14:15:00", paymentStatus: "PAID" },
  { id: "so3", orderNumber: "MSN-20260211-E5F6", buyer: "PharmCity Lekki", buyerPhone: "+2348055667788", status: "DELIVERED", totalAmount: 2150000, items: [{ name: "Eculizumab 300mg/30ml", qty: 1 }], createdAt: "2026-02-11T09:00:00", paymentStatus: "PAID" },
];

const SAMPLE_INQUIRIES = [
  { id: "si1", buyerName: "Dr. Chukwu Emmanuel", buyerPhone: "+2348033445566", product: "Rituximab 500mg", message: "Do you have 10 units available? We need them urgently for a lymphoma patient.", urgency: "urgent", status: "PENDING", createdAt: "2026-02-13T08:20:00" },
  { id: "si2", buyerName: "UCH Ibadan Pharmacy", buyerPhone: "+2348022334455", product: "O Negative Blood", message: "When will O- blood be restocked? We have scheduled surgeries next week.", urgency: "routine", status: "PENDING", createdAt: "2026-02-12T16:45:00" },
  { id: "si3", buyerName: "Reddington Hospital", buyerPhone: "+2348011223344", product: "Eculizumab 300mg", message: "Can you provide a bulk discount for 3 units?", urgency: "routine", status: "RESPONDED", response: "Yes, we offer 5% off for 3+ units. Please place the order and we will adjust.", createdAt: "2026-02-10T11:30:00" },
];

// Icons
const Icons = {
  Package: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Orders: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Chart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  Truck: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Reply: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  ArrowUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
};

const STATUS_COLORS = {
  PENDING: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  CONFIRMED: { bg: "#DBEAFE", text: "#1E40AF", label: "Confirmed" },
  PROCESSING: { bg: "#E0E7FF", text: "#3730A3", label: "Processing" },
  READY_FOR_PICKUP: { bg: "#D1FAE5", text: "#065F46", label: "Ready" },
  IN_TRANSIT: { bg: "#CFFAFE", text: "#155E75", label: "In Transit" },
  DELIVERED: { bg: "#D1FAE5", text: "#065F46", label: "Delivered" },
  CANCELLED: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" },
  RESPONDED: { bg: "#D1FAE5", text: "#065F46", label: "Responded" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --g900: #052E16; --g700: #0F5132; --g600: #157347; --g500: #198754;
    --g400: #3DAA6D; --g100: #D1ECDA; --g50: #EEFAF2;
    --w: #FFF; --f50: #F8F9FA; --f100: #F0F2F4; --f200: #E2E5E9;
    --f300: #CDD1D7; --f400: #9DA3AB; --f500: #6C757D; --f700: #343A40; --f800: #212529; --f900: #0D1117;
    --r500: #DC3545; --r50: #FFF5F5;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; background: var(--f50); color: var(--f800); }

  .dash { max-width: 480px; margin: 0 auto; background: var(--w); min-height: 100vh; }

  .dash-header {
    background: var(--g900); color: white; padding: 20px;
  }
  .dash-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
  .dash-header p { font-size: 13px; opacity: 0.6; }

  .dash-tabs {
    display: flex; background: var(--w); border-bottom: 2px solid var(--f100);
    position: sticky; top: 0; z-index: 10;
  }
  .dash-tab {
    flex: 1; padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 600;
    color: var(--f400); cursor: pointer; border: none; background: none;
    font-family: inherit; display: flex; flex-direction: column; align-items: center; gap: 4px;
    border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;
    position: relative;
  }
  .dash-tab.active { color: var(--g600); border-bottom-color: var(--g600); }
  .dash-tab .badge {
    position: absolute; top: 4px; right: calc(50% - 20px);
    min-width: 18px; height: 18px; border-radius: 9px;
    background: var(--r500); color: white; font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; padding: 0 5px;
  }

  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 20px; }
  .stat-card {
    padding: 16px; border-radius: 12px; background: var(--f50); border: 1px solid var(--f100);
  }
  .stat-label { font-size: 11px; color: var(--f400); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 700; color: var(--f900); }
  .stat-sub { font-size: 12px; color: var(--f400); margin-top: 2px; }
  .stat-card.highlight { background: var(--g50); border-color: var(--g100); }
  .stat-card.highlight .stat-value { color: var(--g700); }

  .section-head { padding: 16px 20px 8px; display: flex; justify-content: space-between; align-items: center; }
  .section-head h3 { font-size: 16px; font-weight: 700; }
  .section-head .see-all { font-size: 13px; color: var(--g600); font-weight: 600; cursor: pointer; border: none; background: none; font-family: inherit; }

  .p-list { padding: 0 20px 100px; }
  .p-item {
    padding: 14px 0; border-bottom: 1px solid var(--f100);
    display: flex; gap: 12px; align-items: center;
  }
  .p-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 13px; font-weight: 700; }
  .p-icon.pharma { background: var(--g50); color: var(--g600); }
  .p-icon.blood { background: var(--r50); color: var(--r500); }
  .p-info { flex: 1; min-width: 0; }
  .p-name { font-size: 14px; font-weight: 600; color: var(--f800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .p-meta { font-size: 12px; color: var(--f400); margin-top: 2px; display: flex; gap: 8px; align-items: center; }
  .p-right { text-align: right; flex-shrink: 0; }
  .p-price { font-size: 14px; font-weight: 700; color: var(--g700); }
  .p-stock { font-size: 11px; font-weight: 600; margin-top: 2px; }
  .p-stock.in { color: var(--g500); }
  .p-stock.out { color: var(--r500); }

  .status-badge {
    display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
  }

  .o-item { padding: 16px 20px; border-bottom: 1px solid var(--f100); }
  .o-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .o-num { font-size: 13px; font-weight: 700; color: var(--f800); }
  .o-date { font-size: 11px; color: var(--f400); }
  .o-buyer { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .o-items-text { font-size: 12px; color: var(--f500); margin-bottom: 10px; }
  .o-bottom { display: flex; justify-content: space-between; align-items: center; }
  .o-total { font-size: 16px; font-weight: 700; color: var(--g700); }
  .o-actions { display: flex; gap: 6px; }
  .o-btn {
    padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: inherit; border: 1.5px solid var(--f200); background: var(--w); color: var(--f700);
    display: flex; align-items: center; gap: 4px;
  }
  .o-btn.primary { background: var(--g600); color: white; border-color: var(--g600); }

  .inq-item { padding: 16px 20px; border-bottom: 1px solid var(--f100); }
  .inq-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .inq-buyer { font-size: 14px; font-weight: 600; }
  .inq-product { font-size: 12px; color: var(--g600); font-weight: 600; margin-bottom: 6px; }
  .inq-msg { font-size: 13px; color: var(--f500); line-height: 1.6; margin-bottom: 10px; }
  .inq-response { font-size: 13px; color: var(--f700); line-height: 1.6; padding: 10px 12px; background: var(--g50); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--g400); }
  .inq-actions { display: flex; gap: 8px; }
  .urgency-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; }
  .urgency-badge.urgent { background: #FEF3C7; color: #92400E; }
  .urgency-badge.routine { background: var(--f100); color: var(--f500); }

  .reply-box {
    margin-top: 10px; padding: 12px; background: var(--f50); border-radius: 10px; border: 1px solid var(--f200);
  }
  .reply-box textarea {
    width: 100%; padding: 10px; border: 1px solid var(--f200); border-radius: 8px;
    font-size: 13px; font-family: inherit; resize: vertical; min-height: 80px;
    outline: none; margin-bottom: 8px; color: var(--f800); background: var(--w);
  }
  .reply-box textarea:focus { border-color: var(--g500); }

  .add-btn {
    position: fixed; bottom: 80px; right: calc(50% - 220px);
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--g600); color: white; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 20px rgba(21,115,71,0.3);
    z-index: 20;
  }

  .add-form {
    padding: 20px; padding-bottom: 100px;
  }
  .form-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--f500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
  .form-input {
    width: 100%; padding: 11px 14px; border: 1.5px solid var(--f200); border-radius: 10px;
    font-size: 14px; font-family: inherit; outline: none; color: var(--f800); background: var(--w);
  }
  .form-input:focus { border-color: var(--g500); }
  .form-select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239DA3AB' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-submit {
    width: 100%; padding: 14px; border-radius: 100px; border: none;
    background: var(--g600); color: white; font-size: 15px; font-weight: 600;
    cursor: pointer; font-family: inherit; margin-top: 8px;
  }
  .form-back {
    width: 100%; padding: 12px; border-radius: 100px;
    border: 1.5px solid var(--f200); background: var(--w); color: var(--f700);
    font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; margin-top: 8px;
  }

  .type-toggle { display: flex; gap: 8px; margin-bottom: 16px; }
  .type-btn {
    flex: 1; padding: 10px; border-radius: 10px; border: 1.5px solid var(--f200);
    background: var(--w); font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: inherit; color: var(--f500); text-align: center;
  }
  .type-btn.active { border-color: var(--g600); background: var(--g50); color: var(--g700); }
`;

// --- Add Product Form ---
function AddProductForm({ onBack, onSubmit }) {
  const [pType, setPType] = useState("PHARMACEUTICAL");
  const [form, setForm] = useState({
    name: "", genericName: "", category: "Oncology", price: "", quantity: "",
    nafdacNumber: "", manufacturer: "", dosageForm: "Injection", strength: "",
    expiryDate: "", description: "", batchNumber: "",
    bloodType: "O-", bloodProduct: "WHOLE_BLOOD", screeningStatus: "Fully Screened",
    storageTemp: "2-6°C", coldChain: true,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="add-form">
      <div className="form-title">Add New Product</div>

      <div className="type-toggle">
        <button className={`type-btn ${pType === "PHARMACEUTICAL" ? "active" : ""}`} onClick={() => setPType("PHARMACEUTICAL")}>💊 Pharmaceutical</button>
        <button className={`type-btn ${pType === "BLOOD_PRODUCT" ? "active" : ""}`} onClick={() => setPType("BLOOD_PRODUCT")}>🩸 Blood Product</button>
      </div>

      <div className="form-group">
        <label className="form-label">Product Name *</label>
        <input className="form-input" placeholder={pType === "PHARMACEUTICAL" ? "e.g. Rituximab 500mg/50ml" : "e.g. Whole Blood - O Negative"} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      {pType === "PHARMACEUTICAL" ? (
        <>
          <div className="form-group">
            <label className="form-label">Generic Name</label>
            <input className="form-input" placeholder="e.g. Rituximab" value={form.genericName} onChange={(e) => set("genericName", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input form-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option>Oncology</option><option>Rare Disease</option><option>Anti-infective</option>
                <option>Cardiology</option><option>Neurology</option><option>Immunology</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dosage Form</label>
              <select className="form-input form-select" value={form.dosageForm} onChange={(e) => set("dosageForm", e.target.value)}>
                <option>Injection</option><option>Tablet</option><option>Capsule</option>
                <option>IV Infusion</option><option>Syrup</option><option>Cream</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Strength</label>
              <input className="form-input" placeholder="e.g. 500mg" value={form.strength} onChange={(e) => set("strength", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">NAFDAC Number</label>
              <input className="form-input" placeholder="e.g. B2-1193" value={form.nafdacNumber} onChange={(e) => set("nafdacNumber", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Manufacturer</label>
            <input className="form-input" placeholder="e.g. Roche" value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Batch Number</label>
              <input className="form-input" placeholder="e.g. LOT-2025-001" value={form.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Blood Type *</label>
              <select className="form-input form-select" value={form.bloodType} onChange={(e) => set("bloodType", e.target.value)}>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bt) => <option key={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Product Type *</label>
              <select className="form-input form-select" value={form.bloodProduct} onChange={(e) => set("bloodProduct", e.target.value)}>
                <option value="WHOLE_BLOOD">Whole Blood</option>
                <option value="PACKED_RED_CELLS">Packed Red Cells</option>
                <option value="FRESH_FROZEN_PLASMA">Fresh Frozen Plasma</option>
                <option value="PLATELET_CONCENTRATE">Platelet Concentrate</option>
                <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Screening Status</label>
              <select className="form-input form-select" value={form.screeningStatus} onChange={(e) => set("screeningStatus", e.target.value)}>
                <option>Fully Screened</option><option>Pending</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Storage Temp</label>
              <input className="form-input" placeholder="e.g. 2-6°C" value={form.storageTemp} onChange={(e) => set("storageTemp", e.target.value)} />
            </div>
          </div>
        </>
      )}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Price (₦) *</label>
          <input className="form-input" type="number" placeholder="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Quantity *</label>
          <input className="form-input" type="number" placeholder="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" style={{ minHeight: 80, resize: "vertical" }} placeholder="Product description..." value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <button className="form-submit" onClick={() => onSubmit({ ...form, type: pType })}>Add Product</button>
      <button className="form-back" onClick={onBack}>Cancel</button>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function SellerDashboard() {
  const [tab, setTab] = useState("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const stats = SAMPLE_STATS;

  if (showAddProduct) {
    return (
      <>
        <style>{css}</style>
        <div className="dash">
          <div className="dash-header">
            <h1>MedSource Seller</h1>
            <p>Add New Listing</p>
          </div>
          <AddProductForm
            onBack={() => setShowAddProduct(false)}
            onSubmit={(data) => { alert("Product added! (Demo)"); setShowAddProduct(false); }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="dash">
        <div className="dash-header">
          <h1>PharmaCare Lagos</h1>
          <p>Seller Dashboard · Verified ✓</p>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {[
            { id: "overview", label: "Overview", icon: <Icons.Chart /> },
            { id: "products", label: "Products", icon: <Icons.Package />, badge: stats.products.outOfStock },
            { id: "orders", label: "Orders", icon: <Icons.Orders />, badge: stats.orders.pending },
            { id: "inquiries", label: "Inquiries", icon: <Icons.Chat />, badge: stats.inquiries.pending },
          ].map((t) => (
            <button key={t.id} className={`dash-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon}
              {t.label}
              {t.badge > 0 && <span className="badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            <div className="stat-grid">
              <div className="stat-card highlight">
                <div className="stat-label">Monthly Revenue</div>
                <div className="stat-value">{formatNaira(stats.revenue.monthly)}</div>
                <div className="stat-sub" style={{ color: "#0F5132", display: "flex", alignItems: "center", gap: 3 }}><Icons.ArrowUp /> 12% vs last month</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">{formatNaira(stats.revenue.total)}</div>
                <div className="stat-sub">{stats.orders.total} orders all time</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Products</div>
                <div className="stat-value">{stats.products.active}</div>
                <div className="stat-sub">{stats.products.outOfStock} out of stock</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Seller Rating</div>
                <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {stats.rating.average} <span style={{ color: "#F59E0B" }}><Icons.Star /></span>
                </div>
                <div className="stat-sub">{stats.rating.count} reviews</div>
              </div>
            </div>

            {stats.products.expiring > 0 && (
              <div style={{ margin: "0 20px 12px", padding: "12px 14px", background: "#FEF3C7", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#92400E" }}><Icons.Alert /></span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#92400E" }}>
                  {stats.products.expiring} product(s) expiring within 90 days
                </span>
              </div>
            )}

            <div className="section-head"><h3>Recent Orders</h3></div>
            {SAMPLE_SELLER_ORDERS.slice(0, 3).map((order) => (
              <div className="o-item" key={order.id}>
                <div className="o-top">
                  <span className="o-num">{order.orderNumber}</span>
                  <span className="status-badge" style={{ background: STATUS_COLORS[order.status]?.bg, color: STATUS_COLORS[order.status]?.text }}>
                    {STATUS_COLORS[order.status]?.label}
                  </span>
                </div>
                <div className="o-buyer">{order.buyer}</div>
                <div className="o-items-text">{order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</div>
                <div className="o-bottom">
                  <span className="o-total">{formatNaira(order.totalAmount)}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <>
            <div className="section-head">
              <h3>{SAMPLE_SELLER_PRODUCTS.length} Products</h3>
            </div>
            <div className="p-list">
              {SAMPLE_SELLER_PRODUCTS.map((p) => (
                <div className="p-item" key={p.id}>
                  <div className={`p-icon ${p.type === "BLOOD_PRODUCT" ? "blood" : "pharma"}`}>
                    {p.type === "BLOOD_PRODUCT" ? (p.bloodType || "🩸") : "💊"}
                  </div>
                  <div className="p-info">
                    <div className="p-name">{p.name}</div>
                    <div className="p-meta">
                      <span>{p.category || p.bloodType}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icons.Eye /> {p.viewCount}</span>
                      {p.nafdacVerified && <span style={{ color: "#0F5132", fontWeight: 600 }}>✓ NAFDAC</span>}
                    </div>
                  </div>
                  <div className="p-right">
                    <div className="p-price">{formatNaira(p.price)}</div>
                    <div className={`p-stock ${p.inStock ? "in" : "out"}`}>
                      {p.inStock ? `${p.quantity} units` : "Out of stock"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="add-btn" onClick={() => setShowAddProduct(true)}><Icons.Plus /></button>
          </>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <>
            <div className="section-head"><h3>All Orders</h3></div>
            {SAMPLE_SELLER_ORDERS.map((order) => (
              <div className="o-item" key={order.id}>
                <div className="o-top">
                  <div>
                    <span className="o-num">{order.orderNumber}</span>
                    <div className="o-date">{new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                  <span className="status-badge" style={{ background: STATUS_COLORS[order.status]?.bg, color: STATUS_COLORS[order.status]?.text }}>
                    {STATUS_COLORS[order.status]?.label}
                  </span>
                </div>
                <div className="o-buyer">{order.buyer}</div>
                <div className="o-items-text">{order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</div>
                <div className="o-bottom">
                  <span className="o-total">{formatNaira(order.totalAmount)}</span>
                  <div className="o-actions">
                    {order.status === "PENDING" && (
                      <button className="o-btn primary"><Icons.Check /> Confirm</button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <button className="o-btn primary"><Icons.Truck /> Ship</button>
                    )}
                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <button className="o-btn" style={{ color: "#DC3545", borderColor: "#FEE2E2" }}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* INQUIRIES TAB */}
        {tab === "inquiries" && (
          <>
            <div className="section-head"><h3>Customer Inquiries</h3></div>
            {SAMPLE_INQUIRIES.map((inq) => (
              <div className="inq-item" key={inq.id}>
                <div className="inq-top">
                  <span className="inq-buyer">{inq.buyerName}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className={`urgency-badge ${inq.urgency}`}>{inq.urgency}</span>
                    <span className="status-badge" style={{ background: STATUS_COLORS[inq.status]?.bg, color: STATUS_COLORS[inq.status]?.text }}>
                      {STATUS_COLORS[inq.status]?.label}
                    </span>
                  </div>
                </div>
                <div className="inq-product">Re: {inq.product}</div>
                <div className="inq-msg">{inq.message}</div>

                {inq.response && (
                  <div className="inq-response">
                    <strong style={{ fontSize: 11, color: "#0F5132" }}>Your Response:</strong><br />
                    {inq.response}
                  </div>
                )}

                {inq.status === "PENDING" && (
                  <>
                    {replyTo === inq.id ? (
                      <div className="reply-box">
                        <textarea
                          placeholder="Type your response..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="o-btn primary" onClick={() => { setReplyTo(null); setReplyText(""); }}>
                            Send Response
                          </button>
                          <button className="o-btn" onClick={() => { setReplyTo(null); setReplyText(""); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="inq-actions">
                        <button className="o-btn primary" onClick={() => setReplyTo(inq.id)}>
                          <Icons.Reply /> Reply
                        </button>
                        <button className="o-btn">
                          📞 Call {inq.buyerPhone.slice(-4)}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
