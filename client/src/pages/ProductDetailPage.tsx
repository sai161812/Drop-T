import React, { useState, useEffect } from 'react';
import { 
  ProductPublicDetail, 
  ProductCategory, 
  CommunityFeedbackChoice, 
  CommunityFeedbackFactor,
  COMMUNITY_FEEDBACK_FACTORS,
  FounderFeedbackBreakdown
} from '@droptest/shared';
import { useAuth } from '../context/AuthContext.js';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  BookmarkCheck,
  MessageSquare, 
  Edit3, 
  FlaskConical,
  Shirt, 
  UtensilsCrossed, 
  Cpu, 
  Package, 
  MapPin, 
  Truck, 
  Check,
  ThumbsUp,
  HelpCircle,
  ThumbsDown,
  User,
  Briefcase,
  Rocket,
  Lock,
  HandCoins,
  X,
  Info
} from 'lucide-react';

interface ProductDetailPageProps {
  productId: string;
  onNavigateBack: () => void;
  onEditProduct: (productId: string) => void;
  onOpenSyntheticLab: (productId: string) => void;
  onPromptAuth?: () => void;
}

const FACTOR_LABELS: Record<CommunityFeedbackFactor, string> = {
  price: 'Price / Value',
  design_fit: 'Design & Aesthetics',
  quality_details: 'Quality & Specifications',
  availability_delivery: 'Availability & Delivery',
  usefulness: 'Practical Usefulness',
  other: 'Other Factors'
};

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
  const [isTogglingSave, setIsTogglingSave] = useState<boolean>(false);

  // Structured Feedback Form state
  const [feedbackChoice, setFeedbackChoice] = useState<CommunityFeedbackChoice | ''>('');
  const [feedbackFactor, setFeedbackFactor] = useState<CommunityFeedbackFactor | ''>('');
  const [feedbackReason, setFeedbackReason] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState<string | null>(null);

  // Support Proposal Modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [supportAmount, setSupportAmount] = useState<number | ''>(500);
  const [supportCurrency, setSupportCurrency] = useState<string>('INR');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState<boolean>(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccessBanner, setSupportSuccessBanner] = useState<string | null>(null);

  // Founder-only feedback breakdown state
  const [founderBreakdown, setFounderBreakdown] = useState<FounderFeedbackBreakdown | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState<boolean>(false);

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

      // Pre-fill user feedback if exists
      if (data.feedback_summary?.user_feedback) {
        setFeedbackChoice(data.feedback_summary.user_feedback.choice);
        setFeedbackFactor(data.feedback_summary.user_feedback.factor);
        setFeedbackReason(data.feedback_summary.user_feedback.reason || '');
      } else {
        setFeedbackChoice('');
        setFeedbackFactor('');
        setFeedbackReason('');
      }

      // Pre-fill support proposal if exists
      if (data.user_proposal) {
        setSupportAmount(data.user_proposal.amount);
        setSupportCurrency(data.user_proposal.currency || 'INR');
        setSupportMessage(data.user_proposal.message || '');
      }

      // If owner, fetch detailed breakdown
      if (user && user.id === data.owner_id) {
        fetchFounderBreakdown();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFounderBreakdown = async () => {
    if (!token) return;
    try {
      setIsLoadingBreakdown(true);
      const res = await fetch(`/api/products/${productId}/feedback/breakdown`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFounderBreakdown(data);
      }
    } catch (err) {
      console.error('Failed to load founder feedback breakdown:', err);
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, token]);

  const handleToggleSave = async () => {
    if (!token) {
      onPromptAuth?.();
      return;
    }

    setIsTogglingSave(true);
    try {
      const nextSavedState = !isSaved;
      const res = await fetch(`/api/products/${productId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ saved: nextSavedState })
      });
      if (!res.ok) throw new Error('Failed to update save status');
      const data = await res.json();
      setIsSaved(data.is_saved);
      setSaveCount(data.save_count);
    } catch (err) {
      console.error('Save toggle error:', err);
    } finally {
      setIsTogglingSave(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onPromptAuth?.();
      return;
    }

    if (!feedbackChoice) {
      setFeedbackErrorMsg('Please select whether you would consider this product.');
      return;
    }

    if (!feedbackFactor) {
      setFeedbackErrorMsg('Please select what matters most to your choice.');
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackErrorMsg(null);
    setFeedbackSuccessMsg(null);

    try {
      const res = await fetch(`/api/products/${productId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          choice: feedbackChoice,
          factor: feedbackFactor,
          reason: feedbackReason.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit feedback');
      }

      const resData = await res.json();
      setFeedbackSuccessMsg(
        product?.feedback_summary?.user_feedback
          ? 'Your feedback response has been updated.'
          : 'Thank you! Your feedback has been recorded.'
      );

      // Update local product feedback summary in place
      if (product) {
        setProduct({
          ...product,
          feedback_summary: resData.feedback_summary
        });
      }

      // If owner, refresh founder breakdown
      if (isOwner) {
        fetchFounderBreakdown();
      }

      setTimeout(() => setFeedbackSuccessMsg(null), 4000);
    } catch (err: any) {
      setFeedbackErrorMsg(err.message || 'Error recording feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleOpenSupportModal = () => {
    if (!token) {
      onPromptAuth?.();
      return;
    }
    if (product?.user_proposal) {
      setSupportAmount(product.user_proposal.amount);
      setSupportCurrency(product.user_proposal.currency || 'INR');
      setSupportMessage(product.user_proposal.message || '');
    } else {
      setSupportAmount(500);
      setSupportCurrency('INR');
      setSupportMessage('');
    }
    setSupportError(null);
    setIsSupportModalOpen(true);
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onPromptAuth?.();
      return;
    }

    const numAmount = Number(supportAmount);
    if (!numAmount || numAmount <= 0) {
      setSupportError('Proposed amount must be a positive number.');
      return;
    }

    if (!supportMessage.trim() || supportMessage.trim().length < 3) {
      setSupportError('Please include a message of at least 3 characters explaining your support intent.');
      return;
    }

    setIsSubmittingSupport(true);
    setSupportError(null);

    try {
      const res = await fetch(`/api/products/${productId}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numAmount,
          currency: supportCurrency,
          message: supportMessage.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit support proposal');
      }

      const resData = await res.json();
      if (product) {
        setProduct({
          ...product,
          user_proposal: {
            id: resData.proposal.id,
            amount: resData.proposal.amount,
            currency: resData.proposal.currency,
            message: resData.proposal.message,
            created_at: resData.proposal.created_at,
            updated_at: resData.proposal.updated_at
          }
        });
      }

      setIsSupportModalOpen(false);
      const currSymbol = supportCurrency === 'INR' ? '₹' : supportCurrency + ' ';
      setSupportSuccessBanner(`Proposal sent: Proposed ${currSymbol}${numAmount.toLocaleString()}`);
      setTimeout(() => setSupportSuccessBanner(null), 5000);
    } catch (err: any) {
      setSupportError(err.message || 'Error submitting support proposal');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${productId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isOwner = user && product && user.id === product.owner_id;
  const canOfferSupport = user && !isOwner && (user.role === 'sponsor' || user.role === 'startup');

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'startup':
        return { label: 'Founder', icon: <Rocket size={11} />, bg: '#DCFCE7', text: '#15803D' };
      case 'sponsor':
        return { label: 'Sponsor', icon: <Briefcase size={11} />, bg: '#FEF3C7', text: '#B45309' };
      default:
        return { label: 'Shopper', icon: <User size={11} />, bg: '#E0E7FF', text: '#4338CA' };
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
  const totalFeedback = product.feedback_summary.total;
  const counts = product.feedback_summary.counts;
  const factorCounts = product.feedback_summary.factor_counts || {
    price: 0,
    design_fit: 0,
    quality_details: 0,
    availability_delivery: 0,
    usefulness: 0,
    other: 0
  };

  const yesPct = totalFeedback > 0 ? Math.round((counts.yes / totalFeedback) * 100) : 0;
  const maybePct = totalFeedback > 0 ? Math.round((counts.maybe / totalFeedback) * 100) : 0;
  const noPct = totalFeedback > 0 ? Math.round((counts.no / totalFeedback) * 100) : 0;
  const hasUserResponded = Boolean(product.feedback_summary.user_feedback);
  const hasSentProposal = Boolean(product.user_proposal);

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

          {/* Offer Support Button (Sponsors and other Startups) */}
          {canOfferSupport && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              onClick={handleOpenSupportModal}
            >
              <HandCoins size={14} />
              <span>{hasSentProposal ? 'Update Support' : 'Offer Support'}</span>
            </button>
          )}

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

      {/* Support Success Notification Banner */}
      {supportSuccessBanner && (
        <div className="status-banner status-banner-success" style={{ marginBottom: 'var(--space-4)' }}>
          <Check size={16} />
          <span>{supportSuccessBanner}</span>
        </div>
      )}

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

            {/* Price Tag & Sent Proposal Tag */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

              {/* Proposal Sent Status Pill */}
              {hasSentProposal && product.user_proposal && (
                <span style={{
                  background: '#DCFCE7',
                  color: '#15803D',
                  border: '1px solid #86EFAC',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Check size={13} />
                  <span>Proposal sent: Proposed {product.user_proposal.currency === 'INR' ? '₹' : product.user_proposal.currency + ' '}{product.user_proposal.amount.toLocaleString()}</span>
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleToggleSave}
                disabled={isTogglingSave}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              {canOfferSupport && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleOpenSupportModal}
                >
                  <HandCoins size={16} />
                  <span>{hasSentProposal ? 'Edit Proposal' : 'Offer Support'}</span>
                </button>
              )}
            </div>
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

      {/* Community Feedback & Sentiment Section */}
      <div style={{
        marginTop: 'var(--space-6)',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Founder Question Banner */}
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MessageSquare size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Feedback from People
            </h3>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
            The founder is asking the community for honest input before committing launch budget:
          </p>
          <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            "{product.feedback_question}"
          </div>
        </div>

        {/* Aggregate Sentiment & Factor Breakdown */}
        <div style={{
          background: 'var(--color-surface-hover)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Community Sentiment ({totalFeedback} {totalFeedback === 1 ? 'Response' : 'Responses'})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {counts.yes} Yes ({yesPct}%) · {counts.maybe} Maybe ({maybePct}%) · {counts.no} No ({noPct}%)
            </div>
          </div>

          {/* Distribution Progress Bar */}
          <div style={{ width: '100%', height: '10px', background: '#E2E8F0', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: '14px' }}>
            {totalFeedback > 0 ? (
              <>
                <div style={{ width: `${yesPct}%`, background: '#22C55E', transition: 'width 0.3s ease' }} title={`Yes: ${counts.yes} (${yesPct}%)`} />
                <div style={{ width: `${maybePct}%`, background: '#F59E0B', transition: 'width 0.3s ease' }} title={`Maybe: ${counts.maybe} (${maybePct}%)`} />
                <div style={{ width: `${noPct}%`, background: '#EF4444', transition: 'width 0.3s ease' }} title={`No: ${counts.no} (${noPct}%)`} />
              </>
            ) : (
              <div style={{ width: '100%', background: '#CBD5E1' }} />
            )}
          </div>

          {/* Factor Breakdown Pills */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Key Deciding Factors:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COMMUNITY_FEEDBACK_FACTORS.map(fKey => {
                const count = factorCounts[fKey] || 0;
                return (
                  <span
                    key={fKey}
                    style={{
                      background: count > 0 ? 'var(--color-surface)' : 'transparent',
                      border: count > 0 ? '1px solid var(--color-primary-subtle)' : '1px solid var(--color-border-subtle)',
                      color: count > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: count > 0 ? 600 : 400
                    }}
                  >
                    {FACTOR_LABELS[fKey]}: <strong>{count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback Response Form */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {hasUserResponded ? 'Your Feedback Response (Editable)' : 'Give Your Structured Feedback'}
            </h4>
            {hasUserResponded && (
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                Response Recorded
              </span>
            )}
          </div>

          {feedbackSuccessMsg && (
            <div className="status-banner status-banner-success" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <Check size={16} />
              <span>{feedbackSuccessMsg}</span>
            </div>
          )}

          {feedbackErrorMsg && (
            <div className="status-banner status-banner-error" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <span>{feedbackErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback}>
            {/* Question 1: Would you consider this product? */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                1. Would you consider this product? <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${feedbackChoice === 'yes' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    border: feedbackChoice === 'yes' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                  onClick={() => setFeedbackChoice('yes')}
                >
                  <ThumbsUp size={18} color={feedbackChoice === 'yes' ? '#FFF' : '#22C55E'} />
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Yes</span>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>Would consider</span>
                </button>

                <button
                  type="button"
                  className={`btn ${feedbackChoice === 'maybe' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    border: feedbackChoice === 'maybe' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                  onClick={() => setFeedbackChoice('maybe')}
                >
                  <HelpCircle size={18} color={feedbackChoice === 'maybe' ? '#FFF' : '#F59E0B'} />
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Maybe</span>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>Depends on details</span>
                </button>

                <button
                  type="button"
                  className={`btn ${feedbackChoice === 'no' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    border: feedbackChoice === 'no' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                  onClick={() => setFeedbackChoice('no')}
                >
                  <ThumbsDown size={18} color={feedbackChoice === 'no' ? '#FFF' : '#EF4444'} />
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>No</span>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>Not for me</span>
                </button>
              </div>
            </div>

            {/* Question 2: What matters most to your choice? */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                2. What matters most to your choice? <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                {COMMUNITY_FEEDBACK_FACTORS.map(fKey => (
                  <button
                    key={fKey}
                    type="button"
                    className={`btn ${feedbackFactor === fKey ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '12px',
                      padding: '8px 12px',
                      justifyContent: 'flex-start',
                      border: feedbackFactor === fKey ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)'
                    }}
                    onClick={() => setFeedbackFactor(fKey)}
                  >
                    {FACTOR_LABELS[fKey]}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: What would you change or want to know? (Optional) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  3. What would you change or want to know? <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {feedbackReason.length}/500
                </span>
              </div>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Share a short specific suggestion, pricing thought, or feature requirement..."
                maxLength={500}
                value={feedbackReason}
                onChange={e => setFeedbackReason(e.target.value)}
                style={{ fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {user ? `Posting as ${user.display_name} (${getRoleBadge(user.role).label})` : 'Sign in to submit your feedback.'}
              </span>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmittingFeedback || !feedbackChoice || !feedbackFactor}
                style={{ fontSize: '13px', padding: '8px 20px' }}
              >
                {isSubmittingFeedback ? 'Saving...' : hasUserResponded ? 'Update Feedback' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Founder-Only Response Insights (Private to Founder) */}
      {isOwner && (
        <div style={{
          marginTop: 'var(--space-6)',
          background: 'var(--color-surface)',
          border: '1.5px solid #CBD5E1',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Founder Response Insights (Private)
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', background: '#F1F5F9', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
              Visible only to product founder
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Individual structured responses recorded from registered community members:
          </p>

          {isLoadingBreakdown ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading respondent feedback...</p>
          ) : founderBreakdown && founderBreakdown.responses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {founderBreakdown.responses.map(item => {
                const roleBadge = getRoleBadge(item.author.role);
                const choiceBg = item.choice === 'yes' ? '#DCFCE7' : item.choice === 'maybe' ? '#FEF3C7' : '#FEE2E2';
                const choiceColor = item.choice === 'yes' ? '#15803D' : item.choice === 'maybe' ? '#B45309' : '#B91C1C';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {item.author.display_name}
                        </span>
                        {item.author.startup_name && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            ({item.author.startup_name})
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: roleBadge.bg,
                          color: roleBadge.text,
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '10px',
                          fontWeight: 600
                        }}>
                          {roleBadge.icon} {roleBadge.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: choiceBg,
                          color: choiceColor,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {item.choice}
                        </span>
                        <span style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--color-text-secondary)'
                        }}>
                          {FACTOR_LABELS[item.factor]}
                        </span>
                      </div>
                    </div>

                    {item.reason && (
                      <p style={{ fontSize: '12px', color: 'var(--color-text-primary)', margin: '4px 0 0 0', lineHeight: 1.45, fontStyle: 'italic' }}>
                        "{item.reason}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
              No individual feedback submissions recorded yet. When shoppers or backers respond, their answers will appear here.
            </div>
          )}
        </div>
      )}

      {/* Offer Support Proposal Modal */}
      {isSupportModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="workbench-card" style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '24px',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <HandCoins size={20} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    {hasSentProposal ? 'Update Support Proposal' : 'Offer Support'}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Propose early backing to help <strong>{product.owner.startup_name || product.owner.display_name}</strong> launch.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Non-binding notice */}
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontSize: '12px',
              color: '#166534'
            }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                This is a recorded proposal of backing to the founder. No payment or financial transaction occurs on DROPTEST.
              </span>
            </div>

            {supportError && (
              <div className="status-banner status-banner-error" style={{ marginBottom: '14px', fontSize: '13px' }}>
                <span>{supportError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSupport}>
              {/* Proposed Amount Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Proposed Amount (₹ INR) <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    placeholder="500"
                    value={supportAmount}
                    onChange={e => setSupportAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ paddingLeft: '32px', fontSize: '14px', fontWeight: 600 }}
                    required
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                  Enter any positive amount you would like to propose for backing this batch.
                </span>
              </div>

              {/* Message Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Proposal Message / Backing Terms <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="e.g. Interested in early batch pre-orders for 20 units or testing in our workspace..."
                  maxLength={1000}
                  value={supportMessage}
                  onChange={e => setSupportMessage(e.target.value)}
                  style={{ fontSize: '13px', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSupportModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingSupport || !supportAmount || Number(supportAmount) <= 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <HandCoins size={14} />
                  <span>{isSubmittingSupport ? 'Sending...' : hasSentProposal ? 'Update Proposal' : 'Submit Proposal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
