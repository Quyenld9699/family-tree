'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import personService, { Person } from 'src/services/personService';
import { Gender } from 'src/constants';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface PersonFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    person?: Person | null;
}

export default function PersonForm({ isOpen, onClose, onSuccess, person }: PersonFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Omit<Person, '_id'>>({
        name: '',
        gender: 'MALE',
        cccd: '',
        avatar: '',
        birth: undefined,
        death: undefined,
        isDead: false,
        address: '',
        desc: '',
    });

    useEffect(() => {
        if (person) {
            setFormData({
                name: person.name,
                gender: person.gender,
                cccd: person.cccd || '',
                avatar: person.avatar || '',
                birth: person.birth,
                death: person.death,
                isDead: person.isDead || false,
                address: person.address || '',
                desc: person.desc || '',
            });
        } else {
            setFormData({
                name: '',
                gender: 'MALE',
                cccd: '',
                avatar: '',
                birth: undefined,
                death: undefined,
                isDead: false,
                address: '',
                desc: '',
            });
        }
    }, [person, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: Omit<Person, '_id'>) => {
            if (person?._id) {
                return personService.updatePerson(person._id, data);
            } else {
                return personService.createPerson(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            toast.success(person ? 'Cập nhật thành công!' : 'Thêm thành công!');
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else if (type === 'date') {
            setFormData((prev) => ({ ...prev, [name]: value ? new Date(value) : undefined }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={person ? 'Cập nhật thông tin người' : 'Thêm người mới'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CCCD</label>
                    <input
                        type="text"
                        name="cccd"
                        value={formData.cccd}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện (URL)</label>
                    <input
                        type="url"
                        name="avatar"
                        value={formData.avatar}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                        <input
                            type="date"
                            name="birth"
                            value={formData.birth ? new Date(formData.birth).toISOString().split('T')[0] : ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mất</label>
                        <input
                            type="date"
                            name="death"
                            value={formData.death ? new Date(formData.death).toISOString().split('T')[0] : ''}
                            onChange={handleChange}
                            disabled={!formData.isDead}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center">
                        <input type="checkbox" name="isDead" checked={formData.isDead} onChange={handleChange} className="mr-2" />
                        <span className="text-sm font-medium text-gray-700">Đã mất</span>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                        name="desc"
                        value={formData.desc}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" disabled={mutation.isPending}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Đang xử lý...' : person ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
