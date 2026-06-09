import { create } from 'zustand';

// --- Types ---

export type AccommodationType = 'Hostel' | 'Budget Hotel' | 'Luxury Hotel' | 'Airbnb / Homestay';

export type PaceType = 'Slow & Soulful' | 'Balanced' | 'Action-Packed';

export type BudgetTier = 'Low' | 'Medium' | 'High' | 'Very-High';

export interface DateRange {
  from: string | null;
  to: string | null;
}

interface TripPlanState {
  destination: string;
  dates: DateRange;
  travelers: string | null;
  selectedVibes: string[];
  accommodation: AccommodationType;
  pace: PaceType;
  budget: BudgetTier;
  preferences: string;
  currentTripId: string | null;
}

interface TripPlanActions {
  setDestination: (value: string) => void;
  setDates: (dates: DateRange) => void;
  setTravelers: (value: string) => void;
  toggleVibe: (vibe: string) => void;
  setAccommodation: (value: AccommodationType) => void;
  setPace: (value: PaceType) => void;
  setBudget: (value: BudgetTier) => void;
  setPreferences: (value: string) => void;
  setCurrentTripId: (id: string) => void;
  reset: () => void;
}

const INITIAL_STATE: TripPlanState = {
  destination: '',
  dates: { from: null, to: null },
  travelers: null,
  selectedVibes: [],
  accommodation: 'Budget Hotel',
  pace: 'Balanced',
  budget: 'Medium',
  preferences: '',
  currentTripId: null,
};

export const useTripPlanStore = create<TripPlanState & TripPlanActions>()((set) => ({
  ...INITIAL_STATE,

  setDestination: (value) => set({ destination: value }),

  setDates: (dates) => set({ dates }),

  setTravelers: (value) => set({ travelers: value }),

  toggleVibe: (vibe) =>
    set((state) => ({
      selectedVibes: state.selectedVibes.includes(vibe)
        ? state.selectedVibes.filter((v) => v !== vibe)
        : [...state.selectedVibes, vibe],
    })),

  setAccommodation: (value) => set({ accommodation: value }),

  setPace: (value) => set({ pace: value }),

  setBudget: (value) => set({ budget: value }),

  setPreferences: (value) => set({ preferences: value }),

  setCurrentTripId: (id) => set({ currentTripId: id }),

  reset: () => set(INITIAL_STATE),
}));
