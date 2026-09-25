import React, { useState, useEffect, useCallback } from 'react';
import { 
  DomainId, 
  PrimaryLever, 
  ImageMetadata, 
  TestDraftPayloadSchema, 
  TestDraftPayload,
  Test
} from '@droptest/shared';
import { DomainSelector } from '../components/SetupTest/DomainSelector.js';
import { AudienceLocationForm } from '../components/SetupTest/AudienceLocationForm.js';
import { OfferingForm } from '../components/SetupTest/OfferingForm.js';
import { AlternativeBForm, OptionAData, OptionBData } from '../components/SetupTest/AlternativeBForm.js';
import { FinancialsForm } from '../components/SetupTest/FinancialsForm.js';
import { AssumptionSummary } from '../components/SetupTest/AssumptionSummary.js';
import { ProfileReviewPanel } from '../components/SetupTest/ProfileReviewPanel.js';
import { DOMAIN_PRESETS, BLANK_PRESET } from '../config/templates.js';
import { RotateCcw, Sparkles, FolderOpen } from 'lucide-react';

interface SetupTestPageProps {
  onSaveSuccess?: (savedData: any) => void;
  onNavigateToResults?: () => void;
  onUpdateHeaderTitle?: (title: string) => void;
  setSaveStatus?: (status: 'saved' | 'saving' | 'error' | 'idle') => void;
}

