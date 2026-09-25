import { z } from 'zod';
import { 
  DOMAIN_IDS, 
  OPTION_IDS, 
  PRIMARY_LEVERS, 
  RESPONSE_CATEGORIES, 
  AUDIENCE_SEGMENTS, 
  FACTOR_TAGS, 
  HUMAN_CHOICES,
  PANEL_CONSTANTS 
} from './types.js';

// Primitive schemas
export const DomainIdSchema = z.enum([
  'clothing_accessories',
  'local_food_beverages',
  'digital_products_services'
]);

export const OptionIdSchema = z.enum(['A', 'B']);

export const PrimaryLeverSchema = z.enum([
  'price',
  'message',
  'served_markets',
  'creative'
]);

export const ResponseCategorySchema = z.enum([
  'interested',
  'unsure',
  'not_interested',
  'unavailable'
]);

export const AudienceSegmentSchema = z.enum([
  'intended',
  'adjacent',
  'contrasting'
]);

export const FactorTagSchema = z.enum([
  'price',
  'fit',
  'access',
  'message',
  'creative',
  'other'
]);

export const HumanChoiceSchema = z.enum(['A', 'B', 'neither', 'unsure']);

// Image metadata schema
export const ImageMetadataSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1).max(255),
  url: z.string().min(1),
  size_bytes: z.number().int().positive().max(5 * 1024 * 1024, 'Image size must be 5MB or less'),
  mime_type: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  confirmed_visual_description: z.string().max(1000).optional(),
  uploaded_at: z.string().datetime().optional()
});

// Domain Specific schemas
export const ClothingSpecificsSchema = z.object({
  item_type: z.string().min(1).max(100),
  material: z.string().min(1).max(200),
  sizes: z.array(z.string().min(1).max(20)).min(1),
  unit_production_cost: z.number().nonnegative().optional(),
  fulfillment_details: z.string().max(500).optional()
});

export const FoodSpecificsSchema = z.object({
  item_name: z.string().min(1).max(100),
  portion: z.string().min(1).max(100),
  ingredients_allergens: z.string().max(500).optional(),
  pickup_delivery_mode: z.string().min(1).max(100),
  availability_window: z.string().max(200).optional(),
  unit_prep_delivery_cost: z.number().nonnegative().optional()
});

export const DigitalSpecificsSchema = z.object({
  core_use_case: z.string().min(1).max(300),
  platform_language: z.string().min(1).max(100),
  pricing_type: z.enum(['one_time', 'subscription']),
  service_support_availability: z.string().max(200).optional()
});

export const DomainSpecificDataSchema = z.union([
  ClothingSpecificsSchema,
  FoodSpecificsSchema,
  DigitalSpecificsSchema,
  z.record(z.unknown())
]);

// Test schema
export const TestSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title cannot exceed 120 characters'),
  domain_id: DomainIdSchema,
  feedback_token: z.string().optional()
});

// Offering schema
export const OfferingSchema = z.object({
  short_value_prop: z.string().min(5, 'Value proposition must be at least 5 characters').max(200, 'Value proposition cannot exceed 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description cannot exceed 2000 characters'),
  currency: z.string().min(1).max(10).default('USD'),
  period: z.string().min(1).max(50).default('launch_batch'),
  domain_specific_data: DomainSpecificDataSchema.optional().default({})
});

// Option schema
export const OptionInputSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().nonnegative('Price must be non-negative'),
  primary_message: z.string().min(5, 'Primary message must be at least 5 characters').max(300),
  served_markets: z.array(z.string().min(1).max(100)).min(1, 'At least one served market is required'),
  fulfillment_mode: z.string().min(1).max(100),
  images: z.array(ImageMetadataSchema).max(3, 'Maximum 3 images allowed').optional().default([]),
  variable_cost_per_sale: z.number().nonnegative('Variable cost must be non-negative').optional(),
  fixed_launch_cost: z.number().nonnegative('Fixed launch cost must be non-negative').optional(),
  capacity_units: z.number().int().positive('Capacity must be a positive integer').optional()
});

