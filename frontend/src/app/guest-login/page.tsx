'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function GuestLoginPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const { loginGuest } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await loginGuest(code);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Mã khách không hợp lệ hoặc đã hết hạn');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ backgroundColor: '#fefef9' }}>
            <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#6a6a6a' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại trang chủ
            </Link>

            <div className="p-8 rounded-[24px] border w-96" style={{ backgroundColor: '#f9f7f2', borderColor: '#e5e5e5' }}>
                <h1 className="text-[24px] font-semibold mb-2 text-center" style={{ color: '#0a0a0a', letterSpacing: '-0.5px' }}>
                    Đăng nhập Khách
                </h1>
                <p className="text-[13px] text-center mb-6" style={{ color: '#6a6a6a' }}>
                    Nhập mã được cấp bởi quản trị viên
                </p>
                {error && (
                    <div className="p-3 rounded-[10px] mb-4 text-[13px]" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#3a3a3a' }}>
                            Mã truy cập
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="w-full px-4 py-2.5 text-[14px] border rounded-[12px] focus:outline-none uppercase tracking-widest"
                            style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#0a0a0a' }}
                            placeholder="XXXX-XXXX"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full font-semibold py-2.5 px-4 rounded-[12px] text-[14px] transition-colors"
                        style={{ backgroundColor: '#1a3a3a', color: '#ffffff' }}
                        onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#0a2020')}
                        onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#1a3a3a')}
                    >
                        Vào xem gia phả
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/login" className="text-[13px]" style={{ color: '#6a6a6a' }}>
                        Đăng nhập Admin
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-[13px]" style={{ color: '#6a6a6a' }}>
                <p className="font-semibold mb-1" style={{ color: '#3a3a3a' }}>
                    Thông tin tác giả:
                </p>
                <p>Họ tên: Lê Đình Quyền</p>
                <p>
                    Gmail:{' '}
                    <a href="mailto:quyenld9699@gmail.com" style={{ color: '#1a3a3a' }}>
                        quyenld9699@gmail.com
                    </a>
                </p>
                <p>
                    SĐT:{' '}
                    <a href="tel:0941158376" style={{ color: '#1a3a3a' }}>
                        0941158376
                    </a>
                </p>
            </div>
        </div>
    );
}
