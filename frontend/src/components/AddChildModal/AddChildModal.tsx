'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import parentChildService, { ParentChild } from 'src/services/parentChildService';
import personService, { Person } from 'src/services/personService';

interface AddChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    spouseId: string | null;
}

export default function AddChildModal({ isOpen, onClose, onSuccess, spouseId }: AddChildModalProps) {
    const [formData, setFormData] = useState<Omit<ParentChild, '_id'>>({
        parent: '',
        child: '',
        isAdopted: false,
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
        if (spouseId) {
            setFormData((prev) => ({
                ...prev,
                parent: spouseId,
                child: '',
            }));
        }
        setError(null);
    }, [spouseId, isOpen]);

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
            await parentChildService.createParentChild(formData);
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm con cái">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chọn con <span className="text-red-500">*</span>
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
                                {person.name} ({person.gender === 'MALE' ? 'Nam' : 'Nữ'}){person.birth ? ` - ${new Date(person.birth).getFullYear()}` : ''}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Nếu chưa có người trong danh sách, hãy thêm người mới trước</p>
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
                        {loading ? 'Đang xử lý...' : 'Thêm con'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