// Audience config schema
export const AudienceConfigSchema = z.object({
  intended_buyer_description: z.string().min(5, 'Intended buyer description must be at least 5 characters').max(500),
  adjacent_buyer_description: z.string().min(5, 'Adjacent buyer description must be at least 5 characters').max(500),
  expected_spend_min: z.number().nonnegative('Expected spend minimum must be non-negative'),
  expected_spend_max: z.number().nonnegative('Expected spend maximum must be non-negative'),
  audience_markets: z.array(z.string().min(1).max(100))
    .min(PANEL_CONSTANTS.MIN_AUDIENCE_MARKETS, 'Must specify at least 1 audience market')
    .max(PANEL_CONSTANTS.MAX_AUDIENCE_MARKETS, 'Cannot specify more than 4 audience markets')
}).refine(data => data.expected_spend_max >= data.expected_spend_min, {
  message: 'Expected spend max must be greater than or equal to minimum',
  path: ['expected_spend_max']
});

// Complete Draft Payload Schema with cross-field validations
export const TestDraftPayloadSchema = z.object({
  test: TestSchema,
  offering: OfferingSchema,
  option_a: OptionInputSchema,
  option_b: OptionInputSchema,
  audience_config: AudienceConfigSchema,
  comparison_lever: PrimaryLeverSchema
}).superRefine((data, ctx) => {
  // 1. Verify served_markets are a subset of audience_markets
  const audienceMarketsSet = new Set(data.audience_config.audience_markets);
  
  for (const market of data.option_a.served_markets) {
    if (!audienceMarketsSet.has(market)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Option A served market "${market}" must be one of the configured audience markets`,
        path: ['option_a', 'served_markets']
      });
    }
  }

  for (const market of data.option_b.served_markets) {
    if (!audienceMarketsSet.has(market)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Option B served market "${market}" must be one of the configured audience markets`,
        path: ['option_b', 'served_markets']
      });
    }
  }

  // 2. Enforce confirmed visual description if creative lever is selected
  if (data.comparison_lever === 'creative') {
    const aHasImages = data.option_a.images && data.option_a.images.length > 0;
    const bHasImages = data.option_b.images && data.option_b.images.length > 0;
    if (aHasImages) {
      for (const img of data.option_a.images) {
        if (!img.confirmed_visual_description || img.confirmed_visual_description.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Option A image requires a confirmed visual description when testing the creative lever',
            path: ['option_a', 'images']
          });
        }
      }
    }
    if (bHasImages) {
      for (const img of data.option_b.images) {
        if (!img.confirmed_visual_description || img.confirmed_visual_description.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Option B image requires a confirmed visual description when testing the creative lever',
            path: ['option_b', 'images']
          });
        }
      }
    }
  }
});

// Human response submission schema
export const HumanResponseSubmissionSchema = z.object({
  choice: HumanChoiceSchema,
  reason: z.string()
    .max(500, 'Reason cannot exceed 500 characters')
    .transform(val => val ? val.replace(/<[^>]*>?/gm, '').trim() : undefined)
    .optional(),
  token: z.string().max(100).optional(),
  client_token: z.string().max(100).optional()
});

// Evaluation record schema (for Phase 1 persistence validation)
export const EvaluationRecordSchema = z.object({
  profile_id: z.string().min(1),
  option_id: OptionIdSchema,
  access_status: z.enum(['served', 'unserved']),
  response: ResponseCategorySchema,
  reason: z.string().min(1).max(1000),
  primary_objection: z.string().max(500).optional(),
  factor_tags: z.array(FactorTagSchema),
  referenced_fields: z.array(z.string().min(1).max(100))
});

// Groq structured batch item schema
export const GroqEvaluationItemSchema = z.object({
  profile_id: z.string().min(1),
  response: z.enum(['interested', 'unsure', 'not_interested']),
  reason: z.string().min(3).max(1000),
  primary_objection: z.string().max(500).optional().nullable(),
  factor_tags: z.array(FactorTagSchema).min(1),
  referenced_fields: z.array(z.string().min(1)).min(1)
});

// Groq structured batch response schema
export const GroqBatchEvaluationResponseSchema = z.object({
  evaluations: z.array(GroqEvaluationItemSchema)
});

