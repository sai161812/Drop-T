import { DomainId, TestDraftPayload } from '@droptest/shared';

export interface DomainPreset {
  id: DomainId;
  label: string;
  payload: TestDraftPayload;
}

export const DOMAIN_PRESETS: Record<string, DomainPreset> = {
  clothing_accessories: {
    id: 'clothing_accessories',
    label: 'Clothing & Accessories',
    payload: {
      test: {
        title: 'Organic Handloom Linen Shirt',
        domain_id: 'clothing_accessories'
      },
      offering: {
        short_value_prop: 'Breathable organic linen shirt handcrafted for warm humid climates',
        description: 'Made from 100% natural organic flax linen with natural horn buttons and relaxed fit. Machine washable and pre-shrunk.',
        currency: 'INR',
        period: 'launch_batch',
        domain_specific_data: {
          item_type: 'Shirt',
          material: '100% Organic Flax Linen',
          sizes: ['S', 'M', 'L', 'XL'],
          unit_production_cost: 350
        }
      },
      option_a: {
        name: 'Launch Price ₹699',
        price: 699,
        primary_message: 'Sustainable everyday comfort at an accessible launch price',
        served_markets: ['Koramangala', 'Indiranagar', 'Whitefield'],
        fulfillment_mode: 'Standard postal shipping',
        images: [],
        variable_cost_per_sale: 350,
        fixed_launch_cost: 6000,
        capacity_units: 50
      },
      option_b: {
        name: 'Premium Price ₹899',
        price: 899,
        primary_message: 'Sustainable everyday comfort at an accessible launch price',
        served_markets: ['Koramangala', 'Indiranagar', 'Whitefield'],
        fulfillment_mode: 'Standard postal shipping',
        images: [],
        variable_cost_per_sale: 350,
        fixed_launch_cost: 6000,
        capacity_units: 50
      },
      audience_config: {
        intended_buyer_description: 'Young eco-conscious working professionals (25-35) looking for sustainable minimalist apparel',
        adjacent_buyer_description: 'College students or gift buyers looking for durable natural aesthetic fabrics',
        expected_spend_min: 500,
        expected_spend_max: 1200,
        audience_markets: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout']
      },
      comparison_lever: 'price'
    }
  },

  local_food_beverages: {
    id: 'local_food_beverages',
    label: 'Local Food & Beverages',
    payload: {
      test: {
        title: 'Small-Batch Cold Brew Concentrate',
        domain_id: 'local_food_beverages'
      },
      offering: {
        short_value_prop: '18-hour steeped single-origin Arabica cold brew concentrate bottle',
        description: 'Crafted with ethically sourced beans from Coorg. Notes of roasted hazelnut and dark chocolate. Yields 6 glasses when mixed with water or milk.',
        currency: 'INR',
        period: 'first_month',
        domain_specific_data: {
          item_name: 'Hazelnut Cold Brew 500ml',
          portion: '500ml glass bottle',
          ingredients_allergens: '100% Arabica Coffee, Filtered Water. No added sugar or preservatives.',
          pickup_delivery_mode: 'Chilled doorstep delivery & Local cafe pickup',
          availability_window: 'Every Saturday & Sunday morning (8 AM - 12 PM)',
          unit_prep_delivery_cost: 120
        }
      },
      option_a: {
        name: 'Pickup Only ₹350',
        price: 350,
        primary_message: 'Fresh weekend pickup at partner neighborhood cafe',
        served_markets: ['Indiranagar', 'Koramangala'],
        fulfillment_mode: 'Weekend cafe counter pickup',
        images: [],
        variable_cost_per_sale: 110,
        fixed_launch_cost: 15000,
        capacity_units: 150
      },
      option_b: {
        name: 'Expanded availability',
        price: 350,
        primary_message: 'Fresh weekend pickup at partner neighborhood cafe',
        served_markets: ['Indiranagar', 'Koramangala', 'HSR Layout'],
        fulfillment_mode: 'Weekend cafe counter pickup',
        images: [],
        variable_cost_per_sale: 160,
        fixed_launch_cost: 15000,
        capacity_units: 150
      },
      audience_config: {
        intended_buyer_description: 'Remote tech workers and coffee enthusiasts making daily iced coffee at home',
        adjacent_buyer_description: 'Fitness enthusiasts wanting clean, zero-sugar pre-workout beverages',
        expected_spend_min: 250,
        expected_spend_max: 600,
        audience_markets: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield']
      },
      comparison_lever: 'served_markets'
    }
  },

  digital_products_services: {
    id: 'digital_products_services',
    label: 'Digital Products & Services',
    payload: {
      test: {
        title: 'InvoiceFlow — Automated GST Invoice Parser',
        domain_id: 'digital_products_services'
      },
      offering: {
        short_value_prop: 'AI tool that extracts line items from vendor PDF invoices directly into spreadsheets',
        description: 'Saves 5+ hours weekly for freelance consultants and small businesses by turning scanned or digital invoices into structured CSV/Google Sheets rows automatically.',
        currency: 'USD',
        period: 'first_month',
        domain_specific_data: {
          core_use_case: 'Automated invoice receipt parsing for accounting',
          platform_language: 'Web App / Chrome Extension / English',
          pricing_type: 'subscription',
          service_support_availability: 'Email support with 24-hour turnaround'
        }
      },
      option_a: {
        name: 'Standard $19/mo',
        price: 19,
        primary_message: 'Parse up to 100 invoices/month with spreadsheet export',
        served_markets: ['North America', 'India', 'Europe'],
        fulfillment_mode: 'Instant cloud web dashboard',
        images: [],
        variable_cost_per_sale: 2,
        fixed_launch_cost: 1200,
        capacity_units: 500
      },
      option_b: {
        name: 'Alternative message $19/mo',
        price: 19,
        primary_message: 'Spend less time entering data: export up to 100 invoices per month',
        served_markets: ['North America', 'India', 'Europe'],
        fulfillment_mode: 'Instant cloud web dashboard',
        images: [],
        variable_cost_per_sale: 3,
        fixed_launch_cost: 1200,
        capacity_units: 500
      },
      audience_config: {
        intended_buyer_description: 'Solo freelancers and boutique agency owners managing 20+ supplier invoices monthly',
        adjacent_buyer_description: 'Bookkeepers and virtual assistants handling accounting for multiple clients',
        expected_spend_min: 15,
        expected_spend_max: 60,
        audience_markets: ['North America', 'India', 'Europe', 'Australia']
      },
      comparison_lever: 'message'
    }
  },

  other: {
    id: 'other',
    label: 'Other / Hardware',
    payload: {
      test: { title: 'General product concept review', domain_id: 'other' },
      offering: {
        short_value_prop: 'A founder-described product concept for a specific buyer need',
        description: 'Review the founder-provided product specifications and stated use case without assuming an apparel, food, or software category.',
        currency: 'USD', period: 'launch_batch', domain_specific_data: { specification_text: 'Founder-supplied specification' }
      },
      option_a: { name: 'Current proposal', price: 0, primary_message: 'Evaluate the founder-provided product proposal', served_markets: ['Market to be confirmed'], fulfillment_mode: 'Founder-stated fulfillment', images: [], variable_cost_per_sale: 0, fixed_launch_cost: 0, capacity_units: 100 },
      option_b: { name: 'Alternative specification', price: 1, primary_message: 'Evaluate the founder-provided product proposal', served_markets: ['Market to be confirmed'], fulfillment_mode: 'Founder-stated fulfillment', images: [], variable_cost_per_sale: 0, fixed_launch_cost: 0, capacity_units: 100 },
      audience_config: { intended_buyer_description: 'People described by the founder as the intended buyers', adjacent_buyer_description: 'Adjacent buyers to be specified by the founder', expected_spend_min: 0, expected_spend_max: 0, audience_markets: ['Market to be confirmed'] }
    }
  },

  smart_water_bottle: {
    id: 'other',
    label: 'Smart Water Bottle (IoT Hardware)',
    payload: {
      test: {
        title: '💧 PureGlow Smart Water Bottle (UV-C & Hydration Sensor)',
        domain_id: 'other'
      },
      offering: {
        short_value_prop: 'Self-cleaning insulated bottle with 280nm UV-C sterilization cap and real-time hydration volume tracking',
        description: 'Double-walled vacuum insulated stainless steel bottle with integrated 280nm UV-C LED sterilization in the cap that activates every 2 hours or on-demand. Features capacitive touch sensor for real-time hydration volume tracking, Bluetooth sync to Apple Health/Google Fit, and 30-day rechargeable battery.',
        currency: 'USD',
        period: 'launch_batch',
        domain_specific_data: {
          specification_text: 'Double-walled vacuum insulated 304 stainless steel bottle with integrated 280nm UV-C LED sterilization in the cap (cycles every 2 hours). Capacitive liquid sensor for intake tracking, Bluetooth 5.2 sync with Apple Health, IPX7 waterproof, 30-day USB-C rechargeable battery.',
          core_features: '280nm UV-C LED cap, Bluetooth 5.2, Capacitive water volume tracking, IPX7 waterproof, 30-day battery life'
        }
      },
      option_a: {
        name: 'Standard Model $79',
        price: 79,
        primary_message: 'Pure, bacteria-free hydration with automated daily intake tracking',
        served_markets: ['North America', 'Europe', 'India', 'Japan'],
        fulfillment_mode: 'Global direct-to-consumer tracked shipping',
        images: [{
          id: 'preset_smart_bottle_1',
          url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
          filename: 'smart_water_bottle_preview.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 245000,
          confirmed_visual_description: 'Matte black double-walled stainless steel smart water bottle with glowing LED ring cap showing purification cycle and hydration volume status.'
        }],
        variable_cost_per_sale: 28,
        fixed_launch_cost: 25000,
        capacity_units: 500
      },
      option_b: {
        name: 'Pro Model with Solar & Filter $99',
        price: 99,
        primary_message: 'Pure, bacteria-free hydration with automated daily intake tracking',
        served_markets: ['North America', 'Europe', 'India', 'Japan'],
        fulfillment_mode: 'Global direct-to-consumer tracked shipping',
        images: [{
          id: 'preset_smart_bottle_1',
          url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
          filename: 'smart_water_bottle_preview.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 245000,
          confirmed_visual_description: 'Matte black double-walled stainless steel smart water bottle with glowing LED ring cap showing purification cycle and hydration volume status.'
        }],
        variable_cost_per_sale: 35,
        fixed_launch_cost: 25000,
        capacity_units: 500
      },
      audience_config: {
        intended_buyer_description: 'Tech-savvy fitness enthusiasts, urban gym-goers, and frequent travelers who prioritize pure water and automated hydration tracking',
        adjacent_buyer_description: 'Outdoor hikers, campers, and remote workers looking for a premium insulated self-cleaning thermos',
        expected_spend_min: 50,
        expected_spend_max: 120,
        audience_markets: ['North America', 'Europe', 'India', 'Japan']
      },
      comparison_lever: 'price'
    }
  },

  artisanal_cold_brew: {
    id: 'local_food_beverages',
    label: '☕ Artisanal Cold Brew Press & Ceramic Tumbler',
    payload: {
      test: {
        title: '☕ Artisanal Cold Brew Press & Ceramic Tumbler',
        domain_id: 'local_food_beverages'
      },
      offering: {
        short_value_prop: 'Zero-bypass micro-mesh cold extraction chamber with integrated ceramic travel tumbler',
        description: '18-hour continuous gravity steep system made with food-grade 304 stainless mesh and high-fired matte ceramic. Produces 500ml ultra-smooth, low-acid concentrate directly into an insulated cup with zero sediment.',
        currency: 'USD',
        period: 'launch_batch',
        domain_specific_data: {
          item_name: 'Artisanal Cold Brew Press Kit',
          portion: '500ml ceramic tumbler + steep vessel',
          ingredients_allergens: '100% Arabica Coorg Coffee kit included. Zero preservatives.',
          pickup_delivery_mode: 'Direct courier delivery with gift packaging',
          availability_window: 'Every batch roasted & shipped weekly',
          unit_prep_delivery_cost: 14
        }
      },
      option_a: {
        name: 'Starter Press Kit $49',
        price: 49,
        primary_message: 'Cafe-quality ultra-smooth cold brew brewed overnight at home',
        served_markets: ['North America', 'Europe', 'India'],
        fulfillment_mode: 'Standard postal shipping',
        images: [{
          id: 'preset_cold_brew_1',
          url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
          filename: 'cold_brew_press.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 210000,
          confirmed_visual_description: 'Matte ceramic tumbler with precision stainless steel micro-filter cold brew extraction chamber pouring clear dark amber cold brew.'
        }],
        variable_cost_per_sale: 16,
        fixed_launch_cost: 8000,
        capacity_units: 300
      },
      option_b: {
        name: 'Deluxe Kit with 2 Tumblers $69',
        price: 69,
        primary_message: 'Cafe-quality ultra-smooth cold brew brewed overnight at home',
        served_markets: ['North America', 'Europe', 'India'],
        fulfillment_mode: 'Standard postal shipping',
        images: [{
          id: 'preset_cold_brew_1',
          url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
          filename: 'cold_brew_press.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 210000,
          confirmed_visual_description: 'Matte ceramic tumbler with precision stainless steel micro-filter cold brew extraction chamber pouring clear dark amber cold brew.'
        }],
        variable_cost_per_sale: 22,
        fixed_launch_cost: 8000,
        capacity_units: 300
      },
      audience_config: {
        intended_buyer_description: 'Specialty coffee enthusiasts and remote tech workers wanting artisanal, low-acid iced coffee without expensive cafe runs',
        adjacent_buyer_description: 'Design-conscious kitchenware collectors and gift buyers seeking aesthetic minimalist drinkware',
        expected_spend_min: 35,
        expected_spend_max: 85,
        audience_markets: ['North America', 'Europe', 'India']
      },
      comparison_lever: 'price'
    }
  }
};

