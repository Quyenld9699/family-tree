'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal/Modal';
import spouseService, { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import personService, { Person } from 'src/services/personService';
import { isMale, Gender } from 'src/utils/genderUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface AddSpouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    person: Person | null;
}

export default function AddSpouseModal({ isOpen, onClose, onSuccess, person }: AddSpouseModalProps) {
    const queryClient = useQueryClient();
    const [searchType, setSearchType] = useState<'name' | 'cccd'>('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSpouse, setSelectedSpouse] = useState<Person | null>(null);
    const [order, setOrder] = useState(1);
    const [marriageDate, setMarriageDate] = useState<string>('');
    const [divorceDate, setDivorceDate] = useState<string>('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Determine if person is husband or wife
    const isPersonMale = isMale(person?.gender);
    const spouseLabel = isPersonMale ? 'vợ' : 'chồng';
    const spouseGender = isPersonMale ? Gender.FEMALE : Gender.MALE;

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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && person?._id) {
            resetForm();
        }
    }, [isOpen, person]);

    const resetForm = () => {
        setSearchQuery('');
        setSelectedSpouse(null);
        setOrder(1);
        setMarriageDate('');
        setDivorceDate('');
        setShowSuggestions(false);
    };

    // Query for existing spouses
    const { data: existingSpouses = [] } = useQuery({
        queryKey: ['spouses', person?._id],
        queryFn: () => spouseService.getSpousesByPersonId(person!._id!),
        enabled: !!isOpen && !!person?._id,
        staleTime: 5 * 60 * 1000,
    });

    // Query for all persons (cached)
    const { data: allPersons = [] } = useQuery({
        queryKey: ['persons'],
        queryFn: () => personService.getAllPersons(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // Filter suggestions
    const suggestions = React.useMemo(() => {
        if (searchQuery.trim().length < 2) return [];
        return allPersons
            .filter((p) => {
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
            })
            .slice(0, 10);
    }, [allPersons, searchQuery, searchType, spouseGender, person]);

    // Show suggestions when query changes
    useEffect(() => {
        if (searchQuery.trim().length >= 2 && suggestions.length > 0 && !selectedSpouse) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [searchQuery, suggestions.length, selectedSpouse]);

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
            // const spouseId = isPersonMale ? (typeof spouse.wife === 'string' ? spouse.wife : spouse.wife?._id) : typeof spouse.husband === 'string' ? spouse.husband : spouse.husband?._id;
            return spouse[orderField] === order;
        });

        if (existingOrder) {
            const existingOrders = existingSpouses
                .map((s) => s[orderField])
                .filter((o): o is number => o !== undefined)
                .sort((a, b) => a - b);
            const maxOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
            toast.warning(`Thứ tự ${order} đã tồn tại. Vui lòng chọn thứ tự từ ${maxOrder + 1} trở lên hoặc số khác chưa sử dụng.`);
            return false;
        }

        return true;
    };

    // Mutation for creating spouse
    const createSpouseMutation = useMutation({
        mutationFn: (data: Omit<Spouse, '_id'>) => spouseService.createSpouse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spouses', person?._id] });
            toast.success('Thêm vợ/chồng thành công!');
            onSuccess();
            onClose();
        },
        onError: (err: any) => {
            console.error('Failed to add spouse:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm vợ/chồng!');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSpouse) {
            toast.warning('Vui lòng chọn một người từ danh sách gợi ý!');
            return;
        }

        if (!validateOrder()) {
            return;
        }

        const spouseData: Omit<Spouse, '_id'> = {
            husband: isPersonMale ? person!._id! : selectedSpouse._id!,
            wife: isPersonMale ? selectedSpouse._id! : person!._id!,
            husbandOrder: isPersonMale ? order : 1,
            wifeOrder: isPersonMale ? 1 : order,
            marriageDate: marriageDate ? new Date(marriageDate) : undefined,
            divorceDate: divorceDate ? new Date(divorceDate) : undefined,
        };

        createSpouseMutation.mutate(spouseData);
    };

    const handleSearchTypeChange = (type: 'name' | 'cccd') => {
        setSearchType(type);
        setSearchQuery('');
        setSelectedSpouse(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thêm ${spouseLabel} cho ${person?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Search Type + Input */}
                <div className="flex gap-3">
                    <div className="w-28 flex-shrink-0">
                        <label className="clay-label">Tìm theo</label>
                        <select value={searchType} onChange={(e) => handleSearchTypeChange(e.target.value as 'name' | 'cccd')} className="clay-select">
                            <option value="name">Tên</option>
                            <option value="cccd">CCCD</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="clay-label">
                            Chọn {spouseLabel} <span style={{ color: '#ef4444' }}>*</span>
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
                                className="clay-input"
                                required
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    className="absolute top-full left-0 right-0 mt-1 rounded-[12px] border max-h-52 overflow-y-auto z-20"
                                    style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', boxShadow: '0 4px 16px rgba(10,10,10,0.08)' }}
                                >
                                    {suggestions.map((p) => (
                                        <div
                                            key={p._id}
                                            onClick={() => handleSelectPerson(p)}
                                            className="px-3 py-2.5 cursor-pointer transition-colors border-b last:border-b-0"
                                            style={{ borderColor: '#e5e5e5' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f7f2')}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                                        >
                                            <div className="text-[13px] font-semibold" style={{ color: '#0a0a0a' }}>
                                                {p.name}
                                            </div>
                                            <div className="text-[11px]" style={{ color: '#6a6a6a' }}>
                                                CCCD: {p.cccd || 'N/A'}
                                                {p.birth ? ` · Sinh: ${new Date(p.birth).getFullYear()}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && (
                                <div
                                    className="absolute top-full left-0 right-0 mt-1 rounded-[12px] border p-3 text-[13px]"
                                    style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#6a6a6a' }}
                                >
                                    Không tìm thấy kết quả
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedSpouse && (
                    <div className="clay-card-inner flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[13px]" style={{ color: '#0a0a0a' }}>
                            Đã chọn: <strong>{selectedSpouse.name}</strong>
                        </span>
                    </div>
                )}

                {/* Order + Dates */}
                <div>
                    <label className="clay-label">
                        Thứ tự {spouseLabel} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 1)} min="1" className="clay-input" required />
                    {existingSpouses.length > 0 && (
                        <p className="mt-1 text-[11px]" style={{ color: '#6a6a6a' }}>
                            Đã sử dụng:{' '}
                            {existingSpouses
                                .map((s) => (isPersonMale ? s.wifeOrder : s.husbandOrder))
                                .filter((o): o is number => o !== undefined)
                                .sort((a, b) => a - b)
                                .join(', ')}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="clay-label">Ngày cưới</label>
                        <input type="date" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} className="clay-input" />
                    </div>
                    <div>
                        <label className="clay-label">Ngày ly hôn</label>
                        <input type="date" value={divorceDate} onChange={(e) => setDivorceDate(e.target.value)} className="clay-input" />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} disabled={createSpouseMutation.isPending} className="clay-btn-secondary">
                        Hủy
                    </button>
                    <button type="submit" disabled={createSpouseMutation.isPending} className="clay-btn-primary">
                        {createSpouseMutation.isPending ? 'Đang xử lý...' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
