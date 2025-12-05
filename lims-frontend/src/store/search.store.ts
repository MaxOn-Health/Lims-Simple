import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SearchEntityType = 'patients' | 'tests' | 'packages';

export interface RecentSearch {
    id: string;
    name: string;
    type: SearchEntityType;
    path: string;
    timestamp: number;
}

interface SearchStore {
    // Modal state
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
    toggleModal: () => void;

    // Active tab
    activeTab: SearchEntityType;
    setActiveTab: (tab: SearchEntityType) => void;

    // Recent searches
    recentSearches: RecentSearch[];
    addRecentSearch: (search: Omit<RecentSearch, 'timestamp'>) => void;
    clearRecentSearches: () => void;
}

const MAX_RECENT_SEARCHES = 5;

export const useSearchStore = create<SearchStore>()(
    persist(
        (set) => ({
            // Modal state
            isOpen: false,
            openModal: () => set({ isOpen: true }),
            closeModal: () => set({ isOpen: false }),
            toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),

            // Active tab
            activeTab: 'patients',
            setActiveTab: (tab) => set({ activeTab: tab }),

            // Recent searches
            recentSearches: [],
            addRecentSearch: (search) =>
                set((state) => {
                    // Remove duplicate if exists
                    const filtered = state.recentSearches.filter((s) => s.id !== search.id);
                    // Add new search at the beginning
                    const newSearches = [
                        { ...search, timestamp: Date.now() },
                        ...filtered,
                    ].slice(0, MAX_RECENT_SEARCHES);
                    return { recentSearches: newSearches };
                }),
            clearRecentSearches: () => set({ recentSearches: [] }),
        }),
        {
            name: 'lims-search-store',
            partialize: (state) => ({
                recentSearches: state.recentSearches,
            }),
        }
    )
);
