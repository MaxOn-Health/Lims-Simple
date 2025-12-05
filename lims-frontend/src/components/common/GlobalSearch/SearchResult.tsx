'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SearchEntityType, RecentSearch } from '@/store/search.store';
import { User, TestTube, Package, Clock, ChevronRight } from 'lucide-react';

interface SearchResultProps {
    id: string;
    type: SearchEntityType;
    primary: string;
    secondary?: string;
    tertiary?: string;
    isSelected: boolean;
    onClick: () => void;
}

export const SearchResult: React.FC<SearchResultProps> = ({
    type,
    primary,
    secondary,
    tertiary,
    isSelected,
    onClick,
}) => {
    const icons = {
        patients: User,
        tests: TestTube,
        packages: Package,
    };

    const Icon = icons[type];

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected
                    ? 'bg-primary-50 border-l-2 border-primary-500'
                    : 'hover:bg-gray-50 border-l-2 border-transparent'
                }`}
        >
            <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${type === 'patients'
                        ? 'bg-blue-100 text-blue-600'
                        : type === 'tests'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-purple-100 text-purple-600'
                    }`}
            >
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{primary}</p>
                {secondary && (
                    <p className="text-xs text-gray-500 truncate">{secondary}</p>
                )}
                {tertiary && (
                    <p className="text-xs text-gray-400 truncate">{tertiary}</p>
                )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
    );
};

interface RecentSearchItemProps {
    search: RecentSearch;
    isSelected: boolean;
    onClick: () => void;
}

export const RecentSearchItem: React.FC<RecentSearchItemProps> = ({
    search,
    isSelected,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${isSelected
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
        >
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate">{search.name}</span>
            <span className="text-xs text-gray-400 capitalize">({search.type})</span>
        </button>
    );
};
