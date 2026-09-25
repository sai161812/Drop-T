import React from 'react';
import { Sliders, Sparkles, Check, Upload, Image as ImageIcon, X, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { PrimaryLever, PRIMARY_LEVERS, PRIMARY_LEVER_LABELS, ImageMetadata } from '@droptest/shared';

export interface OptionBData {
  name: string;
  price: number;
  primary_message: string;
  served_markets: string[];
  fulfillment_mode: string;
  images: ImageMetadata[];
  variable_cost_per_sale?: number;
  fixed_launch_cost?: number;
  capacity_units?: number;
}

export interface OptionAData {
  name: string;
  price: number;
  primary_message: string;
  served_markets: string[];
  fulfillment_mode: string;
  images: ImageMetadata[];
  variable_cost_per_sale?: number;
  fixed_launch_cost?: number;
  capacity_units?: number;
}

interface AlternativeBFormProps {
  comparisonLever: PrimaryLever;
  onChangeComparisonLever: (lever: PrimaryLever) => void;
  optionB: OptionBData;
  onChangeOptionB: (opt: OptionBData) => void;
  optionA: OptionAData;
  currency: string;
  audienceMarkets: string[];
  onUploadImage: (file: File) => Promise<ImageMetadata | null>;
  validationErrors?: Record<string, string>;
}

export const AlternativeBForm: React.FC<AlternativeBFormProps> = ({
  comparisonLever,
  onChangeComparisonLever,
  optionB,
  onChangeOptionB,
  optionA,
  currency,
  audienceMarkets,
  onUploadImage,
  validationErrors = {}
}) => {
  const handleMarketToggle = (market: string) => {
    const current = optionB.served_markets || [];
    if (current.includes(market)) {
      onChangeOptionB({ ...optionB, served_markets: current.filter(m => m !== market) });
    } else {
      onChangeOptionB({ ...optionB, served_markets: [...current, market] });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if ((optionB.images || []).length >= 3) {
      alert('Maximum 3 images allowed per option.');
      return;
    }
    const file = e.target.files[0];
    const uploaded = await onUploadImage(file);
    if (uploaded) {
      const currentImages = optionB.images || [];
      onChangeOptionB({ ...optionB, images: [...currentImages, uploaded] });
    }
    e.target.value = '';
  };

  const handleRemoveImage = (imgId: string) => {
    const currentImages = optionB.images || [];
    onChangeOptionB({ ...optionB, images: currentImages.filter(img => img.id !== imgId) });
  };

  const handleUpdateImageDescription = (imgId: string, desc: string) => {
    const currentImages = optionB.images || [];
    const updated = currentImages.map(img => 
      img.id === imgId ? { ...img, confirmed_visual_description: desc } : img
    );
    onChangeOptionB({ ...optionB, images: updated });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Diff Calculations
  const isPriceDiff = optionA.price !== optionB.price;
  const isMessageDiff = optionA.primary_message !== optionB.primary_message;
  const isMarketsDiff = JSON.stringify(optionA.served_markets.slice().sort()) !== JSON.stringify(optionB.served_markets.slice().sort());
  const isCostDiff = optionA.variable_cost_per_sale !== undefined && 
                     optionB.variable_cost_per_sale !== undefined && 
                     optionA.variable_cost_per_sale !== optionB.variable_cost_per_sale;

  return (
    <div className="workbench-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span>Comparison Lever & Alternative (Option B)</span>
          </h2>
          <p className="card-description">
            Choose exactly one primary decision lever to test against Option A using the same 50-profile panel.
          </p>
        </div>
      </div>

      {/* Primary Lever Selector */}
      <div className="form-group">
        <label className="form-label">
          <Sliders size={14} />
          <span>Primary Comparison Lever</span>
          <span className="required">*</span>
        </label>
        <div className="lever-selector">
          {PRIMARY_LEVERS.map(lever => (
            <button
              key={lever}
              type="button"
              className={`lever-btn ${comparisonLever === lever ? 'active' : ''}`}
              onClick={() => onChangeComparisonLever(lever)}
            >
              {PRIMARY_LEVER_LABELS[lever]}
            </button>
          ))}
        </div>
        <span className="form-help">
          Compare one main change. Simulated differences are hypotheses to check with real people.
        </span>
      </div>

      {/* Exact A -> B Diff Summary Box */}
      <div style={{ background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          <ArrowRight size={14} />
          <span>Exact A &rarr; B Comparison Diff Summary:</span>
        </div>
        
        <ul style={{ listStyle: 'none', paddingLeft: '4px', fontSize: 'var(--font-size-xs)', lineHeight: '1.6' }}>
          {comparisonLever === 'price' && (
            <li className="tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              <strong>Price:</strong> Baseline {currency} {optionA.price} &rarr; Alternative {currency} {optionB.price} {isPriceDiff && `(${(optionB.price - optionA.price) >= 0 ? `+${optionB.price - optionA.price}` : optionB.price - optionA.price})`}
            </li>
          )}
          {comparisonLever === 'message' && (
            <li>
              <strong>Primary Message:</strong> "{optionA.primary_message}" &rarr; "{optionB.primary_message}"
            </li>
          )}
          {comparisonLever === 'served_markets' && (
            <li>
              <strong>Served Markets:</strong> [{optionA.served_markets.join(', ')}] &rarr; [{optionB.served_markets.join(', ')}] {isMarketsDiff ? '(Modified coverage)' : '(Unchanged coverage)'}
            </li>
          )}
          {comparisonLever === 'creative' && (
            <li>
              <strong>Creative:</strong> Option A ({(optionA.images || []).length} images) vs Option B ({(optionB.images || []).length} images) with confirmed visual descriptions.
            </li>
          )}

          {/* Linked Cost Disclosure */}
          {isCostDiff && (
            <li style={{ marginTop: '4px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>Linked Variable Cost Change: {currency} {optionA.variable_cost_per_sale} &rarr; {currency} {optionB.variable_cost_per_sale} per sale</span>
            </li>
          )}
        </ul>
      </div>

      {/* Option B Card */}
      <div className={`option-panel ${comparisonLever ? 'diff-target' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span className="option-badge option-badge-b">
            <Sparkles size={12} />
            <span>Option B (Alternative)</span>
          </span>

          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Active Lever: <strong>{PRIMARY_LEVER_LABELS[comparisonLever]}</strong>
          </span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="option-b-name">
              <span>Alternative Name / Label</span>
              <span className="required">*</span>
            </label>
            <input
              id="option-b-name"
              type="text"
              className="form-input"
              value={optionB.name}
              onChange={e => onChangeOptionB({ ...optionB, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="option-b-price" style={{ color: comparisonLever === 'price' ? 'var(--color-accent)' : 'inherit' }}>
              <span>Price ({currency})</span>
              <span className="required">*</span>
              {comparisonLever === 'price' && <span style={{ fontSize: '10px', background: '#FEF08A', padding: '1px 4px', borderRadius: '2px', marginLeft: '4px' }}>Active Diff</span>}
            </label>
            <input
              id="option-b-price"
              type="number"
              min="0"
              step="any"
              className="form-input tabular-nums"
              style={{ borderColor: comparisonLever === 'price' && isPriceDiff ? 'var(--color-accent)' : undefined }}
              value={isNaN(optionB.price) ? '' : optionB.price}
              onChange={e => onChangeOptionB({ ...optionB, price: parseFloat(e.target.value) || 0 })}
            />
            {isPriceDiff && (
              <span className="form-help tabular-nums">
                Baseline A: {currency} {optionA.price} &rarr; Option B: {currency} {optionB.price} ({(optionB.price - optionA.price) >= 0 ? `+${optionB.price - optionA.price}` : optionB.price - optionA.price})
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="option-b-msg" style={{ color: comparisonLever === 'message' ? 'var(--color-accent)' : 'inherit' }}>
            <span>Primary Message / Positioning</span>
            <span className="required">*</span>
            {comparisonLever === 'message' && <span style={{ fontSize: '10px', background: '#FEF08A', padding: '1px 4px', borderRadius: '2px', marginLeft: '4px' }}>Active Diff</span>}
          </label>
          <input
            id="option-b-msg"
            type="text"
            className="form-input"
            style={{ borderColor: comparisonLever === 'message' && isMessageDiff ? 'var(--color-accent)' : undefined }}
            value={optionB.primary_message}
            onChange={e => onChangeOptionB({ ...optionB, primary_message: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: comparisonLever === 'served_markets' ? 'var(--color-accent)' : 'inherit' }}>
            <span>Served Markets (Availability in Option B)</span>
            <span className="required">*</span>
            {comparisonLever === 'served_markets' && <span style={{ fontSize: '10px', background: '#FEF08A', padding: '1px 4px', borderRadius: '2px', marginLeft: '4px' }}>Active Diff</span>}
          </label>
          <span className="form-help" style={{ marginBottom: '6px' }}>
            {comparisonLever === 'served_markets' 
              ? 'Change served markets to test geographic expansion or focus.'
              : 'Keep aligned or adjust coverage for Option B:'}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {audienceMarkets.length === 0 ? (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Please configure audience markets in Step 2.
              </span>
            ) : (
              audienceMarkets.map((market, idx) => {
                const isSelected = (optionB.served_markets || []).includes(market);
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
          {validationErrors['option_b.served_markets'] && (
            <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
              {validationErrors['option_b.served_markets']}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="option-b-fulfillment">
            <span>Fulfillment Mode</span>
            <span className="required">*</span>
          </label>
          <input
            id="option-b-fulfillment"
            type="text"
            className="form-input"
            value={optionB.fulfillment_mode}
            onChange={e => onChangeOptionB({ ...optionB, fulfillment_mode: e.target.value })}
          />
        </div>

        {/* Option B Imagery (Relevant for Creative Lever) */}
        {comparisonLever === 'creative' && (
          <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
            <label className="form-label">
              <ImageIcon size={14} />
              <span>Alternative Creative / Packaging Images (0 to 3 images)</span>
              <span className="required">*</span>
            </label>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', marginBottom: '8px' }}>
              <Info size={13} style={{ flexShrink: 0 }} />
              <span>Testing creative lever: Confirmed visual descriptions are mandatory for Option B images.</span>
            </div>

            {(optionB.images || []).length < 3 && (
              <label className="image-upload-dropzone" style={{ marginTop: '4px', display: 'block' }}>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <Upload size={18} style={{ margin: '0 auto 4px auto', display: 'block', color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  Click to attach Option B image (PNG, JPEG, WEBP up to 5MB, {(optionB.images || []).length}/3 attached)
                </span>
              </label>
            )}

            {optionB.images && optionB.images.length > 0 && (
              <div className="image-preview-grid">
                {optionB.images.map((img) => (
                  <div key={img.id} className="image-preview-card">
                    <div style={{ position: 'relative' }}>
                      <img src={img.url} alt={img.filename} className="image-preview-img" />
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label={`Remove Option B image ${img.filename}`}
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
                        placeholder="Confirmed visual description (Required for creative lever)..."
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
            {validationErrors['option_b.images'] && (
              <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
                {validationErrors['option_b.images']}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
