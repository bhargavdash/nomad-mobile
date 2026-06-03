// ---------------------------------------------------------------------------
// Deterministic fallback imagery
//
// This is the *fallback* tier behind the server-resolved place image
// (heroImageUrl / TripDay.imageUrl / TrendingDest.imageUrl from nomad-api). It
// maps a query → themed bucket → stable hash, and returns a direct
// `images.unsplash.com/photo-{ID}` CDN URL (no API key).
//
// Every ID below is verified-live — keep this list verified: a dead ID here is
// a broken image on screen. Ported verbatim from nomad-web/lib/unsplash.ts.
// ---------------------------------------------------------------------------

// Appears in multiple buckets — define once to satisfy sonarjs/no-duplicate-string.
const PHOTO_MISTY_LANDSCAPE = '1506905925346-21bda4d32df4';

/** Themed photo buckets. Every ID is a verified-live Unsplash photo. */
const PHOTO_BUCKETS: Record<string, string[]> = {
  heritage: [
    '1524492412937-b28074a5d7da', // Jaipur palace
    '1602216056096-3b40cc0c9944', // Jaisalmer fort
    '1558618666-fcd25c85cd64', // ornate Indian architecture
    '1564507592333-c60657eea523', // Amber Fort
  ],
  temple: [
    '1493976040374-85c8e12f0c0e', // Kyoto temple
    '1528360983277-13d401cdc186', // stone temple steps
    '1545569341-9eb8b30979d9', // lit-up Asian temple
    '1539020140153-e479b8c22e70', // Moroccan tile patterns
    '1529111290557-82f6d5c6cf85', // ancient carved stone
    PHOTO_MISTY_LANDSCAPE, // misty landscape near temple
  ],
  beach: [
    '1507525428034-b723cf961d3e', // beach sunset
    '1505118380757-91f5f5632de0', // tropical palm beach
    '1519046904884-53103b34b206', // aerial turquoise water
    '1473116763249-2faaef81ccda', // ocean horizon
  ],
  mountain: [
    PHOTO_MISTY_LANDSCAPE, // mountain peaks
    '1464822759023-fed622ff2c3b', // snowy mountain range
    '1551632811-561732d1e306', // mountain village
    '1544198365-f5d60b6d8190', // green valley hills
  ],
  desert: [
    '1509316785289-025f5b846b35', // desert dunes
    '1504512485720-7d83a16ee930', // camel caravan silhouette
    '1527489377706-5bf97e608852', // sand texture golden
  ],
  market: [
    '1512453979798-5ea266f8880c', // bustling market stalls
    '1556909114-f6e7ad7d3136', // night market lanterns
    '1558618666-fcd25c85cd64', // bazaar / arched passage
    '1488900128323-21503983a07e', // open-air market produce
  ],
  food: [
    '1504674900247-0877df9cc836', // food spread / feast
    '1555396273-367ea4eb4db5', // warm restaurant interior
    '1493770348161-369560ae357d', // chai / tea glass
    '1565299624946-b28f40a0ae38', // street food close-up
    '1414235077428-338989a2e8c0', // fine dining plate
  ],
  city: [
    '1540959733332-eab4deabeeaf', // Tokyo neon night
    '1534430480872-3498386e7856', // Rome / European piazza
    '1467269204594-9661b134dd2b', // cobblestone European alley
    '1512453979798-5ea266f8880c', // city street at dusk
    '1556910103-1c02745aae4d', // city lights reflection water
  ],
  nature: [
    '1566677914817-56426959ae9c', // rolling green countryside
    '1544198365-f5d60b6d8190', // green valley hills
    '1551632811-561732d1e306', // mountain village
    '1505118380757-91f5f5632de0', // lush tropical green
    PHOTO_MISTY_LANDSCAPE, // misty landscape
  ],
  default: [
    '1507525428034-b723cf961d3e', // beach sunset
    PHOTO_MISTY_LANDSCAPE, // mountains
    '1509316785289-025f5b846b35', // desert dunes
    '1540959733332-eab4deabeeaf', // tokyo night
    '1539020140153-e479b8c22e70', // moroccan tiles
    '1493976040374-85c8e12f0c0e', // kyoto temple
    '1524492412937-b28074a5d7da', // jaipur palace
    '1602216056096-3b40cc0c9944', // jaisalmer fort
    '1534430480872-3498386e7856', // rome
    '1564507592333-c60657eea523', // amber fort
  ],
};

/** Keyword → bucket priority list (first match wins). */
const KEYWORD_RULES: { keywords: string[]; bucket: keyof typeof PHOTO_BUCKETS }[] = [
  {
    keywords: [
      'fort',
      'palace',
      'castle',
      'haveli',
      'mahal',
      'monument',
      'heritage',
      'historical',
      'ruins',
      'citadel',
    ],
    bucket: 'heritage',
  },
  {
    keywords: [
      'temple',
      'shrine',
      'pagoda',
      'church',
      'mosque',
      'mandir',
      'gopuram',
      'stupa',
      'cathedral',
      'basilica',
    ],
    bucket: 'temple',
  },
  {
    keywords: [
      'beach',
      'coast',
      'coastal',
      'sea',
      'ocean',
      'bay',
      'island',
      'surf',
      'snorkel',
      'lagoon',
      'shore',
    ],
    bucket: 'beach',
  },
  {
    keywords: [
      'mountain',
      'hill',
      'trek',
      'trekking',
      'hike',
      'hiking',
      'valley',
      'peak',
      'ridge',
      'gorge',
      'cliff',
      'glacier',
      'summit',
      'pass',
    ],
    bucket: 'mountain',
  },
  {
    keywords: ['desert', 'dune', 'sand', 'sahara', 'thar', 'arid', 'camel', 'oasis'],
    bucket: 'desert',
  },
  {
    keywords: [
      'market',
      'bazaar',
      'bazar',
      'souk',
      'vendor',
      'stall',
      'spice',
      'handicraft',
      'shopping',
    ],
    bucket: 'market',
  },
  {
    keywords: [
      'food',
      'restaurant',
      'cafe',
      'coffee',
      'tea',
      'chai',
      'lunch',
      'dinner',
      'breakfast',
      'eat',
      'dining',
      'street food',
      'lassi',
      'thali',
      'cuisine',
    ],
    bucket: 'food',
  },
  {
    keywords: [
      'city',
      'skyline',
      'urban',
      'downtown',
      'metro',
      'night',
      'neon',
      'lights',
      'rooftop',
      'skyscraper',
    ],
    bucket: 'city',
  },
  {
    keywords: [
      'rice',
      'jungle',
      'forest',
      'garden',
      'park',
      'nature',
      'green',
      'plantation',
      'terrace',
      'waterfall',
      'river',
      'lake',
    ],
    bucket: 'nature',
  },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickPhotoId(query: string): string {
  const q = query.toLowerCase();

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      const bucket = PHOTO_BUCKETS[rule.bucket];
      return bucket[hash(query) % bucket.length];
    }
  }

  // No keyword match — fall back to default pool
  const bucket = PHOTO_BUCKETS.default;
  return bucket[hash(query) % bucket.length];
}

/**
 * Returns a deterministic, verified-live Unsplash CDN URL for a query.
 * Used as the fallback tier when the server can't resolve a real photo of the
 * place. Same query always returns the same URL (no flicker).
 */
export function unsplashByQuery(query: string, w = 1200, h = 800): string {
  const id = pickPhotoId(query);
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;
}

// Legacy alias — kept so older imports keep working.
export function unsplashUrl(query: string, w = 1200, h = 800): string {
  return unsplashByQuery(query, w, h);
}
