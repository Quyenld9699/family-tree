'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal/Modal';
import spouseService, { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import personService, { Person } from 'src/services/personService';
import { isMale, Gender } from 'src/utils/genderUtils';

interface AddSpouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    person: Person | null;
}

export default function AddSpouseModal({ isOpen, onClose, onSuccess, person }: AddSpouseModalProps) {
    const [searchType, setSearchType] = useState<'name' | 'cccd'>('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Person[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSpouse, setSelectedSpouse] = useState<Person | null>(null);
    const [order, setOrder] = useState(1);
    const [marriageDate, setMarriageDate] = useState<string>('');
    const [divorceDate, setDivorceDate] = useState<string>('');
    const [existingSpouses, setExistingSpouses] = useState<SpouseWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Determine if person is husband or wife
    const isPersonMale = isMale(person?.gender);
    const spouseLabel = isPersonMale ? 'vợ' : 'chồng';
    const spouseGender = isPersonMale ? Gender.FEMALE : Gender.MALE;

    // Debug log
    useEffect(() => {
        if (person) {
            console.log('Person:', person.name, 'Gender:', person.gender, 'isPersonMale:', isPersonMale, 'spouseLabel:', spouseLabel);
        }
    }, [person, isPersonMale, spouseLabel]);

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

    // Load existing spouses when modal opens
    useEffect(() => {
        if (isOpen && person?._id) {
            loadExistingSpouses();
            resetForm();
        }
    }, [isOpen, person]);

    const loadExistingSpouses = async () => {
        if (!person?._id) return;
        try {
            const spouses = await spouseService.getSpousesByPersonId(person._id);
            setExistingSpouses(spouses);
        } catch (err) {
            console.error('Failed to load existing spouses:', err);
        }
    };

    const resetForm = () => {
        setSearchQuery('');
        setSelectedSpouse(null);
        setOrder(1);
        setMarriageDate('');
        setDivorceDate('');
        setError(null);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Search for persons based on query
    useEffect(() => {
        const searchPersons = async () => {
            if (searchQuery.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const allPersons = await personService.getAllPersons();
                const filtered = allPersons.filter((p) => {
                    // Filter by gender (opposite of person)
                    if (p.gender !== spouseGender) return false;
                    // Don't show the person themselves
                    if (p._id === person?._id) return false;
                    // Filter by search query
                    if (searchType === 'name') {
                        return p.name.toLowerCase().includes(searchQuery.toLowerCase());
                    } else {
                        return p.cccd?.includes(searchQuery);
                    }
                });
                setSuggestions(filtered.slice(0, 10));
                setShowSuggestions(true);
            } catch (error) {
                console.error('Failed to search persons:', error);
            }
        };

        const debounceTimer = setTimeout(searchPersons, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, searchType, person, spouseGender]);

    const handleSelectPerson = (selectedPerson: Person) => {
        setSelectedSpouse(selectedPerson);
        setSearchQuery(searchType === 'name' ? selectedPerson.name : selectedPerson.cccd || '');
        setShowSuggestions(false);
    };

    const validateOrder = (): boolean => {
        if (!selectedSpouse || !person) return false;

        // Check if this order already exists for this person
        const orderField = isPersonMale ? 'wifeOrder' : 'husbandOrder';
        const existingOrder = existingSpouses.some((spouse) => {
            const spouseId = isPersonMale ? (typeof spouse.wife === 'string' ? spouse.wife : spouse.wife?._id) : typeof spouse.husband === 'string' ? spouse.husband : spouse.husband?._id;

            return spouse[orderField] === order;
        });

        if (existingOrder) {
            const existingOrders = existingSpouses
                .map((s) => s[orderField])
                .filter((o): o is number => o !== undefined)
                .sort((a, b) => a - b);
            const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
            setError(`Thứ tự ${order} đã tồn tại. Vui lòng chọn thứ tự từ ${maxOrder + 1} trở lên hoặc số khác chưa sử dụng.`);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedSpouse) {
            setError('Vui lòng chọn một người từ danh sách gợi ý!');
            return;
        }

        if (!validateOrder()) {
            return;
        }

        setLoading(true);

        try {
            const spouseData: Omit<Spouse, '_id'> = {
                husband: isPersonMale ? person!._id! : selectedSpouse._id!,
                wife: isPersonMale ? selectedSpouse._id! : person!._id!,
                // If person is male (husband), order input is for this wife (husbandOrder = which wife is this)
                // If person is female (wife), order input is for this husband (wifeOrder = which husband is this)
                husbandOrder: isPersonMale ? order : 1,
                wifeOrder: isPersonMale ? 1 : order,
                marriageDate: marriageDate ? new Date(marriageDate) : undefined,
                divorceDate: divorceDate ? new Date(divorceDate) : undefined,
            };

            await spouseService.createSpouse(spouseData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm vợ/chồng!');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchTypeChange = (type: 'name' | 'cccd') => {
        setSearchType(type);
        setSearchQuery('');
        setSelectedSpouse(null);
        setSuggestions([]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thêm ${spouseLabel} cho ${person?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

                {/* Search Type Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm theo</label>
                    <select
                        value={searchType}
                        onChange={(e) => handleSearchTypeChange(e.target.value as 'name' | 'cccd')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="name">Tên</option>
                        <option value="cccd">CCCD</option>
                    </select>
                </div>

                {/* Autocomplete Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chọn {spouseLabel} <span className="text-red-500">*</span>
                    </label>
                    <div ref={wrapperRef} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedSpouse(null);
                            }}
                            placeholder={searchType === 'name' ? `Nhập tên ${spouseLabel}...` : 'Nhập số CCCD...'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-20">
                                {suggestions.map((p) => (
                                    <div key={p._id} onClick={() => handleSelectPerson(p)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0">
                                        <div className="font-medium">{p.name}</div>
                                        <div className="text-xs text-gray-600">
                                            CCCD: {p.cccd || 'N/A'} {p.birth ? `| Sinh: ${new Date(p.birth).getFullYear()}` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg p-3 text-gray-500 text-sm">Không tìm thấy kết quả</div>
                        )}
                    </div>
                    {selectedSpouse && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            ✓ Đã chọn: <span className="font-medium">{selectedSpouse.name}</span>
                        </div>
                    )}
                </div>

                {/* Order Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thứ tự {spouseLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    {existingSpouses.length > 0 && (
                        <p className="mt-1 text-xs text-gray-600">
                            Thứ tự đã sử dụng:{' '}
                            {existingSpouses
                                .map((s) => (isPersonMale ? s.wifeOrder : s.husbandOrder))
                                .filter((o): o is number => o !== undefined)
                                .sort((a, b) => a - b)
                                .join(', ')}
                        </p>
                    )}
                </div>

                {/* Marriage and Divorce Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cưới</label>
                        <input
                            type="date"
                            value={marriageDate}
                            onChange={(e) => setMarriageDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ly hôn</label>
                        <input
                            type="date"
                            value={divorceDate}
                            onChange={(e) => setDivorceDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
