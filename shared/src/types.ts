/**
 * DROPTEST Core Domain Contracts & Types
 * Version: Phase 0 (Locked contracts per PRD)
 */

// Domain IDs
export type DomainId = 
  | 'clothing_accessories'
  | 'local_food_beverages'
  | 'digital_products_services';

export const DOMAIN_IDS: readonly DomainId[] = [
  'clothing_accessories',
  'local_food_beverages',
  'digital_products_services'
] as const;

export const DOMAIN_LABELS: Record<DomainId, string> = {
  clothing_accessories: 'Clothing & Accessories',
  local_food_beverages: 'Local Food & Beverages',
  digital_products_services: 'Digital Products & Services'
};

// Option IDs
export type OptionId = 'A' | 'B';
export const OPTION_IDS: readonly OptionId[] = ['A', 'B'] as const;

// Primary comparison levers
export type PrimaryLever = 
  | 'price'
  | 'message'
  | 'served_markets'
  | 'creative';

export const PRIMARY_LEVERS: readonly PrimaryLever[] = [
  'price',
  'message',
  'served_markets',
  'creative'
] as const;

export const PRIMARY_LEVER_LABELS: Record<PrimaryLever, string> = {
  price: 'Price',
  message: 'Primary Message / Value Prop',
  served_markets: 'Served Markets / Availability',
  creative: 'Creative & Visual Description'
};

// Simulated response categories
export type ResponseCategory = 
  | 'interested'
  | 'unsure'
  | 'not_interested'
  | 'unavailable';

export const RESPONSE_CATEGORIES: readonly ResponseCategory[] = [
  'interested',
  'unsure',
  'not_interested',
  'unavailable'
] as const;

// Profile segments
export type AudienceSegment = 
  | 'intended'
  | 'adjacent'
  | 'contrasting';

export const AUDIENCE_SEGMENTS: readonly AudienceSegment[] = [
  'intended',
  'adjacent',
  'contrasting'
] as const;

// Fixed panel rules
export const PANEL_CONSTANTS = {
  TOTAL_PROFILES: 50,
  INTENDED_COUNT: 20,
  ADJACENT_COUNT: 20,
  CONTRASTING_COUNT: 10,
  TOTAL_EVALUATIONS: 100, // 50 profiles * 2 options (A & B)
  MAX_AUDIENCE_MARKETS: 4,
  MIN_AUDIENCE_MARKETS: 1
} as const;

// Access / Eligibility status
export type AccessStatus = 'served' | 'unserved';

// Factor tags for evaluations
export type FactorTag = 
  | 'price'
  | 'fit'
  | 'access'
  | 'message'
  | 'creative'
  | 'other';

export const FACTOR_TAGS: readonly FactorTag[] = [
  'price',
  'fit',
  'access',
  'message',
  'creative',
  'other'
] as const;

// Run status
export type RunStatus = 
  | 'draft'
  | 'pending'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed';

// Human response choice
export type HumanChoice = 'A' | 'B' | 'neither' | 'unsure';
export const HUMAN_CHOICES: readonly HumanChoice[] = ['A', 'B', 'neither', 'unsure'] as const;

// Image metadata
export interface ImageMetadata {
  id: string;
  filename: string;
  url: string;
  size_bytes: number;
  mime_type: string;
  confirmed_visual_description?: string;
  uploaded_at?: string;
}

// Tailored domain-specific field schemas
export interface ClothingSpecifics {
  item_type: string;
  material: string;
  sizes: string[];
  unit_production_cost?: number;
  fulfillment_details?: string;
}

export interface FoodSpecifics {
  item_name: string;
  portion: string;
  ingredients_allergens?: string;
  pickup_delivery_mode: string;
  availability_window?: string;
  unit_prep_delivery_cost?: number;
}

export interface DigitalSpecifics {
  core_use_case: string;
  platform_language: string;
  pricing_type: 'one_time' | 'subscription';
  service_support_availability?: string;
}

export type DomainSpecificData = 
  | ClothingSpecifics 
  | FoodSpecifics 
  | DigitalSpecifics 
  | Record<string, unknown>;

// Domain Entities
export interface Test {
  id: string;
  title: string;
  domain_id: DomainId;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'ready' | 'archived';
}

export interface Offering {
  id: string;
  test_id: string;
  short_value_prop: string;
  description: string;
  currency: string;
  period: string; // e.g., 'launch_batch' | 'first_month' | 'per_item'
  domain_specific_data: DomainSpecificData;
  created_at: string;
  updated_at: string;
}

