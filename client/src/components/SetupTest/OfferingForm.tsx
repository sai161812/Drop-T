import React from 'react';
import { Package, Upload, Image as ImageIcon, Check, X, Info } from 'lucide-react';
import { DomainId, ImageMetadata } from '@droptest/shared';
import { OptionAData } from './AlternativeBForm.js';

interface OfferingFormProps {
  domainId: DomainId;
  title: string;
  onChangeTitle: (val: string) => void;
  shortValueProp: string;
  onChangeShortValueProp: (val: string) => void;
  description: string;
  onChangeDescription: (val: string) => void;
  currency: string;
  onChangeCurrency: (val: string) => void;
  period: string;
  onChangePeriod: (val: string) => void;
  domainSpecificData: any;
  onChangeDomainSpecificData: (data: any) => void;
  optionA: OptionAData;
  onChangeOptionA: (opt: OptionAData) => void;
  audienceMarkets: string[];
  onUploadImage: (file: File) => Promise<ImageMetadata | null>;
  validationErrors?: Record<string, string>;
}

export const OfferingForm: React.FC<OfferingFormProps> = ({
  domainId,
  title,
  onChangeTitle,
  shortValueProp,
  onChangeShortValueProp,
  description,
  onChangeDescription,
  currency,
  onChangeCurrency,
  period,
  onChangePeriod,
  domainSpecificData,
  onChangeDomainSpecificData,
  optionA,
  onChangeOptionA,
  audienceMarkets,
  onUploadImage,
  validationErrors = {}
}) => {
  const handleMarketToggle = (market: string) => {
    const current = optionA.served_markets || [];
    if (current.includes(market)) {
      onChangeOptionA({ ...optionA, served_markets: current.filter(m => m !== market) });
    } else {
      onChangeOptionA({ ...optionA, served_markets: [...current, market] });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if ((optionA.images || []).length >= 3) {
      alert('Maximum 3 images allowed per option.');
      return;
    }
    const file = e.target.files[0];
    const uploaded = await onUploadImage(file);
    if (uploaded) {
      const currentImages = optionA.images || [];
      onChangeOptionA({ ...optionA, images: [...currentImages, uploaded] });
    }
    e.target.value = '';
  };

  const handleRemoveImage = (imgId: string) => {
    const currentImages = optionA.images || [];
    onChangeOptionA({ ...optionA, images: currentImages.filter(img => img.id !== imgId) });
  };

  const handleUpdateImageDescription = (imgId: string, desc: string) => {
    const currentImages = optionA.images || [];
    const updated = currentImages.map(img => 
      img.id === imgId ? { ...img, confirmed_visual_description: desc } : img
    );
    onChangeOptionA({ ...optionA, images: updated });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="workbench-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span className="card-step-badge">3</span>
            <span>Core Offering & Baseline (Option A)</span>
          </h2>
          <p className="card-description">
            Describe the baseline product/service details. The simulation evaluates this baseline before comparing with Alternative B.
          </p>
        </div>
      </div>

      {/* Core Offering Metadata */}
      <div className="form-group">
        <label className="form-label" htmlFor="offering-title">
          <span>Offering Title</span>
          <span className="required">*</span>
        </label>
        <input
          id="offering-title"
          type="text"
          className="form-input"
          placeholder="e.g. Organic Handloom Linen Shirt"
          value={title}
          onChange={e => onChangeTitle(e.target.value)}
        />
        {validationErrors['test.title'] && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {validationErrors['test.title']}
          </span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="value-prop">
          <span>Short Value Proposition</span>
          <span className="required">*</span>
        </label>
        <input
          id="value-prop"
          type="text"
          className="form-input"
          placeholder="e.g. Breathable organic linen shirt handcrafted for warm humid climates"
          value={shortValueProp}
          onChange={e => onChangeShortValueProp(e.target.value)}
        />
        {validationErrors['offering.short_value_prop'] && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {validationErrors['offering.short_value_prop']}
          </span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="full-description">
          <span>Plain-Language Description</span>
          <span className="required">*</span>
        </label>
        <textarea
          id="full-description"
          className="form-textarea"
          placeholder="e.g. Made from 100% natural organic flax linen with natural horn buttons and relaxed fit. Machine washable and pre-shrunk."
          value={description}
          onChange={e => onChangeDescription(e.target.value)}
        />
        <span className="form-help">Do not rely on images alone; specify key physical/functional attributes in plain text.</span>
        {validationErrors['offering.description'] && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {validationErrors['offering.description']}
          </span>
        )}
      </div>

      {/* Currency & Stated Period */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="currency-input">
            <span>Currency Code</span>
            <span className="required">*</span>
          </label>
          <input
            id="currency-input"
            type="text"
            className="form-input"
            placeholder="e.g. INR, USD, EUR"
            value={currency}
            onChange={e => onChangeCurrency(e.target.value.toUpperCase())}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="period-input">
            <span>Stated Time Period / Batch Scope</span>
            <span className="required">*</span>
          </label>
          <select
            id="period-input"
            className="form-select"
            value={period}
            onChange={e => onChangePeriod(e.target.value)}
          >
            <option value="launch_batch">Initial Launch Batch (1 batch)</option>
            <option value="first_month">First Month Operation</option>
            <option value="single_event">Single Scheduled Drop</option>
            <option value="per_unit">Per Individual Sale</option>
          </select>
        </div>
      </div>

      {/* Tailored Domain Fields (Strictly matching active domain) */}
      <div style={{ background: 'var(--color-surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border-subtle)' }}>
        <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          {domainId === 'clothing_accessories' && 'Apparel Specifications'}
          {domainId === 'local_food_beverages' && 'Food / Beverage Specifications'}
          {domainId === 'digital_products_services' && 'Digital Offering Specifications'}
          {domainId === 'other' && 'Founder-Described Specifications'}
        </h3>

        {domainId === 'clothing_accessories' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Item Type</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Linen Shirt, Tote Bag, Jacket"
                  value={domainSpecificData?.item_type || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, item_type: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Material Composition</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100% French Organic Flax Linen"
                  value={domainSpecificData?.material || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, material: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Available Sizes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. S, M, L, XL, XXL"
                value={Array.isArray(domainSpecificData?.sizes) ? domainSpecificData.sizes.join(', ') : (domainSpecificData?.sizes || '')}
                onChange={e => onChangeDomainSpecificData({ 
                  ...domainSpecificData, 
                  sizes: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                })}
              />
              <span className="form-help">Comma-separated list of sizes.</span>
            </div>
          </>
        )}

        {domainId === 'local_food_beverages' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cold Brew Bottle, Sourdough Loaf"
                  value={domainSpecificData?.item_name || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, item_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Portion / Package Size</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 500ml glass bottle, 4-pack"
                  value={domainSpecificData?.portion || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, portion: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ingredients / Allergens</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 100% Arabica, Gluten-free, Contains tree nuts"
                  value={domainSpecificData?.ingredients_allergens || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, ingredients_allergens: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Availability Window</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Saturday & Sunday mornings (8 AM - 12 PM)"
                  value={domainSpecificData?.availability_window || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, availability_window: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {domainId === 'digital_products_services' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Core Use Case</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Automated PDF receipt extraction into spreadsheets"
                  value={domainSpecificData?.core_use_case || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, core_use_case: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Supported Platform / Languages</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Web App / Chrome Extension / English"
                  value={domainSpecificData?.platform_language || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, platform_language: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pricing Model</label>
                <select
                  className="form-select"
                  value={domainSpecificData?.pricing_type || 'one_time'}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, pricing_type: e.target.value })}
                >
                  <option value="one_time">One-time purchase (Perpetual)</option>
                  <option value="subscription">Recurring Subscription (First-period calculation)</option>
                </select>
                {domainSpecificData?.pricing_type === 'subscription' && (
                  <span className="form-help" style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    Calculations apply to the first billing period only. Churn or lifetime value is not assumed.
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Service / Support Availability</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 24-hour turnaround email support"
                  value={domainSpecificData?.service_support_availability || ''}
                  onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, service_support_availability: e.target.value })}
                />
              </div>
            </div>
          </>
        )}

        {domainId === 'other' && (
          <div className="form-group">
            <label className="form-label" htmlFor="other-specification">Product specifications</label>
            <textarea
              id="other-specification"
              className="form-textarea"
              placeholder="Describe the product facts and intended function without assuming another category."
              value={domainSpecificData?.specification_text || ''}
              onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, specification_text: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Option A Baseline Fields */}
      <div className="option-panel">
        <span className="option-badge option-badge-a">
          <Package size={12} />
          <span>Option A (Baseline)</span>
        </span>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="option-a-name">
              <span>Baseline Name / Label</span>
              <span className="required">*</span>
            </label>
            <input
              id="option-a-name"
              type="text"
              className="form-input"
              value={optionA.name}
              onChange={e => onChangeOptionA({ ...optionA, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="option-a-price">
              <span>Price ({currency})</span>
              <span className="required">*</span>
            </label>
            <input
              id="option-a-price"
              type="number"
              min="0"
              step="any"
              className="form-input tabular-nums"
              value={isNaN(optionA.price) ? '' : optionA.price}
              onChange={e => onChangeOptionA({ ...optionA, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="option-a-msg">
            <span>Primary Message / Positioning</span>
            <span className="required">*</span>
          </label>
          <input
            id="option-a-msg"
            type="text"
            className="form-input"
            value={optionA.primary_message}
            onChange={e => onChangeOptionA({ ...optionA, primary_message: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Served Markets (Availability in Option A)</span>
            <span className="required">*</span>
          </label>
          <span className="form-help" style={{ marginBottom: '6px' }}>
            Select which audience markets are explicitly reachable under Option A:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {audienceMarkets.length === 0 ? (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Please add audience markets in Step 2 above.
              </span>
            ) : (
              audienceMarkets.map((market, idx) => {
                const isSelected = (optionA.served_markets || []).includes(market);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMarketToggle(market)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: isSelected ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: isSelected ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-xs)',
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{market}</span>
                  </button>
                );
              })
            )}
          </div>
          {validationErrors['option_a.served_markets'] && (
            <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
              {validationErrors['option_a.served_markets']}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="option-a-fulfillment">
            <span>Fulfillment Mode</span>
            <span className="required">*</span>
          </label>
          <input
            id="option-a-fulfillment"
            type="text"
            className="form-input"
            placeholder="e.g. Standard postal shipping, Local neighborhood pickup, Instant digital access"
            value={optionA.fulfillment_mode}
            onChange={e => onChangeOptionA({ ...optionA, fulfillment_mode: e.target.value })}
          />
        </div>

        {/* Local Image Uploads with Confirmed Visual Description */}
        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <label className="form-label">
            <ImageIcon size={14} />
            <span>Product Imagery & Visual Descriptions (0 to 3 images)</span>
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', marginBottom: '8px' }}>
            <Info size={13} style={{ flexShrink: 0 }} />
            <span>Image attached; describe what it shows for the simulation. Do not assume model vision analysis without confirmed notes.</span>
          </div>

          {(optionA.images || []).length < 3 && (
            <label className="image-upload-dropzone" style={{ marginTop: '4px', display: 'block' }}>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <Upload size={18} style={{ margin: '0 auto 4px auto', display: 'block', color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Click to attach Option A image (PNG, JPEG, WEBP up to 5MB, {(optionA.images || []).length}/3 attached)
              </span>
            </label>
          )}

          {optionA.images && optionA.images.length > 0 && (
            <div className="image-preview-grid">
              {optionA.images.map((img) => (
                <div key={img.id} className="image-preview-card">
                  <div style={{ position: 'relative' }}>
                    <img src={img.url} alt={img.filename} className="image-preview-img" />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => handleRemoveImage(img.id)}
                      aria-label={`Remove image ${img.filename}`}
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="image-preview-meta">
                    <div style={{ fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {img.filename}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(img.size_bytes)}
                    </div>
                    <textarea
                      placeholder="Confirmed visual description (what this image shows)..."
                      style={{
                        width: '100%',
                        fontSize: '11px',
                        padding: '3px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '3px',
                        marginTop: '4px',
                        height: '45px'
                      }}
                      value={img.confirmed_visual_description || ''}
                      onChange={e => handleUpdateImageDescription(img.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
