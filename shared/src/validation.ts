import { z } from 'zod';
import { CURRENCY_MINOR_DIGITS, toMinorUnits } from './money.js';
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
  'digital_products_services',
  'other'
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
  lab_price_status: z.enum(['known', 'unknown']).optional(),
  item_type: z.string().min(1).max(100),
  material: z.string().min(1).max(200),
  fit: z.string().min(1).max(100).optional(),
  sizes: z.union([z.array(z.string().min(1).max(20)).min(1), z.literal('not_decided')]),
  unit_production_cost: z.number().nonnegative().optional(),
  fulfillment_details: z.string().max(500).optional()
});

export const FoodSpecificsSchema = z.object({
  lab_price_status: z.enum(['known', 'unknown']).optional(),
  item_name: z.string().min(1).max(100),
  portion: z.string().min(1).max(100),
  ingredients_allergens: z.string().max(500).optional(),
  pickup_delivery_mode: z.string().min(1).max(100),
  availability_window: z.string().max(200).optional(),
  unit_prep_delivery_cost: z.number().nonnegative().optional()
});

export const DigitalSpecificsSchema = z.object({
  lab_price_status: z.enum(['known', 'unknown']).optional(),
  core_use_case: z.string().trim().min(1).max(300),
  platform: z.string().trim().min(1).max(100).optional(),
  language: z.string().trim().min(1).max(100).optional(),
  platform_language: z.string().trim().min(1).max(200).optional(),
  pricing_type: z.enum(['one_time', 'subscription', 'not_decided']).optional(),
  service_support_availability: z.string().max(200).optional()
});

export const OtherSpecificsSchema = z.object({
  specification_text: z.string().trim().min(1).max(1000),
  lab_price_status: z.enum(['known', 'unknown']).optional()
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
  sales_scenarios: z.object({ lower_units: z.number().int().nonnegative().optional(), central_units: z.number().int().nonnegative().optional(), higher_units: z.number().int().nonnegative().optional() }).optional(),
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
  panel_seed: z.number().int().min(0).max(2147483647).optional(),
  mode: z.enum(['single', 'comparison']).optional(),
  product_id: z.string().optional(),
  test: TestSchema.extend({
    product_id: z.string().optional()
  }),
  offering: OfferingSchema,
  option_a: OptionInputSchema,
  option_b: OptionInputSchema.optional(),
  audience_config: AudienceConfigSchema,
  comparison_lever: PrimaryLeverSchema.optional().default('price')
}).superRefine((data, ctx) => {
  const specificsSchema = data.test.domain_id === 'clothing_accessories' 
    ? ClothingSpecificsSchema 
    : data.test.domain_id === 'local_food_beverages' 
      ? FoodSpecificsSchema 
      : data.test.domain_id === 'digital_products_services' ? DigitalSpecificsSchema : OtherSpecificsSchema;
  const specifics = specificsSchema.safeParse(data.offering.domain_specific_data);
  if (!specifics.success) {
    for (const issue of specifics.error.issues) {
      ctx.addIssue({ ...issue, path: ['offering', 'domain_specific_data', ...issue.path] });
    }
  }

  const optionsToCheck = [data.option_a];
  if (data.option_b) optionsToCheck.push(data.option_b);

  for (const option of optionsToCheck) {
    for (const units of Object.values(data.offering.sales_scenarios || {})) {
      if (units !== undefined && option.capacity_units !== undefined && units > option.capacity_units) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['offering', 'sales_scenarios'],
          message: 'Sales scenarios must not exceed either option’s capacity.'
        });
      }
    }
  }

  if (new Set(data.audience_config.audience_markets).size !== data.audience_config.audience_markets.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['audience_config', 'audience_markets'],
      message: 'Audience markets must be distinct.'
    });
  }

  // Verify served_markets are a subset of audience_markets for Option A
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

  // Cross-option validation only when in comparison mode
  const isComparison = data.mode === 'comparison' || (!data.mode && Boolean(data.option_b));
  if (isComparison) {
    if (!data.option_b) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['option_b'],
        message: 'Option B is required when running in comparison mode.'
      });
      return;
    }

    const lever = data.comparison_lever || 'price';
    const fields = { price: 'price', message: 'primary_message', served_markets: 'served_markets', creative: 'images' } as const;
    for (const [lKey, field] of Object.entries(fields)) {
      const a = field === 'served_markets' ? [...data.option_a.served_markets].sort() : data.option_a[field as keyof typeof data.option_a];
      const b = field === 'served_markets' ? [...data.option_b.served_markets].sort() : data.option_b[field as keyof typeof data.option_b];
      if (lKey !== lever && JSON.stringify(a) !== JSON.stringify(b)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['option_b', field], message: `Keep ${field} the same as A when testing ${lever}.` });
      }
      if (lKey === lever && JSON.stringify(a) === JSON.stringify(b)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['option_b', field], message: `Change ${field} in B to create a comparison.` });
      }
    }

    if (data.option_a.fulfillment_mode !== data.option_b.fulfillment_mode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['option_b', 'fulfillment_mode'], message: 'Keep fulfillment mode the same across this comparison.' });
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

    if (lever === 'creative') {
      if (!data.option_a.images?.length || !data.option_b.images?.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['option_b', 'images'], message: 'Attach and describe an image for both creative options.' });
      }
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
  }
});

