import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ProductPublicSummary, ProductCategory } from '@droptest/shared';
import { 
  Bookmark, 
  BookmarkCheck, 
  MessageSquare, 
  Layers, 
  PackageSearch,
  ArrowRight
} from 'lucide-react';

interface SavedPageProps {
  onOpenProduct: (productId: string) => void;
  onNavigateToExplore: () => void;
  onPromptAuth: () => void;
}

export const SavedPage: React.FC<SavedPageProps> = ({
  onOpenProduct,
  onNavigateToExplore,
  onPromptAuth
}) => {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<ProductPublicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchSavedProducts();
  }, [token]);

  const fetchSavedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products/saved/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load saved products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message || 'Error loading saved products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!token) {
      onPromptAuth();
      return;
    }

    setSavingId(productId);
    try {
      const res = await fetch(`/api/products/${productId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ saved: false })
      });
      if (!res.ok) throw new Error('Failed to update save status');
      const result = await res.json();
      
      // If unsaved, remove from this list immediately
      if (!result.is_saved) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null || price === undefined) return 'Price not set';
    const currSymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${currSymbol}${price.toLocaleString()}`;
  };

  const getCategoryLabel = (cat: ProductCategory) => {
    switch (cat) {
      case 'clothing_accessories': return 'Apparel & Accessories';
      case 'local_food_beverages': return 'Food & Beverages';
      case 'digital_products_services': return 'Digital & SaaS';
      default: return 'Other Products';
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'idea':
        return { label: 'Idea', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'prototype':
        return { label: 'Prototype', bg: '#FDF4FF', color: '#86198F', border: '#F5D0FE' };
      case 'preparing_to_launch':
        return { label: 'Pre-Launch', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'launched':
        return { label: 'Launched', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' };
      default:
        return { label: stage, bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
    }
  };

  if (!user) {
    return (
      <div className="workbench-card" style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '40px 24px' }}>
        <Bookmark size={48} style={{ margin: '0 auto 16px', color: 'var(--color-primary)' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Sign in to View Saved Products</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
          Bookmark early stage startup products across the directory to keep track of their launch progress.
        </p>
        <button type="button" className="btn btn-primary" onClick={onPromptAuth}>
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="saved-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <BookmarkCheck size={24} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Saved Products
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Early startup concepts and products you have bookmarked for tracking.
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="workbench-card" style={{ height: '340px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="status-banner status-banner-error" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
          <button type="button" className="btn btn-secondary" style={{ marginLeft: '12px' }} onClick={fetchSavedProducts}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="workbench-card" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '540px', margin: '40px auto' }}>
          <PackageSearch size={48} style={{ margin: '0 auto 16px', color: 'var(--color-text-muted)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No saved products yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            You haven't bookmarked any products yet. Browse the Explore directory to discover early products and give founders feedback.
          </p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={onNavigateToExplore}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Explore Products</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Saved Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {products.map(product => {
            const stage = getStageBadge(product.stage);
            const mainImg = product.images && product.images.length > 0 ? product.images[0] : null;

            return (
              <div
                key={product.id}
                className="workbench-card"
                onClick={() => onOpenProduct(product.id)}
                style={{
                  cursor: 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  border: '1px solid var(--color-border)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Card Image */}
                <div style={{ height: '180px', width: '100%', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                  {mainImg ? (
                    <img 
                      src={mainImg.url} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '8px' }}>
                      <Layers size={36} />
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>{getCategoryLabel(product.category)}</span>
                    </div>
                  )}

                  {/* Stage Pill */}
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: stage.bg,
                    color: stage.color,
                    border: `1px solid ${stage.border}`,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {stage.label}
                  </span>

                  {/* Unsave Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(e, product.id)}
                    disabled={savingId === product.id}
                    title="Remove from saved"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                  >
                    <BookmarkCheck size={16} fill="var(--color-primary)" />
                  </button>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Founder / Startup info */}
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 500 }}>
                    {product.startup_name || product.owner_name}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {product.name}
                  </h3>

                  {/* Summary */}
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.45,
                    marginBottom: '14px',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.summary}
                  </p>

                  {/* Footer Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--color-border)', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {formatPrice(product.price, product.currency)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bookmark size={13} />
                        {product.save_count}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={13} />
                        {product.feedback_count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
