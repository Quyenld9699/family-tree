'use client';

import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import personService, { Person } from 'src/services/personService';
import { Gender } from 'src/utils/genderUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface AddPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddPersonModal({ isOpen, onClose, onSuccess }: AddPersonModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Omit<Person, '_id'>>({
        cccd: '',
        name: '',
        avatar: '',
        gender: Gender.MALE,
        birth: undefined,
        death: undefined,
        isDead: false,
        address: '',
        desc: '',
    });

    const mutation = useMutation({
        mutationFn: (data: Omit<Person, '_id'>) => personService.createPerson(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            toast.success('Thêm thành công!');
            onSuccess();
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create person');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const resetForm = () => {
        setFormData({
            cccd: '',
            name: '',
            avatar: '',
            gender: Gender.MALE,
            birth: undefined,
            death: undefined,
            isDead: false,
            address: '',
            desc: '',
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Thêm người mới">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        CCCD <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.cccd || ''}
                        onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                        placeholder="Nhập số CCCD"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                    <input
                        type="text"
                        value={formData.avatar || ''}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) as 0 | 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value={Gender.MALE}>Nam</option>
                        <option value={Gender.FEMALE}>Nữ</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                    <input
                        type="date"
                        value={formData.birth ? new Date(formData.birth).toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, birth: e.target.value ? new Date(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mất</label>
                    <input
                        type="date"
                        value={formData.death ? new Date(formData.death).toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, death: e.target.value ? new Date(e.target.value) : undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isDead"
                        checked={formData.isDead}
                        onChange={(e) => setFormData({ ...formData, isDead: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isDead" className="ml-2 block text-sm text-gray-700">
                        Đã mất
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                        value={formData.desc || ''}
                        onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50" disabled={mutation.isPending}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Đang lưu...' : 'Thêm người'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
