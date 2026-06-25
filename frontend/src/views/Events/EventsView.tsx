'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useEvents } from 'src/hooks/useEvents';
import eventService, { FamilyEvent, CreateEventInput } from 'src/services/eventService';
import { useAuth } from 'src/context/AuthContext';
import ConfirmDialog from 'src/components/ConfirmDialog/ConfirmDialog';

interface PendingConfirm {
    title: string;
    message?: string;
    confirmLabel: string;
    tone: 'danger' | 'default';
    run: () => Promise<void>;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type EventKind = 'death' | 'birth' | 'manual';

interface KindStyle {
    label: string;
    bg: string;
    text: string;
    icon: React.ReactNode;
}

const FlameIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 3c.5 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c0-.8-.3-1.4-.6-2 1.6.8 2.6 2.5 2.6 4.5a4.5 4.5 0 1 1-9 0C7 9 12 8 12 3Z" strokeLinejoin="round" />
    </svg>
);

const CakeIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 4v3M8 5.5v1.5M16 5.5V7" strokeLinecap="round" />
        <path d="M5 11.5c1.2 0 1.2 1.2 2.3 1.2S8.5 11.5 9.7 11.5s1.2 1.2 2.3 1.2 1.2-1.2 2.3-1.2 1.2 1.2 2.3 1.2 1.2-1.2 2.4-1.2" strokeLinecap="round" />
        <path d="M5 11.5V10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1.5m0 0V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.5" strokeLinejoin="round" />
    </svg>
);

const SparkIcon = (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" strokeLinejoin="round" />
        <path d="M18 15l.7 1.8L20.5 17l-1.8.7L18 19.5l-.7-1.8L15.5 17l1.8-.3L18 15Z" strokeLinejoin="round" />
    </svg>
);

