/**
 * DROPTEST Core Domain Contracts & Types
 * Version: Phase 0 (Locked contracts per PRD)
 */

// Domain IDs
export type DomainId = 
  | 'clothing_accessories'
  | 'local_food_beverages'
  | 'digital_products_services'
  | 'other';

export const DOMAIN_IDS: readonly DomainId[] = [
  'clothing_accessories',
  'local_food_beverages',
  'digital_products_services',
  'other'
] as const;

export const DOMAIN_LABELS: Record<DomainId, string> = {
  clothing_accessories: 'Clothing & Accessories',
  local_food_beverages: 'Local Food & Beverages',
  digital_products_services: 'Digital Products & Services',
  other: 'Other'
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
  platform?: string;
  language?: string;
  platform_language?: string;
  pricing_type?: 'one_time' | 'subscription' | 'not_decided';
  service_support_availability?: string;
}

export interface OtherSpecifics { specification_text: string }

export type DomainSpecificData = 
  | ClothingSpecifics 
  | FoodSpecifics 
  | DigitalSpecifics 
  | OtherSpecifics
  | Record<string, unknown>;

// Domain Entities
export interface Test {
  panel_seed?: number;
  id: string;
  title: string;
  domain_id: DomainId;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'ready' | 'archived';
  feedback_token?: string;
}

export interface Offering {
  sales_scenarios?: FinancialInputs['sales_scenarios'];
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
  total_evaluations_expected: number; // 50 in single mode, 100 in comparison mode
  total_evaluations_completed: number;
  error_message?: string;
  mode?: LabRunMode;
  research_status?: 'without_research' | 'completed' | 'no_matches' | 'failed' | 'skipped';
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
  source_ids?: string[];
  created_at: string;
}

