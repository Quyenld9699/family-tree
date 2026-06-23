import { Solar } from 'lunar-javascript';

export interface DateParts {
    day: number;
    month: number;
    isLeapMonth: boolean;
}

/** Đổi 1 Date dương lịch → bộ phận ÂM lịch (day, month, isLeapMonth). */
export function solarToLunarParts(date: Date): DateParts {
    const lunar = Solar.fromDate(date).getLunar();
    return {
        day: lunar.getDay(),
        month: Math.abs(lunar.getMonth()), // âm = tháng nhuận
        isLeapMonth: lunar.getMonth() < 0,
    };
}

/** Đổi 1 Date dương lịch → bộ phận DƯƠNG lịch (day, month). */
export function solarToSolarParts(date: Date): DateParts {
    return { day: date.getDate(), month: date.getMonth() + 1, isLeapMonth: false };
}
