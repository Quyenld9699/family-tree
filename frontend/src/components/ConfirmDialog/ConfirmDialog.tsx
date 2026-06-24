'use client';

import React, { useEffect } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'default';
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    tone = 'default',
    loading = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    // Đóng bằng phím Esc
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const isDanger = tone === 'danger';

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !loading && onClose()} />

            {/* Dialog */}
            <div
                role="alertdialog"
                aria-modal="true"
                className="relative mx-3 mb-3 w-full max-w-sm rounded-[20px] p-5 sm:mb-0"
                style={{ backgroundColor: '#fefef9', border: '1px solid #e5e5e5', boxShadow: '0 8px 48px rgba(10,10,10,0.14)' }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: isDanger ? 'rgba(255,77,139,0.12)' : 'rgba(232,185,74,0.16)', color: isDanger ? '#c0306a' : '#946d12' }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
                            <path d="M12 9v4M12 16.5h.01" strokeLinecap="round" />
                            <path d="M10.3 4.3 2.6 17.5A1.5 1.5 0 0 0 3.9 19.8h16.2a1.5 1.5 0 0 0 1.3-2.3L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[16px] font-semibold" style={{ color: '#0a0a0a', letterSpacing: '-0.3px' }}>
                            {title}
                        </h3>
                        {message && (
                            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: '#6a6a6a' }}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-[12px] border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#f5f0e5] disabled:opacity-50"
                        style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
                        style={{ backgroundColor: isDanger ? '#ff4d8b' : '#0a0a0a' }}
                    >
                        {loading ? 'Đang xử lý...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
