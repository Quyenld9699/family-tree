declare module 'lunar-javascript' {
    interface LunarInstance {
        getYear(): number;
        getMonth(): number; // negative if leap month
        getDay(): number;
        getYearInGanZhi(): string;
        getMonthInChinese(): string;
        getDayInChinese(): string;
        getSolar(): SolarInstance;
    }

    interface SolarInstance {
        getLunar(): LunarInstance;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }

    interface SolarStatic {
        fromDate(date: Date): SolarInstance;
        fromYmd(year: number, month: number, day: number): SolarInstance;
    }

    interface LunarStatic {
        fromYmd(year: number, month: number, day: number): LunarInstance;
    }

    export const Solar: SolarStatic;
    export const Lunar: LunarStatic;
}
