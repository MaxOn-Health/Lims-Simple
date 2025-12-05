'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, User, TestTube, Package, Loader2 } from 'lucide-react';
import { useSearchStore, SearchEntityType, RecentSearch } from '@/store/search.store';
import { useDebounce } from '@/hooks/useDebounce/useDebounce';
import { getShortcutKey } from '@/hooks/useGlobalSearch';
import { patientsService } from '@/services/api/patients.service';
import { testsService } from '@/services/api/tests.service';
import { packagesService } from '@/services/api/packages.service';
import { SearchResult, RecentSearchItem } from './SearchResult';
import { Patient } from '@/types/patient.types';
import { Test } from '@/types/test.types';
import { Package as PackageType } from '@/types/package.types';

interface SearchResultItem {
    id: string;
    type: SearchEntityType;
    primary: string;
    secondary?: string;
    tertiary?: string;
    path: string;
}

export const GlobalSearchModal: React.FC = () => {
    const router = useRouter();
    const { isOpen, closeModal, activeTab, setActiveTab, recentSearches, addRecentSearch } = useSearchStore();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const debouncedQuery = useDebounce(query, 300);

    const tabs: { key: SearchEntityType; label: string; icon: React.ElementType }[] = [
        { key: 'patients', label: 'Patients', icon: User },
        { key: 'tests', label: 'Tests', icon: TestTube },
        { key: 'packages', label: 'Packages', icon: Package },
    ];

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Search when query changes
    useEffect(() => {
        const search = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                let searchResults: SearchResultItem[] = [];

                if (activeTab === 'patients') {
                    const response = await patientsService.getPatients({ search: debouncedQuery, limit: 10 });
                    searchResults = response.data.map((patient: Patient) => ({
                        id: patient.id,
                        type: 'patients' as SearchEntityType,
                        primary: patient.name,
                        secondary: `${patient.patientId} • ${patient.age}y ${patient.gender}`,
                        tertiary: patient.companyName ?? undefined,
                        path: `/patients/${patient.id}`,
                    }));
                } else if (activeTab === 'tests') {
                    const allTests = await testsService.getTests();
                    const filtered = allTests
                        .filter((test: Test) =>
                            test.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                            test.category?.toLowerCase().includes(debouncedQuery.toLowerCase())
                        )
                        .slice(0, 10);
                    searchResults = filtered.map((test: Test) => ({
                        id: test.id,
                        type: 'tests' as SearchEntityType,
                        primary: test.name,
                        secondary: test.category,
                        tertiary: test.unit ? `Unit: ${test.unit}` : undefined,
                        path: `/tests/${test.id}`,
                    }));
                } else if (activeTab === 'packages') {
                    const allPackages = await packagesService.getPackages();
                    const filtered = allPackages
                        .filter((pkg: PackageType) =>
                            pkg.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                            pkg.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
                        )
                        .slice(0, 10);
                    searchResults = filtered.map((pkg: PackageType) => ({
                        id: pkg.id,
                        type: 'packages' as SearchEntityType,
                        primary: pkg.name,
                        secondary: `₹${pkg.price}`,
                        tertiary: pkg.description ?? undefined,
                        path: `/packages/${pkg.id}`,
                    }));
                }

                setResults(searchResults);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [debouncedQuery, activeTab]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const items = query.trim() ? results : recentSearches;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % Math.max(items.length, 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + items.length) % Math.max(items.length, 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (query.trim() && results[selectedIndex]) {
                        handleResultClick(results[selectedIndex]);
                    } else if (!query.trim() && recentSearches[selectedIndex]) {
                        handleRecentClick(recentSearches[selectedIndex]);
                    }
                    break;
                case 'Tab':
                    e.preventDefault();
                    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
                    const nextIndex = e.shiftKey
                        ? (currentIndex - 1 + tabs.length) % tabs.length
                        : (currentIndex + 1) % tabs.length;
                    setActiveTab(tabs[nextIndex].key);
                    break;
            }
        },
        [query, results, recentSearches, selectedIndex, activeTab, tabs]
    );

    const handleResultClick = (result: SearchResultItem) => {
        addRecentSearch({
            id: result.id,
            name: result.primary,
            type: result.type,
            path: result.path,
        });
        closeModal();
        router.push(result.path);
    };

    const handleRecentClick = (recent: RecentSearch) => {
        closeModal();
        router.push(recent.path);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={closeModal}
            />

            {/* Modal */}
            <div className="flex min-h-full items-start justify-center p-4 pt-[15vh]">
                <div
                    className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all"
                    onKeyDown={handleKeyDown}
                >
                    {/* Search Input */}
                    <div className="flex items-center border-b border-gray-200 px-4">
                        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${activeTab}...`}
                            className="w-full px-4 py-4 text-base outline-none placeholder-gray-400"
                        />
                        {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                        <div className="flex items-center gap-2 ml-2">
                            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded">
                                {getShortcutKey()}
                            </kbd>
                            <button
                                onClick={closeModal}
                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setResults([]);
                                        setSelectedIndex(0);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                        ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto">
                        {query.trim() ? (
                            results.length > 0 ? (
                                <div className="py-2">
                                    {results.map((result, index) => (
                                        <SearchResult
                                            key={result.id}
                                            {...result}
                                            isSelected={index === selectedIndex}
                                            onClick={() => handleResultClick(result)}
                                        />
                                    ))}
                                </div>
                            ) : !isLoading ? (
                                <div className="px-4 py-12 text-center">
                                    <p className="text-gray-500">No {activeTab} found</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Try a different search term
                                    </p>
                                </div>
                            ) : null
                        ) : recentSearches.length > 0 ? (
                            <div className="py-2">
                                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Recent Searches
                                </p>
                                {recentSearches.map((recent, index) => (
                                    <RecentSearchItem
                                        key={recent.id}
                                        search={recent}
                                        isSelected={index === selectedIndex}
                                        onClick={() => handleRecentClick(recent)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-12 text-center">
                                <p className="text-gray-500">Start typing to search</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Search for patients, tests, or packages
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">↵</kbd>
                                Select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">Tab</kbd>
                                Switch tab
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px]">Esc</kbd>
                            Close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
