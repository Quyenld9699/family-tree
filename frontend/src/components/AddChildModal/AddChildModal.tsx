'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal/Modal';
import parentChildService, { ParentChild } from 'src/services/parentChildService';
import personService, { Person } from 'src/services/personService';
import { getGenderText } from 'src/utils/genderUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface AddChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    spouseId: string | null;
}

export default function AddChildModal({ isOpen, onClose, onSuccess, spouseId }: AddChildModalProps) {
    const queryClient = useQueryClient();
    const [searchType, setSearchType] = useState<'name' | 'cccd'>('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedChild, setSelectedChild] = useState<Person | null>(null);
    const [isAdopted, setIsAdopted] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSearchQuery('');
        setSelectedChild(null);
        setIsAdopted(false);
        setError(null);
        setShowSuggestions(false);
    };

    // Query for all persons (cached)
    const { data: allPersons = [] } = useQuery({
        queryKey: ['persons'],
        queryFn: () => personService.getAllPersons(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: isOpen, // Only fetch when modal is open
    });

    // Filter suggestions based on search query
    const suggestions = React.useMemo(() => {
        if (searchQuery.trim().length < 2) return [];
        return allPersons
            .filter((p) => {
                if (searchType === 'name') {
                    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
                } else {
                    return p.cccd?.includes(searchQuery);
                }
            })
            .slice(0, 10);
    }, [allPersons, searchQuery, searchType]);

    // Show suggestions when query changes and has results
    useEffect(() => {
        if (searchQuery.trim().length >= 2 && suggestions.length > 0 && !selectedChild) {
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [searchQuery, suggestions.length, selectedChild]);

    const handleSelectPerson = (person: Person) => {
        setSelectedChild(person);
        setSearchQuery(searchType === 'name' ? person.name : person.cccd || '');
        setShowSuggestions(false);
    };

    // Mutation for adding child
    const addChildMutation = useMutation({
        mutationFn: (data: { spouseId: string; childId: string; isAdopted: boolean }) => {
            const childData: Omit<ParentChild, '_id'> = {
                parent: data.spouseId,
                child: data.childId,
                isAdopted: data.isAdopted,
            };
            return parentChildService.createParentChild(childData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
            queryClient.invalidateQueries({ queryKey: ['parents'] });
            toast.success('Thêm con thành công!');
            onSuccess();
            onClose();
        },
        onError: (err: any) => {
            console.error('Failed to add child:', err);
            toast.error(err.response?.data?.message || 'Thêm con thất bại');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!selectedChild) {
            toast.warning('Vui lòng chọn một người từ danh sách gợi ý!');
            return;
        }

        if (!spouseId) {
            toast.error('Không tìm thấy thông tin quan hệ vợ/chồng!');
            return;
        }

        if (!selectedChild._id) {
            toast.error('Thông tin người được chọn không hợp lệ!');
            return;
        }

        addChildMutation.mutate({
            spouseId,
            childId: selectedChild._id,
            isAdopted,
        });
    };

    const handleSearchTypeChange = (type: 'name' | 'cccd') => {
        setSearchType(type);
        setSearchQuery('');
        setSelectedChild(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm con cái">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="clay-card-inner text-[13px]" style={{ color: '#ef4444', backgroundColor: '#fee2e2', borderColor: '#fecaca' }}>
                        {error}
                    </div>
                )}

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
                            Chọn con <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div ref={wrapperRef} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setSelectedChild(null);
                                }}
                                placeholder={searchType === 'name' ? 'Nhập tên con...' : 'Nhập số CCCD...'}
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
                                                CCCD: {p.cccd || 'N/A'} · {getGenderText(p.gender)}
                                                {p.birth ? ` · ${new Date(p.birth).getFullYear()}` : ''}
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

                {selectedChild && (
                    <div className="clay-card-inner flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[13px]" style={{ color: '#0a0a0a' }}>
                            Đã chọn: <strong>{selectedChild.name}</strong>
                        </span>
                    </div>
                )}
                <p className="text-[11px]" style={{ color: '#9a9a9a' }}>
                    Nếu chưa có người trong danh sách, hãy thêm người mới trước
                </p>

                {/* Is Adopted */}
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isAdopted" checked={isAdopted} onChange={(e) => setIsAdopted(e.target.checked)} className="rounded" />
                    <label htmlFor="isAdopted" className="text-[13px]" style={{ color: '#3a3a3a' }}>
                        Con nuôi
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} disabled={addChildMutation.isPending} className="clay-btn-secondary">
                        Hủy
                    </button>
                    <button type="submit" disabled={addChildMutation.isPending} className="clay-btn-primary">
                        {addChildMutation.isPending ? 'Đang xử lý...' : 'Thêm con'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
