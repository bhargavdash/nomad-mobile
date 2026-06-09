// Mirrors backend response shapes served by nomad-api (src/routes/*).
// Kept in lock-step with nomad-web/types/api.ts — the canonical contract.

export type TripStatus = 'researching' | 'ready' | 'active' | 'completed' | 'archived';

export type TripSummary = {
  id: string;
  destination: string;
  dateFrom: string | null;
  dateTo: string | null;
  durationDays: number | null;
  travelers: string | null;
  vibes: string[];
  accommodation: string | null;
  pace: string | null;
  budget: string | null;
  status: TripStatus;
  statsPlaces: number;
  statsTips: number;
  statsPhotoStops: number;
  // Trip-level planning surface (Tier 2). Null on older trips generated before
  // the field existed — render conditionally.
  routeSummary: string | null;
  transportStrategy: string | null;
  seasonalTips: string[];
  stayByCity: Record<string, string> | null;
  budgetEstimate: string | null;
  currencyAdvice: string | null;
  // City-led imagery — resolved server-side once and shipped with the trip.
  heroImageUrl: string | null;
  imagesResolvedAt: string | null;
  createdAt: string;
};

export type TripDay = {
  id: string;
  dayNumber: number;
  city: string;
  title: string;
  description: string | null;
  highlights: string[];
  stopCount: number;
  imageUrl: string | null;
};

export type TripStop = {
  id: string;
  time: string;
  ampm: string;
  duration: string | null;
  name: string;
  description: string | null;
  source: 'youtube' | 'reddit' | 'blog' | 'maps' | null;
  tags: string[];
  locked: boolean;
};

export type TripFullResponse = {
  trip: TripSummary;
  days: (TripDay & { stops?: TripStop[] })[];
};

export type ResearchDiscovery = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  source: 'youtube' | 'reddit' | 'blog' | 'maps';
};

export type ResearchJobResponse = {
  status: 'pending' | 'researching' | 'building' | 'completed' | 'failed';
  phase: number;
  progress: number;
  message: string | null;
  stats: { places: number; tips: number; photoStops: number };
  discoveries: ResearchDiscovery[];
};

// SA-8: trending is LLM-generated per season, split into India + International.
export type TrendingDest = {
  name: string;
  country: string;
  duration: string; // "5-7 days"
  blurb: string; // ≤15 words
  vibe_tags: string[];
  // Hydrated lazily by nomad-api via the Wikipedia place-image resolver.
  // Null when Wikipedia has no usable photo — frontend then deterministically
  // picks a themed Unsplash fallback.
  imageUrl?: string | null;
};

export type Season = 'summer' | 'monsoon' | 'post-monsoon' | 'winter';

export type TrendingResponse = {
  season: Season | 'bootstrap';
  seasonKey: string | null;
  refreshedAt: string | null;
  india: TrendingDest[];
  international: TrendingDest[];
};
