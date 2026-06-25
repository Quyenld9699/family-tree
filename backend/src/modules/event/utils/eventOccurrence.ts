import { Solar, Lunar } from 'lunar-javascript';
import { EventCalendar, EventTrigger } from '../constants';

export interface OccurrenceInput {
    calendar: EventCalendar | string;
    day: number;
    month: number;
    isLeapMonth?: boolean;
}

export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function mondayOf(d: Date): Date {
    const offset = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    return addDays(d, -offset);
}

/** Lùi `n` tháng theo lịch, kẹp ngày về ngày cuối tháng đích nếu tràn. */
function monthsBefore(d: Date, n: number): Date {
    const firstOfTarget = new Date(d.getFullYear(), d.getMonth() - n, 1);
    const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
    const day = Math.min(d.getDate(), lastDay);
    return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), day);
}

/** Solar Date của event trong 1 "chu kỳ năm" (solar year hoặc lunar year). */
function occurrenceForCycle(ev: OccurrenceInput, cycleYear: number): Date | null {
    if (ev.calendar === EventCalendar.SOLAR || ev.calendar === 'solar') {
        return new Date(cycleYear, ev.month - 1, ev.day);
    }
    try {
        const m = ev.isLeapMonth ? -ev.month : ev.month;
        const l = Lunar.fromYmd(cycleYear, m, ev.day);
        const s = l.getSolar();
        return new Date(s.getYear(), s.getMonth() - 1, s.getDay());
    } catch {
        return null;
    }
}

/** Lần xảy ra sắp tới (>= hôm nay). Cuộn sang năm sau nếu đã qua. */
export function nextOccurrence(ev: OccurrenceInput, today: Date): Date | null {
    const t = startOfDay(today);
    if (ev.calendar === EventCalendar.SOLAR || ev.calendar === 'solar') {
        let occ = occurrenceForCycle(ev, t.getFullYear());
        if (occ && occ < t) occ = occurrenceForCycle(ev, t.getFullYear() + 1);
        return occ;
    }
    const curLunarYear = Solar.fromDate(t).getLunar().getYear();
    let occ = occurrenceForCycle(ev, curLunarYear);
    if (occ && occ >= t) return occ;
    return occurrenceForCycle(ev, curLunarYear + 1);
}

/** Các mốc thông báo đang khớp hôm nay (rỗng nếu không có). */
export function getActiveTriggers(ev: OccurrenceInput, today: Date): EventTrigger[] {
    const t = startOfDay(today);
    const occ = nextOccurrence(ev, t);
    if (!occ) return [];

    const triggers: EventTrigger[] = [];
    if (sameDay(t, occ)) triggers.push(EventTrigger.DAY_OF);
    if (sameDay(t, addDays(occ, -1))) triggers.push(EventTrigger.ONE_DAY);
    if (sameDay(t, addDays(occ, -7))) triggers.push(EventTrigger.ONE_WEEK);
    if (sameDay(t, monthsBefore(occ, 1))) triggers.push(EventTrigger.ONE_MONTH);
    return triggers;
}

/** Số ngày từ hôm nay đến occurrence (0 = hôm nay). */
export function daysUntil(occ: Date, today: Date): number {
    const ms = startOfDay(occ).getTime() - startOfDay(today).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}
