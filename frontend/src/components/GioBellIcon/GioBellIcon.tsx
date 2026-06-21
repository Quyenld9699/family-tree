'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GioReminder } from 'src/hooks/useGioReminders';

interface GioBellIconProps {
    reminders: GioReminder[];
}

function DaysLabel({ daysUntil }: { daysUntil: number }) {
    if (daysUntil === 0) {
        return (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[6px]" style={{ backgroundColor: '#fde8e8', color: '#c0392b' }}>
                Hôm nay
            </span>
        );
    }
    if (daysUntil === 1) {
        return (
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[6px]" style={{ backgroundColor: '#fff3e0', color: '#e67e22' }}>
                Ngày mai
            </span>
        );
    }
    if (daysUntil <= 7) {
        return (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[6px]" style={{ backgroundColor: '#fff3e0', color: '#e67e22' }}>
                Còn {daysUntil} ngày
            </span>
        );
    }
    return (
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[6px]" style={{ backgroundColor: '#f3f0e8', color: '#6a6a6a' }}>
            Còn {daysUntil} ngày
        </span>
    );
}

export default function GioBellIcon({ reminders }: GioBellIconProps) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const count = reminders.length;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="relative w-9 h-9 flex items-center justify-center rounded-[12px] border transition-all duration-150 hover:scale-[1.04]"
                style={{
                    backgroundColor: '#fefef9',
                    borderColor: count > 0 ? '#e8b94a' : '#e5e5e5',
                    color: count > 0 ? '#e8b94a' : '#6a6a6a',
                }}
                title={count > 0 ? `${count} lịch giỗ sắp tới` : 'Lịch giỗ'}
            >
                {/* Bell icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {/* Badge */}
                {count > 0 && (
                    <span
                        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: '#c0392b', color: '#ffffff' }}
                    >
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 rounded-[16px] border overflow-hidden z-50"
                    style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', boxShadow: '0 4px 24px rgba(10,10,10,0.10)' }}
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#e5e5e5', backgroundColor: '#f9f7f2' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#e8b94a" strokeWidth={2}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <p className="text-[13px] font-semibold" style={{ color: '#0a0a0a' }}>
                            Lịch giỗ sắp tới
                        </p>
                        <span className="ml-auto text-[11px]" style={{ color: '#6a6a6a' }}>
                            trong 30 ngày
                        </span>
                    </div>

                    {/* Body */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {count === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[13px]" style={{ color: '#9a9a9a' }}>
                                    Không có lịch giỗ trong 30 ngày tới
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y" style={{ borderColor: '#f0ebe0' }}>
                                {reminders.map((r) => (
                                    <li key={r.person._id} className="px-4 py-3 hover:bg-[#f9f7f2] transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold truncate" style={{ color: '#0a0a0a', letterSpacing: '-0.2px' }}>
                                                    {r.person.name}
                                                </p>
                                                <p className="text-[11px] mt-0.5" style={{ color: '#6a6a6a' }}>
                                                    Mất năm {new Date(r.person.death!).getFullYear()}
                                                </p>
                                                <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#3a3a3a' }}>
                                                    Giỗ: {r.gioLunarStr}
                                                </p>
                                                <p className="text-[11px]" style={{ color: '#9a9a9a' }}>
                                                    ({r.gioDate.toLocaleDateString('vi-VN')} dương lịch)
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 mt-0.5">
                                                <DaysLabel daysUntil={r.daysUntil} />
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
