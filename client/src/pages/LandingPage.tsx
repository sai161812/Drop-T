import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowUpRight, 
  FlaskConical, 
  MessageCircleMore, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  Search, 
  Users, 
  TrendingUp, 
  Coins, 
  Settings2
} from 'lucide-react';
import { LightRays } from '../components/LightRays/LightRays.js';
import './LandingPage.css';

interface LandingPageProps {
  onExplore: () => void;
  onSignIn: () => void;
  onOpenProduct?: (productId: string) => void;
}

type ColorPreset = {
  name: string;
  color: string;
  label: string;
};

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'white', color: '#ffffff', label: 'Classic White' },
  { name: 'emerald', color: '#34d399', label: 'Emerald Aurora' },
  { name: 'purple', color: '#c084fc', label: 'Neon Purple' },
  { name: 'amber', color: '#fbbf24', label: 'Sunset Amber' }
];

type ProductPreset = {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  step: number;
  materials: string;
  competitors: { name: string; price: number; cite: string }[];
  baseIntent: number;
  personas: {
    segment: 'Intended' | 'Adjacent' | 'Contrasting';
    name: string;
    avatar: string;
    location: string;
    feedbackTemplate: (price: number) => { intent: 'Yes' | 'Maybe' | 'No'; quote: string; factor: string };
  }[];
};