// Storage contract for incomplete product-linked drafts. Run creation still
// uses TestDraftPayloadSchema above, so partial values can never reach simulation.
export const PartialProductLabDraftPayloadSchema = z.object({
  panel_seed: z.number().int().min(0).max(2147483647).optional(),
  mode: z.enum(['single', 'comparison']).default('single'),
  product_id: z.string().min(1),
  test: z.object({ id: z.string().uuid().optional(), product_id: z.string().min(1), title: z.string().max(120).default(''), domain_id: DomainIdSchema.default('other'), feedback_token: z.string().optional() }),
  offering: z.object({
    sales_scenarios: z.object({ lower_units: z.number().int().nonnegative().optional(), central_units: z.number().int().nonnegative().optional(), higher_units: z.number().int().nonnegative().optional() }).optional(),
    short_value_prop: z.string().max(200).default(''), description: z.string().max(2000).default(''),
    currency: z.string().max(10).default('INR'), period: z.string().max(50).default('launch_batch'),
    domain_specific_data: z.record(z.unknown()).default({})
  }),
  option_a: z.object({ name: z.string().max(100).default(''), price: z.number().finite().nonnegative().default(0), primary_message: z.string().max(300).default(''), served_markets: z.array(z.string().max(100)).max(4).default([]), fulfillment_mode: z.string().max(100).default(''), images: z.array(ImageMetadataSchema).max(3).default([]), variable_cost_per_sale: z.number().nonnegative().optional(), fixed_launch_cost: z.number().nonnegative().optional(), capacity_units: z.number().int().positive().optional() }),
  option_b: z.object({ name: z.string().max(100).default(''), price: z.number().finite().nonnegative().default(0), primary_message: z.string().max(300).default(''), served_markets: z.array(z.string().max(100)).max(4).default([]), fulfillment_mode: z.string().max(100).default(''), images: z.array(ImageMetadataSchema).max(3).default([]), variable_cost_per_sale: z.number().nonnegative().optional(), fixed_launch_cost: z.number().nonnegative().optional(), capacity_units: z.number().int().positive().optional() }).optional(),
  audience_config: z.object({ intended_buyer_description: z.string().max(500).default(''), adjacent_buyer_description: z.string().max(500).default(''), expected_spend_min: z.number().nonnegative().default(0), expected_spend_max: z.number().nonnegative().default(0), audience_markets: z.array(z.string().max(100)).max(4).default([]) }),
  comparison_lever: PrimaryLeverSchema.default('price')
}).superRefine((payload, ctx) => {
  if (payload.test.product_id !== payload.product_id) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['test', 'product_id'], message: 'Linked product IDs must match.' });
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
  referenced_fields: z.array(z.string().min(1).max(100)),
  source_ids: z.array(z.string()).optional()
});

