export type NavSection = 'features' | 'services' | 'portfolio';

export interface AgencyService {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}

export const AGENCY_SERVICES: AgencyService[] = [
  {
    id: 'marketing',
    title: 'Imperial Marketing Strategy',
    subtitle: 'High-Impact Brand Domination',
    description:
      'Omnichannel performance marketing, narrative positioning, and elite customer acquisition architectures designed to outscale the competition.',
    tags: ['Brand Strategy', 'Growth Marketing', 'Conversion Optimization', 'PR'],
  },
  {
    id: 'social',
    title: 'Social Media Agency',
    subtitle: 'Viral Engagement & Cultural Relevance',
    description:
      'High-retention social content, influencer syndication, algorithmic growth campaigns, and premium community orchestration across all platforms.',
    tags: ['Content Engine', 'Influencer Synergies', 'Viral Shortform', 'Community'],
  },
  {
    id: 'advertising',
    title: 'Precision Advertising Agency',
    subtitle: 'Scalable Performance & Media Buying',
    description:
      'Data-driven paid media execution across Meta, Google, TikTok, and programmatic networks with rigorous ROAS metrics and predictive analytics.',
    tags: ['Paid Media', 'Meta & TikTok Ads', 'Programmatic', 'Attribution'],
  },
  {
    id: 'privacy',
    title: 'Digital Privacy & Infrastructure',
    subtitle: 'Unseen, Untouchable, Imperial',
    description:
      'Encrypted digital footprint architecture, brand defense protocols, and sovereign infrastructure consulting for ultra-high-profile entities.',
    tags: ['Cyber Resilience', 'Brand Protection', 'Private Networks', 'Sovereignty'],
  },
];