export const SetupTestPage: React.FC<SetupTestPageProps> = ({
  onSaveSuccess,
  onNavigateToResults: _onNavigateToResults,
  onUpdateHeaderTitle,
  setSaveStatus
}) => {
  // Active test ID if saved
  const [testId, setTestId] = useState<string | undefined>(undefined);
  const [savedDraftsList, setSavedDraftsList] = useState<Test[]>([]);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Load initial preset (Clothing)
  const initialPreset = DOMAIN_PRESETS.clothing_accessories.payload;

  // 1. Domain
  const [domainId, setDomainId] = useState<DomainId>(initialPreset.test.domain_id);

  // 2. Offering Core
  const [title, setTitle] = useState(initialPreset.test.title);
  const [shortValueProp, setShortValueProp] = useState(initialPreset.offering.short_value_prop);
  const [description, setDescription] = useState(initialPreset.offering.description);
  const [currency, setCurrency] = useState(initialPreset.offering.currency);
  const [period, setPeriod] = useState(initialPreset.offering.period);
  const [domainSpecificData, setDomainSpecificData] = useState<any>(initialPreset.offering.domain_specific_data);

  // 3. Option A (Baseline)
  const [optionA, setOptionA] = useState<OptionAData>({
    name: initialPreset.option_a.name,
    price: initialPreset.option_a.price,
    primary_message: initialPreset.option_a.primary_message,
    served_markets: initialPreset.option_a.served_markets,
    fulfillment_mode: initialPreset.option_a.fulfillment_mode,
    images: initialPreset.option_a.images || [],
    variable_cost_per_sale: initialPreset.option_a.variable_cost_per_sale,
    fixed_launch_cost: initialPreset.option_a.fixed_launch_cost,
    capacity_units: initialPreset.option_a.capacity_units
  });

  // 4. Comparison Lever & Option B (Alternative)
  const [comparisonLever, setComparisonLever] = useState<PrimaryLever>(initialPreset.comparison_lever);
  const [optionB, setOptionB] = useState<OptionBData>({
    name: initialPreset.option_b.name,
    price: initialPreset.option_b.price,
    primary_message: initialPreset.option_b.primary_message,
    served_markets: initialPreset.option_b.served_markets,
    fulfillment_mode: initialPreset.option_b.fulfillment_mode,
    images: initialPreset.option_b.images || [],
    variable_cost_per_sale: initialPreset.option_b.variable_cost_per_sale,
    fixed_launch_cost: initialPreset.option_b.fixed_launch_cost,
    capacity_units: initialPreset.option_b.capacity_units
  });

  // 5. Audience & Location Config
  const [intendedBuyer, setIntendedBuyer] = useState(initialPreset.audience_config.intended_buyer_description);
  const [adjacentBuyer, setAdjacentBuyer] = useState(initialPreset.audience_config.adjacent_buyer_description);
  const [expectedSpendMin, setExpectedSpendMin] = useState(initialPreset.audience_config.expected_spend_min);
  const [expectedSpendMax, setExpectedSpendMax] = useState(initialPreset.audience_config.expected_spend_max);
  const [audienceMarkets, setAudienceMarkets] = useState<string[]>(initialPreset.audience_config.audience_markets);

  // 6. Financial scenarios
  const [fixedCost, setFixedCost] = useState<number | undefined>(initialPreset.option_a.fixed_launch_cost);
  const [varCostA, setVarCostA] = useState<number | undefined>(initialPreset.option_a.variable_cost_per_sale);
  const [varCostB, setVarCostB] = useState<number | undefined>(initialPreset.option_b.variable_cost_per_sale);
  const [capacityUnits, setCapacityUnits] = useState<number | undefined>(initialPreset.option_a.capacity_units);
  const [lowerUnits, setLowerUnits] = useState<number | undefined>(30);
  const [centralUnits, setCentralUnits] = useState<number | undefined>(60);
  const [higherUnits, setHigherUnits] = useState<number | undefined>(90);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [missingInputs, setMissingInputs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase0Notice, setPhase0Notice] = useState<string | null>(null);

  // Fetch saved drafts list from SQLite
  const fetchDraftsList = useCallback(async () => {
    try {
      const res = await fetch('/api/tests');
      if (res.ok) {
        const data = await res.json();
        setSavedDraftsList(data.tests || []);
      }
    } catch (e) {
      console.error('Error fetching drafts:', e);
    }
  }, []);

  useEffect(() => {
    fetchDraftsList();
  }, [fetchDraftsList]);

  // Function to apply a preset payload
  const applyPreset = (payload: TestDraftPayload, keepId = false) => {
    if (!keepId) {
      setTestId(undefined);
    }
    setDomainId(payload.test.domain_id);
    setTitle(payload.test.title);
    setShortValueProp(payload.offering.short_value_prop);
    setDescription(payload.offering.description);
    setCurrency(payload.offering.currency);
    setPeriod(payload.offering.period);
    setDomainSpecificData(payload.offering.domain_specific_data || {});

    setOptionA({
      name: payload.option_a.name,
      price: payload.option_a.price,
      primary_message: payload.option_a.primary_message,
      served_markets: payload.option_a.served_markets,
      fulfillment_mode: payload.option_a.fulfillment_mode,
      images: payload.option_a.images || [],
      variable_cost_per_sale: payload.option_a.variable_cost_per_sale,
      fixed_launch_cost: payload.option_a.fixed_launch_cost,
      capacity_units: payload.option_a.capacity_units
    });

    setComparisonLever(payload.comparison_lever);
    setOptionB({
      name: payload.option_b.name,
      price: payload.option_b.price,
      primary_message: payload.option_b.primary_message,
      served_markets: payload.option_b.served_markets,
      fulfillment_mode: payload.option_b.fulfillment_mode,
      images: payload.option_b.images || [],
      variable_cost_per_sale: payload.option_b.variable_cost_per_sale,
      fixed_launch_cost: payload.option_b.fixed_launch_cost,
      capacity_units: payload.option_b.capacity_units
    });

    setIntendedBuyer(payload.audience_config.intended_buyer_description);
    setAdjacentBuyer(payload.audience_config.adjacent_buyer_description);
    setExpectedSpendMin(payload.audience_config.expected_spend_min);
    setExpectedSpendMax(payload.audience_config.expected_spend_max);
    setAudienceMarkets(payload.audience_config.audience_markets);

    setFixedCost(payload.option_a.fixed_launch_cost);
    setVarCostA(payload.option_a.variable_cost_per_sale);
    setVarCostB(payload.option_b.variable_cost_per_sale);
    setCapacityUnits(payload.option_a.capacity_units);
  };

  // Load a saved draft by ID from SQLite
  const loadDraftById = async (id: string) => {
    setIsLoadingDraft(true);
    try {
      const res = await fetch(`/api/tests/${id}`);
      if (res.ok) {
        const full = await res.json();
        setTestId(full.test.id);
        const payload: TestDraftPayload = {
          test: { id: full.test.id, title: full.test.title, domain_id: full.test.domain_id },
          offering: full.offering,
          option_a: full.options.A,
          option_b: full.options.B,
          audience_config: full.audience_config,
          comparison_lever: full.comparison_lever
        };
        applyPreset(payload, true);
        if (setSaveStatus) setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    } finally {
      setIsLoadingDraft(false);
    }
  };

  // Synchronize header title
  useEffect(() => {
    if (onUpdateHeaderTitle) {
      onUpdateHeaderTitle(title || 'New Test Draft');
    }
  }, [title, onUpdateHeaderTitle]);

  // Construct current payload
  const currentPayload: TestDraftPayload = {
    test: {
      id: testId,
      title,
      domain_id: domainId
    },
    offering: {
      short_value_prop: shortValueProp,
      description,
      currency,
      period,
      domain_specific_data: domainSpecificData
    },
    option_a: {
      name: optionA.name,
      price: optionA.price,
      primary_message: optionA.primary_message,
      served_markets: optionA.served_markets,
      fulfillment_mode: optionA.fulfillment_mode,
      images: optionA.images,
      variable_cost_per_sale: varCostA,
      fixed_launch_cost: fixedCost,
      capacity_units: capacityUnits
    },
    option_b: {
      name: optionB.name,
      price: optionB.price,
      primary_message: optionB.primary_message,
      served_markets: optionB.served_markets,
      fulfillment_mode: optionB.fulfillment_mode,
      images: optionB.images,
      variable_cost_per_sale: varCostB,
      fixed_launch_cost: fixedCost,
      capacity_units: capacityUnits
    },
    audience_config: {
      intended_buyer_description: intendedBuyer,
      adjacent_buyer_description: adjacentBuyer,
      expected_spend_min: expectedSpendMin,
      expected_spend_max: expectedSpendMax,
      audience_markets: audienceMarkets
    },
    comparison_lever: comparisonLever
  };

  // Live validation
  useEffect(() => {
    const parseResult = TestDraftPayloadSchema.safeParse(currentPayload);
    const errors: Record<string, string> = {};
    const missing: string[] = [];

    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        const pathStr = issue.path.join('.');
        errors[pathStr] = issue.message;
        missing.push(issue.message);
      }
    }

    setValidationErrors(errors);
    setMissingInputs(missing);
  }, [
    testId, title, domainId, shortValueProp, description, currency, period, domainSpecificData,
    optionA, optionB, comparisonLever, intendedBuyer, adjacentBuyer,
    expectedSpendMin, expectedSpendMax, audienceMarkets, fixedCost, varCostA, varCostB, capacityUnits
  ]);

  const handleSaveDraft = async (): Promise<boolean> => {
    if (setSaveStatus) setSaveStatus('saving');
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayload)
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Save error:', err);
        if (setSaveStatus) setSaveStatus('error');
        return false;
      }

      const saved = await res.json();
      setTestId(saved.test.id);
      if (setSaveStatus) setSaveStatus('saved');
      if (onSaveSuccess) onSaveSuccess(saved);
      fetchDraftsList();
      return true;
    } catch (e) {
      console.error('Save network error:', e);
      if (setSaveStatus) setSaveStatus('error');
      return false;
    }
  };

  const handleRunSimulation = async () => {
    setIsSubmitting(true);
    const saved = await handleSaveDraft();
    setIsSubmitting(false);

    if (saved) {
      setPhase0Notice(
        'Test configuration saved successfully to SQLite database with locked schema and 50-profile contracts. (Phase 1 intake complete; simulation runner executes in Phase 2).'
      );
    }
  };

  const handleUploadImage = async (file: File): Promise<ImageMetadata | null> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        alert('Image upload failed. Check file size (max 5MB) and format.');
        return null;
      }

      const meta: ImageMetadata = await res.json();
      return meta;
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload failed due to a network error.');
      return null;
    }
  };

  const handleDomainSelect = (newDomainId: DomainId) => {
    if (newDomainId === domainId) return;
    setDomainId(newDomainId);
    // Automatically load matching domain template
    const preset = DOMAIN_PRESETS[newDomainId];
    if (preset) {
      applyPreset(preset.payload, false);
    }
  };

  return (
    <div className="workbench-grid">
      {/* 65% Main Setup Column */}
      <div className="setup-column">
        {/* First Fold Guidance Card */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Set up your comparative launch test
              </h2>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Enter your offering details, choose <strong>Option A (Baseline)</strong> and <strong>Option B (Alternative)</strong>, configure your audience markets, and preview the <strong>50 distinct simulated personas</strong> before running the evaluation.
              </p>
            </div>
            
            {/* Saved Drafts Switcher */}
            {savedDraftsList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <FolderOpen size={14} color="var(--color-text-muted)" />
                <select
                  className="form-select"
                  style={{ fontSize: '11px', padding: '3px 8px', maxWidth: '180px' }}
                  value={testId || ''}
                  onChange={e => {
                    if (e.target.value) {
                      loadDraftById(e.target.value);
                    }
                  }}
                  disabled={isLoadingDraft}
                >
                  <option value="" disabled>Load saved draft...</option>
                  {savedDraftsList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title.length > 20 ? `${d.title.substring(0, 20)}...` : d.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <Sparkles size={13} />
              <span>Quick Starter Presets:</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => applyPreset(DOMAIN_PRESETS.clothing_accessories.payload)}
              >
                Apparel Preset
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => applyPreset(DOMAIN_PRESETS.local_food_beverages.payload)}
              >
                Food Preset
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => applyPreset(DOMAIN_PRESETS.digital_products_services.payload)}
              >
                Digital SaaS Preset
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--color-danger)' }}
                onClick={() => applyPreset(BLANK_PRESET)}
              >
                <RotateCcw size={11} /> Clear Form
              </button>
            </div>
          </div>
        </div>

        {phase0Notice && (
          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', color: '#166534', fontSize: 'var(--font-size-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{phase0Notice}</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '4px 8px' }}
              onClick={() => setPhase0Notice(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Domain */}
        <DomainSelector
          selectedDomain={domainId}
          onSelectDomain={handleDomainSelect}
        />

        {/* Step 2: Audience & Location */}
        <AudienceLocationForm
          intendedBuyer={intendedBuyer}
          onChangeIntendedBuyer={setIntendedBuyer}
          adjacentBuyer={adjacentBuyer}
          onChangeAdjacentBuyer={setAdjacentBuyer}
          expectedSpendMin={expectedSpendMin}
          onChangeExpectedSpendMin={setExpectedSpendMin}
          expectedSpendMax={expectedSpendMax}
          onChangeExpectedSpendMax={setExpectedSpendMax}
          currency={currency}
          audienceMarkets={audienceMarkets}
          onChangeAudienceMarkets={setAudienceMarkets}
          validationErrors={validationErrors}
        />

        {/* Step 3: Offering & Baseline A */}
        <OfferingForm
          domainId={domainId}
          title={title}
          onChangeTitle={setTitle}
          shortValueProp={shortValueProp}
          onChangeShortValueProp={setShortValueProp}
          description={description}
          onChangeDescription={setDescription}
          currency={currency}
          onChangeCurrency={setCurrency}
          period={period}
          onChangePeriod={setPeriod}
          domainSpecificData={domainSpecificData}
          onChangeDomainSpecificData={setDomainSpecificData}
          optionA={optionA}
          onChangeOptionA={setOptionA}
          audienceMarkets={audienceMarkets}
          onUploadImage={handleUploadImage}
          validationErrors={validationErrors}
        />

        {/* Step 4: Alternative B & Comparison Lever */}
        <AlternativeBForm
          comparisonLever={comparisonLever}
          onChangeComparisonLever={setComparisonLever}
          optionB={optionB}
          onChangeOptionB={setOptionB}
          optionA={optionA}
          currency={currency}
          audienceMarkets={audienceMarkets}
          onUploadImage={handleUploadImage}
          validationErrors={validationErrors}
        />

        {/* Step 5: Deterministic Financials */}
        <FinancialsForm
          currency={currency}
          period={period}
          priceA={optionA.price}
          priceB={optionB.price}
          variableCostA={varCostA}
          onChangeVariableCostA={setVarCostA}
          variableCostB={varCostB}
          onChangeVariableCostB={setVarCostB}
          fixedCost={fixedCost}
          onChangeFixedCost={setFixedCost}
          capacityUnits={capacityUnits}
          onChangeCapacityUnits={setCapacityUnits}
          lowerUnits={lowerUnits}
          onChangeLowerUnits={setLowerUnits}
          centralUnits={centralUnits}
          onChangeCentralUnits={setCentralUnits}
          higherUnits={higherUnits}
          onChangeHigherUnits={setHigherUnits}
        />

        {/* Step 6: 50-Profile Panel & Deterministic Eligibility Review */}
        <ProfileReviewPanel
          testId={testId}
          domainId={domainId}
          intendedBuyer={intendedBuyer}
          adjacentBuyer={adjacentBuyer}
          expectedSpendMin={expectedSpendMin}
          expectedSpendMax={expectedSpendMax}
          audienceMarkets={audienceMarkets}
          currency={currency}
          optionA={{ name: optionA.name, served_markets: optionA.served_markets }}
          optionB={{ name: optionB.name, served_markets: optionB.served_markets }}
        />
      </div>

      {/* 35% Sticky Sidebar Assumption Summary */}
      <AssumptionSummary
        audienceMarkets={audienceMarkets}
        servedMarketsA={optionA.served_markets}
        servedMarketsB={optionB.served_markets}
        intendedBuyer={intendedBuyer}
        adjacentBuyer={adjacentBuyer}
        expectedSpendMin={expectedSpendMin}
        expectedSpendMax={expectedSpendMax}
        currency={currency}
        comparisonLever={comparisonLever}
        priceA={optionA.price}
        priceB={optionB.price}
        missingInputs={missingInputs}
        isValid={missingInputs.length === 0}
        onRunSimulation={handleRunSimulation}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