const SAMPLE_PRODUCTS: ProductPreset[] = [
  {
    id: 'hemp-tee',
    name: 'Organic Hemp Summer Tee',
    category: 'Clothing & Apparel',
    basePrice: 999,
    minPrice: 499,
    maxPrice: 2499,
    step: 50,
    materials: '55% Organic Himalayan Hemp / 45% Organic Cotton',
    competitors: [
      { name: 'EcoWear Bamboo Tee', price: 1299, cite: 'Source 1' },
      { name: 'FastFashion Basic', price: 499, cite: 'Source 2' }
    ],
    baseIntent: 76,
    personas: [
      {
        segment: 'Intended',
        name: 'Arjun M.',
        avatar: '👨‍💼',
        location: 'Bangalore · Eco-conscious buyer',
        feedbackTemplate: (price) => {
          if (price <= 1199) {
            return {
              intent: 'Yes',
              quote: `At ₹${price}, this is cheaper than EcoWear (₹1,299) while offering genuine 55% hemp. Perfect for summer durability. [Source 1]`,
              factor: 'Material Quality & Value'
            };
          }
          return {
            intent: 'Maybe',
            quote: `At ₹${price}, it crosses into premium territory. I'd need guaranteed lifetime wash warranty to justify over standard bamboo.`,
            factor: 'Price Sensitivity'
          };
        }
      },
      {
        segment: 'Adjacent',
        name: 'Sneha K.',
        avatar: '👩‍💻',
        location: 'Mumbai · Casualwear shopper',
        feedbackTemplate: (price) => {
          if (price <= 899) {
            return {
              intent: 'Yes',
              quote: `Very fair ₹${price} price for breathable fabric. Would wear for remote work and casual outings.`,
              factor: 'Fit & Comfort'
            };
          }
          if (price <= 1499) {
            return {
              intent: 'Maybe',
              quote: `₹${price} is reasonable, but I would wait for size exchanges and community fit reviews first.`,
              factor: 'Fit Confidence'
            };
          }
          return {
            intent: 'No',
            quote: `At ₹${price}, basic casual wear shouldn't cost this much. I'll stick with conventional cotton.`,
            factor: 'Budget Limit'
          };
        }
      },
      {
        segment: 'Contrasting',
        name: 'Rohan D.',
        avatar: '🧑‍🎓',
        location: 'Pune · Strict budget consumer',
        feedbackTemplate: (price) => {
          if (price <= 599) {
            return {
              intent: 'Maybe',
              quote: `Close to fast fashion prices (₹499). If sustainable hemp lasts 2x longer, it might be worth it. [Source 2]`,
              factor: 'Durability vs Cost'
            };
          }
          return {
            intent: 'No',
            quote: `₹${price} is above my budget threshold. Sustainable claims don't outweigh immediate savings.`,
            factor: 'High Price'
          };
        }
      }
    ]
  },
  {
    id: 'cold-brew',
    name: 'Artisanal Cold Brew Ceramic Press',
    category: 'Food & Home Living',
    basePrice: 1850,
    minPrice: 999,
    maxPrice: 3999,
    step: 50,
    materials: 'Stoneware Ceramic, Dual Fine-Mesh 304 Stainless Filter',
    competitors: [
      { name: 'BrewMaster Glass Press', price: 2100, cite: 'Source 1' },
      { name: 'Standard French Press', price: 850, cite: 'Source 2' }
    ],
    baseIntent: 70,
    personas: [
      {
        segment: 'Intended',
        name: 'Priya V.',
        avatar: '👩‍🎨',
        location: 'Delhi NCR · Specialty coffee hobbyist',
        feedbackTemplate: (price) => {
          if (price <= 2100) {
            return {
              intent: 'Yes',
              quote: `Stoneware ceramic thermal retention beats glass alternatives at ₹${price}. High aesthetic appeal. [Source 1]`,
              factor: 'Aesthetic & Thermal Retention'
            };
          }
          return {
            intent: 'Maybe',
            quote: `At ₹${price}, competitive with high-end electric cold brewers. Need replacement gasket availability.`,
            factor: 'Component Longevity'
          };
        }
      },
      {
        segment: 'Adjacent',
        name: 'Karthik S.',
        avatar: '👨‍💼',
        location: 'Hyderabad · Kitchen upgrade seeker',
        feedbackTemplate: (price) => {
          if (price <= 1600) {
            return {
              intent: 'Yes',
              quote: `Good value at ₹${price} for ceramic decor plus dual-mesh filtration.`,
              factor: 'Ease of Cleaning'
            };
          }
          return {
            intent: 'No',
            quote: `At ₹${price}, standard ₹850 French presses extract cold brew adequately for my daily coffee. [Source 2]`,
            factor: 'Alternative Substitutes'
          };
        }
      },
      {
        segment: 'Contrasting',
        name: 'Meera N.',
        avatar: '👩‍⚕️',
        location: 'Jaipur · Instant coffee drinker',
        feedbackTemplate: (price) => {
          return {
            intent: 'No',
            quote: `Cold brew requires 16h steeping time. Neither the ₹${price} price nor the routine fits my morning schedule.`,
            factor: 'Habit Friction'
          };
        }
      }
    ]
  },
  {
    id: 'ai-saas',
    name: 'CloudLedger AI Accountant for Micro-Startups',
    category: 'Digital SaaS & Tools',
    basePrice: 1499,
    minPrice: 499,
    maxPrice: 4999,
    step: 100,
    materials: 'Automated GST Invoicing, WhatsApp Receipts, Cashflow Forecasting',
    competitors: [
      { name: 'Legacy Accounting ERP', price: 3500, cite: 'Source 1' },
      { name: 'Free Spreadsheet Template', price: 0, cite: 'Source 2' }
    ],
    baseIntent: 82,
    personas: [
      {
        segment: 'Intended',
        name: 'Tanmay B.',
        avatar: '🚀',
        location: 'Mumbai · Solo agency founder',
        feedbackTemplate: (price) => {
          if (price <= 1999) {
            return {
              intent: 'Yes',
              quote: `At ₹${price}/mo, replacing 5 hours of manual bookkeeping saves me ₹10k+ in accountant fees. [Source 1]`,
              factor: 'Time Savings & ROI'
            };
          }
          return {
            intent: 'Maybe',
            quote: `At ₹${price}/mo, becomes a significant recurring cost. Need multi-company support to keep subscribing.`,
            factor: 'Monthly Subscription Cost'
          };
        }
      },
      {
        segment: 'Adjacent',
        name: 'Devika R.',
        avatar: '🛍️',
        location: 'Chennai · D2C brand owner',
        feedbackTemplate: (price) => {
          if (price <= 1299) {
            return {
              intent: 'Yes',
              quote: `WhatsApp receipt extraction is a killer feature for D2C operations at ₹${price}/mo.`,
              factor: 'WhatsApp Integration'
            };
          }
          return {
            intent: 'Maybe',
            quote: `₹${price}/mo requires seamless Shopify and UPI reconciliation out of the box.`,
            factor: 'Integration Breadth'
          };
        }
      },
      {
        segment: 'Contrasting',
        name: 'Vikram J.',
        avatar: '💼',
        location: 'Kolkata · Traditional retailer',
        feedbackTemplate: (price) => {
          return {
            intent: 'No',
            quote: `We prefer our existing local accountant and paper receipts. Not ready to trust cloud AI with bank tokens at ₹${price}/mo.`,
            factor: 'Data Privacy & Tradition'
          };
        }
      }
    ]
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onExplore, onSignIn, onOpenProduct }) => {
  // Ambient Light Rays Controls State
  const [showRays, setShowRays] = useState(true);
  const [activeColorPreset, setActiveColorPreset] = useState<ColorPreset>(COLOR_PRESETS[0]);

  // Interactive Sandbox State
  const [selectedProductPreset, setSelectedProductPreset] = useState<ProductPreset>(SAMPLE_PRODUCTS[0]);
  const [testPrice, setTestPrice] = useState<number>(SAMPLE_PRODUCTS[0].basePrice);
  const [activeRoleTab, setActiveRoleTab] = useState<'founder' | 'shopper' | 'sponsor'>('founder');

  // Handle preset change
  const handleSelectProductPreset = (preset: ProductPreset) => {
    setSelectedProductPreset(preset);
    setTestPrice(preset.basePrice);
  };

  // Re-calculate simulation metrics dynamically on slider movement
  const simulationMetrics = useMemo(() => {
    const priceRatio = testPrice / selectedProductPreset.basePrice;
    
    // Compute dynamic Intent %
    let intentPercent = Math.round(selectedProductPreset.baseIntent - (priceRatio - 1) * 35);
    intentPercent = Math.max(15, Math.min(95, intentPercent));

    // Distribution across 50 profiles (20 Intended, 20 Adjacent, 10 Contrasting)
    let intendedYes = Math.round(20 * (intentPercent / 100) * 1.15);
    intendedYes = Math.max(2, Math.min(20, intendedYes));
    const intendedMaybe = Math.round((20 - intendedYes) * 0.7);
    const intendedNo = 20 - intendedYes - intendedMaybe;

    let adjacentYes = Math.round(20 * (intentPercent / 100) * 0.85);
    adjacentYes = Math.max(1, Math.min(18, adjacentYes));
    const adjacentMaybe = Math.round((20 - adjacentYes) * 0.6);
    const adjacentNo = 20 - adjacentYes - adjacentMaybe;

    let contrastingYes = Math.round(10 * (intentPercent / 100) * 0.4);
    contrastingYes = Math.max(0, Math.min(5, contrastingYes));
    const contrastingMaybe = Math.round((10 - contrastingYes) * 0.4);
    const contrastingNo = 10 - contrastingYes - contrastingMaybe;

    const totalYes = intendedYes + adjacentYes + contrastingYes;
    const totalMaybe = intendedMaybe + adjacentMaybe + contrastingMaybe;
    const totalNo = intendedNo + adjacentNo + contrastingNo;

    return {
      intentPercent,
      totalYes,
      totalMaybe,
      totalNo,
      segments: {
        intended: { yes: intendedYes, maybe: intendedMaybe, no: intendedNo, total: 20 },
        adjacent: { yes: adjacentYes, maybe: adjacentMaybe, no: adjacentNo, total: 20 },
        contrasting: { yes: contrastingYes, maybe: contrastingMaybe, no: contrastingNo, total: 10 }
      }
    };
  }, [testPrice, selectedProductPreset]);

  return (
    <div className="landing-page">
      {/* 1. Dynamic WebGL Light Rays Layer */}
      <div className="landing-atmosphere" aria-hidden="true">
        {showRays && (
          <LightRays
            raysOrigin="top-center"
            raysColor={activeColorPreset.color}
            raysSpeed={1.1}
            lightSpread={0.55}
            rayLength={3.2}
            pulsating={false}
            fadeDistance={1.1}
            saturation={1.1}
            followMouse={true}
            mouseInfluence={0.12}
            className="landing-webgl-rays"
          />
        )}
        <div className="landing-glow" />
      </div>

      {/* 2. Ambient Lighting & Demo Controls Switch */}
      <div className="landing-ambient-controls">
        <div className="ambient-panel">
          <button
            type="button"
            className="ambient-toggle-btn"
            role="switch"
            aria-checked={showRays}
            onClick={() => setShowRays(prev => !prev)}
            title="Toggle WebGL Light Rays Animation"
          >
            <Sparkles size={14} className="ambient-icon" />
            <span className="ambient-label">Light Rays</span>
            <span className={`switch-track ${showRays ? 'is-on' : ''}`}>
              <span className="switch-thumb" />
            </span>
          </button>

          {showRays && (
            <div className="ambient-color-presets" aria-label="Select Ray Color Theme">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  className={`color-dot-btn ${activeColorPreset.name === preset.name ? 'active' : ''}`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => setActiveColorPreset(preset)}
                  title={preset.label}
                  aria-label={preset.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Floating Glassmorphism Navbar */}
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Main Navigation">
          <a className="landing-brand" href="/" aria-label="DROPTEST Home">
            <span className="landing-brand-mark"><span /></span>
            <span className="landing-brand-name">drop<span>test</span></span>
          </a>

          <div className="landing-nav-links">
            <a href="#interactive-sandbox">Interactive Sandbox</a>
            <a href="#live-launches">Live Launches</a>
            <a href="#role-ecosystem">3-Role Engine</a>
            <a href="#how-it-works">How It Works</a>
          </div>

          <div className="landing-nav-actions">
            <button className="landing-signin" type="button" onClick={onSignIn}>
              Sign In / Sign Up
            </button>
            <button className="landing-nav-cta" type="button" onClick={onExplore}>
              Explore Launches <ArrowUpRight size={15} />
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* 4. High-Impact Hero Section */}
        <section className="landing-hero" aria-labelledby="landing-heading">
          <div className="landing-hero-content">
            <div className="landing-eyebrow">
              <span className="landing-eyebrow-dot" /> 
              <span>AUTONOMOUS RESEARCH + 50-PERSONA SYNTHETIC LAB</span>
            </div>
            
            <h1 id="landing-heading">
              Validate your product<br />
              <span>with 50 synthetic buyers</span><br />
              before you commit.
            </h1>

            <p className="landing-hero-copy">
              DROPTEST pairs structured community feedback and sponsor support with a private 50-persona synthetic lab that searches competitor benchmarks to test your pricing, features, and objections.
            </p>

            <div className="landing-hero-actions">
              <button className="landing-button landing-button-primary" type="button" onClick={onExplore}>
                Explore Live Launches <ArrowRight size={17} />
              </button>
              <a className="landing-button landing-button-secondary" href="#interactive-sandbox">
                <Sliders size={16} /> Try Live Simulation Demo
              </a>
            </div>

            <div className="landing-integrity-banner">
              <ShieldCheck size={16} className="integrity-icon" />
              <span>
                <strong>Methodological Integrity:</strong> AI synthetic profiles remain strictly isolated from real human community feedback & sponsor proposals.
              </span>
            </div>
          </div>

          {/* 5. Hero Feature Cards Grid */}
          <div className="landing-signal-preview" aria-label="The Three Core Pillars of DROPTEST">
            <div className="landing-preview-topline">
              <span className="landing-preview-kicker">Multi-Signal Pre-Launch Intelligence</span>
              <span className="landing-preview-indicator"><i /> LIVE ENGINE</span>
            </div>

            <div className="landing-preview-grid">
              <article className="landing-preview-card landing-preview-community" onClick={onExplore}>
                <div className="landing-preview-icon"><MessageCircleMore size={20} /></div>
                <div>
                  <span className="landing-preview-label">COMMUNITY FEEDBACK</span>
                  <h2>Real Verified Shoppers</h2>
                  <p>1 structured response per shopper (Yes/Maybe/No + key factors). Clear founder breakdown.</p>
                </div>
                <span className="landing-preview-arrow"><ArrowUpRight size={17} /></span>
              </article>

              <article className="landing-preview-card landing-preview-lab" onClick={() => {
                const el = document.getElementById('interactive-sandbox');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                <div className="landing-preview-icon"><FlaskConical size={20} /></div>
                <div>
                  <span className="landing-preview-label">PRIVATE SYNTHETIC LAB</span>
                  <h2>50 Buyer Personas</h2>
                  <p>20 Intended, 20 Adjacent, 10 Contrasting profiles with dynamic price sensitivity.</p>
                </div>
                <span className="landing-preview-arrow"><ArrowUpRight size={17} /></span>
              </article>

              <article className="landing-preview-card landing-preview-sponsor" onClick={onSignIn}>
                <div className="landing-preview-icon"><Coins size={20} /></div>
                <div>
                  <span className="landing-preview-label">ECOSYSTEM SUPPORT</span>
                  <h2>Sponsor Proposals</h2>
                  <p>Sponsors & founders offer structured support (₹ amount + note) directly to early teams.</p>
                </div>
                <span className="landing-preview-arrow"><ArrowUpRight size={17} /></span>
              </article>
            </div>

            <div className="landing-preview-foot">
              <span>01. Publish Product Draft</span>
              <span className="landing-foot-line" />
              <span>02. Auto-Search Market Benchmarks</span>
              <span className="landing-foot-line" />
              <span>03. Evaluate 50 Personas & Receive Support</span>
            </div>
          </div>
        </section>

        {/* 6. Interactive 50-Persona Simulation Sandbox Widget */}
        <section className="landing-sandbox-section" id="interactive-sandbox" aria-labelledby="sandbox-heading">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">INTERACTIVE SANDBOX</span>
            <h2 id="sandbox-heading">Experience the 50-Persona<br /><span>Simulation Engine Live</span></h2>
            <p>Select a product archetype, adjust the test price slider, and watch how the 50 personas recompute their buying intent in real time.</p>
          </div>

          <div className="sandbox-container">
            {/* Left Column: Product Selector & Price Slider */}
            <div className="sandbox-control-card">
              <div className="sandbox-card-header">
                <span className="sandbox-badge"><Settings2 size={13} /> Simulation Inputs</span>
                <h3>Select Product Concept</h3>
              </div>

              {/* Product Presets */}
              <div className="sandbox-preset-pills" role="tablist">
                {SAMPLE_PRODUCTS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedProductPreset.id === p.id}
                    className={`preset-pill ${selectedProductPreset.id === p.id ? 'active' : ''}`}
                    onClick={() => handleSelectProductPreset(p)}
                  >
                    <span className="preset-name">{p.name}</span>
                    <span className="preset-cat">{p.category}</span>
                  </button>
                ))}
              </div>

              {/* Product Details Box */}
              <div className="sandbox-product-facts">
                <div className="fact-row">
                  <span className="fact-label">Category:</span>
                  <span className="fact-value">{selectedProductPreset.category}</span>
                </div>
                <div className="fact-row">
                  <span className="fact-label">Core Materials / Stack:</span>
                  <span className="fact-value">{selectedProductPreset.materials}</span>
                </div>
                <div className="fact-row">
                  <span className="fact-label"><Search size={12} /> Auto-Retrieved Benchmarks:</span>
                  <div className="fact-competitors">
                    {selectedProductPreset.competitors.map(c => (
                      <span key={c.name} className="competitor-chip">
                        {c.name} (₹{c.price}) · <em>{c.cite}</em>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Price Slider */}
              <div className="sandbox-slider-box">
                <div className="slider-header">
                  <span className="slider-label">Test Retail Price:</span>
                  <span className="slider-value">₹{testPrice.toLocaleString('en-IN')}</span>
                </div>

                <input
                  type="range"
                  className="interactive-range-slider"
                  min={selectedProductPreset.minPrice}
                  max={selectedProductPreset.maxPrice}
                  step={selectedProductPreset.step}
                  value={testPrice}
                  onChange={(e) => setTestPrice(Number(e.target.value))}
                  aria-label="Adjust product price to see persona re-evaluation"
                />

                <div className="slider-bounds">
                  <span>₹{selectedProductPreset.minPrice} (Budget)</span>
                  <span>Baseline: ₹{selectedProductPreset.basePrice}</span>
                  <span>₹{selectedProductPreset.maxPrice} (Premium)</span>
                </div>
              </div>

              <div className="sandbox-cta-wrap">
                <button type="button" className="sandbox-launch-btn" onClick={onSignIn}>
                  <Zap size={16} /> Run Full 50-Profile Review with Groq LLM
                </button>
              </div>
            </div>

            {/* Right Column: Live Persona Results & Sentiment Breakdown */}
            <div className="sandbox-results-card">
              <div className="results-header">
                <div>
                  <span className="sandbox-badge success"><TrendingUp size={13} /> Real-Time Output</span>
                  <h3>50-Persona Intent Scorecard</h3>
                </div>
                <div className="overall-score-pill">
                  <span className="score-num">{simulationMetrics.intentPercent}%</span>
                  <span className="score-desc">Overall Intent</span>
                </div>
              </div>

              {/* Bar breakdown */}
              <div className="intent-bar-container">
                <div className="intent-bar-labels">
                  <span className="tag-yes">Yes: {simulationMetrics.totalYes} ({(simulationMetrics.totalYes * 2)}%)</span>
                  <span className="tag-maybe">Maybe: {simulationMetrics.totalMaybe} ({(simulationMetrics.totalMaybe * 2)}%)</span>
                  <span className="tag-no">No: {simulationMetrics.totalNo} ({(simulationMetrics.totalNo * 2)}%)</span>
                </div>
                <div className="segmented-intent-bar" aria-label="Distribution bar across 50 profiles">
                  <div className="bar-segment yes" style={{ width: `${(simulationMetrics.totalYes / 50) * 100}%` }} />
                  <div className="bar-segment maybe" style={{ width: `${(simulationMetrics.totalMaybe / 50) * 100}%` }} />
                  <div className="bar-segment no" style={{ width: `${(simulationMetrics.totalNo / 50) * 100}%` }} />
                </div>
              </div>

              {/* Persona Split Badges */}
              <div className="segment-pills-row">
                <div className="segment-pill">
                  <span className="seg-title">20 Intended</span>
                  <span className="seg-stats">{simulationMetrics.segments.intended.yes} Yes · {simulationMetrics.segments.intended.maybe} Maybe</span>
                </div>
                <div className="segment-pill">
                  <span className="seg-title">20 Adjacent</span>
                  <span className="seg-stats">{simulationMetrics.segments.adjacent.yes} Yes · {simulationMetrics.segments.adjacent.maybe} Maybe</span>
                </div>
                <div className="segment-pill">
                  <span className="seg-title">10 Contrasting</span>
                  <span className="seg-stats">{simulationMetrics.segments.contrasting.yes} Yes · {simulationMetrics.segments.contrasting.no} No</span>
                </div>
              </div>

              {/* Live Persona Feedback Feed */}
              <div className="persona-feedback-feed">
                <span className="feed-title">Sample Persona Reactions at ₹{testPrice.toLocaleString('en-IN')}:</span>

                <div className="persona-cards-list">
                  {selectedProductPreset.personas.map(persona => {
                    const reaction = persona.feedbackTemplate(testPrice);
                    return (
                      <div key={persona.name} className="persona-reaction-card">
                        <div className="persona-meta">
                          <span className="persona-avatar">{persona.avatar}</span>
                          <div>
                            <span className="persona-name">{persona.name}</span>
                            <span className="persona-loc">{persona.location}</span>
                          </div>
                          <span className={`reaction-badge ${reaction.intent.toLowerCase()}`}>
                            {reaction.intent}
                          </span>
                        </div>
                        <p className="persona-quote">“{reaction.quote}”</p>
                        <span className="persona-factor">
                          <strong>Key Factor:</strong> {reaction.factor}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Live Seeded Products Showcase */}
        <section className="landing-products-section" id="live-launches" aria-labelledby="launches-heading">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">FEATURED DISCOVERY</span>
            <h2 id="launches-heading">Explore Real Products<br /><span>In Validation Right Now</span></h2>
            <p>Inspect active startup proposals, check out community feedback breakdowns, and see support proposals in action.</p>
          </div>

          <div className="landing-product-cards-grid">
            <article className="live-product-card" onClick={() => onOpenProduct ? onOpenProduct('prod_hemp_summer_tee_1') : onExplore()}>
              <div className="card-image-wrap">
                <img 
                  src="/images/products/sage-hemp-tee.jpg" 
                  alt="Organic Hemp Everyday Summer Tee"
                  onError={(e) => { e.currentTarget.src = '/images/products/organic-hemp-summer-tee.png'; }}
                />
                <span className="stage-pill">Validation Stage</span>
              </div>
              <div className="card-body">
                <div className="card-topline">
                  <span className="card-founder">EcoHemp Labs · Kavita Rao</span>
                  <span className="card-price">₹999</span>
                </div>
                <h3>Organic Hemp Everyday Summer Tee</h3>
                <p>55% Himalayan Hemp, 45% Organic Cotton. Breathable, antimicrobial, low water footprint.</p>
                <div className="card-stats">
                  <span><CheckCircle2 size={13} /> 100% Community Yes</span>
                  <span><Coins size={13} /> ₹500 Sponsor Support</span>
                </div>
              </div>
            </article>

            <article className="live-product-card" onClick={() => onOpenProduct ? onOpenProduct('prod_cold_brew_press_2') : onExplore()}>
              <div className="card-image-wrap">
                <img 
                  src="/images/products/cold-brew-press-tumbler.png" 
                  alt="Artisanal Cold Brew Press & Ceramic Tumbler"
                />
                <span className="stage-pill">Prototype Stage</span>
              </div>
              <div className="card-body">
                <div className="card-topline">
                  <span className="card-founder">TerraBrew Innovations · Rohit Verma</span>
                  <span className="card-price">₹1,850</span>
                </div>
                <h3>Artisanal Cold Brew Press & Ceramic Tumbler</h3>
                <p>Stoneware ceramic brewer with dual-layer stainless steel micro-filter for sediment-free extraction.</p>
                <div className="card-stats">
                  <span><Users size={13} /> Active Feedback</span>
                  <span><FlaskConical size={13} /> Lab Tested</span>
                </div>
              </div>
            </article>
          </div>

          <div className="explore-all-cta">
            <button type="button" className="landing-button landing-button-primary" onClick={onExplore}>
              Browse Full Explore Directory <ArrowRight size={17} />
            </button>
          </div>
        </section>

        {/* 8. 3-Role Ecosystem Section */}
        <section className="landing-roles-section" id="role-ecosystem" aria-labelledby="roles-heading">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">BUILT FOR EVERY STAKEHOLDER</span>
            <h2 id="roles-heading">One Platform.<br /><span>Three Distinct Roles.</span></h2>
            <p>Whether you're building, discovering, or sponsoring, DROPTEST creates meaningful pre-launch alignment.</p>
          </div>

          <div className="role-tabs-wrap">
            <div className="role-tabs-nav" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeRoleTab === 'founder'}
                className={`role-tab-btn ${activeRoleTab === 'founder' ? 'active' : ''}`}
                onClick={() => setActiveRoleTab('founder')}
              >
                🚀 Startup Founders
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRoleTab === 'shopper'}
                className={`role-tab-btn ${activeRoleTab === 'shopper' ? 'active' : ''}`}
                onClick={() => setActiveRoleTab('shopper')}
              >
                🛍️ Community Shoppers
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeRoleTab === 'sponsor'}
                className={`role-tab-btn ${activeRoleTab === 'sponsor' ? 'active' : ''}`}
                onClick={() => setActiveRoleTab('sponsor')}
              >
                💼 Ecosystem Sponsors
              </button>
            </div>

            <div className="role-tab-content">
              {activeRoleTab === 'founder' && (
                <div className="role-detail-card">
                  <div className="role-icon-box"><FlaskConical size={24} /></div>
                  <div className="role-copy">
                    <h3>Empower Your Product Launch Decisions</h3>
                    <ul>
                      <li><CheckCircle2 size={16} /> <strong>Private Synthetic Lab:</strong> Run 50-persona evaluations across Intended, Adjacent, and Contrasting buyer segments.</li>
                      <li><CheckCircle2 size={16} /> <strong>Automated Competitor Search:</strong> Retrieve live market benchmarks with verified source links and pricing.</li>
                      <li><CheckCircle2 size={16} /> <strong>Support Proposals Inbox:</strong> Receive non-binding support proposals (`₹ amount` + note) directly from sponsors and other founders.</li>
                      <li><CheckCircle2 size={16} /> <strong>Real Feedback Breakdown:</strong> Review verified community responses with role tags and purchasing factors.</li>
                    </ul>
                    <button type="button" className="role-action-btn" onClick={onSignIn}>
                      Start as a Founder <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {activeRoleTab === 'shopper' && (
                <div className="role-detail-card">
                  <div className="role-icon-box"><MessageCircleMore size={24} /></div>
                  <div className="role-copy">
                    <h3>Shape Tomorrow's Products Today</h3>
                    <ul>
                      <li><CheckCircle2 size={16} /> <strong>Discover Early Concepts:</strong> Explore innovative creations across fashion, tech, home goods, and food before they hit the market.</li>
                      <li><CheckCircle2 size={16} /> <strong>Structured 1-Click Feedback:</strong> Vote Yes/Maybe/No, pick your primary decision factor, and leave an optional reason.</li>
                      <li><CheckCircle2 size={16} /> <strong>Editable Responses:</strong> Update your vote at any time as products evolve without creating duplicate counts.</li>
                      <li><CheckCircle2 size={16} /> <strong>Dedicated Saved List:</strong> Keep track of promising startups on your private `/saved` page.</li>
                    </ul>
                    <button type="button" className="role-action-btn" onClick={onExplore}>
                      Explore Products as a Shopper <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {activeRoleTab === 'sponsor' && (
                <div className="role-detail-card">
                  <div className="role-icon-box"><Coins size={24} /></div>
                  <div className="role-copy">
                    <h3>Back Promising Founders Early</h3>
                    <ul>
                      <li><CheckCircle2 size={16} /> <strong>Structured Support Offers:</strong> Submit proposed support amounts (e.g. ₹500, ₹5,000) and custom partnership notes.</li>
                      <li><CheckCircle2 size={16} /> <strong>Founder Visibility:</strong> Your proposals appear directly in the receiving founder's private proposal inbox.</li>
                      <li><CheckCircle2 size={16} /> <strong>Zero Financial Risk:</strong> Proposals are structured, non-binding intent signals designed to start conversations without complicated escrow.</li>
                      <li><CheckCircle2 size={16} /> <strong>Curated Startup Pipeline:</strong> Spot vetted products backed by realistic synthetic analysis and community votes.</li>
                    </ul>
                    <button type="button" className="role-action-btn" onClick={onSignIn}>
                      Join as a Sponsor <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 9. How It Works Step-by-Step */}
        <section className="landing-how" id="how-it-works" aria-labelledby="how-heading">
          <div className="landing-section-heading">
            <span className="landing-section-kicker">STEP-BY-STEP WORKFLOW</span>
            <h2 id="how-heading">From Concept to<br /><span>Defensible Validation</span></h2>
            <p>Three straightforward steps to pressure-test your product hypothesis before investing significant capital.</p>
          </div>

          <div className="landing-steps">
            <article className="landing-step">
              <span className="landing-step-number">01</span>
              <h3>Publish Product Concept</h3>
              <p>Capture key specs, target markets, materials, pricing, and manufacturing costs in an intuitive founder draft.</p>
            </article>

            <article className="landing-step">
              <span className="landing-step-number">02</span>
              <h3>Run Automated Research</h3>
              <p>Our search engine identifies real competitor alternatives, extracting facts and reference pricing into structured sources.</p>
            </article>

            <article className="landing-step">
              <span className="landing-step-number">03</span>
              <h3>Simulate 50 Personas & Gather Votes</h3>
              <p>Evaluate exact 20/20/10 persona segments while gathering verified human feedback and sponsor proposals simultaneously.</p>
            </article>
          </div>
        </section>

        {/* 10. Bottom Conversion CTA */}
        <section className="landing-bottom-cta">
          <div className="cta-glow-bg" aria-hidden="true" />
          <div className="cta-content">
            <span className="landing-section-kicker">READY TO VALIDATE YOUR VISION?</span>
            <h2>Building something new?</h2>
            <p>Explore active startup drops or sign in to launch your own product review.</p>
            <div className="landing-bottom-actions">
              <button type="button" className="landing-button landing-button-primary" onClick={onExplore}>
                Explore Launches <ArrowRight size={17} />
              </button>
              <button type="button" className="landing-bottom-signin" onClick={onSignIn}>
                Sign In / Sign Up <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <a className="landing-brand landing-footer-brand" href="/" aria-label="DROPTEST Home">
            <span className="landing-brand-mark"><span /></span>
            <span className="landing-brand-name">drop<span>test</span></span>
          </a>
          <div className="footer-links">
            <a href="#interactive-sandbox">Simulation Sandbox</a>
            <a href="#live-launches">Product Launches</a>
            <a href="#role-ecosystem">3-Role Engine</a>
            <a href="#how-it-works">How It Works</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Real Community Signals. 50-Persona Synthetic Lab. Methodological Clarity.</span>
          <span>© {new Date().getFullYear()} DROPTEST. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
