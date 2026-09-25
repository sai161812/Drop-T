import React, { useState, useMemo } from 'react';
import { 
  ProfileTransition, 
  AudienceSegment, 
  ResponseCategory, 
  TransitionType,
  CompetitorReference
} from '@droptest/shared';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Users
} from 'lucide-react';

interface PersonaTransitionTableProps {
  transitions: ProfileTransition[];
  nameA: string;
  nameB?: string;
  references?: CompetitorReference[];
}

export const PersonaTransitionTable: React.FC<PersonaTransitionTableProps> = ({
  transitions,
  nameA,
  nameB,
  references = []
}) => {
  const isComparison = Boolean(nameB);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | AudienceSegment>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [transitionFilter, setTransitionFilter] = useState<'all' | TransitionType>('all');
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const uniqueMarkets = useMemo(() => {
    return Array.from(new Set(transitions.map(t => t.market))).sort();
  }, [transitions]);

  const filteredTransitions = useMemo(() => {
    return transitions.filter(t => {
      if (segmentFilter !== 'all' && t.segment !== segmentFilter) return false;
      if (marketFilter !== 'all' && t.market !== marketFilter) return false;
      if (isComparison && transitionFilter !== 'all' && t.transition_type !== transitionFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.profile_id.toLowerCase().includes(q);
        const matchesUseCase = t.use_case.toLowerCase().includes(q);
        const matchesReasonA = t.reason_a.toLowerCase().includes(q);
        const matchesReasonB = isComparison && t.reason_b ? t.reason_b.toLowerCase().includes(q) : false;
        const matchesObjA = (t.primary_objection_a || '').toLowerCase().includes(q);
        const matchesObjB = (t.primary_objection_b || '').toLowerCase().includes(q);
        const matchesMarket = t.market.toLowerCase().includes(q);

        if (!matchesId && !matchesUseCase && !matchesReasonA && !matchesReasonB && !matchesObjA && !matchesObjB && !matchesMarket) {
          return false;
        }
      }

      return true;
    });
  }, [transitions, segmentFilter, marketFilter, transitionFilter, searchQuery, isComparison]);

  const getResponseBadge = (resp: ResponseCategory | 'missing') => {
    switch (resp) {
      case 'interested':
        return (
          <span className="badge" style={{ background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>
            Interested
          </span>
        );
      case 'unsure':
        return (
          <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
            Unsure
          </span>
        );
      case 'not_interested':
        return (
          <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>
            Not Interested
          </span>
        );
      case 'unavailable':
        return (
          <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
            Unserved
          </span>
        );
      case 'missing':
        return <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>Missing response</span>;
    }
  };

  const getTransitionBadge = (type: TransitionType) => {
    switch (type) {
      case 'became_interested':
        return <span className="badge" style={{ background: '#DCFCE7', color: '#166534', fontSize: '10px' }}>+ Gained Interest</span>;
      case 'lost_interest':
        return <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '10px' }}>- Lost Interest</span>;
      case 'remained_interested':
        return <span className="badge" style={{ background: '#F0FDF4', color: '#15803D', fontSize: '10px' }}>Stable Interest</span>;
      case 'access_opened':
        return <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px' }}>Access Opened</span>;
      case 'access_closed':
        return <span className="badge" style={{ background: '#FEF2F2', color: '#B91C1C', fontSize: '10px' }}>Access Closed</span>;
      case 'remained_hesitant':
      default:
        return <span className="badge" style={{ background: '#F1F5F9', color: '#64748B', fontSize: '10px' }}>Remained Hesitant</span>;
    }
  };

  const citationLinks = (sourceIds?: string[]) => sourceIds?.map(sourceId => {
    const index = references.findIndex(ref => ref.id === sourceId);
    const ref = references[index];
    if (!ref) return null;
    return (
      <a key={sourceId} href={ref.url} target="_blank" rel="noreferrer"
        onClick={event => event.stopPropagation()} className="badge"
        style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '9px', fontWeight: 600, textDecoration: 'none' }}>
        REF-{index + 1}
      </a>
    );
  });

  return (
    <div 
      className="card" 
      style={{ 
        marginBottom: 'var(--space-5)', 
        border: '1px solid var(--color-border)', 
        background: 'var(--color-surface)',
        padding: 'var(--space-4)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: 'var(--space-3)' }}>
        <div>
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} />
            <span>{isComparison ? '50-Persona Paired Response Drill-Down' : '50 Simulated Persona Evaluations'}</span>
          </h4>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {isComparison 
              ? 'Examine how every individual buyer persona shifted their decision between Option A and Option B.'
              : 'Inspect each individual buyer persona\'s simulated evaluation, top objection, and decision rationale.'}
          </p>
        </div>

        <span className="badge" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
          Showing {filteredTransitions.length} of {transitions.length} Personas
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search use case, reason, objection..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '30px', fontSize: '12px', height: '32px' }}
          />
        </div>

        {/* Segment Filter */}
        <select
          className="select"
          value={segmentFilter}
          onChange={e => setSegmentFilter(e.target.value as any)}
          style={{ width: 'auto', fontSize: '12px', height: '32px' }}
        >
          <option value="all">All Segments (50)</option>
          <option value="intended">Intended (20)</option>
          <option value="adjacent">Adjacent (20)</option>
          <option value="contrasting">Contrasting (10)</option>
        </select>

        {/* Market Filter */}
        <select
          className="select"
          value={marketFilter}
          onChange={e => setMarketFilter(e.target.value)}
          style={{ width: 'auto', fontSize: '12px', height: '32px' }}
        >
          <option value="all">All Markets</option>
          {uniqueMarkets.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Transition Filter (Comparison Mode only) */}
        {isComparison && (
          <select
            className="select"
            value={transitionFilter}
            onChange={e => setTransitionFilter(e.target.value as any)}
            style={{ width: 'auto', fontSize: '12px', height: '32px' }}
          >
            <option value="all">All Transitions</option>
            <option value="became_interested">+ Became Interested</option>
            <option value="lost_interest">- Lost Interest</option>
            <option value="remained_interested">Stable Interest</option>
            <option value="remained_hesitant">Remained Hesitant</option>
            <option value="access_opened">Access Opened</option>
            <option value="access_closed">Access Closed</option>
          </select>
        )}
      </div>

      {/* 50-Row Persona Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <th style={{ padding: '8px 12px', fontWeight: 600, width: '70px' }}>ID</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, width: '130px' }}>Segment / Market</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, width: isComparison ? '35%' : '70%' }}>
                {isComparison ? `Option A (${nameA})` : `Evaluation Response (${nameA})`}
              </th>
              {isComparison && <th style={{ padding: '8px 12px', fontWeight: 600, width: '35%' }}>Option B ({nameB})</th>}
              {isComparison && <th style={{ padding: '8px 12px', fontWeight: 600, width: '110px', textAlign: 'right' }}>Shift</th>}
              <th style={{ padding: '8px 8px', width: '36px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransitions.map((t, idx) => {
              const isExpanded = expandedProfileId === t.profile_id;

              return (
                <React.Fragment key={t.profile_id}>
                  <tr
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`Inspect ${t.profile_id}`}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedProfileId(isExpanded ? null : t.profile_id); } }}
                    style={{ 
                      borderBottom: '1px solid var(--color-border-subtle)', 
                      background: isExpanded ? '#F8FAFC' : idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-subtle)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedProfileId(isExpanded ? null : t.profile_id)}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600, verticalAlign: 'top', color: 'var(--color-text-secondary)' }}>
                      {t.profile_id}
                    </td>

                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <span className={`badge badge-${t.segment}`} style={{ fontSize: '10px', textTransform: 'capitalize', display: 'inline-block', marginBottom: '2px' }}>
                        {t.segment}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {t.market}
                      </div>
                    </td>

                    {/* Option A Cell */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {getResponseBadge(t.response_a)}
                        {t.primary_objection_a && (
                          <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>
                            {t.primary_objection_a}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--color-text-primary)', fontSize: '11px', lineHeight: '1.4', margin: 0 }}>
                        {t.reason_a}
                      </p>
                      {t.source_ids_a && t.source_ids_a.length > 0 && (
                        <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {citationLinks(t.source_ids_a)}
                          <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: '9px', fontWeight: 600 }}>
                            🔗 Compares with market reference
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Option B Cell (If comparison) */}
                    {isComparison && (
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          {getResponseBadge(t.response_b)}
                          {t.primary_objection_b && (
                            <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>
                              {t.primary_objection_b}
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--color-text-primary)', fontSize: '11px', lineHeight: '1.4', margin: 0 }}>
                          {t.reason_b}
                        </p>
                        {t.source_ids_b && t.source_ids_b.length > 0 && (
                          <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {citationLinks(t.source_ids_b)}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Transition Badge (If comparison) */}
                    {isComparison && (
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                        {getTransitionBadge(t.transition_type)}
                      </td>
                    )}

                    {/* Expand Arrow */}
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>

                  {/* Expandable Drill-Down Details Drawer */}
                  {isExpanded && (
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--color-border)' }}>
                      <td colSpan={isComparison ? 6 : 4} style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                          {/* Left: Persona Attributes */}
                          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Persona Specs ({t.profile_id})
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                              <p style={{ margin: '0 0 6px 0' }}>
                                <strong>Use Case: </strong>
                                <span>{t.use_case}</span>
                              </p>
                              <p style={{ margin: '0 0 6px 0' }}>
                                <strong>Budget Band: </strong>
                                <span className="tabular-nums">${t.budget_min} – ${t.budget_max}</span>
                              </p>
                              <p style={{ margin: '0 0 6px 0' }}>
                                <strong>Constraints: </strong>
                                <span>{t.constraints.join(', ') || 'None stated'}</span>
                              </p>
                              <p style={{ margin: '0 0 6px 0' }}>
                                <strong>Priorities: </strong>
                                <span>{t.priorities.join(', ') || 'Standard'}</span>
                              </p>
                              <p style={{ margin: 0 }}>
                                <strong>Fulfillment Context: </strong>
                                <span>{t.access_mode}</span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Referenced Facts & Factor Tags */}
                          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Evaluation Influences & Facts
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                {isComparison ? 'Option A Referenced Facts:' : 'Referenced Product Facts:'}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {t.referenced_fields_a && t.referenced_fields_a.length > 0 ? (
                                  t.referenced_fields_a.map((f, i) => (
                                    <span key={i} className="badge" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                                      {f}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Core specification & price</span>
                                )}
                              </div>
                            </div>

                            {isComparison && t.referenced_fields_b && (
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                  Option B Referenced Facts:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {t.referenced_fields_b.length > 0 ? (
                                    t.referenced_fields_b.map((f, i) => (
                                      <span key={i} className="badge" style={{ background: 'var(--color-surface-subtle)', color: 'var(--color-accent)', fontSize: '10px' }}>
                                        {f}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Core specification & price</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
