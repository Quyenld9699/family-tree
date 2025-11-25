'use client';

import React, { useState } from 'react';
import authService from '../../services/authService';
import Modal from '../Modal/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface GuestCode {
    _id: string;
    code: string;
    expiredAt: string;
    note: string;
    role?: string;
    isActive: boolean;
    createdAt: string;
}

interface GuestCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GuestCodeModal({ isOpen, onClose }: GuestCodeModalProps) {
    const queryClient = useQueryClient();
    const [note, setNote] = useState('');
    const [duration, setDuration] = useState(7); // Default 7 days
    const [role, setRole] = useState('view');

    // Query for guest codes
    const { data: codes = [], isLoading } = useQuery({
        queryKey: ['guestCodes'],
        queryFn: async () => {
            const response = await authService.listGuestCodes();
            return response.data;
        },
        enabled: isOpen,
    });

    // Mutation for generating code
    const generateMutation = useMutation({
        mutationFn: (data: { duration: number; note: string; role: string }) => authService.generateGuestCode(data.duration, data.note, data.role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guestCodes'] });
            toast.success('Tạo mã thành công!');
            setNote('');
            setDuration(7);
            setRole('view');
        },
        onError: (error) => {
            console.error('Failed to generate code', error);
            toast.error('Có lỗi xảy ra khi tạo mã');
        },
    });

    // Mutation for revoking code
    const revokeMutation = useMutation({
        mutationFn: (id: string) => authService.revokeGuestCode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guestCodes'] });
            toast.success('Thu hồi mã thành công!');
        },
        onError: (error) => {
            console.error('Failed to revoke code', error);
            toast.error('Có lỗi xảy ra khi thu hồi mã');
        },
    });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        generateMutation.mutate({ duration, note, role });
    };

    const handleRevoke = (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn hủy mã này?')) return;
        revokeMutation.mutate(id);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quản lý Mã Khách (Guest Codes)">
            <div className="p-4">
                {/* Form tạo mã mới */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Tạo mã mới</h3>
                    <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Cho ai?)</label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ví dụ: Chú Bảy, Cô Ba..."
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quyền hạn</label>
                                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="view">Xem (View)</option>
                                    <option value="edit">Chỉnh sửa (Edit)</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn (ngày)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={generateMutation.isPending}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 whitespace-nowrap"
                                >
                                    {generateMutation.isPending ? 'Đang tạo...' : 'Tạo mã'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Danh sách mã */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Danh sách mã đã tạo</h3>
                    {isLoading ? (
                        <div className="text-center py-4">Đang tải...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quyền</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hết hạn</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {codes.map((code: GuestCode) => (
                                        <tr key={code._id} className={!code.isActive ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-blue-600">{code.code}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{code.note}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        code.role === 'edit' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {code.role === 'edit' ? 'Edit' : 'View'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(code.expiredAt)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {code.isActive ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Đã hủy</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                {code.isActive && (
                                                    <button onClick={() => handleRevoke(code._id)} className="text-red-600 hover:text-red-900" disabled={revokeMutation.isPending}>
                                                        {revokeMutation.isPending ? '...' : 'Hủy'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {codes.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                                                Chưa có mã nào được tạo
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