// Groq structured batch item schema
export const GroqEvaluationItemSchema = z.object({
  profile_id: z.string().min(1),
  response: z.enum(['interested', 'unsure', 'not_interested']),
  reason: z.string().min(3).max(1000),
  primary_objection: z.string().max(500).optional().nullable(),
  factor_tags: z.array(FactorTagSchema).min(1).max(3),
  referenced_fields: z.array(z.string().min(1).max(100)).min(1).max(20),
  source_ids: z.array(z.string()).optional().default([])
});

// Groq structured batch response schema
export const GroqBatchEvaluationResponseSchema = z.object({
  evaluations: z.array(GroqEvaluationItemSchema)
});

export const ManualReferencePayloadSchema = z.object({
  url: z.string().trim().url('Must be a valid web URL').max(1000),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  note: z.string().trim().min(5, 'Founder note must be at least 5 characters').max(1000)
});

// ==========================================
// DROPTEST v2 Validation Schemas
// ==========================================

export const UserRoleSchema = z.enum(['user', 'sponsor', 'startup']);

export const SignUpPayloadSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: UserRoleSchema,
  display_name: z.string().trim().max(100).optional(),
  startup_name: z.string().trim().max(100).optional(),
  startup_description: z.string().trim().max(500).optional()
}).superRefine((data, ctx) => {
  if (data.role === 'startup') {
    if (!data.startup_name || data.startup_name.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startup_name'],
        message: 'Startup name is required for startup accounts'
      });
    }
    if (!data.startup_description || data.startup_description.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startup_description'],
        message: 'A short startup description is required (at least 5 characters)'
      });
    }
  } else {
    if (!data.display_name || data.display_name.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['display_name'],
        message: 'Display name is required (min 2 characters)'
      });
    }
  }
});

export const SignInPayloadSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const ProductStageSchema = z.enum(['idea', 'prototype', 'preparing_to_launch', 'launched']);

export const ProductCategorySchema = z.enum([
  'clothing_accessories',
  'local_food_beverages',
  'digital_products_services',
  'other'
]);

const PRODUCT_PUBLIC_CATEGORY_KEYS: Record<z.infer<typeof ProductCategorySchema>, readonly string[]> = {
  clothing_accessories: ['item_type', 'material', 'fit', 'sizes', 'fulfillment_details', 'visual_description'],
  local_food_beverages: ['item_name', 'portion', 'ingredients_allergens', 'pickup_delivery_mode', 'availability_window', 'visual_description'],
  digital_products_services: ['main_function', 'core_use_case', 'platform', 'language', 'platform_language', 'pricing_type', 'service_support_availability', 'visual_description'],
  other: ['specs', 'specification_text', 'visual_description']
};

export const ProductDraftPayloadSchema = z.object({
  name: z.string().trim().max(150).default(''),
  category: ProductCategorySchema.default('other'),
  stage: ProductStageSchema.default('idea'),
  summary: z.string().trim().max(1000).default(''),
  intended_buyer: z.string().trim().max(500).default(''),
  feedback_question: z.string().trim().max(300).default('What should we change before launch?'),
  price: z.number().finite().nonnegative('Price cannot be negative').nullable().optional(),
  currency: z.string().trim().default('INR'),
  availability_markets: z.union([
    z.array(z.string().trim().min(1).max(100)),
    z.literal('not_decided')
  ]).default('not_decided'),
  fulfillment_mode: z.string().trim().max(200).default('not_decided'),
  images: z.array(ImageMetadataSchema).max(3, 'At most 3 images allowed').default([]),
  category_data: z.record(z.unknown()).default({}),
  status: z.enum(['draft', 'published']).default('draft')
}).superRefine((data, ctx) => {
  const allowed = new Set(PRODUCT_PUBLIC_CATEGORY_KEYS[data.category]);
  for (const key of Object.keys(data.category_data)) {
    if (!allowed.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category_data', key],
        message: 'This field is not a supported public product detail'
      });
    }
  }
});

