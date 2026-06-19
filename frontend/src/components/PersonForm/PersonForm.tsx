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
                    <label className="clay-label">Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="clay-input" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="clay-label">Giới tính <span style={{ color: '#ef4444' }}>*</span></label>
                        <select name="gender" value={formData.gender} onChange={handleChange} required className="clay-select">
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                        </select>
                    </div>
                    <div>
                        <label className="clay-label">CCCD</label>
                        <input type="text" name="cccd" value={formData.cccd} onChange={handleChange} className="clay-input" />
                    </div>
                </div>

                <div>
                    <label className="clay-label">Ảnh đại diện (URL)</label>
                    <input type="url" name="avatar" value={formData.avatar} onChange={handleChange} className="clay-input" placeholder="https://..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="clay-label">Ngày sinh</label>
                        <input type="date" name="birth" value={formData.birth ? new Date(formData.birth).toISOString().split('T')[0] : ''} onChange={handleChange} className="clay-input" />
                    </div>
                    <div>
                        <label className="clay-label">Ngày mất</label>
                        <input type="date" name="death" value={formData.death ? new Date(formData.death).toISOString().split('T')[0] : ''} onChange={handleChange} disabled={!formData.isDead} className="clay-input" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" name="isDead" id="pf-isDead" checked={formData.isDead} onChange={handleChange} className="rounded" />
                    <label htmlFor="pf-isDead" className="text-[13px]" style={{ color: '#3a3a3a' }}>Đã mất</label>
                </div>

                <div>
                    <label className="clay-label">Địa chỉ</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="clay-input" />
                </div>

                <div>
                    <label className="clay-label">Mô tả</label>
                    <textarea name="desc" value={formData.desc} onChange={handleChange} rows={3} className="clay-textarea" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} disabled={mutation.isPending} className="clay-btn-secondary">Hủy</button>
                    <button type="submit" disabled={mutation.isPending} className="clay-btn-primary">{mutation.isPending ? 'Đang xử lý...' : person ? 'Cập nhật' : 'Thêm mới'}</button>
                </div>
            </form>
        </Modal>
    );
}
