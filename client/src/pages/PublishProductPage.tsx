import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  Product, 
  ProductCategory, 
  ProductStage, 
  ImageMetadata
} from '@droptest/shared';
import { 
  ArrowLeft, 
  Upload, 
  Trash2
} from 'lucide-react';

interface PublishProductPageProps {
  editProductId?: string;
  onNavigateBack: () => void;
  onPublishSuccess: (productId: string) => void;
}

export const PublishProductPage: React.FC<PublishProductPageProps> = ({
  editProductId,
  onNavigateBack,
  onPublishSuccess
}) => {
  const { token } = useAuth();

  // Core product state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('clothing_accessories');
  const [stage, setStage] = useState<ProductStage>('preparing_to_launch');
  const [summary, setSummary] = useState('');
  const [intendedBuyer, setIntendedBuyer] = useState('');
  const [feedbackQuestion, setFeedbackQuestion] = useState('');
  
  // Price & Currency
  const [priceNotSet, setPriceNotSet] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('INR');

  // Availability & Delivery
  const [marketsNotDecided, setMarketsNotDecided] = useState(false);
  const [marketInput, setMarketInput] = useState('');
  const [fulfillmentNotDecided, setFulfillmentNotDecided] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState('');

  // Images
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Category specific data
  // Clothing
  const [clothingMaterial, setClothingMaterial] = useState('');
  const [clothingFit, setClothingFit] = useState('');
  const [clothingSizes, setClothingSizes] = useState('');

  // Food
  const [foodPortion, setFoodPortion] = useState('');
  const [foodIngredients, setFoodIngredients] = useState('');
  const [foodMode, setFoodMode] = useState('');

  // Digital
  const [digitalPlatform, setDigitalPlatform] = useState('');
  const [digitalLanguage, setDigitalLanguage] = useState('');
  const [digitalUseCase, setDigitalUseCase] = useState('');
  const [digitalPricingType, setDigitalPricingType] = useState<'one_time' | 'subscription' | 'not_decided'>('not_decided');
  const [legacyPlatformLanguage, setLegacyPlatformLanguage] = useState('');

  // Other
  const [otherSpecs, setOtherSpecs] = useState('');
  const [visualDescription, setVisualDescription] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);

  // Load existing product if editing
  useEffect(() => {
    if (!editProductId) return;

    const loadProduct = async () => {
      setIsLoading(true);
      setName(''); setCategory('clothing_accessories'); setStage('preparing_to_launch'); setSummary('');
      setIntendedBuyer(''); setFeedbackQuestion(''); setPriceNotSet(false); setPrice('');
      setMarketsNotDecided(false); setMarketInput(''); setFulfillmentNotDecided(false); setFulfillmentMode('');
      setImages([]); setClothingMaterial(''); setClothingFit(''); setClothingSizes('');
      setFoodPortion(''); setFoodIngredients(''); setFoodMode(''); setDigitalPlatform('');
      setDigitalLanguage(''); setDigitalUseCase(''); setDigitalPricingType('not_decided'); setLegacyPlatformLanguage(''); setOtherSpecs(''); setVisualDescription('');
      try {
        const res = await fetch(`/api/products/${editProductId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Could not load product details');
        const p: Product = await res.json();

        setName(p.name);
        setCategory(p.category);
        setStage(p.stage);
        setSummary(p.summary);
        setIntendedBuyer(p.intended_buyer);
        setFeedbackQuestion(p.feedback_question);
        
        if (p.price === null) {
          setPriceNotSet(true);
          setPrice('');
        } else {
          setPriceNotSet(false);
          setPrice(p.price);
        }
        setCurrency(p.currency);

        if (p.availability_markets === 'not_decided') {
          setMarketsNotDecided(true);
          setMarketInput('');
        } else {
          setMarketsNotDecided(false);
          setMarketInput(Array.isArray(p.availability_markets) ? p.availability_markets.join(', ') : '');
        }

        if (p.fulfillment_mode === 'not_decided') {
          setFulfillmentNotDecided(true);
          setFulfillmentMode('');
        } else {
          setFulfillmentNotDecided(false);
          setFulfillmentMode(p.fulfillment_mode);
        }

        setImages(p.images || []);

        if (p.category_data) {
          if (p.category_data.material) setClothingMaterial(p.category_data.material === 'not_decided' ? '' : p.category_data.material);
          if (p.category_data.fit) setClothingFit(p.category_data.fit === 'not_decided' ? '' : p.category_data.fit);
          if (p.category_data.sizes) setClothingSizes(p.category_data.sizes === 'not_decided' ? '' : Array.isArray(p.category_data.sizes) ? p.category_data.sizes.join(', ') : p.category_data.sizes);
          if (p.category_data.portion) setFoodPortion(p.category_data.portion === 'not_decided' ? '' : p.category_data.portion);
          if (p.category_data.ingredients_allergens) setFoodIngredients(p.category_data.ingredients_allergens === 'not_decided' ? '' : p.category_data.ingredients_allergens);
          if (p.category_data.pickup_delivery_mode) setFoodMode(p.category_data.pickup_delivery_mode === 'not_decided' ? '' : p.category_data.pickup_delivery_mode);
          if (p.category_data.platform) setDigitalPlatform(p.category_data.platform === 'not_decided' ? '' : p.category_data.platform);
          else if (p.category_data.platform_language) setLegacyPlatformLanguage(p.category_data.platform_language);
          if (p.category_data.language) setDigitalLanguage(p.category_data.language === 'not_decided' ? '' : p.category_data.language);
          if (p.category_data.core_use_case) setDigitalUseCase(p.category_data.core_use_case === 'not_decided' ? '' : p.category_data.core_use_case);
          if (['one_time', 'subscription', 'not_decided'].includes(p.category_data.pricing_type)) setDigitalPricingType(p.category_data.pricing_type);
          if (p.category_data.specs) setOtherSpecs(p.category_data.specs === 'not_decided' ? '' : p.category_data.specs);
          if (p.category_data.specification_text) setOtherSpecs(p.category_data.specification_text === 'not_decided' ? '' : p.category_data.specification_text);
          if (p.category_data.visual_description) setVisualDescription(p.category_data.visual_description);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [editProductId, token]);

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 3) {
      alert('You can upload at most 3 images');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Image upload failed. Check the file type and 5 MB size limit.');
      }
      const meta: ImageMetadata = await res.json();
      setImages(prev => [...prev, meta]);
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateImageDescription = (index: number, desc: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, confirmed_visual_description: desc } : img));
  };

  const constructPayload = (status: 'draft' | 'published') => {
    // Construct category_data
    let categoryData: Record<string, any> = {};
    if (category === 'clothing_accessories') {
      categoryData = {
        item_type: 'Apparel',
          material: clothingMaterial.trim() || 'not_decided',
          fit: clothingFit.trim() || 'not_decided',
          sizes: clothingSizes.trim() ? clothingSizes.split(',').map(s => s.trim()).filter(Boolean) : 'not_decided'
      };
    } else if (category === 'local_food_beverages') {
      categoryData = {
        item_name: name,
        portion: foodPortion.trim() || 'not_decided',
        ingredients_allergens: foodIngredients.trim() || 'not_decided',
        pickup_delivery_mode: foodMode.trim() || 'not_decided'
      };
    } else if (category === 'digital_products_services') {
      categoryData = {
        ...(legacyPlatformLanguage && !digitalPlatform.trim() && !digitalLanguage.trim()
          ? { platform_language: legacyPlatformLanguage }
          : { platform: digitalPlatform.trim() || 'not_decided', language: digitalLanguage.trim() || 'not_decided' }),
        core_use_case: digitalUseCase.trim() || 'not_decided',
        pricing_type: digitalPricingType
      };
    } else {
      categoryData = {
        specification_text: otherSpecs.trim() || 'not_decided'
      };
    }
    if (visualDescription.trim()) categoryData.visual_description = visualDescription.trim();

    const markets = marketsNotDecided 
      ? 'not_decided' 
      : marketInput.split(',').map(m => m.trim()).filter(Boolean);

    return {
      name,
      category,
      stage,
      summary,
      intended_buyer: intendedBuyer,
      feedback_question: feedbackQuestion,
      price: priceNotSet ? null : (price === '' ? null : Number(price)),
      currency,
      availability_markets: markets,
      fulfillment_mode: fulfillmentNotDecided ? 'not_decided' : fulfillmentMode,
      images,
      category_data: categoryData,
      status
    };
  };

  const handleSave = async (status: 'draft' | 'published') => {
    setError(null);
    setIssues([]);
    setIsSubmitting(true);

    try {
      const payload = constructPayload(status);
      const url = editProductId ? `/api/products/${editProductId}` : '/api/products';
      const method = editProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save product');
        if (data.issues) setIssues(data.issues);
        return;
      }

      onPublishSuccess(data.id || editProductId);
    } catch (err: any) {
      setError(err.message || 'Network error while saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      {/* Back Button */}
      <button
        type="button"
        className="btn btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-4)' }}
        onClick={onNavigateBack}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Form Title */}
        <div style={{ marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-4)' }}>
          <span className="brand-badge" style={{ fontSize: '10px', marginBottom: '6px', display: 'inline-block' }}>
            {editProductId ? 'EDIT PRODUCT' : 'NEW PRODUCT PROPOSAL'}
          </span>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            {editProductId ? 'Update Your Product Details' : 'Publish a Product to the Community'}
          </h1>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Provide clear facts about your product. Manufacturing costs stay private in your Synthetic Lab.
          </p>
        </div>

        {error && (
          <div role="alert" style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{error}</div>
            {issues.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
                {issues.map((iss, i) => (
                  <li key={i}>{iss.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); handleSave('published'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '6px' }}>
              1. Basic Product Information
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="product-name">Product Name *</label>
              <input
                id="product-name"
                type="text"
                className="form-input"
                placeholder="e.g. Organic Linen Shirt"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="product-category">Category *</label>
                <select
                  id="product-category"
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                >
                  <option value="clothing_accessories">Apparel & Fashion</option>
                  <option value="local_food_beverages">Food & Bakery</option>
                  <option value="digital_products_services">Digital Products & SaaS</option>
                  <option value="other">Other Category</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-stage">Current Stage *</label>
                <select
                  id="product-stage"
                  className="form-select"
                  value={stage}
                  onChange={e => setStage(e.target.value as ProductStage)}
                >
                  <option value="idea">Idea / Concept</option>
                  <option value="prototype">Prototype in Progress</option>
                  <option value="preparing_to_launch">Preparing to Launch</option>
                  <option value="launched">Already Launched</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="product-summary">Product Summary (What it is and why choose it) *</label>
              <textarea
                id="product-summary"
                className="form-textarea"
                rows={3}
                placeholder="What it is, key features, and core benefit..."
                value={summary}
                onChange={e => setSummary(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="product-intended-buyer">Intended Buyer Description *</label>
              <input
                id="product-intended-buyer"
                type="text"
                className="form-input"
                placeholder="e.g. Eco-conscious professionals (25–35)"
                value={intendedBuyer}
                onChange={e => setIntendedBuyer(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="product-feedback-question">Your Feedback Question for the Community *</label>
              <input
                id="product-feedback-question"
                type="text"
                className="form-input"
                placeholder="e.g. Would you buy this at ₹699?"
                value={feedbackQuestion}
                onChange={e => setFeedbackQuestion(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 2. Price & Economics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '6px' }}>
              2. Launch Price
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={priceNotSet}
                  onChange={e => {
                    setPriceNotSet(e.target.checked);
                    if (e.target.checked) setPrice('');
                  }}
                />
                <span style={{ fontWeight: 500 }}>Price not decided yet</span>
              </label>
            </div>

            {!priceNotSet && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="product-price">Target Launch Price *</label>
                  <input
                    id="product-price"
                    type="number"
                    className="form-input"
                    placeholder="699"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required={!priceNotSet}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="product-currency">Currency</label>
                  <select
                    id="product-currency"
                    className="form-select"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 3. Availability & Fulfillment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '6px' }}>
              3. Availability & Fulfillment
            </h3>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" htmlFor="product-markets" style={{ margin: 0 }}>Available / Served Markets</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={marketsNotDecided}
                    onChange={e => setMarketsNotDecided(e.target.checked)}
                  />
                  <span>Not decided yet</span>
                </label>
              </div>
              {!marketsNotDecided && (
                <input
                  id="product-markets"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bengaluru, Mumbai, Delhi NCR"
                  value={marketInput}
                  onChange={e => setMarketInput(e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" htmlFor="product-fulfillment" style={{ margin: 0 }}>Fulfillment & Delivery Mode</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fulfillmentNotDecided}
                    onChange={e => setFulfillmentNotDecided(e.target.checked)}
                  />
                  <span>Not decided yet</span>
                </label>
              </div>
              {!fulfillmentNotDecided && (
                <input
                  id="product-fulfillment"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Standard courier shipping"
                  value={fulfillmentMode}
                  onChange={e => setFulfillmentMode(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* 4. Category-Specific Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '6px' }}>
              4. Category Details ({category.replace(/_/g, ' ')})
            </h3>
            <p className="form-help">Enter each known fact. A blank category field is saved explicitly as “Not decided yet”; it is not treated as a known product fact.</p>

            {category === 'clothing_accessories' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-clothing-material">Material / Fabric *</label>
                    <input
                      id="product-clothing-material"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 100% Organic Linen"
                      value={clothingMaterial}
                      onChange={e => setClothingMaterial(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-clothing-fit">Fit / Cut</label>
                    <input
                      id="product-clothing-fit"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Relaxed fit"
                      value={clothingFit}
                      onChange={e => setClothingFit(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="product-clothing-sizes">Available Sizes (comma-separated)</label>
                  <input
                    id="product-clothing-sizes"
                    type="text"
                    className="form-input"
                    placeholder="e.g. S, M, L, XL"
                    value={clothingSizes}
                    onChange={e => setClothingSizes(e.target.value)}
                  />
                </div>
              </>
            )}

            {category === 'local_food_beverages' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-food-portion">Portion / Weight *</label>
                    <input
                      id="product-food-portion"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 750g loaf"
                      value={foodPortion}
                      onChange={e => setFoodPortion(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-food-mode">Delivery / Pickup Mode</label>
                    <input
                      id="product-food-mode"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Morning delivery / pickup"
                      value={foodMode}
                      onChange={e => setFoodMode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="product-food-ingredients">Known Ingredients & Allergens *</label>
                  <input
                    id="product-food-ingredients"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Wheat flour, sea salt, sourdough starter. Contains gluten."
                    value={foodIngredients}
                    onChange={e => setFoodIngredients(e.target.value)}
                  />
                </div>
              </>
            )}

            {category === 'digital_products_services' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-digital-platform">Platform / Stack *</label>
                    <input
                      id="product-digital-platform"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Web SaaS / Mobile"
                      value={digitalPlatform}
                      onChange={e => setDigitalPlatform(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-digital-language">Language</label>
                    <input
                      id="product-digital-language"
                      type="text"
                      className="form-input"
                      placeholder="e.g. TypeScript / Python"
                      value={digitalLanguage}
                      onChange={e => setDigitalLanguage(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="product-digital-use-case">Primary Use Case</label>
                    <input
                      id="product-digital-use-case"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Product validation workspace"
                      value={digitalUseCase}
                      onChange={e => setDigitalUseCase(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="digital-pricing-type">Billing type</label>
                  <select id="digital-pricing-type" className="form-select" value={digitalPricingType} onChange={e => setDigitalPricingType(e.target.value as 'one_time' | 'subscription' | 'not_decided')}>
                    <option value="not_decided">Not decided yet</option>
                    <option value="one_time">One-time purchase</option>
                    <option value="subscription">Subscription</option>
                  </select>
                  {digitalPricingType === 'subscription' && <span className="form-help">Synthetic Lab finance will use the explicitly selected first operating period.</span>}
                </div>
              </>
            )}

            {category === 'other' && (
              <div className="form-group">
                <label className="form-label" htmlFor="product-other-specs">Technical Specifications / Key Details</label>
                <textarea
                  id="product-other-specs"
                  className="form-textarea"
                  rows={2}
                  placeholder="Key dimensions, features, or materials..."
                  value={otherSpecs}
                  onChange={e => setOtherSpecs(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 5. Product Images */}
          <div className="form-group">
            <label className="form-label" htmlFor="visual-description">Visual / functional description (required if no image)</label>
            <textarea
              id="visual-description"
              className="form-textarea"
              rows={2}
              placeholder="Visual appearance and key design details..."
              value={visualDescription}
              onChange={e => setVisualDescription(e.target.value)}
            />
          </div>

          {/* 5. Product Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '6px' }}>
              5. Product Images (Up to 3)
            </h3>

            {images.length < 3 && (
              <div>
                <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  <Upload size={14} />
                  <span>{isUploading ? 'Uploading...' : 'Upload Image (PNG, JPG, WebP max 5MB)'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}

            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: 'var(--color-surface-hover)'
                  }}>
                    <img src={img.url} alt={`Upload ${idx + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                    <div style={{ padding: '8px' }}>
                      <input
                        aria-label={`Confirmed visual description for image ${idx + 1}`}
                        type="text"
                        className="form-input"
                        style={{ fontSize: '11px', padding: '4px 6px', marginBottom: '6px' }}
                        placeholder="Image description..."
                        value={img.confirmed_visual_description || ''}
                        onChange={e => handleUpdateImageDescription(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--color-danger)', width: '100%' }}
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-4)',
            marginTop: 'var(--space-2)'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSave('draft')}
              disabled={isSubmitting}
            >
              Save as Draft
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editProductId ? 'Update & Publish' : 'Publish Product to Feed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
