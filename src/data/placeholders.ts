export const SOURCE_BADGE_COLORS = {
  youtube: { bg: '#E8593C', text: '#fff', label: '▶ YouTube' },
  reddit: { bg: '#FF4500', text: '#fff', label: 'R Reddit' },
  blog: { bg: '#2A7A56', text: '#fff', label: '✍ Blog' },
  maps: { bg: '#2E6FAA', text: '#fff', label: '📍 Maps' },
} as const;

// --- Plan Your Trip data ---

export const VIBE_CATEGORIES = [
  {
    label: 'Food + Drink',
    vibes: ['Local cuisines', 'Street food', 'Chai stops', 'Fine dining'],
  },
  {
    label: 'Explore',
    vibes: ['Photo spots', 'Heritage walks', 'Handicrafts', 'Hidden gems', 'Sunrise spots'],
  },
  {
    label: 'Shopping',
    vibes: ['Local Markets', 'Luxury Boutiques', 'Artisan Crafts', 'Souvenirs'],
  },
];

export const ACCOMMODATION_OPTIONS = [
  { icon: '🏡', label: 'Boutique Villa', desc: 'Private, curated, intimate' },
  { icon: '🏨', label: 'Luxury Hotel', desc: 'Full-service, high-end amenities' },
  { icon: '🌿', label: 'Eco Lodge', desc: 'Sustainable, close to nature' },
  { icon: '🏠', label: 'Homestay', desc: 'Authentic, local living experiences' },
  { icon: '🛋', label: 'Airbnb', desc: 'Unique stays in local neighborhoods' },
  { icon: '🛏', label: 'Hostel', desc: 'Social, budget-friendly for solo travelers' },
  { icon: '✨', label: 'Custom Stay', desc: 'Request specific lodging' },
];

export const PACE_OPTIONS = ['Slow & Soulful', 'Balanced', 'Action-Packed'] as const;

export const BUDGET_TIERS = ['Low', 'Medium', 'High', 'Very-High'] as const;

export const TRAVELER_OPTIONS = [
  { value: '1' as const, label: '1 Person' },
  { value: '2' as const, label: '2 People' },
  { value: '3+' as const, label: '3+ People' },
  { value: 'large' as const, label: 'Large Group' },
];

// --- Research Ticker data ---

export const RESEARCH_SOURCES = [
  { key: 'youtube' as const, label: 'YouTube vlogs', color: '#E8593C' },
  { key: 'reddit' as const, label: 'Reddit: r/travel', color: '#FF4500' },
  { key: 'google' as const, label: 'Google Search', color: '#2E6FAA' },
  { key: 'blog' as const, label: 'Travel blogs', color: '#2A7A56' },
];
