'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import spouseService, { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import personService, { Person } from 'src/services/personService';
import { isMale, isFemale } from 'src/utils/genderUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface SpouseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    spouse?: SpouseWithDetails | null;
}

export default function SpouseForm({ isOpen, onClose, onSuccess, spouse }: SpouseFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Omit<Spouse, '_id'>>({
        husband: '',
        wife: '',
        husbandOrder: 1,
        wifeOrder: 1,
        marriageDate: undefined,
        divorceDate: undefined,
    });

    // Query for all persons (cached)
    const { data: persons = [] } = useQuery({
        queryKey: ['persons'],
        queryFn: () => personService.getAllPersons(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    useEffect(() => {
        if (spouse) {
            setFormData({
                husband: typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id || '',
                wife: typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id || '',
                husbandOrder: spouse.husbandOrder || 1,
                wifeOrder: spouse.wifeOrder || 1,
                marriageDate: spouse.marriageDate,
                divorceDate: spouse.divorceDate,
            });
        } else {
            setFormData({
                husband: '',
                wife: '',
                husbandOrder: 1,
                wifeOrder: 1,
                marriageDate: undefined,
                divorceDate: undefined,
            });
        }
    }, [spouse, isOpen]);

    // Mutation for creating/updating spouse
    const mutation = useMutation({
        mutationFn: (data: Omit<Spouse, '_id'>) => {
            if (spouse?._id) {
                return spouseService.updateSpouse(spouse._id, data);
            } else {
                return spouseService.createSpouse(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spouses'] });
            toast.success('Lưu thành công!');
            onSuccess();
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'date') {
            setFormData((prev) => ({ ...prev, [name]: value ? new Date(value) : undefined }));
        } else if (type === 'number') {
            setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 1 }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const malePersons = persons.filter((p) => isMale(p.gender));
    const femalePersons = persons.filter((p) => isFemale(p.gender));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={spouse ? 'Cập nhật quan hệ vợ chồng' : 'Thêm quan hệ vợ chồng'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chồng <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="husband"
                        value={formData.husband}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Chọn chồng --</option>
                        {malePersons.map((person) => (
                            <option key={person._id} value={person._id}>
                                {person.name} {person.birth ? `(${new Date(person.birth).getFullYear()})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vợ <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="wife"
                        value={formData.wife}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Chọn vợ --</option>
                        {femalePersons.map((person) => (
                            <option key={person._id} value={person._id}>
                                {person.name} {person.birth ? `(${new Date(person.birth).getFullYear()})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự vợ</label>
                        <input
                            type="number"
                            name="wifeOrder"
                            value={formData.wifeOrder}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Vợ thứ mấy của chồng (1, 2, 3...)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự chồng</label>
                        <input
                            type="number"
                            name="husbandOrder"
                            value={formData.husbandOrder}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Chồng thứ mấy của vợ (1, 2, 3...)</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cưới</label>
                        <input
                            type="date"
                            name="marriageDate"
                            value={formData.marriageDate ? new Date(formData.marriageDate).toISOString().split('T')[0] : ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ly hôn</label>
                        <input
                            type="date"
                            name="divorceDate"
                            value={formData.divorceDate ? new Date(formData.divorceDate).toISOString().split('T')[0] : ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={mutation.isPending}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Đang xử lý...' : spouse ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
