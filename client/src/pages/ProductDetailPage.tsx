import React, { useState, useEffect } from 'react';
import { ProductPublicDetail, ProductCategory } from '@droptest/shared';
import { useAuth } from '../context/AuthContext.js';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  MessageSquare, 
  Edit3, 
  FlaskConical,
  Shirt, 
  UtensilsCrossed, 
  Cpu, 
  Package, 
  MapPin, 
  Truck, 
  Check
} from 'lucide-react';

interface ProductDetailPageProps {
  productId: string;
  onNavigateBack: () => void;
  onEditProduct: (productId: string) => void;
  onOpenSyntheticLab: (productId: string) => void;
  onPromptAuth?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigateBack,
  onEditProduct,
  onOpenSyntheticLab,
  onPromptAuth
}) => {
  const { user, token } = useAuth();
  const [product, setProduct] = useState<ProductPublicDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Engagement states
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(0);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Product not found or unavailable');
      const data: ProductPublicDetail = await res.json();
      setProduct(data);
      setIsSaved(Boolean(data.is_saved));
      setSaveCount(data.save_count || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, token]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${productId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isOwner = user && product && user.id === product.owner_id;

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'clothing_accessories': return <Shirt size={16} />;
      case 'local_food_beverages': return <UtensilsCrossed size={16} />;
      case 'digital_products_services': return <Cpu size={16} />;
      default: return <Package size={16} />;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'launched': return { bg: '#DCFCE7', text: '#15803D', label: 'Launched' };
      case 'preparing_to_launch': return { bg: '#FEF3C7', text: '#B45309', label: 'Preparing to Launch' };
      case 'prototype': return { bg: '#E0E7FF', text: '#4338CA', label: 'Prototype' };
      default: return { bg: '#F3F4F6', text: '#4B5563', label: 'Idea / Concept' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
        <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }} onClick={onNavigateBack}>
          <ArrowLeft size={14} /> Back to Explore
        </button>
        <div role="alert" style={{ background: 'var(--color-danger-bg)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', color: 'var(--color-danger)', textAlign: 'center' }}>
          <h3>Product Not Found</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>{error || 'This product does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const stageStyle = getStageBadge(product.stage);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      {/* Top Navigation & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={onNavigateBack}
        >
          <ArrowLeft size={14} /> Back to Feed
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            onClick={handleCopyLink}
          >
            {copiedLink ? <Check size={14} color="var(--color-success)" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Share URL'}</span>
          </button>

          {/* Owner Actions */}
          {isOwner && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                onClick={() => onEditProduct(product.id)}
              >
                <Edit3 size={14} /> Edit Details
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                onClick={() => onOpenSyntheticLab(product.id)}
              >
                <FlaskConical size={14} /> Private Synthetic Lab
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Product Card */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        display: 'grid',
        gridTemplateColumns: product.images && product.images.length > 0 ? '1fr 1fr' : '1fr',
        gap: '0'
      }}>
        {/* Left: Images Gallery */}
        {product.images && product.images.length > 0 && (
          <div style={{ background: 'var(--color-surface-hover)', padding: 'var(--space-5)', borderRight: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '100%', height: '340px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <img
                src={product.images[0].url}
                alt={product.images[0].confirmed_visual_description || product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {product.images[0].confirmed_visual_description && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                <strong>Visual Description:</strong> {product.images[0].confirmed_visual_description}
              </div>
            )}
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {product.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={`Thumbnail ${idx + 2}`}
                    style={{ width: '70px', height: '70px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--color-border)' }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right: Product Details & Overview */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Stage and Category Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{
                background: stageStyle.bg,
                color: stageStyle.text,
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {stageStyle.label}
              </span>
              <span style={{
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {getCategoryIcon(product.category)}
                <span>{product.category.replace(/_/g, ' ')}</span>
              </span>
            </div>

            {/* Startup Info */}
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
              {product.owner.startup_name || product.owner.display_name}
            </div>

            {/* Product Title */}
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '10px', lineHeight: '1.25' }}>
              {product.name}
            </h1>

            {/* Price Tag */}
            <div style={{ marginBottom: '16px' }}>
              {product.price !== null ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {product.currency === 'INR' ? '₹' : product.currency + ' '}{product.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>target launch price</span>
                </div>
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
                  Launch price not decided yet
                </span>
              )}
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Product Overview
              </h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: '1.55' }}>
                {product.summary}
              </p>
            </div>

            {/* Intended Buyer */}
            <div style={{ marginBottom: '20px', background: 'var(--color-primary-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '3px' }}>
                🎯 Intended Audience / Buyer:
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                {product.intended_buyer}
              </div>
            </div>
          </div>

          {/* Engagement Footer */}
          <div style={{
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bookmark size={15} /> <strong>{saveCount}</strong> saves
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={15} /> <strong>{product.feedback_summary.total}</strong> community responses
              </span>
            </div>

            {!isOwner && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => {
                    if (!user) onPromptAuth?.();
                    else {
                      setIsSaved(!isSaved);
                      setSaveCount(prev => isSaved ? prev - 1 : prev + 1);
                    }
                  }}
                >
                  <Bookmark size={14} /> {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specifications & Availability Breakdown */}
      <div style={{
        marginTop: 'var(--space-6)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-4)'
      }}>
        {/* Category Details Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getCategoryIcon(product.category)}
            <span>Category Specifications ({product.category.replace(/_/g, ' ')})</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {product.category === 'clothing_accessories' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Material / Fabric:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.category_data?.material || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Fit / Style:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.category_data?.fit || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Available Sizes:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {Array.isArray(product.category_data?.sizes) ? product.category_data.sizes.join(', ') : product.category_data?.sizes || 'Standard'}
                  </span>
                </div>
              </>
            )}

            {product.category === 'local_food_beverages' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Portion / Weight:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.category_data?.portion || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Ingredients & Allergens:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: '240px', textAlign: 'right' }}>
                    {product.category_data?.ingredients_allergens || 'Not specified'}
                  </span>
                </div>
              </>
            )}

            {product.category === 'digital_products_services' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Platform / Language:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.category_data?.platform_language || 'Web'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Core Function:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.category_data?.core_use_case || 'Productivity'}</span>
                </div>
              </>
            )}

            {product.category === 'other' && (
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Specifications:</span>
                <p style={{ marginTop: '4px', fontWeight: 500 }}>{product.category_data?.specs || 'None provided'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Availability & Delivery Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} />
            <span>Availability & Fulfillment</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Served Markets / Regions:</div>
              {product.availability_markets === 'not_decided' ? (
                <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Not decided yet</span>
              ) : Array.isArray(product.availability_markets) && product.availability_markets.length > 0 ? (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {product.availability_markets.map((m, i) => (
                    <span key={i} style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500 }}>
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <span>All Online</span>
              )}
            </div>

            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Fulfillment Mode:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                <Truck size={14} color="var(--color-primary)" />
                <span>{product.fulfillment_mode === 'not_decided' ? 'Not decided yet' : product.fulfillment_mode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Founder Question & Feedback Box */}
      <div style={{
        marginTop: 'var(--space-6)',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-primary-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <MessageSquare size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Founder's Question for You
          </h3>
        </div>
        <p style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px', background: 'var(--color-surface-hover)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
          "{product.feedback_question}"
        </p>

        {/* Structured Feedback Summary Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <strong>Community Sentiment:</strong> {product.feedback_summary.total} Total ({product.feedback_summary.counts.yes} Yes / {product.feedback_summary.counts.maybe} Maybe / {product.feedback_summary.counts.no} No)
          </div>
        </div>
      </div>
    </div>
  );
};
