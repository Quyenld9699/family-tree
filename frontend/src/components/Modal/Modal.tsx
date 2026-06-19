'use client';

import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Modal Content */}
            <div
                className="relative max-w-2xl w-full mx-3 md:mx-4 flex flex-col rounded-[20px] md:rounded-[24px] overflow-hidden"
                style={{
                    maxHeight: '90dvh',
                    backgroundColor: '#fefef9',
                    border: '1px solid #e5e5e5',
                    boxShadow: '0 8px 48px rgba(10,10,10,0.12)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <h2 className="text-[15px] md:text-[17px] font-semibold truncate pr-2" style={{ color: '#0a0a0a', letterSpacing: '-0.3px' }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex-shrink-0 rounded-[10px] flex items-center justify-center transition-colors text-[18px] leading-none"
                        style={{ color: '#6a6a6a', backgroundColor: '#f9f7f2' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f0e8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f9f7f2')}
                    >
                        &times;
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto px-4 py-4 md:px-6 md:py-5 flex-1" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                    {children}
                </div>
            </div>
        </div>
    );
}
