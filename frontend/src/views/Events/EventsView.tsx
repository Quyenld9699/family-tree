'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEvents } from 'src/hooks/useEvents';
import eventService, { FamilyEvent, CreateEventInput } from 'src/services/eventService';
import { useAuth } from 'src/context/AuthContext';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function typeLabel(e: FamilyEvent): string {
    if (e.sourceType === 'death') return 'Giỗ';
    if (e.sourceType === 'birth') return 'Sinh nhật';
    return 'Lễ / Khác';
}

export default function EventsView() {
    const { data: events = [], isLoading } = useEvents();
    const { isAdmin, isEditor } = useAuth();
    const canEdit = isAdmin || isEditor;
    const queryClient = useQueryClient();

    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState<string | null>(null);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] });

    const handleSyncAll = async () => {
        if (!confirm('Tính lại toàn bộ giỗ & sinh nhật từ danh sách thành viên?')) return;
        setSyncing(true);
        setSyncMsg(null);
        try {
            const res = await eventService.syncAll();
            setSyncMsg(`Đã xử lý ${res.processed} thành viên, xóa ${res.deletedOrphans} event thừa.`);
            refresh();
        } catch (e: any) {
            setSyncMsg('Lỗi: ' + (e?.response?.data?.message || e.message));
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa sự kiện này?')) return;
        await eventService.deleteEvent(id);
        refresh();
    };

    return (
        <div className="min-h-screen px-4 py-6 md:px-8" style={{ backgroundColor: '#fffaf0' }}>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-5 gap-3">
                    <div className="flex items-center gap-3">
                        <a href="/" className="text-[13px] rounded-[12px] border px-3 py-2" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                            ← Cây gia phả
                        </a>
                        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#0a0a0a' }}>
                            Lịch sự kiện
                        </h1>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing}
                            className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ backgroundColor: '#0a0a0a' }}
                        >
                            {syncing ? 'Đang tính...' : 'Tính lại giỗ & sinh nhật'}
                        </button>
                    )}
                </div>

                {syncMsg && (
                    <div className="mb-4 rounded-[12px] border px-4 py-3 text-sm" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                        {syncMsg}
                    </div>
                )}

                {canEdit && <EventForm onSaved={refresh} />}

                {isLoading ? (
                    <p style={{ color: '#6a6a6a' }}>Đang tải...</p>
                ) : events.length === 0 ? (
                    <p className="mt-4" style={{ color: '#9a9a9a' }}>Chưa có sự kiện nào.</p>
                ) : (
                    <ul className="space-y-2 mt-4">
                        {events.map((e) => (
                            <li
                                key={e._id}
                                className="flex items-center justify-between rounded-[16px] border px-4 py-3"
                                style={{ backgroundColor: '#fffaf0', borderColor: '#e5e5e5' }}
                            >
                                <div className="min-w-0">
                                    <div className="font-medium truncate" style={{ color: '#0a0a0a' }}>{e.title}</div>
                                    <div className="text-[13px]" style={{ color: '#6a6a6a' }}>
                                        {typeLabel(e)} · {e.day}/{e.month}{e.isLeapMonth ? ' (nhuận)' : ''} {e.calendar === 'lunar' ? 'ÂL' : 'DL'}
                                        {!e.isActive && ' · (tắt)'}
                                    </div>
                                </div>
                                {canEdit && (
                                    <button onClick={() => handleDelete(e._id)} className="text-[13px] flex-shrink-0 ml-3" style={{ color: '#ff4d8b' }}>
                                        Xóa
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function EventForm({ onSaved }: { onSaved: () => void }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [calendar, setCalendar] = useState<'lunar' | 'solar'>('lunar');
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState(1);
    const [isLeapMonth, setIsLeapMonth] = useState(false);
    const [saving, setSaving] = useState(false);

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setSaving(true);
        try {
            const input: CreateEventInput = { title, calendar, day, month, isLeapMonth: calendar === 'lunar' ? isLeapMonth : false };
            await eventService.createEvent(input);
            setTitle('');
            setOpen(false);
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="rounded-[12px] border px-4 py-2.5 text-sm font-medium" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                + Thêm sự kiện
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="rounded-[16px] border p-4 space-y-3" style={{ borderColor: '#e5e5e5' }}>
            <input
                required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên sự kiện"
                className="w-full rounded-[12px] border px-4 py-3 text-sm" style={{ backgroundColor: '#fffaf0', borderColor: '#e5e5e5' }}
            />
            <div className="flex gap-3 flex-wrap">
                <select value={calendar} onChange={(e) => setCalendar(e.target.value as 'lunar' | 'solar')} className="rounded-[12px] border px-3 py-2.5 text-sm" style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0' }}>
                    <option value="lunar">Âm lịch</option>
                    <option value="solar">Dương lịch</option>
                </select>
                <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="rounded-[12px] border px-3 py-2.5 text-sm" style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0' }}>
                    {DAYS.map((d) => <option key={d} value={d}>Ngày {d}</option>)}
                </select>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-[12px] border px-3 py-2.5 text-sm" style={{ borderColor: '#e5e5e5', backgroundColor: '#fffaf0' }}>
                    {MONTHS.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
                </select>
                {calendar === 'lunar' && (
                    <label className="flex items-center gap-1.5 text-sm" style={{ color: '#3a3a3a' }}>
                        <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} /> Nhuận
                    </label>
                )}
            </div>
            <div className="flex gap-2">
                <button type="submit" disabled={saving} className="rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#0a0a0a' }}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-[12px] border px-4 py-2.5 text-sm" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                    Hủy
                </button>
            </div>
        </form>
    );
}
