'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import parentChildService, { ParentChild, ParentChildWithDetails } from 'src/services/parentChildService';
import spouseService, { SpouseWithDetails } from 'src/services/spouseService';
import personService, { Person } from 'src/services/personService';

interface ParentChildFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    parentChild?: ParentChildWithDetails | null;
}

export default function ParentChildForm({ isOpen, onClose, onSuccess, parentChild }: ParentChildFormProps) {
    const [formData, setFormData] = useState<Omit<ParentChild, '_id'>>({
        parent: '',
        child: '',
        isAdopted: false,
    });

    const [spouses, setSpouses] = useState<SpouseWithDetails[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (parentChild) {
            setFormData({
                parent: typeof parentChild.parent === 'string' ? parentChild.parent : parentChild.parent._id || '',
                child: typeof parentChild.child === 'string' ? parentChild.child : parentChild.child._id || '',
                isAdopted: parentChild.isAdopted || false,
            });
        } else {
            setFormData({
                parent: '',
                child: '',
                isAdopted: false,
            });
        }
        setError(null);
    }, [parentChild, isOpen]);

    const loadData = async () => {
        try {
            const [spousesData, personsData] = await Promise.all([spouseService.getAllSpouses(), personService.getAllPersons()]);
            setSpouses(spousesData);
            setPersons(personsData);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (parentChild?._id) {
                await parentChildService.updateParentChild(parentChild._id, formData);
            } else {
                await parentChildService.createParentChild(formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const getSpouseLabel = (spouse: SpouseWithDetails) => {
        const husbandName = typeof spouse.husband === 'string' ? 'Unknown' : spouse.husband?.name || 'Unknown';
        const wifeName = typeof spouse.wife === 'string' ? 'Unknown' : spouse.wife?.name || 'Unknown';
        const marriageYear = spouse.marriageDate ? new Date(spouse.marriageDate).getFullYear() : '';
        return `${husbandName} ❤️ ${wifeName}${marriageYear ? ` (${marriageYear})` : ''}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={parentChild ? 'Cập nhật quan hệ cha mẹ-con' : 'Thêm quan hệ cha mẹ-con'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cặp cha mẹ (Spouse Relationship) <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="parent"
                        value={formData.parent}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Chọn cặp cha mẹ --</option>
                        {spouses.map((spouse) => (
                            <option key={spouse._id} value={spouse._id}>
                                {getSpouseLabel(spouse)}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Chọn quan hệ vợ chồng của cha mẹ</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Con <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="child"
                        value={formData.child}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Chọn con --</option>
                        {persons.map((person) => (
                            <option key={person._id} value={person._id}>
                                {person.name} {person.birth ? `(${new Date(person.birth).getFullYear()})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="flex items-center">
                        <input type="checkbox" name="isAdopted" checked={formData.isAdopted} onChange={handleChange} className="mr-2" />
                        <span className="text-sm font-medium text-gray-700">Con nuôi</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={loading}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={loading}>
                        {loading ? 'Đang xử lý...' : parentChild ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
