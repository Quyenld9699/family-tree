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
                    className="fixed z-10 w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-150 hover:scale-[1.04]"
                    style={{ top: '80px', right: '20px', backgroundColor: '#fefef9', border: '1.5px solid #e5e5e5', color: '#0a0a0a', boxShadow: '0 2px 12px rgba(10,10,10,0.07)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f7f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fefef9')}
                    title="Xem toàn bộ cây gia phả"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
