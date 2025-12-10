'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import spouseService, { SpouseWithDetails, Spouse } from 'src/services/spouseService';
import Gallery from '../Gallery/Gallery';
import { Person } from 'src/services/personService';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface RelationshipDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    spouse: SpouseWithDetails | null;
}

export default function RelationshipDetailModal({ isOpen, onClose, spouse }: RelationshipDetailModalProps) {
    const { isAdmin, isEditor } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<{
        marriageDate: string;
        divorceDate: string;
        husbandOrder: number;
        wifeOrder: number;
    }>({
        marriageDate: '',
        divorceDate: '',
        husbandOrder: 1,
        wifeOrder: 1,
    });

    useEffect(() => {
        if (spouse) {
            setFormData({
                marriageDate: spouse.marriageDate ? new Date(spouse.marriageDate).toISOString().split('T')[0] : '',
                divorceDate: spouse.divorceDate ? new Date(spouse.divorceDate).toISOString().split('T')[0] : '',
                husbandOrder: spouse.husbandOrder || 1,
                wifeOrder: spouse.wifeOrder || 1,
            });
        }
    }, [spouse]);

    const updateSpouseMutation = useMutation({
        mutationFn: (data: Partial<Spouse>) => spouseService.updateSpouse(spouse!._id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spouses'] });
            toast.success('Cập nhật thông tin hôn nhân thành công!');
            setIsEditing(false);
        },
        onError: (err: any) => {
            console.error('Failed to update spouse:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
        },
    });

    const handleSave = () => {
        if (!spouse?._id) return;

        const updateData: Partial<Spouse> = {
            husbandOrder: formData.husbandOrder,
            wifeOrder: formData.wifeOrder,
            marriageDate: formData.marriageDate ? new Date(formData.marriageDate) : undefined,
            divorceDate: formData.divorceDate ? new Date(formData.divorceDate) : undefined,
        };

        // If dates are empty strings, we might want to send null or handle it in backend.
        // Based on AddSpouseModal, undefined is used.
        // However, if we want to clear a date, we might need to send null if the backend supports it,
        // or just undefined if we only update what's present.
        // Assuming backend handles null/undefined correctly for clearing if needed, or just updates.
        // If the user clears the date input, formData.marriageDate will be ''.
        // new Date('') is Invalid Date.

        if (formData.marriageDate === '') {
            // If it was present and now is empty, we might want to clear it.
            // But Partial<Spouse> defines dates as Date | undefined.
            // Let's assume undefined means "no change" or "null" depending on backend.
            // Usually to clear, we might need to send null.
            // Let's check spouseService types.
            // It says marriageDate?: Date.
            // Let's try sending null as any if needed, but for now let's stick to undefined if empty string
            // Wait, if I want to REMOVE a date, I probably need to send null.
            // But let's look at how AddSpouseModal does it:
            // marriageDate: marriageDate ? new Date(marriageDate) : undefined
            // This is for creation. For update, if I want to unset, I might need explicit null.
            // Let's assume for now we just update values.
        }

        // Refined logic for dates:
        // If user clears the date, we want to save it as null/undefined.
        // If the backend uses Mongoose, setting a field to undefined usually doesn't unset it.
        // We might need to send null.

        const payload: any = {
            husbandOrder: formData.husbandOrder,
            wifeOrder: formData.wifeOrder,
        };

        if (formData.marriageDate) {
            payload.marriageDate = new Date(formData.marriageDate);
        } else {
            // If empty, we might want to unset it?
            // For now let's just not send it if it's empty, effectively not updating it if it was there?
            // Or if we want to allow clearing, we should send null.
            // Let's try sending null if it was previously set.
            if (spouse.marriageDate) payload.marriageDate = null;
        }

        if (formData.divorceDate) {
            payload.divorceDate = new Date(formData.divorceDate);
        } else {
            if (spouse.divorceDate) payload.divorceDate = null;
        }

        updateSpouseMutation.mutate(payload);
    };

    if (!spouse) return null;

    const husband = typeof spouse.husband === 'string' ? null : (spouse.husband as Person);
    const wife = typeof spouse.wife === 'string' ? null : (spouse.wife as Person);

    const husbandName = husband?.name || 'Chồng';
    const wifeName = wife?.name || 'Vợ';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Quan hệ: ${husbandName} - ${wifeName}`}>
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Thông tin hôn nhân</h3>
                        {(isAdmin || isEditor) && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                </svg>
                                Sửa
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cưới</label>
                                    <input
                                        type="date"
                                        value={formData.marriageDate}
                                        onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày ly hôn</label>
                                    <input
                                        type="date"
                                        value={formData.divorceDate}
                                        onChange={(e) => setFormData({ ...formData, divorceDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự vợ của {husbandName}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.wifeOrder}
                                        onChange={(e) => setFormData({ ...formData, wifeOrder: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự chồng của {wifeName}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.husbandOrder}
                                        onChange={(e) => setFormData({ ...formData, husbandOrder: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                                    disabled={updateSpouseMutation.isPending}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                                    disabled={updateSpouseMutation.isPending}
                                >
                                    {updateSpouseMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Ngày cưới</label>
                                <div className="mt-1 text-gray-900">{spouse.marriageDate ? new Date(spouse.marriageDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Ngày ly hôn</label>
                                <div className="mt-1 text-gray-900">{spouse.divorceDate ? new Date(spouse.divorceDate).toLocaleDateString('vi-VN') : 'Không'}</div>
                            </div>
                            <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                                <div className="text-sm text-gray-700">
                                    <p className="mb-1">
                                        <span className="font-medium">{wifeName}</span> là vợ thứ <span className="font-bold text-blue-600">{spouse.wifeOrder || 1}</span> của {husbandName}
                                    </p>
                                    <p>
                                        <span className="font-medium">{husbandName}</span> là chồng thứ <span className="font-bold text-blue-600">{spouse.husbandOrder || 1}</span> của {wifeName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Gallery Section */}
                <Gallery spouseId={spouse._id} />
            </div>
        </Modal>
    );
}
