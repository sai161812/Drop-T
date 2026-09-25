import React, { useState, useEffect } from 'react';
import { DomainId, PrimaryLever, ImageMetadata, TestDraftPayloadSchema, TestDraftPayload } from '@droptest/shared';
import { DomainSelector } from '../components/SetupTest/DomainSelector.js';
import { AudienceLocationForm } from '../components/SetupTest/AudienceLocationForm.js';
import { OfferingForm } from '../components/SetupTest/OfferingForm.js';
import { AlternativeBForm, OptionAData, OptionBData } from '../components/SetupTest/AlternativeBForm.js';
import { FinancialsForm } from '../components/SetupTest/FinancialsForm.js';
import { AssumptionSummary } from '../components/SetupTest/AssumptionSummary.js';

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
  // 1. Domain
  const [domainId, setDomainId] = useState<DomainId>('clothing_accessories');

  // 2. Offering Core
  const [title, setTitle] = useState('Organic Handloom Linen Shirt');
  const [shortValueProp, setShortValueProp] = useState('Breathable organic linen shirt handcrafted for warm humid climates');
  const [description, setDescription] = useState('Made from 100% natural organic flax linen with natural horn buttons and relaxed fit. Machine washable and pre-shrunk.');
  const [currency, setCurrency] = useState('INR');
  const [period, setPeriod] = useState('launch_batch');
  const [domainSpecificData, setDomainSpecificData] = useState<any>({
    item_type: 'Shirt',
    material: '100% Organic Flax Linen',
    sizes: ['S', 'M', 'L', 'XL']
  });

  // 3. Option A (Baseline)
  const [optionA, setOptionA] = useState<OptionAData>({
    name: 'Baseline ₹699',
    price: 699,
    primary_message: 'Sustainable everyday comfort at an accessible launch price',
    served_markets: ['Bangalore Urban', 'Chennai Central'],
    fulfillment_mode: 'Standard postal shipping',
    images: [],
    variable_cost_per_sale: 299,
    fixed_launch_cost: 20000,
    capacity_units: 100
  });

  // 4. Comparison Lever & Option B (Alternative)
  const [comparisonLever, setComparisonLever] = useState<PrimaryLever>('price');
  const [optionB, setOptionB] = useState<OptionBData>({
    name: 'Premium ₹899',
    price: 899,
    primary_message: 'Sustainable luxury crafted with gift packaging included',
    served_markets: ['Bangalore Urban', 'Chennai Central'],
    fulfillment_mode: 'Standard postal shipping',
    images: [],
    variable_cost_per_sale: 320,
    fixed_launch_cost: 20000,
    capacity_units: 100
  });

  // 5. Audience & Location Config
  const [intendedBuyer, setIntendedBuyer] = useState('Young eco-conscious working professionals (25-35) looking for sustainable minimalist apparel');
  const [adjacentBuyer, setAdjacentBuyer] = useState('College students or gift buyers looking for durable natural aesthetic fabrics');
  const [expectedSpendMin, setExpectedSpendMin] = useState(500);
  const [expectedSpendMax, setExpectedSpendMax] = useState(1200);
  const [audienceMarkets, setAudienceMarkets] = useState<string[]>(['Bangalore Urban', 'Chennai Central', 'Hyderabad']);

  // 6. Financial scenarios
  const [fixedCost, setFixedCost] = useState<number | undefined>(20000);
  const [varCostA, setVarCostA] = useState<number | undefined>(299);
  const [varCostB, setVarCostB] = useState<number | undefined>(320);
  const [capacityUnits, setCapacityUnits] = useState<number | undefined>(100);
  const [lowerUnits, setLowerUnits] = useState<number | undefined>(30);
  const [centralUnits, setCentralUnits] = useState<number | undefined>(60);
  const [higherUnits, setHigherUnits] = useState<number | undefined>(90);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [missingInputs, setMissingInputs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase0Notice, setPhase0Notice] = useState<string | null>(null);

  // Synchronize header title
  useEffect(() => {
    if (onUpdateHeaderTitle) {
      onUpdateHeaderTitle(title);
    }
  }, [title, onUpdateHeaderTitle]);

  // Construct current payload
  const currentPayload: TestDraftPayload = {
    test: {
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
    title, domainId, shortValueProp, description, currency, period, domainSpecificData,
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
      if (setSaveStatus) setSaveStatus('saved');
      if (onSaveSuccess) onSaveSuccess(saved);
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
        'Test configuration saved successfully to SQLite database with locked schema and 50-profile contracts. (Phase 0 scope complete; simulation engine runs in Phase 1).'
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

  return (
    <div className="workbench-grid">
      {/* 65% Main Setup Column */}
      <div className="setup-column">
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
          onSelectDomain={setDomainId}
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
