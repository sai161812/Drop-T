import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ProfileReviewPanel } from '../components/SetupTest/ProfileReviewPanel.js';
import { PreflightLabCard } from '../components/SetupTest/PreflightLabCard.js';
import { DOMAIN_PRESETS } from '../config/templates.js';
import { 
  FolderOpen, 
  FlaskConical, 
  Rocket, 
  Package, 
  Users, 
  TrendingUp, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Play, 
  ArrowRight, 
  ArrowLeft, 
  Save,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import './SetupTestPage.css';

export type LabPageId = 'overview' | 'offering' | 'audience' | 'financials' | 'simulation';

interface SetupTestPageProps {
  onSaveSuccess?: (savedData: any) => void;
  onNavigateToResults?: () => void;
  onUpdateHeaderTitle?: (title: string) => void;
  setSaveStatus?: (status: 'saved' | 'saving' | 'error' | 'idle') => void;
  activeTestId?: string;
  onTestIdChange?: (id: string | undefined) => void;
  linkedProductId?: string;
  linkedProductReview?: 'resume' | 'new';
}

export const SetupTestPage: React.FC<SetupTestPageProps> = ({
  onSaveSuccess,
  onNavigateToResults,
  onUpdateHeaderTitle,
  setSaveStatus,
  activeTestId,
  onTestIdChange,
  linkedProductId,
  linkedProductReview = 'resume'
}) => {
  const { token } = useAuth();
  
  // Page navigation state (Default: 'overview')
  const [activePage, setActivePage] = useState<LabPageId>('overview');

  // Active test ID if saved
  const [testId, setTestId] = useState<string | undefined>(activeTestId);
  const [savedDraftsList, setSavedDraftsList] = useState<Test[]>([]);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [panelSeed, setPanelSeed] = useState(12345);
  const [isLocked, setIsLocked] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [labLoadError, setLabLoadError] = useState<string | null>(null);

  // Mode: Default to single-product review (50 evaluations)
  const [mode, setMode] = useState<'single' | 'comparison'>('single');
  const [linkedProduct, setLinkedProduct] = useState<any | null>(null);
  const [trialPrice, setTrialPrice] = useState<number | undefined>(undefined);
  const [skipResearch, setSkipResearch] = useState(false);
  const [researchRefreshKey, setResearchRefreshKey] = useState(0);

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
  const [comparisonLever, setComparisonLever] = useState<PrimaryLever>(initialPreset.comparison_lever || 'price');
  const [optionB, setOptionB] = useState<OptionBData>({
    name: initialPreset.option_b?.name || `${initialPreset.option_a.name} (Alt)`,
    price: initialPreset.option_b?.price ?? initialPreset.option_a.price,
    primary_message: initialPreset.option_b?.primary_message || initialPreset.option_a.primary_message,
    served_markets: initialPreset.option_b?.served_markets || initialPreset.option_a.served_markets,
    fulfillment_mode: initialPreset.option_b?.fulfillment_mode || initialPreset.option_a.fulfillment_mode,
    images: initialPreset.option_b?.images || initialPreset.option_a.images || [],
    variable_cost_per_sale: initialPreset.option_b?.variable_cost_per_sale ?? initialPreset.option_a.variable_cost_per_sale,
    fixed_launch_cost: initialPreset.option_b?.fixed_launch_cost ?? initialPreset.option_a.fixed_launch_cost,
    capacity_units: initialPreset.option_b?.capacity_units ?? initialPreset.option_a.capacity_units
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
  const [varCostB, setVarCostB] = useState<number | undefined>(initialPreset.option_b?.variable_cost_per_sale);
  const [capacityUnits, setCapacityUnits] = useState<number | undefined>(initialPreset.option_a.capacity_units);
  const [lowerUnits, setLowerUnits] = useState<number | undefined>();
  const [centralUnits, setCentralUnits] = useState<number | undefined>();
  const [higherUnits, setHigherUnits] = useState<number | undefined>();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [missingInputs, setMissingInputs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch saved drafts list from SQLite
  const fetchDraftsList = useCallback(async () => {
    try {
      const res = await fetch('/api/tests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSavedDraftsList(data.tests || []);
      }
    } catch (e) {
      console.error('Error fetching drafts:', e);
    }
  }, [token]);

  useEffect(() => {
    fetchDraftsList();
  }, [fetchDraftsList]);

  // Function to apply a preset payload
  const applyPreset = (payload: TestDraftPayload, keepId = false) => {
    if (!keepId) {
      setTestId(undefined);
      onTestIdChange?.(undefined);
      setIsLocked(false);
      setRunState({ status: 'idle' });
    }
    if (payload.mode) setMode(payload.mode);
    setPanelSeed(payload.panel_seed ?? 12345);
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

    if (payload.comparison_lever) setComparisonLever(payload.comparison_lever);
    if (payload.option_b) {
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
    }

    setIntendedBuyer(payload.audience_config.intended_buyer_description);
    setAdjacentBuyer(payload.audience_config.adjacent_buyer_description);
    setExpectedSpendMin(payload.audience_config.expected_spend_min);
    setExpectedSpendMax(payload.audience_config.expected_spend_max);
    setAudienceMarkets(payload.audience_config.audience_markets);

    setFixedCost(payload.option_a.fixed_launch_cost);
    setVarCostA(payload.option_a.variable_cost_per_sale);
    setVarCostB(payload.option_b?.variable_cost_per_sale);
    setCapacityUnits(payload.option_a.capacity_units);
    setLowerUnits(payload.offering.sales_scenarios?.lower_units);
    setCentralUnits(payload.offering.sales_scenarios?.central_units);
    setHigherUnits(payload.offering.sales_scenarios?.higher_units);
  };

  // Load product lab when URL has ?product=... or ?id=...
  const loadProductLab = useCallback(async (productId: string, review: 'resume' | 'new') => {
    setIsLoadingDraft(true);
    setLabLoadError(null);
    try {
      setTrialPrice(undefined);
      const res = await fetch(`/api/products/${productId}/lab${review === 'new' ? '?review=new' : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Unable to open this product in the Synthetic Lab.');
      }

      setLinkedProduct(data.product);
      if (data.test) {
        const full = data.test;
        if (data.product.price === null && full.options.A.price > 0) setTrialPrice(full.options.A.price);
        setTestId(full.test.id);
        onTestIdChange?.(full.test.id);
        setIsLocked(Boolean(data.run));
        if (data.run) updateRunState(data.run);
        else setRunState({ status: 'idle' });
        const payload: TestDraftPayload = {
          panel_seed: full.test.panel_seed,
          mode: full.mode || (full.options.B ? 'comparison' : 'single'),
          product_id: productId,
          test: { id: full.test.id, title: full.test.title, domain_id: full.test.domain_id, product_id: productId },
          offering: full.offering,
          option_a: full.options.A,
          option_b: full.options.B,
          audience_config: full.audience_config,
          comparison_lever: full.comparison_lever
        };
        applyPreset(payload, true);
      } else if (data.prefilled_payload) {
        applyPreset(data.prefilled_payload, false);
        setMode('single');
      }
    } catch (err: any) {
      console.error('Failed to load product lab:', err);
      setLinkedProduct(null);
      setLabLoadError(err.message || 'Unable to open this product in the Synthetic Lab.');
    } finally {
      setIsLoadingDraft(false);
    }
  }, [onTestIdChange, token]);

  useEffect(() => {
    if (linkedProductId) {
      void loadProductLab(linkedProductId, linkedProductReview);
    } else {
      setLinkedProduct(null);
      setLabLoadError(null);
    }
  }, [linkedProductId, linkedProductReview, loadProductLab]);

  // Load a saved draft by ID from SQLite
  const loadDraftById = async (id: string) => {
    setIsLoadingDraft(true);
    try {
      const res = await fetch(`/api/tests/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const full = await res.json();
        setTestId(full.test.id);
        onTestIdChange?.(full.test.id);
        const runData = await fetch(`/api/tests/${id}/runs/latest`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).then(r => r.json());
        setIsLocked(Boolean(runData.run));
        if (runData.run) updateRunState(runData.run);
        else setRunState({ status: 'idle' });
        const payload: TestDraftPayload = {
          panel_seed: full.test.panel_seed,
          mode: full.mode || (full.options.B ? 'comparison' : 'single'),
          product_id: full.product_id,
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

  useEffect(() => { 
    if (activeTestId && !linkedProduct) void loadDraftById(activeTestId); 
  }, [activeTestId]);

  // Only the selected lever can diverge in comparison mode. Baseline edits propagate to the other fields.
  useEffect(() => {
    if (mode === 'comparison') {
      setOptionB(previous => ({ ...previous,
        price: comparisonLever === 'price' ? previous.price : optionA.price,
        primary_message: comparisonLever === 'message' ? previous.primary_message : optionA.primary_message,
        served_markets: comparisonLever === 'served_markets' ? previous.served_markets : optionA.served_markets,
        images: comparisonLever === 'creative' ? previous.images : optionA.images,
        fulfillment_mode: optionA.fulfillment_mode
      }));
    }
  }, [mode, comparisonLever, optionA]);

  // Handle trial price change for option A if public price was not set
  const handleTrialPriceChange = (price: number | undefined) => {
    setTrialPrice(price);
    setOptionA(prev => ({ ...prev, price: price ?? 0 }));
  };

  // Synchronize header title
  useEffect(() => {
    if (onUpdateHeaderTitle) {
      onUpdateHeaderTitle(title || 'Synthetic Lab');
    }
  }, [title, onUpdateHeaderTitle]);

  // Construct current payload
  const currentPayload: TestDraftPayload = {
    panel_seed: panelSeed,
    mode,
    product_id: linkedProduct?.id || undefined,
    test: {
      id: testId,
      product_id: linkedProduct?.id || undefined,
      title,
      domain_id: domainId
    },
    offering: {
      sales_scenarios: { lower_units: lowerUnits, central_units: centralUnits, higher_units: higherUnits },
      short_value_prop: shortValueProp,
      description,
      currency,
      period,
      domain_specific_data: {
        ...domainSpecificData,
        ...(linkedProduct?.price === null ? { lab_price_status: trialPrice === undefined ? 'unknown' : 'known' } : {})
      }
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
    ...(mode === 'comparison' ? {
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
      comparison_lever: comparisonLever
    } : {}),
    audience_config: {
      intended_buyer_description: intendedBuyer,
      adjacent_buyer_description: adjacentBuyer,
      expected_spend_min: expectedSpendMin,
      expected_spend_max: expectedSpendMax,
      audience_markets: audienceMarkets
    }
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
    mode, testId, title, domainId, shortValueProp, description, currency, period, domainSpecificData,
    optionA, optionB, comparisonLever, intendedBuyer, adjacentBuyer,
    expectedSpendMin, expectedSpendMax, audienceMarkets, fixedCost, varCostA, varCostB, capacityUnits, lowerUnits, centralUnits, higherUnits
  ]);

  const handleSaveDraft = async (): Promise<string | null> => {
    setSaveError(null);
    setIsSavingLocal(true);
    if (setSaveStatus) setSaveStatus('saving');
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(currentPayload)
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Save error:', err);
        setSaveError(err.error || 'Unable to save draft. Please try again.');
        if (setSaveStatus) setSaveStatus('error');
        return null;
      }

      const saved = await res.json();
      const savedId = saved.test.id;
      setTestId(savedId);
      if (onTestIdChange) onTestIdChange(savedId);
      if (setSaveStatus) setSaveStatus('saved');
      if (onSaveSuccess) onSaveSuccess(saved);
      fetchDraftsList();
      return savedId;
    } catch (e) {
      console.error('Save network error:', e);
      setSaveError('Unable to reach the server. Your changes are still in this form.');
      if (setSaveStatus) setSaveStatus('error');
      return null;
    } finally {
      setIsSavingLocal(false);
    }
  };

  const [runState, setRunState] = useState<{
    status: 'idle' | 'running' | 'completed' | 'partial' | 'failed' | 'unconfigured';
    runId?: string;
    completedCount?: number;
    message?: string;
  }>({ status: 'idle' });

  const updateRunState = (run: any) => {
    const running = run.status === 'running' || run.status === 'pending';
    const expected = run.total_evaluations_expected || (mode === 'comparison' ? 100 : 50);
    setIsSubmitting(running);
    setRunState({ 
      status: running ? 'running' : run.status, 
      runId: run.id, 
      completedCount: run.total_evaluations_completed,
      message: `${run.total_evaluations_completed} / ${expected} evaluations saved.${run.error_message ? ` ${run.error_message}` : running ? ' Evaluation is in progress.' : ''}` 
    });
  };

  useEffect(() => {
    if (!testId || runState.status !== 'running' || !runState.runId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/tests/${testId}/runs/${runState.runId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Progress unavailable');
        const data = await res.json();
        if (!cancelled) updateRunState(data.run);
      } catch {
        if (!cancelled) setRunState(previous => ({ ...previous, message: 'Progress connection interrupted. Reconnecting; saved evaluations are preserved.' }));
      }
    };
    const timer = window.setInterval(poll, 1500);
    void poll();
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [testId, runState.status, runState.runId, mode, token]);

  const requestRun = async (url: string, skipResearchForRun?: boolean) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(skipResearchForRun === undefined ? {} : { skip_research: skipResearchForRun })
      });
      const data = await res.json();
      if (!res.ok || !data.run) {
        if (data.code === 'RESEARCH_FAILED' || data.code === 'RESEARCH_PENDING') setResearchRefreshKey(value => value + 1);
        throw new Error(data.error || 'Could not start the simulation.');
      }
      setIsLocked(true);
      updateRunState(data.run);
    } catch (error) {
      setRunState(previous => ({ ...previous, status: 'failed', message: error instanceof Error ? error.message : 'Connection failed. Reload this saved draft to check progress.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunSimulation = async (skipOverride?: boolean) => {
    setIsSubmitting(true);
    setRunState({ status: 'running', message: 'Saving your test before starting...' });
    const savedId = await handleSaveDraft();
    if (!savedId) {
      setRunState({ status: 'failed', message: 'Correct the inputs or retry saving before running.' });
      setIsSubmitting(false);
      return;
    }
    await requestRun('/api/tests/' + savedId + '/run', skipOverride ?? skipResearch);
  };

  const handleRetryIncompleteRun = async (runId: string) => {
    if (!testId) return;
    setIsSubmitting(true);
    setRunState(previous => ({ ...previous, status: 'running', runId, message: 'Retrying missing evaluations...' }));
    await requestRun('/api/tests/' + testId + '/runs/' + runId + '/retry');
  };

  const handleUploadImage = async (file: File): Promise<ImageMetadata | null> => {
    if (!token) {
      alert('Please sign in before uploading an image.');
      return null;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || 'Image upload failed. Check file size (max 5MB) and format.');
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
    const preset = DOMAIN_PRESETS[newDomainId];
    if (preset) {
      applyPreset(preset.payload, false);
    }
  };

  const isPriceNotSet = linkedProduct ? linkedProduct.price === null : false;
  const isFormValid = missingInputs.length === 0 && !isLocked;

  // Page definitions for the left sidebar
  const labPages = useMemo(() => {
    // Check completion status for each page
    const isOfferingComplete = Boolean(
      title.trim() &&
      shortValueProp.trim() &&
      description.trim() &&
      optionA.name.trim() &&
      optionA.primary_message.trim() &&
      (mode !== 'comparison' || (optionB.name.trim() && optionB.primary_message.trim()))
    );

    const isAudienceComplete = Boolean(
      intendedBuyer.trim() &&
      adjacentBuyer.trim() &&
      audienceMarkets.length > 0 &&
      expectedSpendMin >= 0 &&
      expectedSpendMax >= expectedSpendMin
    );

    const isFinancialsComplete = true; // Financials have sensible defaults
    const isOverviewComplete = true;

    return [
      {
        id: 'overview' as LabPageId,
        stepNum: '01',
        title: 'Launch Overview',
        subtitle: 'Review mode & market research',
        icon: Rocket,
        isComplete: isOverviewComplete
      },
      {
        id: 'offering' as LabPageId,
        stepNum: '02',
        title: 'Product & Offering',
        subtitle: mode === 'comparison' ? 'Baseline A & Variant B' : 'Core specs & baseline details',
        icon: Package,
        isComplete: isOfferingComplete
      },
      {
        id: 'audience' as LabPageId,
        stepNum: '03',
        title: 'Audience & Markets',
        subtitle: 'Buyer profiles & locations',
        icon: Users,
        isComplete: isAudienceComplete
      },
      {
        id: 'financials' as LabPageId,
        stepNum: '04',
        title: 'Unit Economics',
        subtitle: 'Costs, margins & sales volume',
        icon: TrendingUp,
        isComplete: isFinancialsComplete
      },
      {
        id: 'simulation' as LabPageId,
        stepNum: '05',
        title: 'Panel & Simulation',
        subtitle: '50 personas & execution',
        icon: Cpu,
        isComplete: isFormValid
      }
    ];
  }, [
    mode, 
    title, 
    shortValueProp, 
    description, 
    optionA, 
    optionB, 
    intendedBuyer, 
    adjacentBuyer, 
    audienceMarkets, 
    expectedSpendMin, 
    expectedSpendMax, 
    isFormValid
  ]);

  const completedCount = labPages.filter(p => p.isComplete).length;
  const progressPercent = Math.round((completedCount / labPages.length) * 100);

  const currentPageIndex = labPages.findIndex(p => p.id === activePage);
  const prevPage = currentPageIndex > 0 ? labPages[currentPageIndex - 1] : null;
  const nextPage = currentPageIndex < labPages.length - 1 ? labPages[currentPageIndex + 1] : null;

  return (
    <div className="lab-workbench-layout">
      {/* 1. Dedicated Left Navigation Sidebar */}
      <aside className="lab-sidebar" aria-label="Synthetic Lab Navigation">
        <div className="lab-sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lab-badge">
              <FlaskConical size={12} />
              <span>Synthetic Lab</span>
            </span>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              padding: '2px 6px', 
              borderRadius: 'var(--radius-sm)',
              background: mode === 'comparison' ? '#FEF3C7' : 'var(--color-intended-bg)',
              color: mode === 'comparison' ? '#92400E' : 'var(--color-intended)'
            }}>
              {mode === 'comparison' ? 'A/B Test (100)' : 'Single (50)'}
            </span>
          </div>

          <h2 className="lab-sidebar-title" title={title || 'Product Evaluation'}>
            {title || (linkedProduct ? linkedProduct.name : 'Product Evaluation')}
          </h2>
          <p className="lab-sidebar-subtitle">
            {linkedProduct ? 'Linked to published proposal' : 'Interactive pre-launch sandbox'}
          </p>
        </div>

        {/* Step Pages Navigation List */}
        <nav aria-label="Synthetic Lab Steps">
          <ul className="lab-nav-list">
            {labPages.map((page) => {
              const Icon = page.icon;
              const isActive = activePage === page.id;
              return (
                <li key={page.id} className="lab-nav-item">
                  <button
                    type="button"
                    className={`lab-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActivePage(page.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="lab-nav-btn-content">
                      <div className="lab-nav-icon-wrap">
                        <Icon size={14} />
                      </div>
                      <div className="lab-nav-text">
                        <span className="lab-nav-step-num">Step {page.stepNum}</span>
                        <span className="lab-nav-label">{page.title}</span>
                      </div>
                    </div>

                    <div className="lab-nav-status-icon">
                      {page.isComplete ? (
                        <CheckCircle2 size={14} color="var(--color-success)" />
                      ) : (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-border-strong)' }} />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer Controls & Progress */}
        <div className="lab-sidebar-footer">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              <span>Configuration Readiness</span>
              <span className="tabular-nums" style={{ fontWeight: 600 }}>{completedCount}/{labPages.length}</span>
            </div>
            <div className="lab-progress-bar-wrap">
              <div className="lab-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Save Draft Action Button */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
            onClick={() => void handleSaveDraft()}
            disabled={isLocked || isSubmitting || isSavingLocal || runState.status === 'running'}
          >
            {isSavingLocal ? <RefreshCw size={12} className="spin" /> : <Save size={12} />}
            <span>{isSavingLocal ? 'Saving...' : 'Save Lab Draft'}</span>
          </button>

          {/* Saved Drafts Dropdown (if exists) */}
          {savedDraftsList.length > 0 && !linkedProduct && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen size={13} color="var(--color-text-muted)" />
              <select
                className="form-select"
                style={{ fontSize: '11px', padding: '3px 6px', width: '100%' }}
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

          {/* Quick Run / Execution Button from Sidebar */}
          <button
            type="button"
            className="btn btn-primary lab-quick-run-btn"
            disabled={!isFormValid || isSubmitting || runState.status === 'running'}
            onClick={() => void handleRunSimulation()}
            title={!isFormValid ? 'Complete all required inputs to run simulation' : 'Launch 50-profile synthetic simulation'}
          >
            {!isFormValid ? <Lock size={13} /> : <Play size={13} />}
            <span>{mode === 'single' ? 'Run Review (50)' : 'Run A/B Review (100)'}</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Page Content Area */}
      <main className="lab-main-content">
        {saveError && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '13px', background: 'var(--color-danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger-border)' }}>{saveError}</p>}
        {labLoadError && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '13px', background: 'var(--color-danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger-border)' }}>{labLoadError}</p>}
        
        {isLocked && (
          <div className="workbench-card" style={{ background: '#FEFCE8', borderColor: '#FDE047' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', margin: 0 }}>This test is frozen</p>
                <p style={{ fontSize: '12px', color: '#78350F', margin: 0 }}>Its inputs, panel and evaluations stay paired with this run.</p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={() => { setTestId(undefined); onTestIdChange?.(undefined); setIsLocked(false); setRunState({ status: 'idle' }); }}
              >
                Create an editable copy
              </button>
            </div>
          </div>
        )}

        {/* Global Simulation Execution State Banner */}
        {runState.status !== 'idle' && (
          <div role="status" aria-live="polite" style={{
            background: runState.status === 'completed' 
              ? 'var(--color-success-bg)' 
              : runState.status === 'partial' || runState.status === 'unconfigured' 
                ? 'var(--color-warning-bg)' 
                : runState.status === 'running'
                  ? 'var(--color-intended-bg)'
                  : 'var(--color-danger-bg)',
            border: `1px solid ${
              runState.status === 'completed' 
                ? '#86EFAC' 
                : runState.status === 'partial' || runState.status === 'unconfigured' 
                  ? '#FDE68A' 
                  : runState.status === 'running'
                    ? '#BAE6FD'
                    : '#FCA5A5'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            color: runState.status === 'completed'
              ? 'var(--color-success)'
              : runState.status === 'partial' || runState.status === 'unconfigured'
                ? '#92400E'
                : runState.status === 'running'
                  ? 'var(--color-intended)'
                  : 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>
                {runState.status === 'running' && '⏳ Running Simulation:'}
                {runState.status === 'completed' && '✓ Simulation Complete:'}
                {runState.status === 'partial' && '⚠️ Incomplete Run:'}
                {runState.status === 'unconfigured' && '⚙️ Configuration Required:'}
                {runState.status === 'failed' && '✕ Run Error:'}
              </span>
              <span>{runState.message}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {runState.status === 'completed' && onNavigateToResults && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={onNavigateToResults}
                >
                  View Simulated Results &rarr;
                </button>
              )}

              {(runState.status === 'partial' || runState.status === 'failed') && runState.runId && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => handleRetryIncompleteRun(runState.runId!)}
                  disabled={isSubmitting}
                >
                  Retry Incomplete Evaluations
                </button>
              )}

              {runState.status === 'partial' && onNavigateToResults && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  onClick={onNavigateToResults}
                >
                  View Partial Results
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={() => setRunState({ status: 'idle' })}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Page 1: Overview & Research */}
        {activePage === 'overview' && (
          <div className="lab-page-body">
            <div className="lab-page-header">
              <div className="lab-page-title-group">
                <div className="lab-page-breadcrumb">
                  <span>Synthetic Lab</span>
                  <span>/</span>
                  <span>Step 1 of 5</span>
                </div>
                <h1 className="lab-page-title">Launch Overview & Market Evidence</h1>
                <p className="lab-page-desc">
                  Set evaluation mode, verify launch pricing, and extract live competitor search references.
                </p>
              </div>

              <span className="badge badge-intended" style={{ padding: '4px 10px', fontSize: '12px' }}>
                Stage 1: Preflight
              </span>
            </div>

            {/* Quick Context Highlights */}
            <div className="lab-overview-grid">
              <div className="lab-overview-card">
                <div className="lab-overview-card-title">
                  <Cpu size={14} color="var(--color-intended)" />
                  <span>AI Consumer Panel Engine</span>
                </div>
                <div className="lab-overview-card-value">
                  Powered by Llama 3.3 70B via Groq. Evaluates willingness-to-pay and objections across 50 consumer profiles.
                </div>
              </div>

              <div className="lab-overview-card">
                <div className="lab-overview-card-title">
                  <Sparkles size={14} color="var(--color-adjacent)" />
                  <span>Market Intelligence</span>
                </div>
                <div className="lab-overview-card-value">
                  Retrieves live comparable market prices and competitor claims to ground persona reasoning in real market data.
                </div>
              </div>

              <div className="lab-overview-card">
                <div className="lab-overview-card-title">
                  <Sliders size={14} color="var(--color-contrasting)" />
                  <span>Decision Isolation</span>
                </div>
                <div className="lab-overview-card-value">
                  Single-product review validates concept viability. A/B mode isolates price, messaging, or creative levers.
                </div>
              </div>
            </div>

            {/* Stage 4/5 Preflight Lab Card */}
            <PreflightLabCard
              product={linkedProduct}
              mode={mode}
              onModeChange={setMode}
              trialPrice={trialPrice}
              onTrialPriceChange={handleTrialPriceChange}
              isPriceNotSet={isPriceNotSet}
              skipResearch={skipResearch}
              onSkipResearchChange={setSkipResearch}
              onContinueWithoutResearch={() => void handleRunSimulation(true)}
              researchRefreshKey={researchRefreshKey}
            />
          </div>
        )}

        {/* Page 2: Product & Offering */}
        {activePage === 'offering' && (
          <div className="lab-page-body">
            <div className="lab-page-header">
              <div className="lab-page-title-group">
                <div className="lab-page-breadcrumb">
                  <span>Synthetic Lab</span>
                  <span>/</span>
                  <span>Step 2 of 5</span>
                </div>
                <h1 className="lab-page-title">Product Offering & Baseline Variant</h1>
                <p className="lab-page-desc">
                  Select your product domain category and detail your core value proposition, specs, and visual creative.
                </p>
              </div>

              <span className="badge badge-intended" style={{ padding: '4px 10px', fontSize: '12px' }}>
                Stage 2: Offering Specs
              </span>
            </div>

            <fieldset disabled={isLocked || isSubmitting || runState.status === 'running'} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Step 1: Domain Selection */}
              <DomainSelector
                selectedDomain={domainId}
                onSelectDomain={handleDomainSelect}
              />

              {/* Step 2: Core Offering & Baseline Option A */}
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

              {/* Step 3: Alternative B & Comparison Lever (Only in Comparison Mode) */}
              {mode === 'comparison' && (
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
              )}
            </fieldset>
          </div>
        )}

        {/* Page 3: Target Audience & Markets */}
        {activePage === 'audience' && (
          <div className="lab-page-body">
            <div className="lab-page-header">
              <div className="lab-page-title-group">
                <div className="lab-page-breadcrumb">
                  <span>Synthetic Lab</span>
                  <span>/</span>
                  <span>Step 3 of 5</span>
                </div>
                <h1 className="lab-page-title">Target Audience & Geographic Markets</h1>
                <p className="lab-page-desc">
                  Specify your ideal intended customer, adjacent market profiles, expected spend boundaries, and delivery cities.
                </p>
              </div>

              <span className="badge badge-intended" style={{ padding: '4px 10px', fontSize: '12px' }}>
                Stage 3: Audience
              </span>
            </div>

            <fieldset disabled={isLocked || isSubmitting || runState.status === 'running'} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
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
            </fieldset>
          </div>
        )}

        {/* Page 4: Unit Economics & Scenarios */}
        {activePage === 'financials' && (
          <div className="lab-page-body">
            <div className="lab-page-header">
              <div className="lab-page-title-group">
                <div className="lab-page-breadcrumb">
                  <span>Synthetic Lab</span>
                  <span>/</span>
                  <span>Step 4 of 5</span>
                </div>
                <h1 className="lab-page-title">Unit Economics & Sales Scenarios</h1>
                <p className="lab-page-desc">
                  Model fixed setup costs, variable margins per unit, and projected volume scenarios (conservative, target, optimistic).
                </p>
              </div>

              <span className="badge badge-intended" style={{ padding: '4px 10px', fontSize: '12px' }}>
                Stage 4: Economics
              </span>
            </div>

            <fieldset disabled={isLocked || isSubmitting || runState.status === 'running'} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              <FinancialsForm
                currency={currency}
                period={period}
                priceA={optionA.price}
                priceUnknown={linkedProduct?.price === null && trialPrice === undefined}
                priceB={mode === 'comparison' ? optionB.price : undefined}
                variableCostA={varCostA}
                onChangeVariableCostA={setVarCostA}
                variableCostB={mode === 'comparison' ? varCostB : undefined}
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
            </fieldset>
          </div>
        )}

        {/* Page 5: Synthetic Panel & Simulation Run */}
        {activePage === 'simulation' && (
          <div className="lab-page-body">
            <div className="lab-page-header">
              <div className="lab-page-title-group">
                <div className="lab-page-breadcrumb">
                  <span>Synthetic Lab</span>
                  <span>/</span>
                  <span>Step 5 of 5</span>
                </div>
                <h1 className="lab-page-title">50-Profile Panel & Simulation Launchpad</h1>
                <p className="lab-page-desc">
                  Inspect the deterministic 50-consumer persona distribution and launch your AI evaluation run.
                </p>
              </div>

              <span className="badge badge-intended" style={{ padding: '4px 10px', fontSize: '12px' }}>
                Stage 5: Mission Control
              </span>
            </div>

            {/* Simulation Readiness Summary Card */}
            <div className="workbench-card" style={{ background: isFormValid ? 'var(--color-surface)' : '#FFFBEB', borderColor: isFormValid ? 'var(--color-border)' : '#FDE68A' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isFormValid ? <CheckCircle2 size={16} color="var(--color-success)" /> : <AlertTriangle size={16} color="var(--color-warning)" />}
                  <span>Simulation Readiness Checklist</span>
                </h2>
                <span className={`badge ${isFormValid ? 'badge-intended' : 'badge-contrasting'}`}>
                  {isFormValid ? 'All Requirements Met' : `${missingInputs.length} Requirement(s) Needed`}
                </span>
              </div>

              {missingInputs.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Complete the following required fields to enable the 50-profile evaluation:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#92400E', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {missingInputs.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Your product proposal, market evidence, audience parameters, and economic assumptions are fully verified and ready.
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}
                  disabled={!isFormValid || isSubmitting || runState.status === 'running'}
                  onClick={() => void handleRunSimulation()}
                >
                  {!isFormValid ? <Lock size={16} /> : <Play size={16} />}
                  <span>
                    {isSubmitting || runState.status === 'running' 
                      ? 'Running 50-Profile Evaluation...' 
                      : mode === 'single' 
                        ? 'Launch Product Review (50 Personas)' 
                        : 'Launch Comparative Review (100 Evaluations)'}
                  </span>
                </button>

                {runState.status === 'completed' && onNavigateToResults && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px', fontSize: '14px' }}
                    onClick={onNavigateToResults}
                  >
                    View Completed Results &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* 50-Profile Panel Review */}
            <ProfileReviewPanel
              seed={panelSeed}
              onSeedChange={setPanelSeed}
              locked={isLocked || runState.status === 'running'}
              testId={testId}
              domainId={domainId}
              intendedBuyer={intendedBuyer}
              adjacentBuyer={adjacentBuyer}
              expectedSpendMin={expectedSpendMin}
              expectedSpendMax={expectedSpendMax}
              audienceMarkets={audienceMarkets}
              currency={currency}
              optionA={{ name: optionA.name, served_markets: optionA.served_markets }}
              optionB={mode === 'comparison' ? { name: optionB.name, served_markets: optionB.served_markets } : undefined}
            />
          </div>
        )}

        {/* Page Navigation Footer (Previous / Next Step) */}
        <footer className="lab-page-footer">
          <div className="lab-page-footer-left">
            {prevPage ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActivePage(prevPage.id)}
              >
                <ArrowLeft size={14} />
                <span>Previous: {prevPage.title}</span>
              </button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Step 1 of 5
              </span>
            )}
          </div>

          <div className="lab-page-footer-right">
            {nextPage ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActivePage(nextPage.id)}
              >
                <span>Next: {nextPage.title}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isFormValid || isSubmitting || runState.status === 'running'}
                onClick={() => void handleRunSimulation()}
              >
                <Play size={14} />
                <span>Launch 50-Profile Simulation</span>
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};
