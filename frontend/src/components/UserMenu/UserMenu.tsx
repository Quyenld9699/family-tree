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
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 focus:outline-none transition-all duration-200 hover:scale-105"
                title="Menu người dùng"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 overflow-hidden transform origin-top-right transition-all duration-200 ease-out z-50">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Xin chào</p>
                        <p className="text-base font-bold text-gray-900 truncate">{user.role === 'admin' ? 'Admin' : 'Gia đình'}</p>
                    </div>

                    <div className="py-1">
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    onOpenGuestCodeModal();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-3 group"
                            >
                                <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 16l-1.518 4.674a1 1 0 00.933 1.318 1 1 0 00.933-1.318l.828-3.172a3 3 0 002.328-2.328l.828-3.172a3 3 0 00-2.328-2.328l-.828 3.172a3 3 0 01-2.328 2.328l-.828 3.172a3 3 0 01-2.328 2.328L4 20V4a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 001 1h3a2 2 0 002-2v-1"
                                        />
                                    </svg>
                                </div>
                                <span className="font-medium">Quản lý Mã Khách</span>
                            </button>
                        )}

                        <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 group">
                            <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
