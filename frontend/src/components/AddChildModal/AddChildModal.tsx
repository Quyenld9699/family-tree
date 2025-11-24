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
                        Chọn con <span className="text-red-500">*</span>
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
                                            CCCD: {p.cccd || 'N/A'} | Giới tính: {getGenderText(p.gender)}
                                            {p.birth ? ` | Sinh: ${new Date(p.birth).getFullYear()}` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg p-3 text-gray-500 text-sm">Không tìm thấy kết quả</div>
                        )}
                    </div>
                    {selectedChild && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            ✓ Đã chọn: <span className="font-medium">{selectedChild.name}</span>
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Nếu chưa có người trong danh sách, hãy thêm người mới trước</p>
                </div>

                {/* Is Adopted Checkbox */}
                <div>
                    <label className="flex items-center">
                        <input type="checkbox" checked={isAdopted} onChange={(e) => setIsAdopted(e.target.checked)} className="mr-2" />
                        <span className="text-sm font-medium text-gray-700">Con nuôi</span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={addChildMutation.isPending}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={addChildMutation.isPending}>
                        {addChildMutation.isPending ? 'Đang xử lý...' : 'Thêm con'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