export const ProductPublishPayloadSchema = ProductDraftPayloadSchema.superRefine((data, ctx) => {
  if (!data.name || data.name.trim().length < 3) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Product name must be at least 3 characters' });
  }
  if (!data.price && data.price !== 0 && data.price !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price'], message: 'Set a nonnegative price or explicitly mark it not decided.' });
  }
  if (!data.summary || data.summary.trim().length < 15) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['summary'], message: 'Summary must be at least 15 characters' });
  }
  if (!data.intended_buyer || data.intended_buyer.trim().length < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['intended_buyer'], message: 'Intended buyer description is required' });
  }
  if (!data.feedback_question || data.feedback_question.trim().length < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['feedback_question'], message: 'Feedback question is required' });
  }
  const notDecided = (value: unknown) => typeof value === 'string' && value.trim().toLowerCase() === 'not_decided';
  const requiredText = (key: string, label: string) => {
    const value = data.category_data[key];
    if (!(typeof value === 'string' && value.trim().length > 0) && !notDecided(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category_data', key], message: `${label} is required; enter a value or choose “Not decided yet”.` });
    }
  };
  if (data.category === 'clothing_accessories') {
    requiredText('material', 'Material');
    requiredText('fit', 'Fit');
    const sizes = data.category_data.sizes;
    if (!notDecided(sizes) && !(Array.isArray(sizes) && sizes.some(value => typeof value === 'string' && value.trim()))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category_data', 'sizes'], message: 'Sizes are required; enter at least one or choose “Not decided yet”.' });
    }
  } else if (data.category === 'local_food_beverages') {
    requiredText('portion', 'Portion');
    requiredText('ingredients_allergens', 'Known ingredients and allergens (or explicitly not decided)');
  } else if (data.category === 'digital_products_services') {
    requiredText('core_use_case', 'Main function');
    if (data.category_data.platform_language) {
      requiredText('platform_language', 'Platform and language');
    } else {
      requiredText('platform', 'Platform');
      requiredText('language', 'Language');
    }
    if (!['one_time', 'subscription', 'not_decided'].includes(String(data.category_data.pricing_type || ''))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category_data', 'pricing_type'], message: 'Choose one-time, subscription, or explicitly not decided.' });
    }
  } else {
    if (!data.category_data.specification_text && !data.category_data.specs) requiredText('specification_text', 'Product specification');
    else if (![data.category_data.specification_text, data.category_data.specs].some(value => typeof value === 'string' && value.trim().length > 0)) {
      requiredText('specification_text', 'Product specification');
    }
  }

  const markets = data.availability_markets;
  if (markets !== 'not_decided' && (!markets.length || markets.some(market => !market.trim()))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['availability_markets'], message: 'Enter at least one market or choose “Not decided yet”.' });
  }
  if (markets !== 'not_decided' && (!data.fulfillment_mode.trim() || data.fulfillment_mode === 'not_decided')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fulfillment_mode'], message: 'Fulfillment mode is required when markets are specified.' });
  }

  // Only a dedicated user-confirmed visual description or an uploaded image is evidence of visual detail.
  const hasImage = data.images.length > 0;
  const hasDescription = data.summary.trim().length >= 20 || (typeof data.category_data.visual_description === 'string' && data.category_data.visual_description.trim().length >= 20);
  if (!hasImage && !hasDescription) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['images'], message: 'Provide an image or a dedicated visual/functional description of at least 20 characters.' });
  }
});

export const CommunityFeedbackSubmissionSchema = z.object({
  choice: z.enum(['yes', 'maybe', 'no']),
  factor: z.enum(['price', 'design_fit', 'quality_details', 'availability_delivery', 'usefulness', 'other']),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').transform(val => val ? val.replace(/<[^>]*>?/gm, '').trim() : undefined).optional()
});

export const SupportProposalSubmissionSchema = z.object({
  amount: z.number().finite().positive('Proposed amount must be a positive number').max(1_000_000_000),
  currency: z.string().trim().min(1).transform(value => value.toUpperCase()).default('INR'),
  message: z.string().trim().min(3, 'Message must be at least 3 characters').max(1000, 'Message cannot exceed 1000 characters')
}).superRefine((data, ctx) => {
  const digits = CURRENCY_MINOR_DIGITS[data.currency];
  if (digits === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['currency'], message: 'Choose INR, USD, EUR, GBP, or JPY.' });
  } else if (toMinorUnits(data.amount, data.currency) === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: `${data.currency} amount exceeds its supported precision or safe range.` });
  }
});
