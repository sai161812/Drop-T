import React from 'react';
import { Package, Upload, Image as ImageIcon, Check } from 'lucide-react';
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
    const file = e.target.files[0];
    const uploaded = await onUploadImage(file);
    if (uploaded) {
      const currentImages = optionA.images || [];
      onChangeOptionA({ ...optionA, images: [...currentImages, uploaded] });
    }
    e.target.value = '';
  };

  const handleUpdateImageDescription = (imgId: string, desc: string) => {
    const currentImages = optionA.images || [];
    const updated = currentImages.map(img => 
      img.id === imgId ? { ...img, confirmed_visual_description: desc } : img
    );
    onChangeOptionA({ ...optionA, images: updated });
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

      {/* Tailored Domain Fields */}
      <div style={{ background: 'var(--color-surface-subtle)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border-subtle)' }}>
        <h3 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
          {domainId === 'clothing_accessories' && 'Apparel Specifications'}
          {domainId === 'local_food_beverages' && 'Food / Beverage Specifications'}
          {domainId === 'digital_products_services' && 'Digital Offering Specifications'}
        </h3>

        {domainId === 'clothing_accessories' && (
          <div className="form-row">
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
            </div>
          </div>
        )}

        {domainId === 'local_food_beverages' && (
          <div className="form-row">
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
            <div className="form-group">
              <label className="form-label">Ingredients / Dietary Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vegan, 100% Arabica, Contains nuts"
                value={domainSpecificData?.ingredients_allergens || ''}
                onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, ingredients_allergens: e.target.value })}
              />
            </div>
          </div>
        )}

        {domainId === 'digital_products_services' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supported Platform / Languages</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Web / iOS / Android / English"
                value={domainSpecificData?.platform_language || ''}
                onChange={e => onChangeDomainSpecificData({ ...domainSpecificData, platform_language: e.target.value })}
              />
            </div>
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
            </div>
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
          <span className="form-help">
            Upload images shown to real evaluators. A confirmed visual description ensures simulated personas understand the visual details accurately.
          </span>

          <label className="image-upload-dropzone" style={{ marginTop: '8px', display: 'block' }}>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Upload size={18} style={{ margin: '0 auto 4px auto', display: 'block', color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Click to attach image (PNG, JPEG, WEBP up to 5MB)
            </span>
          </label>

          {optionA.images && optionA.images.length > 0 && (
            <div className="image-preview-grid">
              {optionA.images.map((img) => (
                <div key={img.id} className="image-preview-card">
                  <img src={img.url} alt={img.filename} className="image-preview-img" />
                  <div className="image-preview-meta">
                    <div style={{ fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {img.filename}
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
