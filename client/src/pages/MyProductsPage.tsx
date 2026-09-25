import React, { useState, useEffect } from 'react';
import { Product, SupportProposal } from '@droptest/shared';
import { useAuth } from '../context/AuthContext.js';
import { 
  Package, 
  PlusCircle, 
  Edit3, 
  Eye, 
  FlaskConical, 
  Bookmark, 
  MessageSquare,
  HandCoins,
  Briefcase,
  Rocket,
  ArrowRight,
  Info
} from 'lucide-react';

interface MyProductsPageProps {
  onOpenProduct: (productId: string) => void;
  onEditProduct: (productId: string) => void;
  onNavigateToPublish: () => void;
  onOpenSyntheticLab: (productId: string) => void;
}

export const MyProductsPage: React.FC<MyProductsPageProps> = ({
  onOpenProduct,
  onEditProduct,
  onNavigateToPublish,
  onOpenSyntheticLab
}) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'proposals'>('products');
  const [products, setProducts] = useState<(Product & { save_count: number; feedback_count: number })[]>([]);
  const [proposals, setProposals] = useState<SupportProposal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch products
      const pRes = await fetch('/api/products/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!pRes.ok) throw new Error('Failed to load your products');
      const pData = await pRes.json();
      setProducts(pData.products || []);

      // Fetch incoming proposals
      const propRes = await fetch('/api/products/proposals/incoming', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (propRes.ok) {
        const propData = await propRes.json();
        setProposals(propData.proposals || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching founder dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (user?.role !== 'startup') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
        <div role="alert" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
          <Package size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3>Founder Portal</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
            This section is for startup founders to manage their products and launch tests.
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="brand-badge" style={{ fontSize: '10px', marginBottom: '4px', display: 'inline-block' }}>
            {user.startup_name || 'MY STARTUP'}
          </span>
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Founder Workspace
          </h1>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Manage product proposals, review incoming backer proposals, and run the Synthetic Lab.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={onNavigateToPublish}
        >
          <PlusCircle size={15} /> Publish New Product
        </button>
      </div>

      {/* Workspace Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-5)' }}>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: 600 }}
        >
          <Package size={15} />
          <span>My Products ({products.length})</span>
        </button>

        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: 600 }}
        >
          <HandCoins size={15} />
          <span>Support Proposals ({proposals.length})</span>
        </button>
      </div>

      {error && (
        <div role="alert" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>
        </div>
      ) : activeTab === 'products' ? (
        /* Products Tab Content */
        products.length === 0 ? (
          <div style={{
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            textAlign: 'center'
          }}>
            <Package size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              No products created yet
            </h3>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto 16px auto' }}>
              Publish your first product proposal to start gathering feedback from the community and run AI persona simulations.
            </p>
            <button type="button" className="btn btn-primary" onClick={onNavigateToPublish}>
              Publish Your First Product
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {products.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      textTransform: 'uppercase',
                      background: p.status === 'published' ? '#DCFCE7' : '#F3F4F6',
                      color: p.status === 'published' ? '#15803D' : '#4B5563',
                      border: `1px solid ${p.status === 'published' ? '#86EFAC' : '#E5E7EB'}`
                    }}>
                      {p.status}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {p.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    {p.summary.length > 90 ? `${p.summary.substring(0, 90)}...` : p.summary}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {p.price !== null ? (p.currency === 'INR' ? '₹' : p.currency + ' ') + p.price : 'Price not set'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Bookmark size={12} /> {p.save_count} saves
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MessageSquare size={12} /> {p.feedback_count} responses
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => onOpenProduct(p.id)}
                  >
                    <Eye size={13} /> View
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => onEditProduct(p.id)}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => onOpenSyntheticLab(p.id)}
                  >
                    <FlaskConical size={13} /> Synthetic Lab
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Support Proposals Tab Content */
        <div>
          {/* Informational Banner */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#166534'
          }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              Proposals are non-binding expressions of support from verified sponsors and fellow founders. No funds or financial transactions are processed on the platform.
            </span>
          </div>

          {proposals.length === 0 ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              textAlign: 'center'
            }}>
              <HandCoins size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                No support proposals received yet
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: 1.45 }}>
                When sponsors or other founders discover your product on Explore and propose backing, their offers will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {proposals.map(prop => (
                <div
                  key={prop.id}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4) var(--space-5)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {prop.sender_name}
                      </span>
                      {prop.sender_startup_name && (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          ({prop.sender_startup_name})
                        </span>
                      )}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: prop.sender_role === 'sponsor' ? '#FEF3C7' : '#DCFCE7',
                        color: prop.sender_role === 'sponsor' ? '#B45309' : '#15803D',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {prop.sender_role === 'sponsor' ? <Briefcase size={12} /> : <Rocket size={12} />}
                        {prop.sender_role === 'sponsor' ? 'Sponsor Backer' : 'Startup Founder'}
                      </span>
                    </div>

                    <div style={{
                      background: '#DCFCE7',
                      color: '#15803D',
                      border: '1px solid #86EFAC',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      Proposed {formatCurrency(prop.amount, prop.currency)}
                    </div>
                  </div>

                  {/* Target Product Tag */}
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>For Product:</span>
                    <button
                      type="button"
                      onClick={() => onOpenProduct(prop.product_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>{prop.product_name}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Message Content */}
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    background: '#F8FAFC',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    margin: '4px 0 0 0',
                    lineHeight: 1.45,
                    border: '1px solid var(--color-border-subtle)'
                  }}>
                    "{prop.message}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
