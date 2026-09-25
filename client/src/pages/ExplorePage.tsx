import React, { useState, useEffect } from 'react';
import { ProductPublicSummary, ProductCategory } from '@droptest/shared';
import { 
  Search, 
  Bookmark, 
  MessageSquare, 
  Shirt, 
  UtensilsCrossed, 
  Cpu, 
  Package,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface ExplorePageProps {
  onOpenProduct: (productId: string) => void;
  onNavigateToPublish: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onOpenProduct,
  onNavigateToPublish
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductPublicSummary[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load feed');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError('Unable to load products. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'clothing_accessories': return <Shirt size={14} />;
      case 'local_food_beverages': return <UtensilsCrossed size={14} />;
      case 'digital_products_services': return <Cpu size={14} />;
      default: return <Package size={14} />;
    }
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'launched': return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'preparing_to_launch': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'prototype': return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' };
      default: return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    }
  };

  return (
    <div className="explore-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      {/* Hero / Header Section */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6) var(--space-6)',
        marginBottom: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="brand-badge" style={{ fontSize: '10px' }}>EARLY STAGE COMMUNITY</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Real startups & structured feedback</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Explore Startup Product Launches
            </h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '680px', lineHeight: '1.5' }}>
              Discover genuine upcoming products from early founders, save your favorites, share structured feedback, and offer backing proposals before products hit the market.
            </p>
          </div>

          {user?.role === 'startup' && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
              onClick={onNavigateToPublish}
            >
              <PlusCircle size={16} /> Publish New Product
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-5)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--color-border-subtle)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Products' },
              { id: 'clothing_accessories', label: 'Apparel & Fashion' },
              { id: 'local_food_beverages', label: 'Food & Bakery' },
              { id: 'digital_products_services', label: 'Digital SaaS' },
              { id: 'other', label: 'Other Products' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`btn ${category === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
                onClick={() => setCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px', minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search products or founders..."
                style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0 12px', height: '34px', fontSize: '12px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Product Feed Grid */}
      {error && (
        <div role="alert" style={{ padding: 'var(--space-4)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading verified products...</div>
        </div>
      ) : products.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center'
        }}>
          <Package size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
            No products published in this category yet
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto 16px auto' }}>
            {user?.role === 'startup' 
              ? 'Be the first founder to publish your product launch and gather real community reactions.'
              : 'Check back soon as founders publish new early product proposals.'}
          </p>
          {user?.role === 'startup' && (
            <button type="button" className="btn btn-primary" onClick={onNavigateToPublish}>
              Publish Your Product
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-4)'
        }}>
          {products.map(product => {
            const stageStyle = getStageBadgeColor(product.stage);
            return (
              <div
                key={product.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onClick={() => onOpenProduct(product.id)}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Product Image / Placeholder */}
                <div style={{
                  height: '180px',
                  background: 'var(--color-surface-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].confirmed_visual_description || product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                      {getCategoryIcon(product.category)}
                      <span style={{ fontSize: '11px', fontWeight: 500 }}>No image uploaded</span>
                    </div>
                  )}

                  {/* Stage Pill */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: stageStyle.bg,
                    color: stageStyle.text,
                    border: `1px solid ${stageStyle.border}`,
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {product.stage.replace(/_/g, ' ')}
                  </div>

                  {/* Category Pill */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.65)',
                    color: '#FFF',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {getCategoryIcon(product.category)}
                    <span>{product.category.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Startup Name */}
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
                      {product.startup_name || product.owner_name}
                    </div>

                    {/* Product Name */}
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px', lineHeight: '1.3' }}>
                      {product.name}
                    </h3>

                    {/* Summary */}
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '12px' }}>
                      {product.summary.length > 110 ? `${product.summary.substring(0, 110)}...` : product.summary}
                    </p>
                  </div>

                  {/* Footer Stats & Price */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 'var(--space-3)',
                    borderTop: '1px solid var(--color-border-subtle)',
                    fontSize: '12px'
                  }}>
                    {/* Price */}
                    <div>
                      {product.price !== null ? (
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '14px' }}>
                          {product.currency === 'INR' ? '₹' : product.currency + ' '}{product.price.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '11px' }}>
                          Price not set
                        </span>
                      )}
                    </div>

                    {/* Engagement Counts */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`${product.save_count} saves`}>
                        <Bookmark size={13} /> {product.save_count}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`${product.feedback_count} feedback responses`}>
                        <MessageSquare size={13} /> {product.feedback_count}
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
