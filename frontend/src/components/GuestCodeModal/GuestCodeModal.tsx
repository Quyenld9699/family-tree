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
        <Modal isOpen={isOpen} onClose={onClose} title="Quản lý Mã Khách">
            <div className="space-y-5">
                {/* Form tạo mã mới */}
                <div className="clay-card">
                    <h3 className="clay-section-title">Tạo mã mới</h3>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="clay-label">Ghi chú (Cho ai?)</label>
                            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Chú Bảy, Cô Ba..." className="clay-input" required />
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="clay-label">Quyền hạn</label>
                                <select value={role} onChange={(e) => setRole(e.target.value)} className="clay-select">
                                    <option value="view">Xem (View)</option>
                                    <option value="edit">Chỉnh sửa (Edit)</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="clay-label">Thời hạn (ngày)</label>
                                <input type="number" min="1" max="365" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="clay-input" />
                            </div>
                            <div className="flex items-end">
                                <button type="submit" disabled={generateMutation.isPending} className="clay-btn-teal whitespace-nowrap">
                                    {generateMutation.isPending ? 'Đang tạo...' : 'Tạo mã'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Danh sách mã */}
                <div>
                    <h3 className="clay-section-title">Danh sách mã đã tạo</h3>
                    {isLoading ? (
                        <div className="flex items-center gap-2 py-4 text-[13px]" style={{ color: '#6a6a6a' }}>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: '#1a3a3a', borderTopColor: 'transparent' }} />
                            Đang tải...
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[12px] border" style={{ borderColor: '#e5e5e5' }}>
                            <table className="min-w-full">
                                <thead style={{ backgroundColor: '#f9f7f2' }}>
                                    <tr>
                                        {['Mã Code', 'Ghi chú', 'Quyền', 'Hết hạn', 'Trạng thái', ''].map((h) => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6a6a6a' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: '#fefef9' }}>
                                    {codes.map((code: GuestCode, i: number) => (
                                        <tr key={code._id} style={{ opacity: code.isActive ? 1 : 0.5, borderTop: i > 0 ? '1px solid #e5e5e5' : undefined }}>
                                            <td className="px-4 py-3 whitespace-nowrap font-mono text-[13px] font-bold" style={{ color: '#1a3a3a' }}>
                                                {code.code}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[13px]" style={{ color: '#3a3a3a' }}>
                                                {code.note}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className="px-2 py-0.5 text-[11px] font-semibold rounded-full"
                                                    style={code.role === 'edit' ? { backgroundColor: '#ede9ff', color: '#7c3aed' } : { backgroundColor: '#e5e5e5', color: '#6a6a6a' }}
                                                >
                                                    {code.role === 'edit' ? 'Edit' : 'View'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[12px]" style={{ color: '#6a6a6a' }}>
                                                {formatDate(code.expiredAt)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className="px-2 py-0.5 text-[11px] font-semibold rounded-full"
                                                    style={code.isActive ? { backgroundColor: '#dcfce7', color: '#16a34a' } : { backgroundColor: '#fee2e2', color: '#ef4444' }}
                                                >
                                                    {code.isActive ? 'Hoạt động' : 'Đã hủy'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                {code.isActive && (
                                                    <button
                                                        onClick={() => handleRevoke(code._id)}
                                                        disabled={revokeMutation.isPending}
                                                        className="clay-btn-danger"
                                                        style={{ padding: '4px 10px', fontSize: '11px' }}
                                                    >
                                                        {revokeMutation.isPending ? '...' : 'Hủy'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {codes.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-[13px]" style={{ color: '#9a9a9a' }}>
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
