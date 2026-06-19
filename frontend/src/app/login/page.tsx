'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại');
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

            <div className="p-6 md:p-8 rounded-[24px] border w-full max-w-sm mx-4" style={{ backgroundColor: '#f9f7f2', borderColor: '#e5e5e5' }}>
                <h1 className="text-[24px] font-semibold mb-6 text-center" style={{ color: '#0a0a0a', letterSpacing: '-0.5px' }}>
                    Đăng nhập Admin
                </h1>
                {error && (
                    <div className="p-3 rounded-[10px] mb-4 text-[13px]" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 hidden">
                        <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#3a3a3a' }}>
                            Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2.5 text-[14px] border rounded-[12px] focus:outline-none"
                            style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#0a0a0a' }}
                            required
                        />
                    </div>
                    <div className="mb-5">
                        <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#3a3a3a' }}>
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 text-[14px] border rounded-[12px] focus:outline-none"
                            style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', color: '#0a0a0a' }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full font-semibold py-2.5 px-4 rounded-[12px] text-[14px] transition-colors"
                        style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
                        onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#1f1f1f')}
                        onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#0a0a0a')}
                    >
                        Đăng nhập
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/guest-login" className="text-[13px]" style={{ color: '#6a6a6a' }}>
                        Đăng nhập bằng mã khách (Guest)
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
