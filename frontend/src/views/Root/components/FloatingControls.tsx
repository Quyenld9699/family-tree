'use client';
import { useCallback } from 'react';
import SearchBar from 'src/components/SearchBar/SearchBar';
import AddPersonButton from 'src/components/AddPersonButton/AddPersonButton';
import LoadingOverlay from 'src/components/LoadingOverlay/LoadingOverlay';

interface FloatingControlsProps {
    isAdmin: boolean;
    isEditor: boolean;
    isLoading: boolean;
    onSearch: (personId: string, generations: number) => void;
    onAddPerson: () => void;
    isSearchActive: boolean;
    onResetSearch: () => void;
}

export default function FloatingControls({ isAdmin, isEditor, isLoading, onSearch, onAddPerson, isSearchActive, onResetSearch }: FloatingControlsProps) {
    return (
        <>
            <SearchBar onSearch={onSearch} />
            {(isAdmin || isEditor) && <AddPersonButton onClick={onAddPerson} />}

            <LoadingOverlay isLoading={isLoading} />

            {isSearchActive && (
                <button
                    onClick={onResetSearch}
                    className="fixed z-10 w-12 h-12 bg-gray-500 text-red-600 rounded-full shadow-lg hover:bg-gray-600 flex items-center justify-center"
                    title="Xem toàn bộ cây gia phả"
                    style={{ top: '80px', right: '20px' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                </button>
            )}
        </>
    );
}
