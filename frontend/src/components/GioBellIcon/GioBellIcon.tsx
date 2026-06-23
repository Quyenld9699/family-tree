'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EventNotification } from 'src/services/eventService';

interface GioBellIconProps {
    notifications: EventNotification[];
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
    return (
        <span
            className="text-[11px] font-medium px-1.5 py-0.5 rounded-[6px]"
            style={daysUntil <= 7 ? { backgroundColor: '#fff3e0', color: '#e67e22' } : { backgroundColor: '#f3f0e8', color: '#6a6a6a' }}
        >
            Còn {daysUntil} ngày
        </span>
    );
}

function typeLabel(sourceType: string): string {
    if (sourceType === 'death') return 'Giỗ';
    if (sourceType === 'birth') return 'Sinh nhật';
    return 'Sự kiện';
}

export default function GioBellIcon({ notifications }: GioBellIconProps) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const count = notifications.length;

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
                title={count > 0 ? `${count} sự kiện sắp tới` : 'Lịch sự kiện'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
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
                    className="fixed left-3 right-3 top-[4.25rem] z-50 overflow-hidden rounded-[16px] border sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
                    style={{ backgroundColor: '#fefef9', borderColor: '#e5e5e5', boxShadow: '0 4px 24px rgba(10,10,10,0.10)' }}
                >
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#e5e5e5', backgroundColor: '#f9f7f2' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#e8b94a" strokeWidth={2}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <p className="text-[13px] font-semibold" style={{ color: '#0a0a0a' }}>
                            Sự kiện sắp tới
                        </p>
                    </div>

                    <div className="max-h-[min(60vh,400px)] overflow-y-auto">
                        {count === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[13px]" style={{ color: '#9a9a9a' }}>
                                    Không có sự kiện sắp tới
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y" style={{ borderColor: '#f0ebe0' }}>
                                {notifications.map((n) => (
                                    <li key={n.event._id} className="px-4 py-3 hover:bg-[#f9f7f2] transition-colors">
                                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold truncate" style={{ color: '#0a0a0a', letterSpacing: '-0.2px' }}>
                                                    {n.event.title}
                                                </p>
                                                <p className="text-[11px] mt-0.5" style={{ color: '#6a6a6a' }}>
                                                    {typeLabel(n.event.sourceType)}
                                                </p>
                                                {n.occurrenceSolar && (
                                                    <p className="text-[11px] mt-0.5" style={{ color: '#9a9a9a' }}>
                                                        {new Date(n.occurrenceSolar).toLocaleDateString('vi-VN')} dương lịch
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 sm:mt-0.5">
                                                {n.daysUntil !== null && <DaysLabel daysUntil={n.daysUntil} />}
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
