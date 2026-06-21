import { useMemo } from 'react';
import { Solar, Lunar } from 'lunar-javascript';
import { Person } from 'src/services/personService';
import { toVietnameseLunarDate } from 'src/utils/lunarDateUtils';

export interface GioReminder {
    person: Person;
    /** Solar date of this year's (or next year's) giỗ */
    gioDate: Date;
    /** Lunar date string of the giỗ, e.g. "16 tháng 3 năm Bính Ngọ" */
    gioLunarStr: string;
    /** Days until the giỗ (0 = today, negative = already passed – should not appear) */
    daysUntil: number;
}

const REMIND_DAYS_BEFORE = 30;

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getSolarGioForLunarYear(lunarYear: number, lunarMonth: number, lunarDay: number): Date | null {
    try {
        const l = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
        const s = l.getSolar();
        return new Date(s.getYear(), s.getMonth() - 1, s.getDay());
    } catch {
        return null;
    }
}

export function useGioReminders(persons: Person[]): GioReminder[] {
    return useMemo(() => {
        const today = startOfDay(new Date());
        const cutoff = new Date(today);
        cutoff.setDate(cutoff.getDate() + REMIND_DAYS_BEFORE);

        const currentLunarYear = Solar.fromDate(today).getLunar().getYear();
        const reminders: GioReminder[] = [];

        for (const person of persons) {
            if (!person.isDead || !person.death) continue;

            const deathDate = new Date(person.death);
            const lunarDeath = Solar.fromDate(deathDate).getLunar();
            // Use absolute value: negative month means leap month, use the regular month index
            const lunarMonth = Math.abs(lunarDeath.getMonth());
            const lunarDay = lunarDeath.getDay();

            // Try current lunar year first, then next if already passed
            let gioDate = getSolarGioForLunarYear(currentLunarYear, lunarMonth, lunarDay);
            if (!gioDate) continue;

            const daysUntilCurrent = Math.ceil((gioDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilCurrent < 0) {
                // Already passed this year → try next lunar year
                const nextGioDate = getSolarGioForLunarYear(currentLunarYear + 1, lunarMonth, lunarDay);
                if (!nextGioDate) continue;
                gioDate = nextGioDate;
            }

            const daysUntil = Math.ceil((gioDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntil >= 0 && daysUntil <= REMIND_DAYS_BEFORE) {
                reminders.push({
                    person,
                    gioDate,
                    gioLunarStr: toVietnameseLunarDate(gioDate),
                    daysUntil,
                });
            }
        }

        // Sort: soonest first
        reminders.sort((a, b) => a.daysUntil - b.daysUntil);
        return reminders;
    }, [persons]);
}
