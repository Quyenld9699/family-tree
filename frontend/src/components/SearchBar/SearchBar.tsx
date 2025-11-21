'use client';

import React, { useState, useEffect, useRef } from 'react';
import personService, { Person } from 'src/services/personService';
import { getGenderText } from 'src/utils/genderUtils';

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
            alert('Vui lòng chọn một người từ danh sách gợi ý!');
            return;
        }
        if (generations < 1 || generations > 10) {
            alert('Số thế hệ phải từ 1 đến 10!');
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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            {/* Search Type Selector */}
            <select
                value={searchType}
                onChange={(e) => handleSearchTypeChange(e.target.value as 'name' | 'cccd')}
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="name">Tìm theo Tên</option>
                <option value="cccd">Tìm theo CCCD</option>
            </select>

            {/* Autocomplete Search Input */}
            <div ref={wrapperRef} className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedPerson(null);
                    }}
                    placeholder={searchType === 'name' ? 'Nhập tên người...' : 'Nhập số CCCD...'}
                    className="w-64 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-20">
                        {suggestions.map((person) => (
                            <div key={person._id} onClick={() => handleSelectPerson(person)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0">
                                <div className="font-medium">{person.name}</div>
                                <div className="text-xs text-gray-600">
                                    CCCD: {person.cccd || 'N/A'} | Giới tính: {getGenderText(person.gender)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && !loading && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg p-3 text-gray-500 text-sm">Không tìm thấy kết quả</div>
                )}
            </div>

            {/* Generations Input */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 whitespace-nowrap">Số thế hệ:</label>
                <input
                    type="number"
                    min="1"
                    max="10"
                    value={generations}
                    onChange={(e) => setGenerations(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Search Button */}
            <button
                onClick={handleSearch}
                disabled={!selectedPerson}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
                Tìm kiếm
            </button>
        </div>
    );
}
