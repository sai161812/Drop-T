import React, { useState, useEffect } from 'react';
import { FlaskConical, ShieldAlert, CheckCircle2, RefreshCw, HelpCircle, Search, ExternalLink, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { CompetitorReference, SearchProviderStatus } from '@droptest/shared';
import { useAuth } from '../../context/AuthContext.js';

interface PreflightLabCardProps {
  product?: {
    id: string;
    name: string;
    stage: string;
    category: string;
    price: number | null;
    currency: string;
    summary: string;
    intended_buyer?: string;
    availability_markets?: string[];
    fulfillment_mode?: string;
  };
  mode: 'single' | 'comparison';
  onModeChange: (newMode: 'single' | 'comparison') => void;
  trialPrice?: number;
  onTrialPriceChange: (price: number | undefined) => void;
  isPriceNotSet: boolean;
  skipResearch?: boolean;
  onSkipResearchChange?: (skip: boolean) => void;
  onContinueWithoutResearch?: () => void;
  researchRefreshKey?: number;
}

export const PreflightLabCard: React.FC<PreflightLabCardProps> = ({
  product,
  mode,
  onModeChange,
  trialPrice,
  onTrialPriceChange,
  isPriceNotSet,
  skipResearch = false,
  onSkipResearchChange,
  onContinueWithoutResearch,
  researchRefreshKey = 0
}) => {
  const { token } = useAuth();
  const [isTestingProvider, setIsTestingProvider] = useState(false);
  const [providerStatus, setProviderStatus] = useState<{
    tested: boolean;
    success?: boolean;
    model?: string;
    error?: string;
  }>({ tested: false });

  // Research state
  const [references, setReferences] = useState<CompetitorReference[]>([]);
  const [searchProviderStatus, setSearchProviderStatus] = useState<SearchProviderStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatusMsg, setSearchStatusMsg] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Manual reference form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  useEffect(() => {
    if (product?.id) {
      loadReferences();
      loadResearchStatus();
    }
  }, [product?.id, token, researchRefreshKey]);

  const loadResearchStatus = async () => {
    if (!product?.id) return;
    try {
      const res = await fetch(`/api/products/${product.id}/research/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSearchProviderStatus(data.status);
        if (data.suggested_query) setSearchQuery(data.suggested_query);
        const attempt = data.research_attempt;
        if (attempt?.status === 'failed') {
          setSearchError(attempt.error_message || 'The latest market search failed.');
          setSearchStatusMsg(null);
        } else if (attempt?.status === 'no_matches') {
          setSearchError(null);
          setSearchStatusMsg('Search completed: no relevant comparable products were found. You may continue.');
        } else if (attempt?.status === 'completed') {
          setSearchError(null);
          setSearchStatusMsg('The latest matching market search is ready.');
        }
      }
    } catch {
      // Ignore
    }
  };

  const loadReferences = async () => {
    if (!product?.id) return;
    try {
      const res = await fetch(`/api/products/${product.id}/research/references`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setReferences(data.references || []);
      }
    } catch {
      // Ignore
    }
  };

  const handleRunSearch = async () => {
    if (!product?.id) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchStatusMsg(null);
    try {
      const res = await fetch(`/api/products/${product.id}/research/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query: searchQuery || undefined })
      });
      const data = await res.json();
      if (data.status === 'completed') {
        onSkipResearchChange?.(false);
        setReferences(data.references || []);
        setSearchStatusMsg(`Found ${data.references?.length || 0} comparable market references.`);
      } else if (data.status === 'no_matches') {
        onSkipResearchChange?.(false);
        setReferences(data.references || []);
        setSearchStatusMsg('Search completed: No direct competitor products found for this query.');
      } else {
        setSearchError(data.error || 'Search encountered an issue.');
      }
    } catch (e: any) {
      setSearchError(e.message || 'Failed to execute web search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleReference = async (refId: string, currentSelected: boolean) => {
    if (!product?.id) return;
    try {
      const res = await fetch(`/api/products/${product.id}/research/references/${refId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ selected: !currentSelected })
      });
      if (res.ok) {
        setReferences(prev => prev.map(r => r.id === refId ? { ...r, selected: !currentSelected } : r));
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteReference = async (refId: string) => {
    if (!product?.id) return;
    try {
      const res = await fetch(`/api/products/${product.id}/research/references/${refId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setReferences(prev => prev.filter(r => r.id !== refId));
      }
    } catch {
      // Ignore
    }
  };

  const handleAddManualReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id || !manualUrl || !manualTitle || !manualNote) return;
    setIsSubmittingManual(true);
    try {
      const res = await fetch(`/api/products/${product.id}/research/references/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          url: manualUrl,
          title: manualTitle,
          note: manualNote
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReferences(prev => [data.reference, ...prev]);
        setManualUrl('');
        setManualTitle('');
        setManualNote('');
        setShowManualForm(false);
      }
    } catch {
      // Ignore
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const runSmokeTest = async () => {
    setIsTestingProvider(true);
    try {
      const res = await fetch('/api/tests/smoke-test', { method: 'POST' });
      const data = await res.json();
      setProviderStatus({
        tested: true,
        success: data.success,
        model: data.model,
        error: data.error
      });
    } catch (e: any) {
      setProviderStatus({
        tested: true,
        success: false,
        error: e.message || 'Failed to connect to simulation engine'
      });
    } finally {
      setIsTestingProvider(false);
    }
  };

  const selectedCount = references.filter(r => r.selected).length;

  return (
    <div 
      className="card" 
      style={{ 
        border: '1px solid var(--color-border)', 
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span 
              className="badge" 
              style={{ 
                background: '#EEF2FF', 
                color: '#4338CA', 
                fontWeight: 600, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '11px' 
              }}
            >
              <FlaskConical size={12} />
              Review setup
            </span>
            {product && (
              <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '11px' }}>
                Linked to {product.name}
              </span>
            )}
            <span 
              className="badge" 
              style={{ 
                background: selectedCount > 0 && !skipResearch ? '#DCFCE7' : '#FEF3C7', 
                color: selectedCount > 0 && !skipResearch ? '#15803D' : '#92400E', 
                fontSize: '10px', 
                fontWeight: 600 
              }}
            >
              {selectedCount > 0 && !skipResearch 
                ? `${selectedCount} source${selectedCount === 1 ? '' : 's'} selected` 
                : skipResearch 
                  ? 'Review without sources'
                  : 'Sources not added'}
            </span>
          </div>

          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {product ? `${product.name} — validation brief` : 'Choose how to validate the idea'}
          </h3>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Use one 50-persona review, or compare two versions of the same idea. Your private inputs stay private.
          </p>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface-subtle)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
          <button
            type="button"
            className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
            onClick={() => onModeChange('single')}
          >
            One idea · 50 personas
          </button>
          <button
            type="button"
            className={`btn ${mode === 'comparison' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
            onClick={() => onModeChange('comparison')}
          >
            Compare A/B · 100 reviews
          </button>
        </div>
      </div>

      {/* Undecided Price Handler (Compact Private Preflight) */}
      {isPriceNotSet && (
        <div 
          style={{ 
            background: '#F8FAFC', 
            border: '1px solid #CBD5E1', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 14px', 
            marginBottom: 'var(--space-3)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                <HelpCircle size={14} style={{ color: '#0284C7' }} />
                Public Price is Not Set
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', maxWidth: '500px' }}>
                The public price stays undecided. Set a private trial price to let personas assess price fit; otherwise this is a concept-only review and pricing claims are disabled.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                Private Trial Price ({product?.currency || 'INR'}):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 499"
                value={trialPrice !== undefined ? trialPrice : ''}
                onChange={(e) => onTrialPriceChange(e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100px', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #94A3B8' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage 5: Comparable Products & Market Research Section */}
      <div style={{ 
        background: 'var(--color-surface-subtle)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 'var(--radius-md)', 
        padding: '14px 16px', 
        marginBottom: 'var(--space-3)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={15} color="var(--color-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Existing products and sources
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                ({selectedCount}/5 selected for simulation)
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Find relevant alternatives, then choose up to five sources to ground the validation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowManualForm(!showManualForm)}
            >
              <Plus size={13} />
              {showManualForm ? 'Close Manual Entry' : 'Add Link Manually'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={handleRunSearch}
              disabled={isSearching}
            >
              <Search size={13} className={isSearching ? 'animate-spin' : ''} />
              {isSearching ? 'Searching...' : 'Search existing products'}
            </button>
          </div>
        </div>

        {/* Search Query Preview */}
        {searchQuery && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Search query:</span>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Custom search query..."
              style={{ flex: 1, fontSize: '11px', padding: '3px 8px', height: '24px' }}
            />
          </div>
        )}

        {/* Status / Error Alerts */}
        {searchStatusMsg && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', marginBottom: '10px' }}>
            {searchStatusMsg}
          </div>
        )}

        {searchError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <AlertTriangle size={13} /> Search Unavailable or Failed
            </div>
            <div style={{ marginTop: '2px' }}>{searchError}</div>
            {onSkipResearchChange && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={handleRunSearch}>
                  Retry Search
                </button>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => onContinueWithoutResearch ? onContinueWithoutResearch() : onSkipResearchChange(true)}>
                  Continue without research
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Add Reference Form */}
        {showManualForm && (
          <form onSubmit={handleAddManualReference} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Add Manual Competitor / Alternative Link</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Product or Brand Name (e.g. Patagonia Hemp Tee)"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                required
                style={{ fontSize: '11px', padding: '5px 8px' }}
              />
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/product"
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                required
                style={{ fontSize: '11px', padding: '5px 8px' }}
              />
            </div>
            <textarea
              className="form-textarea"
              placeholder="Founder note on this competitor (e.g. Alternative priced at ₹1,199 with Pan-India delivery)"
              value={manualNote}
              onChange={e => setManualNote(e.target.value)}
              rows={2}
              required
              style={{ fontSize: '11px', padding: '5px 8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowManualForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} disabled={isSubmittingManual}>
                {isSubmittingManual ? 'Adding...' : 'Save Manual Reference'}
              </button>
            </div>
          </form>
        )}

        {/* References List */}
        {references.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {references.map((ref, idx) => (
              <div 
                key={ref.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '8px 10px',
                  background: 'var(--color-surface)',
                  border: `1px solid ${ref.selected ? 'var(--color-primary-subtle)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={ref.selected}
                    onChange={() => handleToggleReference(ref.id, ref.selected)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)' }}>[REF-{idx + 1}]</span>
                      <a 
                        href={ref.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        {ref.title} <ExternalLink size={11} color="var(--color-primary)" />
                      </a>
                      <span style={{ fontSize: '10px', background: '#F1F5F9', color: '#475569', padding: '1px 5px', borderRadius: '3px' }}>
                        {ref.domain}
                      </span>
                      <span style={{ 
                        fontSize: '10px', 
                        background: ref.evidence_type === 'founder_manual_note' ? '#F3E8FF' : '#E0F2FE', 
                        color: ref.evidence_type === 'founder_manual_note' ? '#6B21A8' : '#0369A1', 
                        padding: '1px 5px', 
                        borderRadius: '3px',
                        fontWeight: 600
                      }}>
                        {ref.evidence_type === 'founder_manual_note' ? 'Founder Note' : 'Retrieved Snippet'}
                      </span>
                    </div>

                    {/* Supported Facts */}
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {ref.supported_facts && ref.supported_facts.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '14px' }}>
                          {ref.supported_facts.map((fact, fIdx) => (
                            <li key={fIdx}>{fact}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ margin: 0 }}>{ref.snippet_or_fact}</p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteReference(ref.id)}
                  style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                  title="Remove reference"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '14px', color: 'var(--color-text-muted)', fontSize: '11px', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            No sources yet. Search existing products or add a reference you already trust.
          </div>
        )}
      </div>

      <details className="lab-technical-details">
        <summary>Technical status</summary>
        <div className="lab-technical-details-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span>
            Mode: <strong>{mode === 'single' ? 'Single Product (50 Persona Evaluations)' : 'A/B Comparison (100 Paired Evaluations)'}</strong>
          </span>
          {searchProviderStatus && (
            <span>
              Search: <strong>{searchProviderStatus.provider.toUpperCase()}</strong> ({searchProviderStatus.credential_present ? 'API Connected' : 'Direct Search Active'})
            </span>
          )}
          {providerStatus.tested && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {providerStatus.success ? (
                <>
                  <CheckCircle2 size={12} style={{ color: '#16A34A' }} />
                  <span style={{ color: '#16A34A', fontWeight: 600 }}>Model Ready ({providerStatus.model})</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={12} style={{ color: '#DC2626' }} />
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>{providerStatus.error}</span>
                </>
              )}
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '11px', padding: '3px 8px', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={runSmokeTest}
          disabled={isTestingProvider}
        >
          <RefreshCw size={11} className={isTestingProvider ? 'animate-spin' : ''} />
          {isTestingProvider ? 'Testing Model...' : 'Smoke Test Engine'}
        </button>
        </div>
      </details>
    </div>
  );
};
