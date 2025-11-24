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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
        </div>
    );
}
