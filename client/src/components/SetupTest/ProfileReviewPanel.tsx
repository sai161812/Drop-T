import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DomainId, 
  Profile, 
  AudienceSegment, 
  EligibilityResult
} from '@droptest/shared';
import { 
  Users, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  DollarSign, 
  Eye, 
  SlidersHorizontal,
  Lock
} from 'lucide-react';

interface PanelStats {
  total: number;
  eligible_count: number;
  unserved_count: number;
  eligible_by_segment: {
    intended: { eligible: number; total: number };
    adjacent: { eligible: number; total: number };
    contrasting: { eligible: number; total: number };
  };
  eligible_by_market: Record<string, { eligible: number; total: number }>;
}

interface ProfileReviewPanelProps {
  testId?: string;
  domainId: DomainId;
  intendedBuyer: string;
  adjacentBuyer: string;
  expectedSpendMin: number;
  expectedSpendMax: number;
  audienceMarkets: string[];
  currency: string;
  optionA: { name: string; served_markets: string[] };
  optionB: { name: string; served_markets: string[] };
}

export const ProfileReviewPanel: React.FC<ProfileReviewPanelProps> = ({
  testId: _testId,
  domainId,
  intendedBuyer,
  adjacentBuyer,
  expectedSpendMin,
  expectedSpendMax,
  audienceMarkets,
  currency,
  optionA,
  optionB
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [statsA, setStatsA] = useState<PanelStats | null>(null);
  const [statsB, setStatsB] = useState<PanelStats | null>(null);
  const [profileEligibility, setProfileEligibility] = useState<Record<string, { a: EligibilityResult; b: EligibilityResult }>>({});
  const [currentSeed, setCurrentSeed] = useState<number>(12345);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & display
  const [segmentFilter, setSegmentFilter] = useState<'all' | AudienceSegment>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const fetchPanel = useCallback(async (seedToUse?: number) => {
    if (!audienceMarkets || audienceMarkets.length === 0) {
      setError('Please add at least 1 audience market above to generate the simulated panel.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const seed = seedToUse !== undefined ? seedToUse : currentSeed;

    try {
      const res = await fetch('/api/tests/preview-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain_id: domainId,
          intended_buyer_description: intendedBuyer,
          adjacent_buyer_description: adjacentBuyer,
          expected_spend_min: expectedSpendMin,
          expected_spend_max: expectedSpendMax,
          audience_markets: audienceMarkets,
          option_a: optionA,
          option_b: optionB,
          seed
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || 'Failed to generate profile review panel');
      }

      const data = await res.json();
      setProfiles(data.profiles || []);
      setStatsA(data.stats_a || null);
      setStatsB(data.stats_b || null);
      setProfileEligibility(data.profile_eligibility || {});
      if (data.seed !== undefined) {
        setCurrentSeed(data.seed);
      }
    } catch (e: any) {
      console.error('Error loading panel profiles:', e);
      setError(e.message || 'Unable to generate persona review panel');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  }, [
    domainId, intendedBuyer, adjacentBuyer, expectedSpendMin, expectedSpendMax, 
    audienceMarkets, optionA, optionB, currentSeed
  ]);

  // Initial load or debounced update on parameter change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPanel();
    }, 250);
    return () => clearTimeout(handler);
  }, [domainId, expectedSpendMin, expectedSpendMax, audienceMarkets, optionA.served_markets, optionB.served_markets]);

  // Handle manual panel regeneration with new seed
  const handleRegenerate = () => {
    setIsRegenerating(true);
    const newSeed = Math.floor(Math.random() * 1000000) + 1;
    setCurrentSeed(newSeed);
    fetchPanel(newSeed);
  };

  // Filtered profiles list
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      if (segmentFilter !== 'all' && p.segment !== segmentFilter) return false;
      if (marketFilter !== 'all' && p.market !== marketFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesUseCase = p.use_case.toLowerCase().includes(q);
        const matchesConstraints = p.constraints.some(c => c.toLowerCase().includes(q));
        const matchesPriorities = p.priorities.some(pr => pr.toLowerCase().includes(q));
        const matchesMarket = p.market.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        if (!matchesUseCase && !matchesConstraints && !matchesPriorities && !matchesMarket && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [profiles, segmentFilter, marketFilter, searchQuery]);

  // Market counts breakdown
  const marketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of profiles) {
      counts[p.market] = (counts[p.market] || 0) + 1;
    }
    return counts;
  }, [profiles]);

  const selectedProfile = useMemo(() => {
    if (!selectedProfileId) return null;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [profiles, selectedProfileId]);

  return (
    <div className="card" style={{ marginTop: 'var(--space-6)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ 
            background: 'var(--color-surface-subtle)', 
            padding: '8px', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-intended)'
          }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Simulated Panel & Eligibility Review
              </h3>
              <span className="badge" style={{ background: 'var(--color-intended-bg)', color: 'var(--color-intended)', fontWeight: 600 }}>
                50 Personas
              </span>
              <span className="badge" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                <Lock size={10} style={{ marginRight: '3px' }} /> Seed #{currentSeed}
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              20 Intended • 20 Adjacent • 10 Contrasting personas with deterministic market access gating
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleRegenerate}
            disabled={isLoading || isRegenerating}
            title="Re-roll seed and regenerate 50 unique personas"
          >
            <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Panel'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '6px', color: 'var(--color-text-muted)' }}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
          {error && (
            <div style={{ background: 'var(--color-danger-bg)', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '12px', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Panel Freeze & Determinism Notice */}
          <div style={{ 
            background: 'var(--color-surface-subtle)', 
            border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-md)', 
            padding: '10px 14px', 
            fontSize: '11px', 
            color: 'var(--color-text-secondary)', 
            lineHeight: '1.5',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <ShieldCheck size={16} color="var(--color-intended)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Deterministic Panel Lock:</strong> When a simulation run begins, these exact 50 profiles are frozen with identical IDs (<code>prof_01</code>..<code>prof_50</code>) and traits across both options. You may revise audience descriptions or markets above and regenerate the panel anytime before running.
            </div>
          </div>

          {/* Panel Summary Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: 'var(--space-3)', 
            marginBottom: 'var(--space-4)' 
          }}>
            {/* 1. Segment Split */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Audience Segment Split
              </span>
              <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '8px 0', background: '#E2E8F0' }}>
                <div style={{ width: '40%', background: 'var(--color-intended)' }} title="20 Intended (40%)" />
                <div style={{ width: '40%', background: 'var(--color-adjacent)' }} title="20 Adjacent (40%)" />
                <div style={{ width: '20%', background: 'var(--color-contrasting)' }} title="10 Contrasting (20%)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--color-intended)', fontWeight: 600 }}>20 Intended</span>
                <span style={{ color: 'var(--color-adjacent)', fontWeight: 600 }}>20 Adjacent</span>
                <span style={{ color: 'var(--color-contrasting)', fontWeight: 600 }}>10 Contrasting</span>
              </div>
            </div>

            {/* 2. Market Allocation */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Audience Market Allocation
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {Object.entries(marketCounts).map(([market, count]) => (
                  <span 
                    key={market} 
                    className="badge" 
                    style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-primary)', fontSize: '11px', padding: '3px 7px' }}
                  >
                    <MapPin size={10} style={{ marginRight: '3px' }} />
                    {market}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Option A Eligibility */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Option A Access Coverage
                </span>
                <span className="badge" style={{ background: statsA && statsA.unserved_count === 0 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', color: statsA && statsA.unserved_count === 0 ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '10px' }}>
                  {statsA ? `${statsA.eligible_count} / ${statsA.total} Served` : 'Calculating...'}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--color-text-secondary)' }}>
                {statsA && statsA.unserved_count > 0 ? (
                  <span style={{ color: 'var(--color-warning)' }}>
                    <strong>{statsA.unserved_count} unserved</strong> (outside Option A markets)
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-success)' }}>
                    100% of panel in served markets
                  </span>
                )}
              </div>
            </div>

            {/* 4. Option B Eligibility */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Option B Access Coverage
                </span>
                <span className="badge" style={{ background: statsB && statsB.unserved_count === 0 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', color: statsB && statsB.unserved_count === 0 ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '10px' }}>
                  {statsB ? `${statsB.eligible_count} / ${statsB.total} Served` : 'Calculating...'}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--color-text-secondary)' }}>
                {statsB && statsB.unserved_count > 0 ? (
                  <span style={{ color: 'var(--color-warning)' }}>
                    <strong>{statsB.unserved_count} unserved</strong> (outside Option B markets)
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-success)' }}>
                    100% of panel in served markets
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '12px', 
            flexWrap: 'wrap',
            padding: '10px 14px',
            background: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-3)'
          }}>
            {/* Segment filter pills */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <SlidersHorizontal size={13} color="var(--color-text-muted)" />
              <button
                type="button"
                className="btn"
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 8px',
                  background: segmentFilter === 'all' ? 'var(--color-accent)' : 'transparent',
                  color: segmentFilter === 'all' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  border: '1px solid ' + (segmentFilter === 'all' ? 'var(--color-accent)' : 'var(--color-border)')
                }}
                onClick={() => setSegmentFilter('all')}
              >
                All ({profiles.length})
              </button>
              <button
                type="button"
                className="btn"
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 8px',
                  background: segmentFilter === 'intended' ? 'var(--color-intended)' : 'transparent',
                  color: segmentFilter === 'intended' ? 'white' : 'var(--color-intended)',
                  border: '1px solid ' + (segmentFilter === 'intended' ? 'var(--color-intended)' : 'var(--color-border)')
                }}
                onClick={() => setSegmentFilter('intended')}
              >
                Intended (20)
              </button>
              <button
                type="button"
                className="btn"
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 8px',
                  background: segmentFilter === 'adjacent' ? 'var(--color-adjacent)' : 'transparent',
                  color: segmentFilter === 'adjacent' ? 'white' : 'var(--color-adjacent)',
                  border: '1px solid ' + (segmentFilter === 'adjacent' ? 'var(--color-adjacent)' : 'var(--color-border)')
                }}
                onClick={() => setSegmentFilter('adjacent')}
              >
                Adjacent (20)
              </button>
              <button
                type="button"
                className="btn"
                style={{ 
                  fontSize: '11px', 
                  padding: '3px 8px',
                  background: segmentFilter === 'contrasting' ? 'var(--color-contrasting)' : 'transparent',
                  color: segmentFilter === 'contrasting' ? 'white' : 'var(--color-contrasting)',
                  border: '1px solid ' + (segmentFilter === 'contrasting' ? 'var(--color-contrasting)' : 'var(--color-border)')
                }}
                onClick={() => setSegmentFilter('contrasting')}
              >
                Contrasting (10)
              </button>
            </div>

            {/* Market & Search */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {audienceMarkets.length > 1 && (
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '3px 8px', height: '28px' }}
                  value={marketFilter}
                  onChange={e => setMarketFilter(e.target.value)}
                >
                  <option value="all">All Markets</option>
                  {audienceMarkets.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search use cases / traits..."
                  className="form-input"
                  style={{ fontSize: '11px', padding: '3px 8px 3px 26px', height: '28px', width: '180px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Profiles Inspectable List / Table */}
          <div style={{ 
            maxHeight: '440px', 
            overflowY: 'auto', 
            border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '70px' }}>ID</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '110px' }}>Segment</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '120px' }}>Market</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '100px' }}>Budget Band</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Use Case & Constraints</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '120px', textAlign: 'center' }}>Option Access</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, width: '50px', textAlign: 'center' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No personas match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((prof, idx) => {
                    const elig = profileEligibility[prof.id];
                    const isServedA = elig ? elig.a.is_eligible : true;
                    const isServedB = elig ? elig.b.is_eligible : true;

                    return (
                      <tr 
                        key={prof.id} 
                        style={{ 
                          borderBottom: '1px solid var(--color-border-subtle)',
                          background: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
                          transition: 'background 0.1s ease'
                        }}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          {prof.id}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              background: prof.segment === 'intended' ? 'var(--color-intended-bg)' : prof.segment === 'adjacent' ? 'var(--color-adjacent-bg)' : 'var(--color-contrasting-bg)',
                              color: prof.segment === 'intended' ? 'var(--color-intended)' : prof.segment === 'adjacent' ? 'var(--color-adjacent)' : 'var(--color-contrasting)',
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            {prof.segment}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={11} color="var(--color-text-muted)" />
                            {prof.market}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                          {currency} {prof.budget_min} – {prof.budget_max}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '3px' }}>
                            {prof.use_case}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {prof.constraints.map((c, i) => (
                              <span key={i} style={{ fontSize: '10px', background: 'rgba(0,0,0,0.04)', padding: '1px 5px', borderRadius: '3px', color: 'var(--color-text-secondary)' }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            <span 
                              className="badge" 
                              style={{ 
                                background: isServedA ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', 
                                color: isServedA ? 'var(--color-success)' : 'var(--color-danger)', 
                                fontSize: '10px',
                                padding: '1px 5px'
                              }}
                              title={isServedA ? 'Option A: Served' : elig?.a.reason_if_unserved || 'Option A: Unserved'}
                            >
                              A: {isServedA ? 'Served' : 'Unserved'}
                            </span>
                            <span 
                              className="badge" 
                              style={{ 
                                background: isServedB ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', 
                                color: isServedB ? 'var(--color-success)' : 'var(--color-danger)', 
                                fontSize: '10px',
                                padding: '1px 5px'
                              }}
                              title={isServedB ? 'Option B: Served' : elig?.b.reason_if_unserved || 'Option B: Unserved'}
                            >
                              B: {isServedB ? 'Served' : 'Unserved'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '4px', color: 'var(--color-intended)' }}
                            onClick={() => setSelectedProfileId(prof.id)}
                            title="Inspect persona details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Inspect Profile Modal / Detail View */}
          {selectedProfile && (
            <div style={{ 
              marginTop: 'var(--space-4)', 
              padding: 'var(--space-4)', 
              background: 'var(--color-surface-subtle)', 
              border: '1px solid var(--color-border)', 
              borderRadius: 'var(--radius-md)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>
                    {selectedProfile.id}
                  </span>
                  <span 
                    className="badge" 
                    style={{ 
                      background: selectedProfile.segment === 'intended' ? 'var(--color-intended-bg)' : selectedProfile.segment === 'adjacent' ? 'var(--color-adjacent-bg)' : 'var(--color-contrasting-bg)',
                      color: selectedProfile.segment === 'intended' ? 'var(--color-intended)' : selectedProfile.segment === 'adjacent' ? 'var(--color-adjacent)' : 'var(--color-contrasting)',
                      textTransform: 'capitalize',
                      fontWeight: 600
                    }}
                  >
                    {selectedProfile.segment} Persona
                  </span>
                  <span className="badge" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                    <MapPin size={11} style={{ marginRight: '3px' }} /> {selectedProfile.market}
                  </span>
                  <span className="badge" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                    <DollarSign size={11} style={{ marginRight: '3px' }} /> Budget: {currency} {selectedProfile.budget_min} – {currency} {selectedProfile.budget_max}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setSelectedProfileId(null)}
                >
                  Close Inspection
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <strong>Primary Motivation & Use Case:</strong>
                  <p style={{ marginTop: '3px', color: 'var(--color-text-primary)' }}>{selectedProfile.use_case}</p>

                  <strong style={{ display: 'block', marginTop: '8px' }}>Access Channel / Context:</strong>
                  <p style={{ marginTop: '2px', color: 'var(--color-text-secondary)' }}>{selectedProfile.access_mode}</p>
                </div>
                <div>
                  <strong>Key Constraints:</strong>
                  <ul style={{ paddingLeft: '16px', marginTop: '3px', color: 'var(--color-text-secondary)' }}>
                    {selectedProfile.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>

                  <strong style={{ display: 'block', marginTop: '8px' }}>Evaluation Priorities:</strong>
                  <ul style={{ paddingLeft: '16px', marginTop: '3px', color: 'var(--color-text-secondary)' }}>
                    {selectedProfile.priorities.map((pr, i) => (
                      <li key={i}>{pr}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Deterministic Access Details */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px', fontSize: '11px' }}>
                <div>
                  <strong>Option A Deterministic Eligibility: </strong>
                  {profileEligibility[selectedProfile.id]?.a.is_eligible ? (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Served (Reachable in {selectedProfile.market})</span>
                  ) : (
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{profileEligibility[selectedProfile.id]?.a.reason_if_unserved}</span>
                  )}
                </div>
                <div>
                  <strong>Option B Deterministic Eligibility: </strong>
                  {profileEligibility[selectedProfile.id]?.b.is_eligible ? (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Served (Reachable in {selectedProfile.market})</span>
                  ) : (
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{profileEligibility[selectedProfile.id]?.b.reason_if_unserved}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