export interface Option {
  id: OptionId; // 'A' or 'B'
  test_id: string;
  name: string;
  price: number;
  primary_message: string;
  served_markets: string[];
  fulfillment_mode: string;
  images: ImageMetadata[];
  variable_cost_per_sale?: number;
  fixed_launch_cost?: number;
  capacity_units?: number;
  created_at: string;
  updated_at: string;
}

export interface AudienceConfig {
  id: string;
  test_id: string;
  intended_buyer_description: string;
  adjacent_buyer_description: string;
  expected_spend_min: number;
  expected_spend_max: number;
  audience_markets: string[];
  panel_size: number; // exactly 50
  intended_count: number; // 20
  adjacent_count: number; // 20
  contrasting_count: number; // 10
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // stable e.g. "prof_01" .. "prof_50"
  test_id: string;
  segment: AudienceSegment;
  market: string;
  budget_min: number;
  budget_max: number;
  use_case: string;
  constraints: string[];
  priorities: string[];
  access_mode: string;
  created_at: string;
}

export interface Run {
  id: string;
  test_id: string;
  status: RunStatus;
  primary_lever: PrimaryLever;
  profile_seed: number;
  model_id?: string;
  created_at: string;
  completed_at?: string;
  total_evaluations_expected: number; // 100
  total_evaluations_completed: number;
  error_message?: string;
}

export interface Evaluation {
  id: string;
  run_id: string;
  test_id: string;
  profile_id: string;
  option_id: OptionId;
  access_status: AccessStatus;
  response: ResponseCategory;
  reason: string;
  primary_objection?: string;
  factor_tags: FactorTag[];
  referenced_fields: string[];
  created_at: string;
}

export interface GroqEvaluationItem {
  profile_id: string;
  response: 'interested' | 'unsure' | 'not_interested';
  reason: string;
  primary_objection?: string | null;
  factor_tags: FactorTag[];
  referenced_fields: string[];
}

export interface GroqBatchEvaluationResponse {
  evaluations: GroqEvaluationItem[];
}

export interface HumanResponse {
  id: string;
  test_id: string;
  choice: HumanChoice;
  reason?: string;
  created_at: string;
  token_hash?: string;
}

// Financial Inputs & Scenario Contracts (PRD Section 8)
export interface FinancialInputs {
  currency: string;
  period: string;
  fixed_launch_cost?: number;
  price: number;
  variable_cost_per_sale?: number;
  capacity_units?: number;
  sales_scenarios?: {
    lower_units?: number;
    central_units?: number;
    higher_units?: number;
  };
}

export interface ScenarioCalculation {
  units: number;
  revenue: number;
  variable_cost: number;
  net_result: number;
  is_within_capacity: boolean;
}

export interface FinancialCalculationResult {
  has_sufficient_inputs: boolean;
  missing_fields: string[];
  contribution_per_sale?: number;
  break_even_units?: number | null; // null if no break-even or invalid
  break_even_status_message?: string; // e.g. "No break-even at this price and unit cost." or "Cannot break even within entered capacity."
  scenarios?: {
    lower?: ScenarioCalculation;
    central?: ScenarioCalculation;
    higher?: ScenarioCalculation;
  };
}

// Aggregate Test Payload (for Setup & Persistence)
export interface TestDraftPayload {
  test: {
    id?: string;
    title: string;
    domain_id: DomainId;
  };
  offering: {
    short_value_prop: string;
    description: string;
    currency: string;
    period: string;
    domain_specific_data?: DomainSpecificData;
  };
  option_a: {
    name: string;
    price: number;
    primary_message: string;
    served_markets: string[];
    fulfillment_mode: string;
    images?: ImageMetadata[];
    variable_cost_per_sale?: number;
    fixed_launch_cost?: number;
    capacity_units?: number;
  };
  option_b: {
    name: string;
    price: number;
    primary_message: string;
    served_markets: string[];
    fulfillment_mode: string;
    images?: ImageMetadata[];
    variable_cost_per_sale?: number;
    fixed_launch_cost?: number;
    capacity_units?: number;
  };
  audience_config: {
    intended_buyer_description: string;
    adjacent_buyer_description: string;
    expected_spend_min: number;
    expected_spend_max: number;
    audience_markets: string[];
  };
  comparison_lever: PrimaryLever;
}

