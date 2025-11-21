'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import spouseService, { Spouse } from 'src/services/spouseService';
import personService, { Person } from 'src/services/personService';

interface AddSpouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    person: Person | null;
}

export default function AddSpouseModal({ isOpen, onClose, onSuccess, person }: AddSpouseModalProps) {
    const [formData, setFormData] = useState<Omit<Spouse, '_id'>>({
        husband: '',
        wife: '',
        husbandOrder: 1,
        wifeOrder: 1,
        marriageDate: undefined,
        divorceDate: undefined,
    });

    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadPersons();
        }
    }, [isOpen]);

    useEffect(() => {
        if (person) {
            // Auto-fill husband or wife based on person's gender
            if (person.gender === 'MALE') {
                setFormData((prev) => ({
                    ...prev,
                    husband: person._id || '',
                    wife: '',
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    husband: '',
                    wife: person._id || '',
                }));
            }
        }
        setError(null);
    }, [person, isOpen]);

    const loadPersons = async () => {
        try {
            const data = await personService.getAllPersons();
            setPersons(data);
        } catch (err) {
            console.error('Failed to load persons:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await spouseService.createSpouse(formData);
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

        if (type === 'date') {
            setFormData((prev) => ({ ...prev, [name]: value ? new Date(value) : undefined }));
        } else if (type === 'number') {
            setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 1 }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const malePersons = persons.filter((p) => p.gender === 'MALE');
    const femalePersons = persons.filter((p) => p.gender === 'FEMALE');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thêm vợ/chồng cho ${person?.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chồng <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="husband"
                        value={formData.husband}
                        onChange={handleChange}
                        required
                        disabled={person?.gender === 'MALE'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">-- Chọn chồng --</option>
                        {malePersons.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.name} {p.birth ? `(${new Date(p.birth).getFullYear()})` : ''}
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
                        disabled={person?.gender === 'FEMALE'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">-- Chọn vợ --</option>
                        {femalePersons.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.name} {p.birth ? `(${new Date(p.birth).getFullYear()})` : ''}
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
