import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertCircle, 
  MapPin, 
  Truck, 
  HelpCircle, 
  Ban, 
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { PublicFeedbackViewData, HumanChoice } from '@droptest/shared';
import { EmptyState } from '../components/Common/EmptyState.js';

interface PublicFeedbackPageProps {
  tokenOrId?: string;
  isStandalone?: boolean;
  onNavigateToSetup?: () => void;
}

export const PublicFeedbackPage: React.FC<PublicFeedbackPageProps> = ({ 
  tokenOrId, 
  isStandalone = false, 
  onNavigateToSetup 
}) => {
  const [data, setData] = useState<PublicFeedbackViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [selectedChoice, setSelectedChoice] = useState<HumanChoice | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionMsg, setSubmissionMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Client session token for duplicate prevention
  const getClientToken = useCallback((testToken: string) => {
    const storageKey = `droptest_client_token_${testToken}`;
    let clientTok = localStorage.getItem(storageKey);
    if (!clientTok) {
      clientTok = `client_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem(storageKey, clientTok);
    }
    return clientTok;
  }, []);

  const fetchFeedbackData = useCallback(async () => {
    if (!tokenOrId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/feedback/${tokenOrId}`);
      if (res.ok) {
        const feedbackData: PublicFeedbackViewData = await res.json();
        setData(feedbackData);

        // Check if previously submitted in this browser
        const prevChoice = localStorage.getItem(`droptest_submission_${feedbackData.feedback_token}_choice`);
        const prevReason = localStorage.getItem(`droptest_submission_${feedbackData.feedback_token}_reason`);
        if (prevChoice) {
          setSelectedChoice(prevChoice as HumanChoice);
          if (prevReason) setReasonText(prevReason);
          setIsSubmitted(true);
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Feedback page not found or link has expired');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error loading feedback page');
    } finally {
      setIsLoading(false);
    }
  }, [tokenOrId]);

  useEffect(() => {
    fetchFeedbackData();
  }, [fetchFeedbackData]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChoice || !data) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const clientToken = getClientToken(data.feedback_token);
      const res = await fetch(`/api/feedback/${data.feedback_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice: selectedChoice,
          reason: reasonText.trim() || undefined,
          client_token: clientToken
        })
      });

      if (res.ok) {
        const resData = await res.json();
        setIsSubmitted(true);
        setSubmissionMsg(resData.message || 'Thank you for your feedback! Your response has been recorded.');
        
        // Cache locally to prevent accidental spamming and show previous choice
        localStorage.setItem(`droptest_submission_${data.feedback_token}_choice`, selectedChoice);
        if (reasonText.trim()) {
          localStorage.setItem(`droptest_submission_${data.feedback_token}_reason`, reasonText.trim());
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to submit response. Please try again.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error submitting feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div style={{ maxWidth: '800px', margin: '80px auto', textAlign: 'center', padding: 'var(--space-6)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 12px auto' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Loading feedback comparison...
        </p>
      </div>
    );
  }

  // 2. Empty state (No test ID / token provided)
  if (!tokenOrId || !data) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', width: '100%', padding: '0 var(--space-4)' }}>
        {errorMsg ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px', border: '1px solid var(--color-border)' }}>
            <AlertCircle size={36} style={{ color: 'var(--color-warning)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Feedback Link Not Found
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 20px auto' }}>
              {errorMsg}
            </p>
            {onNavigateToSetup && (
              <button type="button" className="btn btn-primary" onClick={onNavigateToSetup}>
                Go to Test Setup
              </button>
            )}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Public Feedback Link Not Generated Yet"
            message="A shareable public validation page for real prospective buyers becomes active once your test options are saved and executed in the workbench."
            actionTitle="How real-person validation works in DROPTEST:"
            actionSteps={[
              'Finish your offering setup and comparison lever in "Set up test".',
              'Execute the 50-persona simulation to generate an unguessable public feedback link.',
              'Share the public link with real buyers to collect anonymous choices (A, B, neither, unsure) and qualitative reasons.',
              'Review human validation results in a dedicated results section with separate counts, never mixed with simulated profiles.'
            ]}
            primaryActionLabel="Go to Set up test"
            onPrimaryAction={onNavigateToSetup}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: 'var(--space-4) var(--space-4) var(--space-8) var(--space-4)' }}>
      {/* Top Banner with Public Controls & Privacy Badge */}
      <div 
        className="card" 
        style={{ 
          marginBottom: 'var(--space-4)', 
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            DROPTEST Public Feedback Link
          </span>
          <span className="badge badge-intended" style={{ fontSize: '10px' }}>
            Anonymous Survey
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyLink}
            style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Copy shareable feedback link"
          >
            {copied ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
            {copied ? 'Link Copied!' : 'Copy Feedback Link'}
          </button>

          {!isStandalone && onNavigateToSetup && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToSetup}
              style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ArrowLeft size={12} />
              Workbench
            </button>
          )}
        </div>
      </div>

      {/* Offering Header */}
      <div 
        className="card" 
        style={{ 
          marginBottom: 'var(--space-4)', 
          padding: 'var(--space-5)', 
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-primary)'
        }}
      >
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
          {data.title}
        </h1>
        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
          {data.short_value_prop}
        </p>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {data.description}
        </p>
      </div>

      {/* Side-by-Side Comparison of Option A and Option B */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 'var(--space-4)', 
          marginBottom: 'var(--space-6)' 
        }}
      >
        {/* Option A Card */}
        <div 
          className="card" 
          style={{ 
            border: selectedChoice === 'A' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: selectedChoice === 'A' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'border-color 0.15s ease'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div>
                <span className="badge badge-intended" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Option A
                </span>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {data.options.A.name}
                </h3>
              </div>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {data.currency}{data.options.A.price}
              </span>
            </div>

            {/* Images for Option A */}
            {data.options.A.images && data.options.A.images.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {data.options.A.images.map((img, i) => (
                    <div key={img.id || i} style={{ position: 'relative', width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', background: '#000' }}>
                      <img 
                        src={img.url} 
                        alt={img.confirmed_visual_description || `Option A product visual ${i + 1}`}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                      {img.confirmed_visual_description && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', padding: '4px 6px', background: 'var(--color-surface-subtle)', borderTop: '1px solid var(--color-border-subtle)' }}>
                          {img.confirmed_visual_description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--color-surface-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Primary Message:</div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                "{data.options.A.primary_message}"
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span>Available in: <strong>{data.options.A.served_markets.join(', ')}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span>Fulfillment: <strong>{data.options.A.fulfillment_mode}</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${selectedChoice === 'A' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            onClick={() => setSelectedChoice('A')}
          >
            {selectedChoice === 'A' ? '✓ Selected Option A' : 'Choose Option A'}
          </button>
        </div>

        {/* Option B Card */}
        <div 
          className="card" 
          style={{ 
            border: selectedChoice === 'B' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: selectedChoice === 'B' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'border-color 0.15s ease'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div>
                <span className="badge badge-adjacent" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Option B
                </span>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {data.options.B.name}
                </h3>
              </div>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {data.currency}{data.options.B.price}
              </span>
            </div>

            {/* Images for Option B */}
            {data.options.B.images && data.options.B.images.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {data.options.B.images.map((img, i) => (
                    <div key={img.id || i} style={{ position: 'relative', width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)', background: '#000' }}>
                      <img 
                        src={img.url} 
                        alt={img.confirmed_visual_description || `Option B product visual ${i + 1}`}
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                      {img.confirmed_visual_description && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', padding: '4px 6px', background: 'var(--color-surface-subtle)', borderTop: '1px solid var(--color-border-subtle)' }}>
                          {img.confirmed_visual_description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--color-surface-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Primary Message:</div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                "{data.options.B.primary_message}"
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span>Available in: <strong>{data.options.B.served_markets.join(', ')}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <span>Fulfillment: <strong>{data.options.B.fulfillment_mode}</strong></span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${selectedChoice === 'B' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            onClick={() => setSelectedChoice('B')}
          >
            {selectedChoice === 'B' ? '✓ Selected Option B' : 'Choose Option B'}
          </button>
        </div>
      </div>

      {/* Main Feedback Form: "Which would you consider?" */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-5)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Which would you consider?
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Select the option you would be more likely to buy or explore, or tell us if neither fits your needs.
          </p>
        </div>

        {/* 4 Clear Radio Cards */}
        <div 
          role="radiogroup" 
          aria-label="Which would you consider?"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: 'var(--space-4)' }}
        >
          {/* Choice A */}
          <label 
            htmlFor="choice_a"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 14px', 
              borderRadius: 'var(--radius-md)', 
              border: selectedChoice === 'A' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', 
              background: selectedChoice === 'A' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: 'pointer'
            }}
          >
            <input 
              type="radio" 
              id="choice_a" 
              name="feedback_choice" 
              value="A" 
              checked={selectedChoice === 'A'} 
              onChange={() => setSelectedChoice('A')} 
              style={{ cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Option A ({data.currency}{data.options.A.price})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {data.options.A.name}
              </div>
            </div>
          </label>

          {/* Choice B */}
          <label 
            htmlFor="choice_b"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 14px', 
              borderRadius: 'var(--radius-md)', 
              border: selectedChoice === 'B' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', 
              background: selectedChoice === 'B' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: 'pointer'
            }}
          >
            <input 
              type="radio" 
              id="choice_b" 
              name="feedback_choice" 
              value="B" 
              checked={selectedChoice === 'B'} 
              onChange={() => setSelectedChoice('B')} 
              style={{ cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Option B ({data.currency}{data.options.B.price})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {data.options.B.name}
              </div>
            </div>
          </label>

          {/* Choice Neither */}
          <label 
            htmlFor="choice_neither"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 14px', 
              borderRadius: 'var(--radius-md)', 
              border: selectedChoice === 'neither' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', 
              background: selectedChoice === 'neither' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: 'pointer'
            }}
          >
            <input 
              type="radio" 
              id="choice_neither" 
              name="feedback_choice" 
              value="neither" 
              checked={selectedChoice === 'neither'} 
              onChange={() => setSelectedChoice('neither')} 
              style={{ cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ban size={13} style={{ color: 'var(--color-text-muted)' }} /> Neither
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Neither option appeals to me
              </div>
            </div>
          </label>

          {/* Choice Unsure */}
          <label 
            htmlFor="choice_unsure"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 14px', 
              borderRadius: 'var(--radius-md)', 
              border: selectedChoice === 'unsure' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', 
              background: selectedChoice === 'unsure' ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: 'pointer'
            }}
          >
            <input 
              type="radio" 
              id="choice_unsure" 
              name="feedback_choice" 
              value="unsure" 
              checked={selectedChoice === 'unsure'} 
              onChange={() => setSelectedChoice('unsure')} 
              style={{ cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HelpCircle size={13} style={{ color: 'var(--color-text-muted)' }} /> Unsure
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Need more information
              </div>
            </div>
          </label>
        </div>

        {/* Optional Qualitative Reason Input */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="reason_input" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Why? (Optional short reason)
            </label>
            <span style={{ fontSize: '11px', color: reasonText.length > 450 ? 'var(--color-warning)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {reasonText.length} / 500
            </span>
          </div>
          <textarea
            id="reason_input"
            rows={3}
            className="input"
            placeholder="Share why this option appeals or what would make it better for you..."
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value.slice(0, 500))}
            style={{ width: '100%', resize: 'vertical', fontSize: '13px' }}
          />
        </div>

        {/* Success / Error Feedback */}
        {isSubmitted && submissionMsg && (
          <div style={{ marginBottom: 'var(--space-3)', background: 'var(--color-success-bg)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                {submissionMsg}
              </div>
              <div style={{ fontSize: '11px', color: '#15803D' }}>
                You can change your selection above and submit again if your preference changes.
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ marginBottom: 'var(--space-3)', background: 'var(--color-danger-bg)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#991B1B' }}>{errorMsg}</span>
          </div>
        )}

        {/* Action Button & Anonymous Privacy Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            <ShieldCheck size={14} />
            <span>Anonymous response. No names, email addresses, or phone numbers are collected.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedChoice || isSubmitting}
            style={{ minWidth: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Submitting...
              </>
            ) : isSubmitted ? (
              'Update Response'
            ) : (
              'Submit Response'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