export interface FullTestResponse {
  test: Test;
  offering: Offering;
  options: {
    A: Option;
    B: Option;
  };
  audience_config: AudienceConfig;
  comparison_lever: PrimaryLever;
}

// Phase 4: Comparison Result & Analysis Contracts
export interface SegmentResultBreakdown {
  interested: number;
  unsure: number;
  not_interested: number;
  unavailable: number;
  total: number;
  eligible: number;
}

export interface MarketResultBreakdown {
  market: string;
  interested: number;
  unsure: number;
  not_interested: number;
  unavailable: number;
  total: number;
  eligible: number;
  access_status: AccessStatus;
}

export interface ObjectionSummaryItem {
  tag: FactorTag | string;
  count: number;
  sample_objections: string[];
}

export interface OptionResultSummary {
  option_id: OptionId;
  option_name: string;
  total_profiles: number; // always 50
  eligible_count: number;
  unserved_count: number;
  interested_total: number; // interested / 50
  interested_eligible: number; // interested / eligible
  unsure_total: number;
  not_interested_total: number;
  unavailable_total: number;
  by_segment: Record<AudienceSegment, SegmentResultBreakdown>;
  by_market: Record<string, MarketResultBreakdown>;
  dominant_objections: ObjectionSummaryItem[];
}

export type TransitionType = 
  | 'became_interested'
  | 'lost_interest'
  | 'remained_interested'
  | 'remained_hesitant'
  | 'remained_unavailable'
  | 'access_opened'
  | 'access_closed';

export interface ProfileTransition {
  profile_id: string;
  segment: AudienceSegment;
  market: string;
  budget_min: number;
  budget_max: number;
  use_case: string;
  constraints: string[];
  priorities: string[];
  access_mode: string;
  response_a: ResponseCategory;
  response_b: ResponseCategory;
  access_status_a: AccessStatus;
  access_status_b: AccessStatus;
  reason_a: string;
  reason_b: string;
  primary_objection_a?: string;
  primary_objection_b?: string;
  factor_tags_a: FactorTag[];
  factor_tags_b: FactorTag[];
  referenced_fields_a: string[];
  referenced_fields_b: string[];
  transition_type: TransitionType;
}

export interface TransitionMatrix {
  matrix: Record<ResponseCategory, Record<ResponseCategory, number>>;
  top_transitions: Array<{ from: ResponseCategory; to: ResponseCategory; count: number }>;
  net_interested_change: number; // interested_B - interested_A
  segment_switches: Record<AudienceSegment, {
    gained_interested: number;
    lost_interested: number;
    net: number;
  }>;
}

export interface EligibilityChangeSummary {
  market: string;
  status_a: AccessStatus;
  status_b: AccessStatus;
  profile_count: number;
  profiles_affected: string[];
  change_type: 'became_eligible' | 'became_ineligible' | 'unchanged';
  coverage_note: string;
}

export interface DecisionCardData {
  is_run_complete: boolean;
  total_completed: number;
  total_expected: number; // 100
  winner_declared: boolean; // false if conflicted or incomplete
  status_headline: string;
  recommended_next_test: string;
  key_simulated_observation: string;
  leading_objection: string;
  location_access_caveat: string;
  missing_evidence: string;
  finance_comparison?: {
    has_finance: boolean;
    break_even_a?: number | null;
    break_even_b?: number | null;
    break_even_status_a?: string;
    break_even_status_b?: string;
    note: string;
  };
}

export interface SingleLeverDiffData {
  lever: PrimaryLever;
  field_diffs: Array<{
    field: string;
    label: string;
    val_a: string | number | string[];
    val_b: string | number | string[];
  }>;
  cost_diff?: {
    var_cost_a?: number;
    var_cost_b?: number;
    fixed_cost_a?: number;
    fixed_cost_b?: number;
    has_cost_variance: boolean;
  };
}

export interface ComparisonAnalysis {
  test_id: string;
  run_id: string;
  run_status: RunStatus;
  primary_lever: PrimaryLever;
  model_id?: string;
  option_a_summary: OptionResultSummary;
  option_b_summary: OptionResultSummary;
  eligibility_changes: EligibilityChangeSummary[];
  transitions: ProfileTransition[];
  transition_matrix: TransitionMatrix;
  decision_card: DecisionCardData;
  single_lever_diff: SingleLeverDiffData;
  finance_analysis: {
    option_a: FinancialCalculationResult;
    option_b: FinancialCalculationResult;
  };
}

