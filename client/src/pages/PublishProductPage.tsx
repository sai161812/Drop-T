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
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shirt,
  UtensilsCrossed,
  Cpu,
  Package,
  Bookmark,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Check
} from 'lucide-react';
import './PublishProductPage.css';

interface PublishProductPageProps {
  editProductId?: string;
  onNavigateBack: () => void;
  onPublishSuccess: (productId: string) => void;
}

const PRODUCT_FALLBACK_IMAGES: Record<string, string> = {
  'cloud ledger': '/images/products/cloud-ledger.jpg',
  'terracotta self-watering planter': '/images/products/terracotta-self-watering-planter.jpg',
  'handcrafted hemp tote bag': '/images/products/handcrafted-hemp-tote.jpg',
  'organic flax linen t-shirt (updated edition)': '/images/products/organic-flax-linen-shirt.jpg',
  'organic flax linen minimalist t-shirt': '/images/products/organic-flax-minimalist-tee.jpg',
  'country style artisan sourdough loaf': '/images/products/artisan-sourdough.jpg',
  'organic hemp everyday summer tee': '/images/products/sage-hemp-tee.jpg',
  'demo organic himalayan hemp summer tee': '/images/products/sage-hemp-tee.jpg',
  'smart water bottle': '/images/products/smart-water-bottle.jpg',
  'founder a published product': '/images/products/apparel-indigo-overshirt.jpg',
  'founder b published product': '/images/products/apparel-rust-tee.jpg',
  'injected product': '/images/products/apparel-charcoal-tee.jpg',
  'artisanal cold brew press & ceramic tumbler': '/images/products/cold-brew-press-tumbler.png'
};

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

  // UI status & view controls
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);
  const [categoryDetailsExpanded, setCategoryDetailsExpanded] = useState(true);
  const [previewTab, setPreviewTab] = useState<'feed' | 'detail'>('feed');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedTimestamp, setDraftSavedTimestamp] = useState<string | null>(null);
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

      if (status === 'draft') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDraftSavedTimestamp(timeStr);
      } else {
        onPublishSuccess(data.id || editProductId);
      }
    } catch (err: any) {
      setError(err.message || 'Network error while saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section completion calculations (subtle progress cue)
  const isBasicsComplete = Boolean(
    name.trim() && 
    summary.trim() && 
    intendedBuyer.trim() && 
    feedbackQuestion.trim()
  );

  const isDetailsComplete = Boolean(
    (images.length > 0 || visualDescription.trim())
  );

  const isLaunchComplete = Boolean(
    (priceNotSet || (price !== '' && Number(price) >= 0))
  );

  const completedStagesCount = [isBasicsComplete, isDetailsComplete, isLaunchComplete].filter(Boolean).length;
  const isReadyToPublish = isBasicsComplete && isDetailsComplete && isLaunchComplete;

  // Visual helper utilities
  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'clothing_accessories': return <Shirt size={13} />;
      case 'local_food_beverages': return <UtensilsCrossed size={13} />;
      case 'digital_products_services': return <Cpu size={13} />;
      default: return <Package size={13} />;
    }
  };

  const getStageBadgeInfo = (stg: ProductStage) => {
    switch (stg) {
      case 'launched': return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Launched' };
      case 'preparing_to_launch': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Preparing to Launch' };
      case 'prototype': return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', label: 'Prototype' };
      default: return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', label: 'Idea / Concept' };
    }
  };

  const formatCurrencyPrice = () => {
    if (priceNotSet) return 'Price TBD (Undecided)';
    if (price === '' || price === null || price === undefined) return 'Price not entered';
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${Number(price).toLocaleString()}`;
  };

  // Live preview image resolution:
  // 1. Explicitly uploaded image
  // 2. Matching demo product image when founder types a known product name (e.g. "Smart Water Bottle")
  // 3. Otherwise null (displays clean upload prompt placeholder)
  const uploadedImage = images[0]?.url;
  const matchedDemoImage = PRODUCT_FALLBACK_IMAGES[name.trim().toLowerCase()];
  const activePreviewImage = uploadedImage || matchedDemoImage || null;

  const stageBadge = getStageBadgeInfo(stage);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="publish-page-container">
      {/* Header & Stage Progress Bar */}
      <div className="publish-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '3px 9px' }}
                onClick={onNavigateBack}
              >
                <ArrowLeft size={13} /> Back
              </button>
              <span className="brand-badge" style={{ fontSize: '10px' }}>
                {editProductId ? 'EDIT PRODUCT' : 'NEW PRODUCT PROPOSAL'}
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '4px 0' }}>
              {editProductId ? 'Update Your Product Details' : 'Publish a Product to the Community'}
            </h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              Provide clear facts about your product. Manufacturing costs stay private in your Synthetic Lab.
            </p>
          </div>

          {/* Top Quick Actions & Subtle Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {draftSavedTimestamp && (
              <span style={{ fontSize: '11px', color: '#15803D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> Draft saved at {draftSavedTimestamp}
              </span>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSave('draft')}
              disabled={isSubmitting}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Save Draft
            </button>
          </div>
        </div>

        {/* Stage Stepper Tabs */}
        <div className="publish-stage-nav">
          <button
            type="button"
            className={`publish-stage-chip ${activeStage === 1 ? 'active' : ''} ${isBasicsComplete ? 'completed' : ''}`}
            onClick={() => {
              setActiveStage(1);
              document.getElementById('stage-basics')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {isBasicsComplete ? <CheckCircle2 size={13} color={activeStage === 1 ? '#FFF' : '#15803D'} /> : <span>1</span>}
            <span>Basics</span>
          </button>

          <button
            type="button"
            className={`publish-stage-chip ${activeStage === 2 ? 'active' : ''} ${isDetailsComplete ? 'completed' : ''}`}
            onClick={() => {
              setActiveStage(2);
              document.getElementById('stage-details')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {isDetailsComplete ? <CheckCircle2 size={13} color={activeStage === 2 ? '#FFF' : '#15803D'} /> : <span>2</span>}
            <span>Product Details & Images</span>
          </button>

          <button
            type="button"
            className={`publish-stage-chip ${activeStage === 3 ? 'active' : ''} ${isLaunchComplete ? 'completed' : ''}`}
            onClick={() => {
              setActiveStage(3);
              document.getElementById('stage-launch')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {isLaunchComplete ? <CheckCircle2 size={13} color={activeStage === 3 ? '#FFF' : '#15803D'} /> : <span>3</span>}
            <span>Audience & Launch</span>
          </button>

          <button
            type="button"
            className={`publish-stage-chip ${activeStage === 4 ? 'active' : ''} ${isReadyToPublish ? 'completed' : ''}`}
            onClick={() => {
              setActiveStage(4);
              document.getElementById('stage-publish')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {isReadyToPublish ? <CheckCircle2 size={13} color={activeStage === 4 ? '#FFF' : '#15803D'} /> : <span>4</span>}
            <span>Preview & Publish</span>
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {completedStagesCount} of 3 sections ready
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Form & Right Live Preview */}
      <div className="publish-layout">
        
        {/* Left Column: Form with Staged Sections */}
        <form onSubmit={e => { e.preventDefault(); handleSave('published'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div role="alert" style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
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

          {/* STAGE 1: BASICS */}
          <div id="stage-basics" className="publish-stage-section">
            <div className="publish-stage-heading-bar">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                1. Basic Product Information
              </h2>
              <span className={`publish-stage-status-badge ${isBasicsComplete ? 'complete' : 'pending'}`}>
                {isBasicsComplete ? '✓ Complete' : 'Required fields pending'}
              </span>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                placeholder="What it is, key features, and core benefit to the customer..."
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
                placeholder="e.g. Eco-conscious professionals (25–35) seeking breathable wardrobe essentials"
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
                placeholder="e.g. Would you buy this at ₹699, and what additional color would you prefer?"
                value={feedbackQuestion}
                onChange={e => setFeedbackQuestion(e.target.value)}
                required
              />
            </div>
          </div>

          {/* STAGE 2: PRODUCT DETAILS & IMAGES */}
          <div id="stage-details" className="publish-stage-section">
            <div className="publish-stage-heading-bar">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                2. Product Details & Visuals
              </h2>
              <span className={`publish-stage-status-badge ${isDetailsComplete ? 'complete' : 'pending'}`}>
                {isDetailsComplete ? '✓ Visuals added' : 'Visual description or image needed'}
              </span>
            </div>

            {/* Expandable Category Specifications Box */}
            <div className="publish-expandable-box">
              <div 
                className="publish-expandable-header"
                onClick={() => setCategoryDetailsExpanded(!categoryDetailsExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getCategoryIcon(category)}
                  <span>Category Details ({category.replace(/_/g, ' ')})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span>{categoryDetailsExpanded ? 'Collapse' : 'Expand'}</span>
                  {categoryDetailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {categoryDetailsExpanded && (
                <div className="publish-expandable-content">
                  <p className="form-help" style={{ margin: 0 }}>
                    Enter each known fact. A blank category field is saved explicitly as “Not decided yet”; it is not treated as a known product fact.
                  </p>

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
                        <select 
                          id="digital-pricing-type" 
                          className="form-select" 
                          value={digitalPricingType} 
                          onChange={e => setDigitalPricingType(e.target.value as 'one_time' | 'subscription' | 'not_decided')}
                        >
                          <option value="not_decided">Not decided yet</option>
                          <option value="one_time">One-time purchase</option>
                          <option value="subscription">Subscription</option>
                        </select>
                        {digitalPricingType === 'subscription' && (
                          <span className="form-help">Synthetic Lab finance will use the explicitly selected first operating period.</span>
                        )}
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
              )}
            </div>

            {/* Visual Description & Image Upload Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '6px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="visual-description">Visual / functional description (required if no image)</label>
                <textarea
                  id="visual-description"
                  className="form-textarea"
                  rows={2}
                  placeholder="Visual appearance, materials, silhouette, and key design details..."
                  value={visualDescription}
                  onChange={e => setVisualDescription(e.target.value)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Product Images (Up to 3)</label>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{images.length} of 3 uploaded</span>
                </div>

                {images.length < 3 && (
                  <div style={{ marginBottom: '12px' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: 'var(--color-surface-hover)'
                      }}>
                        <img src={img.url} alt={`Upload ${idx + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
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
            </div>
          </div>

          {/* STAGE 3: AUDIENCE & LAUNCH */}
          <div id="stage-launch" className="publish-stage-section">
            <div className="publish-stage-heading-bar">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                3. Launch Price & Fulfillment
              </h2>
              <span className={`publish-stage-status-badge ${isLaunchComplete ? 'complete' : 'pending'}`}>
                {isLaunchComplete ? '✓ Complete' : 'Pending price entry'}
              </span>
            </div>

            {/* Launch Price */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Target Launch Price</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={priceNotSet}
                    onChange={e => {
                      setPriceNotSet(e.target.checked);
                      if (e.target.checked) setPrice('');
                    }}
                  />
                  <span>Price not decided yet</span>
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

            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Served Markets */}
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

              {/* Fulfillment Mode */}
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
          </div>

          {/* STAGE 4: REVIEW & PUBLISH */}
          <div id="stage-publish" className="publish-stage-section">
            <div className="publish-stage-heading-bar">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                4. Readiness & Final Publication
              </h2>
              <span className={`publish-stage-status-badge ${isReadyToPublish ? 'complete' : 'pending'}`}>
                {isReadyToPublish ? '✓ Ready to publish' : 'Complete required items'}
              </span>
            </div>

            <div className="readiness-summary-card">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px' }}>
                Launch Publication Checklist
              </div>
              <div className="readiness-checklist-item">
                {name.trim() ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#B45309" />}
                <span className={name.trim() ? 'ready' : 'missing'}>
                  {name.trim() ? `Product Name: "${name}"` : 'Product Name is required'}
                </span>
              </div>
              <div className="readiness-checklist-item">
                {summary.trim() ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#B45309" />}
                <span className={summary.trim() ? 'ready' : 'missing'}>
                  {summary.trim() ? 'Product Summary provided' : 'Product Summary is required'}
                </span>
              </div>
              <div className="readiness-checklist-item">
                {intendedBuyer.trim() ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#B45309" />}
                <span className={intendedBuyer.trim() ? 'ready' : 'missing'}>
                  {intendedBuyer.trim() ? `Intended Buyer: "${intendedBuyer}"` : 'Intended Buyer description is required'}
                </span>
              </div>
              <div className="readiness-checklist-item">
                {feedbackQuestion.trim() ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#B45309" />}
                <span className={feedbackQuestion.trim() ? 'ready' : 'missing'}>
                  {feedbackQuestion.trim() ? 'Community Feedback Question set' : 'Feedback Question is required'}
                </span>
              </div>
              <div className="readiness-checklist-item">
                {images.length > 0 || visualDescription.trim() ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#B45309" />}
                <span className={images.length > 0 || visualDescription.trim() ? 'ready' : 'missing'}>
                  {images.length > 0 ? `${images.length} Image(s) uploaded` : visualDescription.trim() ? 'Visual description provided' : 'Product image or visual description is required'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-4)',
              marginTop: '4px'
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
          </div>
        </form>

        {/* Right Column: Sticky Live Product Preview */}
        <div className="live-preview-sidebar">
          <div className="live-preview-container">
            {/* Live Preview Header with Tabs */}
            <div className="live-preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#15803D', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Live Community Preview
                </span>
              </div>

              <div className="live-preview-tabs">
                <button
                  type="button"
                  className={`live-preview-tab-btn ${previewTab === 'feed' ? 'active' : ''}`}
                  onClick={() => setPreviewTab('feed')}
                >
                  Explore Feed Card
                </button>
                <button
                  type="button"
                  className={`live-preview-tab-btn ${previewTab === 'detail' ? 'active' : ''}`}
                  onClick={() => setPreviewTab('detail')}
                >
                  Detail View
                </button>
              </div>
            </div>

            {/* Explore Feed Card Mode */}
            {previewTab === 'feed' && (
              <div className="live-card-mockup">
                {/* Hero Product Image or Upload Placeholder */}
                <div className="live-card-hero-image">
                  {activePreviewImage ? (
                    <img
                      src={activePreviewImage}
                      alt={images[0]?.confirmed_visual_description || `${name || 'Product'} preview`}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: 'var(--color-text-muted)',
                      padding: '20px 16px',
                      textAlign: 'center',
                      width: '100%',
                      height: '100%',
                      background: 'var(--color-surface-subtle)'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-surface)',
                        border: '1px dashed var(--color-border-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)'
                      }}>
                        <Upload size={18} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        No product image uploaded yet
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', maxWidth: '200px' }}>
                        Upload in Section 2 or type a demo product name
                      </div>
                    </div>
                  )}
                  
                  {/* Stage Badge */}
                  <div
                    className="live-card-badge-stage"
                    style={{
                      background: stageBadge.bg,
                      color: stageBadge.text,
                      border: `1px solid ${stageBadge.border}`
                    }}
                  >
                    {stage.replace(/_/g, ' ')}
                  </div>

                  {/* Category Badge */}
                  <div className="live-card-badge-cat">
                    {getCategoryIcon(category)}
                    <span>{category.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="live-card-body">
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                      Your Startup
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                      {name || 'Untitled Product Proposal'}
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.4,
                      margin: '0 0 10px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {summary || 'Product summary will appear here explaining what makes this product uniquely valuable...'}
                    </p>
                  </div>

                  {/* Price & Target Buyer Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {formatCurrencyPrice()}
                    </div>
                    <div className="live-card-chip" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {intendedBuyer ? `Target: ${intendedBuyer}` : 'All buyers'}
                    </div>
                  </div>

                  {/* Mock Action Bar */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                    <div style={{
                      flex: 1,
                      padding: '6px',
                      background: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <Bookmark size={11} /> Save
                    </div>
                    <div style={{
                      flex: 1.5,
                      padding: '6px',
                      background: '#18181B',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      textAlign: 'center',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <MessageSquare size={11} /> Give Feedback
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail View Mode */}
            {previewTab === 'detail' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activePreviewImage ? (
                  <div style={{ height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#F4F4F5', border: '1px solid var(--color-border)' }}>
                    <img
                      src={activePreviewImage}
                      alt="Detail view preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    height: '130px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-subtle)',
                    border: '1px dashed var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: 'var(--color-text-muted)'
                  }}>
                    <Upload size={16} />
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>No image uploaded yet</span>
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>
                    {name || 'Untitled Product Proposal'}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-full)', background: stageBadge.bg, color: stageBadge.text }}>
                      {stage.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>
                      {category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {summary || 'Detailed summary of the product proposal...'}
                  </p>
                </div>

                {/* Feedback Question Banner */}
                <div className="live-card-question-box">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HelpCircle size={12} /> Founder's Community Question
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                    "{feedbackQuestion || 'Would you buy this product at our target launch price?'}"
                  </div>
                </div>

                {/* Key Facts Summary */}
                <div style={{ background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Launch Price:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrencyPrice()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Served Markets:</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{marketsNotDecided ? 'Not decided yet' : marketInput || 'Not specified'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Fulfillment:</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{fulfillmentNotDecided ? 'Not decided yet' : fulfillmentMode || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            )}

            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', margin: '14px 0 0 0' }}>
              ● Live interactive preview updates instantly as you edit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
