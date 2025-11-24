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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 relative">
            <Link href="/" className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại trang chủ
            </Link>

            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập Khách</h1>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Mã truy cập</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 uppercase"
                            placeholder="Nhập mã được cấp"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                        Vào xem gia phả
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/login" className="text-blue-500 hover:underline text-sm">
                        Đăng nhập Admin
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-600 text-sm">
                <p className="font-bold mb-2">Thông tin tác giả:</p>
                <p>Họ tên: Lê Đình Quyền</p>
                <p>
                    Gmail:{' '}
                    <a href="mailto:quyenld9699@gmail.com" className="text-blue-500 hover:underline">
                        quyenld9699@gmail.com
                    </a>
                </p>
                <p>
                    SĐT:{' '}
                    <a href="tel:0941158376" className="text-blue-500 hover:underline">
                        0941158376
                    </a>
                </p>
            </div>
        </div>
    );
}
