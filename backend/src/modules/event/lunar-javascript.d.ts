declare module 'lunar-javascript' {
    export class Solar {
        static fromDate(date: Date): Solar;
        static fromYmd(year: number, month: number, day: number): Solar;
        getLunar(): Lunar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }
    export class Lunar {
        static fromYmd(year: number, month: number, day: number): Lunar;
        getSolar(): Solar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }
}
