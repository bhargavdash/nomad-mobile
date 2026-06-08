export const SOURCE_BADGE_COLORS = {
  youtube: { bg: '#E8593C', text: '#fff', label: '▶ YouTube' },
  reddit: { bg: '#FF4500', text: '#fff', label: 'R Reddit' },
  blog: { bg: '#2A7A56', text: '#fff', label: 'Blog' },
  maps: { bg: '#2E6FAA', text: '#fff', label: 'Maps' },
} as const;

// --- Plan Your Trip data ---

export const VIBE_CATEGORIES = [
  {
    label: 'Food',
    vibes: ['Local favorites', 'Street food', 'Aesthetic cafes', 'Luxury dining'],
  },
  {
    label: 'Explore',
    vibes: [
      'Hidden gems',
      'Photo stops',
      'Sunrise points',
      'Religious places',
      'History & archaeology',
      'Beaches',
      'Mountains',
    ],
  },
  {
    label: 'Shopping',
    vibes: ['Handlooms', 'Local markets', 'Handicrafts', 'Souvenirs'],
  },
];

export const ACCOMMODATION_OPTIONS = [
  { icon: 'home', label: 'Boutique Villa', desc: 'Private, curated, intimate' },
  { icon: 'star', label: 'Luxury Hotel', desc: 'Full-service, high-end amenities' },
  { icon: 'feather', label: 'Eco Lodge', desc: 'Sustainable, close to nature' },
  { icon: 'users', label: 'Homestay', desc: 'Authentic, local living experiences' },
  { icon: 'key', label: 'Airbnb', desc: 'Unique stays in local neighborhoods' },
  { icon: 'moon', label: 'Hostel', desc: 'Social, budget-friendly for solo travelers' },
  { icon: 'plus-circle', label: 'Custom Stay', desc: 'Request specific lodging' },
] as const;

export const PACE_OPTIONS = ['Slow & Soulful', 'Balanced', 'Action-Packed'] as const;

export const BUDGET_TIERS = ['Low', 'Medium', 'High', 'Very-High'] as const;

// Exact traveller counts, 1–10 — rendered as a dropdown picker on the plan form.
export const MAX_TRAVELERS = 10;

export const TRAVELER_OPTIONS = Array.from({ length: MAX_TRAVELERS }, (_, i) => {
  const n = i + 1;
  return { value: String(n), label: `${n} ${n === 1 ? 'traveler' : 'travelers'}` };
});

// --- Research Ticker data ---

export const RESEARCH_SOURCES = [
  { key: 'youtube' as const, label: 'YouTube vlogs', color: '#E8593C' },
  { key: 'reddit' as const, label: 'Reddit: r/travel', color: '#FF4500' },
  { key: 'google' as const, label: 'Google Search', color: '#2E6FAA' },
  { key: 'blog' as const, label: 'Travel blogs', color: '#2A7A56' },
];
