'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../services/authService';

interface UserMenuProps {
    user: User;
    isAdmin: boolean;
    onLogout: () => void;
    onOpenGuestCodeModal: () => void;
}

export default function UserMenu({ user, isAdmin, onLogout, onOpenGuestCodeModal }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-[12px] flex items-center justify-center border focus:outline-none transition-all duration-150 hover:scale-[1.03]"
                style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#3a3a3a' }}
                title="Menu người dùng"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 rounded-[16px] border py-2 overflow-hidden z-50"
                    style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', boxShadow: '0 4px 24px rgba(10,10,10,0.08)' }}
                >
                    <div className="px-4 py-3 border-b" style={{ borderColor: '#e5e5e5', backgroundColor: '#f9f7f2' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#6a6a6a', letterSpacing: '1px' }}>
                            Xin chào
                        </p>
                        <p className="text-[15px] font-semibold truncate" style={{ color: '#0a0a0a', letterSpacing: '-0.2px' }}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'editor' ? 'Người chỉnh sửa' : 'Gia đình'}
                        </p>
                    </div>

                    <div className="py-1">
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    onOpenGuestCodeModal();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center gap-3"
                                style={{ color: '#3a3a3a' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f7f2')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                            >
                                <div className="p-1.5 rounded-[8px]" style={{ backgroundColor: '#f3f0e8' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: '#1a3a3a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                        />
                                    </svg>
                                </div>
                                <span className="font-medium">Quản lý Mã Khách</span>
                            </button>
                        )}

                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center gap-3"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff0f0')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        >
                            <div className="p-1.5 rounded-[8px]" style={{ backgroundColor: '#fee2e2' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <span className="font-medium">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
