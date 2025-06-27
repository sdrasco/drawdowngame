// News engine module handling both company and industry events
// This file introduces industry-wide news events that can
// affect all companies within the same industry.

const TUNABLES = {
  // probability a given industry will generate an event each week
  pIndustryEvent: 0.03
};

// List of supported industries
const INDUSTRIES = ['Software', 'Semiconductors', 'Retail', 'Energy', 'Banking'];

// Simple headline templates for each industry
const INDUSTRY_HEADLINES = {
  Software: {
    pos: [
      'Cloud spending accelerates among enterprises',
      'Major firms adopt new software standards',
      'Strong quarterly results boost SaaS optimism',
      'Developers embrace cross-platform tools',
      'AI-driven automation drives license sales',
      'Record venture funding lifts start-up valuations',
      'Open-source contributions reach all-time high',
      'Security breakthroughs cut breach costs',
      'Productivity apps top download charts',
      'Remote work trend expands IT budgets'
    ],
    neg: [
      'Major ransomware wave hits SaaS providers',
      'Key API vulnerability exposes user data',
      'Legacy system failures disrupt operations',
      'Antitrust scrutiny slows big software deals',
      'Currency headwinds weaken overseas revenue',
      'Talent poaching sparks hiring wars',
      'New privacy rules complicate analytics',
      'Licensing disputes stall deployments',
      'Cloud outages create service havoc',
      'Layoffs sweep across smaller vendors'
    ]
  },
  Semiconductors: {
    pos: [
      'Chip demand surges on AI boom',
      'Next-gen lithography breakthroughs announced',
      'Foundries report record utilization rates',
      'New partnerships secure supply chains',
      'Memory prices rebound on strong orders',
      'Analysts raise targets after earnings beat',
      'Electric vehicle growth fuels chipmakers',
      'Governments pour billions into fabs',
      'Lower costs boost margins across sector',
      'Emerging markets drive smartphone production'
    ],
    neg: [
      'New export restrictions hit chipmakers',
      'Equipment shortages delay fab expansions',
      'Weak PC sales drag on processor orders',
      'Geopolitical tensions threaten supply chains',
      'Labor strikes disrupt major foundries',
      'Lithography defects force chip recalls',
      'Patent lawsuits escalate among rivals',
      'Energy crisis hikes fabrication costs',
      'Uncertain demand leads to overstock fears',
      'Severe drought threatens water-intensive fabs'
    ]
  },
  Retail: {
    pos: [
      'Consumer confidence lifts store sales',
      'E-commerce growth beats expectations',
      'Holiday season demand skyrockets',
      'Loyalty programs drive repeat business',
      'Omnichannel strategies pay off',
      'Cost-cutting boosts profit margins',
      'Supply chain improvements speed deliveries',
      'Private label brands gain popularity',
      'Housing market boom spurs home goods',
      'Record foot traffic reported at malls'
    ],
    neg: [
      'Supply chain disruptions slam inventories',
      'Rising wages squeeze profit margins',
      'Store closures accelerate in urban areas',
      'Consumers shift away from discretionary spending',
      'Logistics costs surge on fuel prices',
      'Major data breach hits loyalty program',
      'Inflation worries dampen holiday outlook',
      'Aggressive discounting sparks price wars',
      'Unseasonable weather hurts apparel sales',
      'Labor shortages force reduced hours'
    ]
  },
  Energy: {
    pos: [
      'Oil prices rally on supply cut',
      'Breakthrough in battery storage announced',
      'Major discoveries boost proven reserves',
      'Renewable projects secure key subsidies',
      'OPEC signals production discipline',
      'Natural gas exports hit record levels',
      'Carbon capture technology gains traction',
      'Power grid upgrades improve efficiency',
      'Hydrogen investments draw new capital',
      'Offshore wind capacity expands rapidly'
    ],
    neg: [
      'Government pushes renewable mandates',
      'Pipeline protests delay distribution',
      'Hurricanes disrupt offshore drilling',
      'Refinery outages trigger shortages',
      'Safety violations result in hefty fines',
      'Fracking ban talk spooks investors',
      'Nuclear plant shutdown sparks supply fears',
      'Carbon taxes cut into profits',
      'Glut of crude drives price slump',
      'Energy demand drops amid warm winter'
    ]
  },
  Banking: {
    pos: [
      'Interest rate cuts boost loan demand',
      'Credit card spending hits record levels',
      'Wealth management fees climb on market rally',
      'Fintech partnerships streamline operations',
      'Strong capital buffers impress regulators',
      'Mortgage applications soar with low rates',
      'Trading desks profit from volatility',
      'Digital account growth accelerates',
      'Lower defaults improve balance sheets',
      'Major banks announce share buybacks'
    ],
    neg: [
      'Regulators tighten capital requirements',
      'Loan delinquencies rise in key sectors',
      'Cyber attack exposes customer data',
      'Interest rate hikes squeeze borrowers',
      'Money laundering scandal rocks industry',
      'New fintech competitors erode fees',
      'Economic downturn triggers credit losses',
      'Investment banking revenues slump',
      'Branch closures anger local communities',
      'Litigation costs surge over compliance failures'
    ]
  }
};

// Utility to pick a random element from an array
function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Possibly generate an IndustryEvent for each industry and
// append it to the provided newsFeed array.
function maybeGenerateIndustryNews(newsFeed) {
  INDUSTRIES.forEach(ind => {
    if (Math.random() < TUNABLES.pIndustryEvent) {
      const sentiment = Math.random() < 0.5 ? 1 : -1;
      const r = Math.random();
      const magnitude = r < 0.6 ? 'small' : r < 0.9 ? 'medium' : 'large';
      const pool = INDUSTRY_HEADLINES[ind][sentiment > 0 ? 'pos' : 'neg'];
      const headline = choose(pool);
      newsFeed.push({
        industry: ind,
        sentiment,
        magnitude,
        headline
      });
    }
  });
}

// Apply the impact of any IndustryEvents to the supplied list of stocks.
// Each stock object must carry `industry`, `jump` and `driftBump` fields.
// `jump` is an additive log-return applied for the coming week and `driftBump`
// is an array of {daysLeft, delta} items representing temporary drift changes.
function applyNewsEffects(stocks, events, baseJump, baseDeltaMu, days) {
  const industryEvents = events.filter(e => e.industry);
  industryEvents.forEach(evt => {
    stocks.forEach(s => {
      if (s.industry !== evt.industry) return;
      const eps = Math.random();
      const industryJump = baseJump * (0.8 + 0.4 * eps) * evt.sentiment;
      const industryDelta = baseDeltaMu * (0.9 + 0.2 * eps) * evt.sentiment;
      s.jump = (s.jump || 0) + industryJump;
      if (!s.driftBump) s.driftBump = [];
      s.driftBump.push({ daysLeft: days, delta: industryDelta });
    });
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    TUNABLES,
    INDUSTRIES,
    INDUSTRY_HEADLINES,
    maybeGenerateIndustryNews,
    applyNewsEffects
  };
}