export const SHOWCASE_DEMOS = [
  {
    key: 'smart_water_bottle',
    name: '💧 Smart Water Bottle',
    badge: 'IoT Hardware · High Competition Case',
    desc: 'UV-C LED self-cleaning cap + hydration intake tracking ($79)',
    overlapText: '3 of 5 benchmarks share core concept',
    noveltyVerdict: 'WEAK' as const,
    presetKey: 'smart_water_bottle' as const
  },
  {
    key: 'artisanal_cold_brew',
    name: '☕ Artisanal Cold Brew Press',
    badge: 'D2C Goods · High Differentiation Case',
    desc: 'Ceramic travel tumbler + zero-bypass gravity steeping ($49)',
    overlapText: '1 of 5 benchmarks share core concept',
    noveltyVerdict: 'STRONG' as const,
    presetKey: 'artisanal_cold_brew' as const
  }
];

export const BLANK_PRESET: TestDraftPayload = {
  test: {
    title: '',
    domain_id: 'clothing_accessories'
  },
  offering: {
    short_value_prop: '',
    description: '',
    currency: 'USD',
    period: 'launch_batch',
    domain_specific_data: {}
  },
  option_a: {
    name: 'Option A (Baseline)',
    price: 0,
    primary_message: '',
    served_markets: [],
    fulfillment_mode: '',
    images: [],
    variable_cost_per_sale: undefined,
    fixed_launch_cost: undefined,
    capacity_units: undefined
  },
  option_b: {
    name: 'Option B (Alternative)',
    price: 0,
    primary_message: '',
    served_markets: [],
    fulfillment_mode: '',
    images: [],
    variable_cost_per_sale: undefined,
    fixed_launch_cost: undefined,
    capacity_units: undefined
  },
  audience_config: {
    intended_buyer_description: '',
    adjacent_buyer_description: '',
    expected_spend_min: 0,
    expected_spend_max: 0,
    audience_markets: []
  },
  comparison_lever: 'price'
};