const KIND_STYLES: Record<EventKind, KindStyle> = {
    death: { label: 'Giỗ', bg: 'rgba(232,185,74,0.16)', text: '#946d12', icon: FlameIcon },
    birth: { label: 'Sinh nhật', bg: 'rgba(255,77,139,0.12)', text: '#c0306a', icon: CakeIcon },
    manual: { label: 'Lễ / Khác', bg: 'rgba(184,164,237,0.20)', text: '#5b4ba8', icon: SparkIcon },
};

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatSolar(d: Date): string {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function daysUntilLabel(days: number): { text: string; bg: string; color: string } {
    if (days <= 0) return { text: 'Hôm nay', bg: '#fde8e8', color: '#c0392b' };
    if (days === 1) return { text: 'Ngày mai', bg: '#fff3e0', color: '#e67e22' };
    if (days <= 7) return { text: `Còn ${days} ngày`, bg: '#fff3e0', color: '#e67e22' };
    if (days <= 30) return { text: `Còn ${days} ngày`, bg: '#f3f0e8', color: '#8a7a4a' };
    return { text: `Còn ${days} ngày`, bg: '#f3f0e8', color: '#9a9a9a' };
}

export default function EventsView() {
    const { data: events = [], isLoading } = useEvents();
    const { isAdmin, isEditor } = useAuth();
    const canEdit = isAdmin || isEditor;
    const queryClient = useQueryClient();

    const [syncing, setSyncing] = useState(false);
    const [filter, setFilter] = useState<'all' | EventKind>('all');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] });

    const runConfirm = async () => {
        if (!confirm) return;
        setConfirmLoading(true);
        try {
            await confirm.run();
            setConfirm(null);
        } finally {
            setConfirmLoading(false);
        }
    };

    const counts = useMemo(() => {
        const c = { all: events.length, death: 0, birth: 0, manual: 0 };
        for (const e of events) c[e.sourceType as EventKind]++;
        return c;
    }, [events]);

    const visible = useMemo(() => (filter === 'all' ? events : events.filter((e) => e.sourceType === filter)), [events, filter]);

    const requestSyncAll = () =>
        setConfirm({
            title: 'Tính lại giỗ & sinh nhật?',
            message: 'Hệ thống sẽ đồng bộ lại toàn bộ giỗ và sinh nhật từ danh sách thành viên, đồng thời dọn các sự kiện tự động không còn hợp lệ.',
            confirmLabel: 'Tính lại',
            tone: 'default',
            run: async () => {
                setSyncing(true);
                try {
                    const res = await eventService.syncAll();
                    toast.success(`Đã đồng bộ ${res.processed} thành viên · dọn ${res.deletedOrphans} sự kiện thừa.`);
                    refresh();
                } catch (e: any) {
                    toast.error('Lỗi: ' + (e?.response?.data?.message || e.message));
                } finally {
                    setSyncing(false);
                }
            },
        });

    const requestDelete = (event: FamilyEvent) =>
        setConfirm({
            title: 'Xóa sự kiện này?',
            message: `"${event.title}" sẽ bị xóa khỏi lịch. Với giỗ/sinh nhật tự động, bạn có thể tạo lại bằng nút "Tính lại giỗ & sinh nhật".`,
            confirmLabel: 'Xóa',
            tone: 'danger',
            run: async () => {
                await eventService.deleteEvent(event._id);
                toast.success('Đã xóa sự kiện');
                refresh();
            },
        });

    const handleToggle = async (e: FamilyEvent) => {
        setBusyId(e._id);
        try {
            await eventService.updateEvent(e._id, { isActive: !e.isActive });
            toast.success(e.isActive ? 'Đã tắt thông báo' : 'Đã bật thông báo');
            refresh();
        } finally {
            setBusyId(null);
        }
    };

    const handleRefresh = async (e: FamilyEvent) => {
        setBusyId(e._id);
        try {
            await eventService.resyncEvent(e._id);
            toast.success('Đã cập nhật từ hồ sơ thành viên');
            refresh();
        } catch (err: any) {
            toast.error('Lỗi: ' + (err?.response?.data?.message || err.message));
        } finally {
            setBusyId(null);
        }
    };

    const filterChips: { key: 'all' | EventKind; label: string; count: number }[] = [
        { key: 'all', label: 'Tất cả', count: counts.all },
        { key: 'death', label: 'Giỗ', count: counts.death },
        { key: 'birth', label: 'Sinh nhật', count: counts.birth },
        { key: 'manual', label: 'Lễ / Khác', count: counts.manual },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#fffaf0' }}>
            <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <Link
                            href="/"
                            prefetch
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
                            style={{ color: '#6a6a6a' }}
                        >
                            <span aria-hidden>←</span> Cây gia phả
                        </Link>
                        <h1 className="mt-1.5 text-[28px] font-semibold leading-tight" style={{ color: '#0a0a0a', letterSpacing: '-0.8px' }}>
                            Lịch sự kiện
                        </h1>
                        <p className="mt-0.5 text-[13px]" style={{ color: '#6a6a6a' }}>
                            {counts.all} sự kiện · sắp xếp theo ngày gần nhất
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={requestSyncAll}
                            disabled={syncing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60 sm:w-auto sm:flex-shrink-0"
                            style={{ backgroundColor: '#0a0a0a' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} stroke="currentColor" strokeWidth={2}>
                                <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 12a8 8 0 0 1-13.7 5.7L4 16" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 4v4h-4M4 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {syncing ? 'Đang tính...' : 'Tính lại giỗ & sinh nhật'}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filterChips.map((chip) => {
                        const active = filter === chip.key;
                        return (
                            <button
                                key={chip.key}
                                onClick={() => setFilter(chip.key)}
                                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                                style={{
                                    borderColor: active ? '#0a0a0a' : '#e5e5e5',
                                    backgroundColor: active ? '#0a0a0a' : '#fffaf0',
                                    color: active ? '#ffffff' : '#3a3a3a',
                                }}
                            >
                                {chip.label}
                                <span
                                    className="rounded-full px-1.5 text-[11px] font-semibold"
                                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.22)' : '#f0ebe0', color: active ? '#ffffff' : '#6a6a6a' }}
                                >
                                    {chip.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Add form */}
                {canEdit && (
                    <div className="mt-4">
                        <EventForm onSaved={refresh} />
                    </div>
                )}

                {/* List */}
                <div className="mt-4">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-[78px] animate-pulse rounded-[16px] border" style={{ borderColor: '#eee6d6', backgroundColor: '#f7f2e6' }} />
                            ))}
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="rounded-[16px] border border-dashed px-4 py-12 text-center" style={{ borderColor: '#e0d8c4' }}>
                            <p className="text-[14px]" style={{ color: '#9a9a9a' }}>
                                {filter === 'all' ? 'Chưa có sự kiện nào.' : 'Không có sự kiện thuộc loại này.'}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2.5">
                            {visible.map((e) => (
                                <EventCard
                                    key={e._id}
                                    event={e}
                                    canEdit={canEdit}
                                    busy={busyId === e._id}
                                    onToggle={() => handleToggle(e)}
                                    onRefresh={() => handleRefresh(e)}
                                    onDelete={() => requestDelete(e)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirm !== null}
                title={confirm?.title ?? ''}
                message={confirm?.message}
                confirmLabel={confirm?.confirmLabel}
                tone={confirm?.tone}
                loading={confirmLoading}
                onConfirm={runConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}

function EventCard({
    event,
    canEdit,
    busy,
    onToggle,
    onRefresh,
    onDelete,
}: {
    event: FamilyEvent;
    canEdit: boolean;
    busy: boolean;
    onToggle: () => void;
    onRefresh: () => void;
    onDelete: () => void;
}) {
    const style = KIND_STYLES[event.sourceType as EventKind] ?? KIND_STYLES.manual;
    const occ = event.nextOccurrence ? new Date(event.nextOccurrence) : null;
    const days = occ ? Math.round((startOfDay(occ).getTime() - startOfDay(new Date()).getTime()) / 86400000) : null;
    const dayLabel = days !== null ? daysUntilLabel(days) : null;

    return (
        <li
            className="flex items-center gap-3 rounded-[16px] border p-3 transition-colors sm:gap-4 sm:p-4"
            style={{ backgroundColor: '#fffefb', borderColor: '#e5e5e5', opacity: event.isActive ? 1 : 0.62 }}
        >
            {/* Icon */}
            <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12"
                style={{ backgroundColor: style.bg, color: style.text }}
            >
                {style.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold" style={{ color: '#0a0a0a', letterSpacing: '-0.2px' }}>
                        {event.title}
                    </p>
                    {!event.isActive && (
                        <span className="flex-shrink-0 rounded-[6px] px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: '#eceae4', color: '#9a9a9a' }}>
                            Tắt
                        </span>
                    )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: '#6a6a6a' }}>
                    <span className="rounded-[6px] px-1.5 py-0.5 font-medium" style={{ backgroundColor: style.bg, color: style.text }}>
                        {style.label}
                    </span>
                    <span className="font-medium">
                        {event.day}/{event.month}
                        {event.isLeapMonth ? ' nhuận' : ''} {event.calendar === 'lunar' ? 'ÂL' : 'DL'}
                    </span>
                    {occ && (
                        <span style={{ color: '#9a9a9a' }}>· sắp tới {formatSolar(occ)}</span>
                    )}
                </div>
            </div>

            {/* Right side */}
            <div className="flex flex-shrink-0 flex-col items-end gap-2">
                {dayLabel && (
                    <span className="whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: dayLabel.bg, color: dayLabel.color }}>
                        {dayLabel.text}
                    </span>
                )}
                {canEdit && (
                    <div className="flex items-center gap-1">
                        {event.sourceType !== 'manual' && (
                            <button
                                onClick={onRefresh}
                                disabled={busy}
                                title="Cập nhật lại từ hồ sơ thành viên"
                                aria-label="Cập nhật lại từ hồ sơ"
                                className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors hover:bg-[#eef3f1] disabled:opacity-50"
                                style={{ color: '#1a3a3a' }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} stroke="currentColor" strokeWidth={1.8}>
                                    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 12a8 8 0 0 1-13.7 5.7L4 16" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M20 4v4h-4M4 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onToggle}
                            disabled={busy}
                            title={event.isActive ? 'Tắt thông báo' : 'Bật thông báo'}
                            aria-label={event.isActive ? 'Tắt thông báo' : 'Bật thông báo'}
                            className="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:opacity-50"
                            style={{ backgroundColor: event.isActive ? '#1a3a3a' : '#d8d2c4' }}
                        >
                            <span
                                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                                style={{ left: event.isActive ? '18px' : '2px' }}
                            />
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={busy}
                            title="Xóa"
                            aria-label="Xóa sự kiện"
                            className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors hover:bg-[#fdeef3] disabled:opacity-50"
                            style={{ color: '#ff4d8b' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.8}>
                                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </li>
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
            toast.success('Đã thêm sự kiện');
            setTitle('');
            setOpen(false);
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-[12px] border border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#f9f5ec]"
                style={{ borderColor: '#d8cdb0', color: '#3a3a3a' }}
            >
                <span className="text-[16px] leading-none" style={{ color: '#e8b94a' }}>+</span> Thêm sự kiện
            </button>
        );
    }

    const fieldStyle = { backgroundColor: '#fffaf0', borderColor: '#e5e5e5' } as const;

    return (
        <form onSubmit={submit} className="rounded-[16px] border p-4 sm:p-5" style={{ borderColor: '#e5e5e5', backgroundColor: '#fefdf8' }}>
            <p className="mb-3 text-[13px] font-semibold" style={{ color: '#0a0a0a' }}>Thêm sự kiện mới</p>
            <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên sự kiện (vd: Lễ gia tiên)"
                className="w-full rounded-[12px] border px-4 py-3 text-sm outline-none focus:border-[#1a3a3a]"
                style={fieldStyle}
            />
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium" style={{ color: '#6a6a6a' }}>Loại lịch</span>
                    <select value={calendar} onChange={(e) => setCalendar(e.target.value as 'lunar' | 'solar')} className="rounded-[12px] border px-3 py-2.5 text-sm outline-none" style={fieldStyle}>
                        <option value="lunar">Âm lịch</option>
                        <option value="solar">Dương lịch</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium" style={{ color: '#6a6a6a' }}>Ngày</span>
                    <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="rounded-[12px] border px-3 py-2.5 text-sm outline-none" style={fieldStyle}>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium" style={{ color: '#6a6a6a' }}>Tháng</span>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-[12px] border px-3 py-2.5 text-sm outline-none" style={fieldStyle}>
                        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                </label>
            </div>
            {calendar === 'lunar' && (
                <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: '#3a3a3a' }}>
                    <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} className="h-4 w-4 accent-[#1a3a3a]" />
                    Tháng nhuận
                </label>
            )}
            <div className="mt-4 flex gap-2">
                <button type="submit" disabled={saving || !title.trim()} className="rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50" style={{ backgroundColor: '#0a0a0a' }}>
                    {saving ? 'Đang lưu...' : 'Lưu sự kiện'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-[12px] border px-4 py-2.5 text-sm transition-colors hover:bg-[#f5f0e5]" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                    Hủy
                </button>
            </div>
        </form>
    );
}
