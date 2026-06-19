'use client';

import React, { useState, useEffect, useRef } from 'react';
import personService, { Person } from 'src/services/personService';
import { getGenderText } from 'src/utils/genderUtils';
import { toast } from 'react-toastify';

interface SearchBarProps {
    onSearch: (personId: string, generations: number) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [searchType, setSearchType] = useState<'name' | 'cccd'>('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [generations, setGenerations] = useState(3);
    const [suggestions, setSuggestions] = useState<Person[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search for persons based on query
    useEffect(() => {
        const searchPersons = async () => {
            if (searchQuery.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const allPersons = await personService.getAllPersons();
                const filtered = allPersons.filter((person) => {
                    if (searchType === 'name') {
                        return person.name.toLowerCase().includes(searchQuery.toLowerCase());
                    } else {
                        return person.cccd?.includes(searchQuery);
                    }
                });
                setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
                setShowSuggestions(true);
            } catch (error) {
                console.error('Failed to search persons:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchPersons, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, searchType]);

    const handleSelectPerson = (person: Person) => {
        setSelectedPerson(person);
        setSearchQuery(searchType === 'name' ? person.name : person.cccd || '');
        setShowSuggestions(false);
    };

    const handleSearch = () => {
        if (!selectedPerson) {
            toast.warning('Vui lòng chọn một người từ danh sách gợi ý!');
            return;
        }
        if (generations < 1 || generations > 10) {
            toast.warning('Số thế hệ phải từ 1 đến 10!');
            return;
        }
        onSearch(selectedPerson._id!, generations);
    };

    const handleSearchTypeChange = (type: 'name' | 'cccd') => {
        setSearchType(type);
        setSearchQuery('');
        setSelectedPerson(null);
        setSuggestions([]);
    };

    return (
        <div
            className="fixed top-16 md:top-2 left-1/2 transform -translate-x-1/2 z-10 rounded-[16px] border px-3 py-2 md:px-4 md:py-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-[95%] md:w-auto justify-center"
            style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', boxShadow: '0 2px 16px rgba(10,10,10,0.07)' }}
        >
            {/* Row 1: Search Type & Input */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                    value={searchType}
                    onChange={(e) => handleSearchTypeChange(e.target.value as 'name' | 'cccd')}
                    className="px-2 py-1.5 md:px-3 md:py-2 text-[13px] rounded-[10px] border focus:outline-none focus:ring-2 w-1/3 md:w-auto"
                    style={{ backgroundColor: '#f9f7f2', borderColor: '#e5e5e5', color: '#3a3a3a', focusRingColor: '#1a3a3a' } as React.CSSProperties}
                >
                    <option value="name">Tên</option>
                    <option value="cccd">CCCD</option>
                </select>

                {/* Autocomplete Search Input */}
                <div ref={wrapperRef} className="relative flex-1 md:flex-none">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedPerson(null);
                        }}
                        placeholder={searchType === 'name' ? 'Nhập tên người...' : 'Nhập số CCCD...'}
                        className="w-full md:w-64 px-3 py-1.5 md:py-2 text-[13px] border rounded-[10px] focus:outline-none"
                        style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#0a0a0a' }}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" style={{ borderColor: '#1a3a3a', borderTopColor: 'transparent' }}></div>
                        </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            className="absolute top-full left-0 right-0 mt-1 border rounded-[12px] max-h-60 overflow-y-auto z-20 text-left"
                            style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', boxShadow: '0 4px 16px rgba(10,10,10,0.08)' }}
                        >
                            {suggestions.map((person) => (
                                <div
                                    key={person._id}
                                    onClick={() => handleSelectPerson(person)}
                                    className="px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors"
                                    style={{ borderColor: '#e5e5e5' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f7f2')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                                >
                                    <div className="text-[13px] font-semibold" style={{ color: '#0a0a0a' }}>
                                        {person.name}
                                    </div>
                                    <div className="text-[11px] mt-0.5" style={{ color: '#6a6a6a' }}>
                                        CCCD: {person.cccd || 'N/A'} | {getGenderText(person.gender)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && !loading && (
                        <div
                            className="absolute top-full left-0 right-0 mt-1 border rounded-[12px] p-3 text-[13px] text-left"
                            style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#6a6a6a' }}
                        >
                            Không tìm thấy kết quả
                        </div>
                    )}
                </div>
            </div>

            {/* Row 2: Generations & Button */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center gap-2 flex-1 md:flex-none">
                    <label className="text-[13px] whitespace-nowrap" style={{ color: '#3a3a3a' }}>
                        Số thế hệ:
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={generations}
                        onChange={(e) => setGenerations(parseInt(e.target.value) || 1)}
                        className="w-full md:w-16 px-2 py-1.5 text-[13px] border rounded-[10px] focus:outline-none"
                        style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#0a0a0a' }}
                    />
                </div>

                {/* Search Button */}
                <button
                    onClick={handleSearch}
                    disabled={!selectedPerson}
                    className="px-4 py-1.5 text-[13px] font-semibold rounded-[10px] transition-colors whitespace-nowrap"
                    style={{
                        backgroundColor: selectedPerson ? '#0a0a0a' : '#e5e5e5',
                        color: selectedPerson ? '#ffffff' : '#6a6a6a',
                        cursor: selectedPerson ? 'pointer' : 'not-allowed',
                    }}
                >
                    Tìm kiếm
                </button>
            </div>
        </div>
    );
}
