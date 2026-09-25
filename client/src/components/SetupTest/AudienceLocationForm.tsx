import React, { useState } from 'react';
import { Users, MapPin, Plus, X } from 'lucide-react';
import { PANEL_CONSTANTS } from '@droptest/shared';

interface AudienceLocationFormProps {
  intendedBuyer: string;
  onChangeIntendedBuyer: (val: string) => void;
  adjacentBuyer: string;
  onChangeAdjacentBuyer: (val: string) => void;
  expectedSpendMin: number;
  onChangeExpectedSpendMin: (val: number) => void;
  expectedSpendMax: number;
  onChangeExpectedSpendMax: (val: number) => void;
  currency: string;
  audienceMarkets: string[];
  onChangeAudienceMarkets: (markets: string[]) => void;
  validationErrors?: Record<string, string>;
}

export const AudienceLocationForm: React.FC<AudienceLocationFormProps> = ({
  intendedBuyer,
  onChangeIntendedBuyer,
  adjacentBuyer,
  onChangeAdjacentBuyer,
  expectedSpendMin,
  onChangeExpectedSpendMin,
  expectedSpendMax,
  onChangeExpectedSpendMax,
  currency,
  audienceMarkets,
  onChangeAudienceMarkets,
  validationErrors = {}
}) => {
  const [newMarketInput, setNewMarketInput] = useState('');

  const handleAddMarket = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMarketInput.trim();
    if (!trimmed) return;
    if (audienceMarkets.includes(trimmed)) return;
    if (audienceMarkets.length >= PANEL_CONSTANTS.MAX_AUDIENCE_MARKETS) return;

    onChangeAudienceMarkets([...audienceMarkets, trimmed]);
    setNewMarketInput('');
  };

  const handleRemoveMarket = (index: number) => {
    const updated = audienceMarkets.filter((_, i) => i !== index);
    onChangeAudienceMarkets(updated);
  };

  return (
    <div className="workbench-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span className="card-step-badge">2</span>
            <span>Audience & Location Assumptions</span>
          </h2>
          <p className="card-description">
            Configure the 50-profile simulated panel split (20 intended / 20 adjacent / 10 contrasting) and target markets.
          </p>
        </div>
      </div>

      {/* Audience Descriptions */}
      <div className="form-group">
        <label className="form-label" htmlFor="intended-buyer">
          <Users size={14} color="var(--color-intended)" />
          <span>Intended Buyer Description (20 Profiles)</span>
          <span className="required">*</span>
        </label>
        <textarea
          id="intended-buyer"
          className="form-textarea"
          placeholder="e.g. Eco-conscious young professionals (25-35) looking for high-quality sustainable linen clothing"
          value={intendedBuyer}
          onChange={e => onChangeIntendedBuyer(e.target.value)}
        />
        <span className="form-help">Describe who you primarily expect to buy this offering.</span>
        {validationErrors['audience_config.intended_buyer_description'] && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {validationErrors['audience_config.intended_buyer_description']}
          </span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="adjacent-buyer">
          <Users size={14} color="var(--color-adjacent)" />
          <span>Adjacent Buyer Description (20 Profiles)</span>
          <span className="required">*</span>
        </label>
        <textarea
          id="adjacent-buyer"
          className="form-textarea"
          placeholder="e.g. University students or gift buyers looking for aesthetic durable natural fabrics"
          value={adjacentBuyer}
          onChange={e => onChangeAdjacentBuyer(e.target.value)}
        />
        <span className="form-help">Describe a plausible neighboring audience with related needs or different buying contexts.</span>
        {validationErrors['audience_config.adjacent_buyer_description'] && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {validationErrors['audience_config.adjacent_buyer_description']}
          </span>
        )}
      </div>

      {/* Expected Spend Range */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="spend-min">
            <span>Expected Spend Min ({currency})</span>
            <span className="required">*</span>
          </label>
          <input
            id="spend-min"
            type="number"
            min="0"
            step="any"
            className="form-input tabular-nums"
            value={isNaN(expectedSpendMin) ? '' : expectedSpendMin}
            onChange={e => onChangeExpectedSpendMin(parseFloat(e.target.value) || 0)}
          />
          <span className="form-help">Minimum price this buyer group typically pays.</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="spend-max">
            <span>Expected Spend Max ({currency})</span>
            <span className="required">*</span>
          </label>
          <input
            id="spend-max"
            type="number"
            min="0"
            step="any"
            className="form-input tabular-nums"
            value={isNaN(expectedSpendMax) ? '' : expectedSpendMax}
            onChange={e => onChangeExpectedSpendMax(parseFloat(e.target.value) || 0)}
          />
          <span className="form-help">Maximum budget ceiling before immediate drop-off.</span>
        </div>
      </div>
      {validationErrors['audience_config.expected_spend_max'] && (
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-3)' }}>
          {validationErrors['audience_config.expected_spend_max']}
        </div>
      )}

      {/* Audience Markets */}
      <div className="form-group">
        <label className="form-label">
          <MapPin size={14} />
          <span>Audience Markets (1 to 4 Target Regions)</span>
          <span className="required">*</span>
        </label>
        <span className="form-help" style={{ marginBottom: '8px' }}>
          Specific cities, neighborhoods, or country zones where your simulated personas reside.
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          {audienceMarkets.map((market, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500
              }}
            >
              <span>{market}</span>
              <button
                type="button"
                onClick={() => handleRemoveMarket(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  color: 'var(--color-text-muted)'
                }}
                title="Remove market"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        {audienceMarkets.length < PANEL_CONSTANTS.MAX_AUDIENCE_MARKETS && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Bangalore Urban, Chennai Central, Delhi NCR"
              value={newMarketInput}
              onChange={e => setNewMarketInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMarket(e);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddMarket}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        )}
        {validationErrors['audience_config.audience_markets'] && (
          <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
            {validationErrors['audience_config.audience_markets']}
          </span>
        )}
      </div>
    </div>
  );
};
