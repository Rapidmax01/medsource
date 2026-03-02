import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { productApi, uploadApi, nafdacApi } from '../services/api';
import { Icons } from '../components/shared/Icons';

const CATEGORIES = [
  'Oncology',
  'Rare Disease',
  'Orphan Drugs',
  'Blood Products',
  'Vaccines',
  'Diagnostics',
];

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Injection',
  'IV Infusion',
  'Syrup',
  'Suspension',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Suppository',
  'Powder',
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_PRODUCTS = [
  { value: 'WHOLE_BLOOD', label: 'Whole Blood' },
  { value: 'PACKED_RED_CELLS', label: 'Packed Red Cells' },
  { value: 'FRESH_FROZEN_PLASMA', label: 'Fresh Frozen Plasma' },
  { value: 'PLATELET_CONCENTRATE', label: 'Platelet Concentrate' },
  { value: 'CRYOPRECIPITATE', label: 'Cryoprecipitate' },
];

const MAX_IMAGES = 5;

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // NAFDAC verification state
  const [nafdacStatus, setNafdacStatus] = useState(null); // null | 'checking' | 'verified' | 'unverified' | 'error'

  const [form, setForm] = useState({
    type: 'PHARMACEUTICAL',
    name: '',
    description: '',
    price: '',
    quantity: '',
    images: [],
    // Pharma
    genericName: '',
    category: '',
    dosageForm: '',
    strength: '',
    manufacturer: '',
    nafdacNumber: '',
    batchNumber: '',
    expiryDate: '',
    // Blood
    bloodType: '',
    bloodProduct: '',
    screeningStatus: '',
    coldChain: false,
    collectionDate: '',
    storageTemp: '',
    // Tags
    tags: '',
  });

  // Load existing product for edit mode
  useEffect(() => {
    if (!isEdit) return;
    productApi.getById(id)
      .then((res) => {
        const p = res.product || res;
        setForm({
          type: p.type || 'PHARMACEUTICAL',
          name: p.name || '',
          description: p.description || '',
          price: p.price?.toString() || '',
          quantity: p.quantity?.toString() || '',
          images: p.images || [],
          genericName: p.genericName || '',
          category: p.category || '',
          dosageForm: p.dosageForm || '',
          strength: p.strength || '',
          manufacturer: p.manufacturer || '',
          nafdacNumber: p.nafdacNumber || '',
          batchNumber: p.batchNumber || '',
          expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : '',
          bloodType: p.bloodType || '',
          bloodProduct: p.bloodProduct || '',
          screeningStatus: p.screeningStatus || '',
          coldChain: p.coldChain || false,
          collectionDate: p.collectionDate ? p.collectionDate.slice(0, 10) : '',
          storageTemp: p.storageTemp || '',
          tags: (p.tags || []).join(', '),
        });
        if (p.nafdacVerified) setNafdacStatus('verified');
      })
      .catch(() => {
        showToast('Failed to load product', 'error');
        navigate('/seller');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, showToast]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'nafdacNumber') setNafdacStatus(null);
  };

  // Image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      showToast(`Maximum ${MAX_IMAGES} images allowed`, 'error');
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const urls = [];
      for (const file of toUpload) {
        const res = await uploadApi.uploadImage(file);
        urls.push(res.url || res.secure_url || res.imageUrl);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch {
      showToast('Image upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  // NAFDAC verify
  const handleVerifyNafdac = async () => {
    const num = form.nafdacNumber.trim();
    if (!num) {
      showToast('Enter a NAFDAC number first', 'error');
      return;
    }
    setNafdacStatus('checking');
    try {
      const res = await nafdacApi.verify(num);
      setNafdacStatus(res.verified || res.isRegistered ? 'verified' : 'unverified');
    } catch {
      setNafdacStatus('error');
    }
  };

  // Validation
  const validate = () => {
    if (!form.name.trim()) return 'Product name is required';
    if (!form.price || parseFloat(form.price) <= 0) return 'Price must be greater than 0';
    if (form.quantity === '' || parseInt(form.quantity) < 0) return 'Quantity must be 0 or more';
    if (form.type === 'PHARMACEUTICAL') {
      if (!form.category) return 'Category is required for pharmaceuticals';
    }
    if (form.type === 'BLOOD_PRODUCT') {
      if (!form.bloodType) return 'Blood type is required';
      if (!form.bloodProduct) return 'Blood product type is required';
    }
    return null;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        type: form.type,
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        images: form.images,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (form.type === 'PHARMACEUTICAL') {
        Object.assign(data, {
          genericName: form.genericName.trim() || undefined,
          category: form.category || undefined,
          dosageForm: form.dosageForm || undefined,
          strength: form.strength.trim() || undefined,
          manufacturer: form.manufacturer.trim() || undefined,
          nafdacNumber: form.nafdacNumber.trim() || undefined,
          batchNumber: form.batchNumber.trim() || undefined,
          expiryDate: form.expiryDate || undefined,
        });
      } else {
        Object.assign(data, {
          bloodType: form.bloodType || undefined,
          bloodProduct: form.bloodProduct || undefined,
          screeningStatus: form.screeningStatus.trim() || undefined,
          coldChain: form.coldChain,
          collectionDate: form.collectionDate || undefined,
          storageTemp: form.storageTemp.trim() || undefined,
        });
      }

      if (isEdit) {
        await productApi.update(id, data);
        showToast('Product updated');
      } else {
        await productApi.create(data);
        showToast('Product created');
      }
      navigate('/seller');
    } catch (err) {
      showToast(err.error || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading product...</span>
      </div>
    );
  }

  const isPharma = form.type === 'PHARMACEUTICAL';

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A8F3C 0%, #067A32 100%)',
        color: '#fff',
        padding: '20px 20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/seller')} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
          }}>
            <Icons.ArrowLeft />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        {/* Product Type Toggle */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Product Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['PHARMACEUTICAL', 'BLOOD_PRODUCT'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleChange('type', t)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: `1.5px solid ${form.type === t ? 'var(--green-600)' : 'var(--gray-200)'}`,
                  background: form.type === t ? 'var(--green-50)' : '#fff',
                  color: form.type === t ? 'var(--green-700)' : 'var(--gray-500)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t === 'PHARMACEUTICAL' ? 'Pharmaceutical' : 'Blood Product'}
              </button>
            ))}
          </div>
        </div>

        {/* Common Fields */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Product Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Imatinib 400mg Tablets"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your product..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Price (NGN) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Quantity *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="0"
              min="0"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Pharmaceutical Fields */}
        {isPharma && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Generic Name</label>
              <input
                type="text"
                value={form.genericName}
                onChange={(e) => handleChange('genericName', e.target.value)}
                placeholder="e.g. Imatinib Mesylate"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Dosage Form</label>
                <select
                  value={form.dosageForm}
                  onChange={(e) => handleChange('dosageForm', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select form</option>
                  {DOSAGE_FORMS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Strength</label>
                <input
                  type="text"
                  value={form.strength}
                  onChange={(e) => handleChange('strength', e.target.value)}
                  placeholder="e.g. 500mg"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Manufacturer</label>
                <input
                  type="text"
                  value={form.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  placeholder="e.g. Novartis"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* NAFDAC Number with inline verify */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>NAFDAC Number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={form.nafdacNumber}
                  onChange={(e) => handleChange('nafdacNumber', e.target.value)}
                  placeholder="e.g. A4-0123"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleVerifyNafdac}
                  disabled={nafdacStatus === 'checking' || !form.nafdacNumber.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--green-600)',
                    background: nafdacStatus === 'verified' ? 'var(--green-600)' : '#fff',
                    color: nafdacStatus === 'verified' ? '#fff' : 'var(--green-600)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: nafdacStatus === 'checking' ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: 'nowrap',
                    opacity: !form.nafdacNumber.trim() ? 0.5 : 1,
                  }}
                >
                  {nafdacStatus === 'checking' ? 'Verifying...'
                    : nafdacStatus === 'verified' ? 'Verified'
                    : 'Verify'}
                </button>
              </div>
              {nafdacStatus === 'unverified' && (
                <p style={{ fontSize: 12, color: 'var(--red-500)', margin: '4px 0 0' }}>
                  NAFDAC number not found in registry. Product can still be listed.
                </p>
              )}
              {nafdacStatus === 'error' && (
                <p style={{ fontSize: 12, color: 'var(--red-500)', margin: '4px 0 0' }}>
                  Verification failed. Try again later.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Batch Number</label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) => handleChange('batchNumber', e.target.value)}
                  placeholder="e.g. BN-2024-001"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </>
        )}

        {/* Blood Product Fields */}
        {!isPharma && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Blood Type *</label>
                <select
                  value={form.bloodType}
                  onChange={(e) => handleChange('bloodType', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select type</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Blood Product *</label>
                <select
                  value={form.bloodProduct}
                  onChange={(e) => handleChange('bloodProduct', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select product</option>
                  {BLOOD_PRODUCTS.map((bp) => (
                    <option key={bp.value} value={bp.value}>{bp.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Screening Status</label>
              <input
                type="text"
                value={form.screeningStatus}
                onChange={(e) => handleChange('screeningStatus', e.target.value)}
                placeholder="e.g. Fully Screened"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Collection Date</label>
                <input
                  type="date"
                  value={form.collectionDate}
                  onChange={(e) => handleChange('collectionDate', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Storage Temp</label>
                <input
                  type="text"
                  value={form.storageTemp}
                  onChange={(e) => handleChange('storageTemp', e.target.value)}
                  placeholder="e.g. 2-6°C"
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.coldChain}
                onChange={(e) => handleChange('coldChain', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--green-600)' }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-700)' }}>
                Requires Cold Chain
              </span>
            </label>
          </>
        )}

        {/* Images */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Product Images ({form.images.length}/{MAX_IMAGES})
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {form.images.map((url, i) => (
              <div key={i} style={{
                position: 'relative',
                width: 80,
                height: 80,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--gray-200)',
              }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
            {form.images.length < MAX_IMAGES && (
              <label style={{
                width: 80,
                height: 80,
                borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--gray-300)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1,
              }}>
                {uploading ? (
                  <div className="spinner" style={{ width: 20, height: 20 }} />
                ) : (
                  <Icons.Plus />
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => handleChange('tags', e.target.value)}
            placeholder="e.g. oncology, chemotherapy, rare"
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: 'var(--gray-400)', margin: '4px 0 0' }}>
            Separate tags with commas
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: 15,
            fontWeight: 700,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting
            ? (isEdit ? 'Updating...' : 'Creating...')
            : (isEdit ? 'Update Product' : 'Create Product')}
        </button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--gray-600)',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--gray-200)',
  borderRadius: 'var(--radius-md)',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  color: 'var(--gray-800)',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
};