export interface GroqEvaluationItem {
  profile_id: string;
  response: 'interested' | 'unsure' | 'not_interested';
  reason: string;
  primary_objection?: string | null;
  factor_tags: FactorTag[];
  referenced_fields: string[];
  source_ids?: string[];
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

export interface HumanFeedbackStats {
  total: number;
  counts: Record<HumanChoice, number>;
  responses: HumanResponse[];
  feedback_token?: string;
  recruitment_context: string;
}

export interface PublicOptionViewData {
  id: OptionId;
  name: string;
  price: number;
  primary_message: string;
  served_markets: string[];
  fulfillment_mode: string;
  images: ImageMetadata[];
}

export interface PublicFeedbackViewData {
  test_id: string;
  feedback_token: string;
  title: string;
  domain_id: DomainId;
  short_value_prop: string;
  description: string;
  currency: string;
  period: string;
  domain_specific_data: DomainSpecificData;
  comparison_lever: PrimaryLever;
  options: {
    A: PublicOptionViewData;
    B: PublicOptionViewData;
  };
}

// Financial Inputs & Scenario Contracts (PRD Section 8)
export interface FinancialInputs {
  price_unknown?: boolean;
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
  is_valid: boolean;
  validation_error?: string;
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
  panel_seed?: number;
  mode?: LabRunMode;
  product_id?: string;
  test: {
    id?: string;
    product_id?: string;
    title: string;
    domain_id: DomainId;
    feedback_token?: string;
  };
  offering: {
    sales_scenarios?: FinancialInputs['sales_scenarios'];
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
  option_b?: {
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
  comparison_lever?: PrimaryLever;
}

export interface FullTestResponse {
  test: Test & { product_id?: string };
  product_id?: string;
  mode: LabRunMode;
  offering: Offering;
  options: {
    A: Option;
    B?: Option;
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
  missing: number;
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
  missing: number;
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
  missing_total: number;
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
  | 'access_closed'
  | 'incomplete';

export type PersonaResponse = ResponseCategory | 'missing';

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
  response_a: PersonaResponse;
  response_b: PersonaResponse;
  evaluation_status_a: 'complete' | 'missing';
  evaluation_status_b: 'complete' | 'missing';
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
  source_ids_a?: string[];
  source_ids_b?: string[];
  transition_type: TransitionType;
}

export interface TransitionMatrix {
  matrix: Record<ResponseCategory, Record<ResponseCategory, number>>;
  top_transitions: Array<{ from: ResponseCategory; to: ResponseCategory; count: number }>;
  net_interested_change: number; // interested_B - interested_A
  incomplete_pairs: number;
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
  product_id?: string;
  run_id: string;
  mode: LabRunMode;
  research_status: 'without_research' | 'completed' | 'no_matches' | 'failed' | 'skipped';
  references?: CompetitorReference[];
  selected_references?: CompetitorReference[];
  reference_summary?: string;
  run_status: RunStatus;
  primary_lever: PrimaryLever;
  model_id?: string;
  currency: string;
  period: string;
  options: {
    A: {
      name: string;
      price: number;
      variable_cost_per_sale?: number;
      fixed_launch_cost?: number;
      capacity_units?: number;
    };
    B?: {
      name: string;
      price: number;
      variable_cost_per_sale?: number;
      fixed_launch_cost?: number;
      capacity_units?: number;
    };
  };
  option_a_summary: OptionResultSummary;
  option_b_summary?: OptionResultSummary;
  eligibility_changes: EligibilityChangeSummary[];
  transitions: ProfileTransition[];
  transition_matrix?: TransitionMatrix;
  decision_card: DecisionCardData;
  single_lever_diff?: SingleLeverDiffData;
  finance_analysis: {
    option_a: FinancialCalculationResult;
    option_b?: FinancialCalculationResult;
  };
}

// ==========================================
// DROPTEST v2 Community, Auth & Product Contracts
// ==========================================

export type UserRole = 'user' | 'sponsor' | 'startup';
export const USER_ROLES: readonly UserRole[] = ['user', 'sponsor', 'startup'] as const;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  startup_name?: string;
  startup_description?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  startup_name?: string;
  startup_description?: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  role: UserRole;
  display_name?: string;
  startup_name?: string;
  startup_description?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export type ProductStage = 'idea' | 'prototype' | 'preparing_to_launch' | 'launched';
export const PRODUCT_STAGES: readonly ProductStage[] = ['idea', 'prototype', 'preparing_to_launch', 'launched'] as const;

export type ProductCategory = DomainId | 'other';
export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'clothing_accessories',
  'local_food_beverages',
  'digital_products_services',
  'other'
] as const;

export type ProductStatus = 'draft' | 'published';

export interface Product {
  id: string;
  owner_id: string;
  name: string;
  category: ProductCategory;
  stage: ProductStage;
  summary: string;
  intended_buyer: string;
  feedback_question: string;
  price: number | null; // null represents explicitly 'not_set'
  currency: string;
  availability_markets: string[] | 'not_decided';
  fulfillment_mode: string | 'not_decided';
  images: ImageMetadata[];
  category_data: Record<string, any>;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductPublicSummary {
  id: string;
  owner_id: string;
  owner_name: string;
  startup_name?: string;
  name: string;
  category: ProductCategory;
  stage: ProductStage;
  summary: string;
  price: number | null;
  currency: string;
  images: ImageMetadata[];
  save_count: number;
  is_saved?: boolean;
  feedback_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPublicDetail extends Product {
  owner: PublicUser;
  save_count: number;
  is_saved?: boolean;
  feedback_summary: {
    total: number;
    counts: { yes: number; maybe: number; no: number };
    factor_counts?: Record<CommunityFeedbackFactor, number>;
    user_feedback?: {
      choice: CommunityFeedbackChoice;
      factor: CommunityFeedbackFactor;
      reason?: string;
    };
  };
  user_proposal?: {
    id: string;
    amount: number;
    currency: string;
    message: string;
    created_at: string;
    updated_at?: string;
  };
}

export type CommunityFeedbackChoice = 'yes' | 'maybe' | 'no';
export const COMMUNITY_FEEDBACK_CHOICES: readonly CommunityFeedbackChoice[] = ['yes', 'maybe', 'no'] as const;

export type CommunityFeedbackFactor = 
  | 'price' 
  | 'design_fit' 
  | 'quality_details' 
  | 'availability_delivery' 
  | 'usefulness' 
  | 'other';

export const COMMUNITY_FEEDBACK_FACTORS: readonly CommunityFeedbackFactor[] = [
  'price',
  'design_fit',
  'quality_details',
  'availability_delivery',
  'usefulness',
  'other'
] as const;

export interface ProductFeedback {
  id: string;
  author_id: string;
  product_id: string;
  choice: CommunityFeedbackChoice;
  factor: CommunityFeedbackFactor;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackAuthorInfo {
  id: string;
  display_name: string;
  role: UserRole;
  startup_name?: string;
}

export interface FounderFeedbackItem {
  id: string;
  author: FeedbackAuthorInfo;
  choice: CommunityFeedbackChoice;
  factor: CommunityFeedbackFactor;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FounderFeedbackBreakdown {
  total: number;
  counts: Record<CommunityFeedbackChoice, number>;
  factor_counts: Record<CommunityFeedbackFactor, number>;
  responses: FounderFeedbackItem[];
}

export interface SupportProposal {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  sender_startup_name?: string;
  product_id: string;
  product_name: string;
  recipient_id: string;
  amount: number;
  currency: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export type EvidenceType = 'retrieved_snippet' | 'retrieved_page' | 'founder_manual_note';

export interface CompetitorReference {
  id: string;
  product_id: string;
  query: string;
  title: string;
  url: string;
  domain: string;
  snippet_or_fact: string;
  source_type: 'automated' | 'founder_supplied';
  evidence_type: EvidenceType;
  supported_facts: string[];
  founder_note?: string;
  selected: boolean;
  date_checked: string;
  created_at?: string;
  research_attempt_id?: string;
}

export type ResearchAttemptStatus = 'pending' | 'completed' | 'no_matches' | 'failed' | 'skipped';

export interface ResearchAttempt {
  id: string;
  product_id: string;
  input_fingerprint: string;
  query: string;
  provider: string;
  status: ResearchAttemptStatus;
  error_message?: string;
  comparison_summary?: string;
  started_at: string;
  completed_at?: string;
}

export interface SearchProviderStatus {
  is_configured: boolean;
  provider: 'brave' | 'tavily' | 'serper' | 'duckduckgo' | 'none';
  required_credential?: string;
  credential_present: boolean;
  message?: string;
}

export type LabRunMode = 'single' | 'comparison';
