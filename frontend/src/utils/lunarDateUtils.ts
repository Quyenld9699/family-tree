import { Solar } from 'lunar-javascript';

const CAN_VI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_VI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/**
 * Convert a solar date to Vietnamese lunar date string.
 * Returns format: "16 tháng 3 năm Ất Dậu" or "16 tháng 3 nhuận năm Ất Dậu" for leap months.
 */
export function toVietnameseLunarDate(date: Date): string {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    const day = lunar.getDay();
    const month = Math.abs(lunar.getMonth()); // negative month = leap month
    const year = lunar.getYear();
    const isLeapMonth = lunar.getMonth() < 0;

    const canIndex = (((year - 4) % 10) + 10) % 10;
    const chiIndex = (((year - 4) % 12) + 12) % 12;
    const yearName = `${CAN_VI[canIndex]} ${CHI_VI[chiIndex]}`;

    const leapStr = isLeapMonth ? ' nhuận' : '';
    return `${day} tháng ${month}${leapStr} năm ${yearName}`;
}

/**
 * Short format: "16/3 Ất Dậu" used in compact nodes.
 */
export function toVietnameseLunarDateShort(date: Date): string {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    const day = lunar.getDay();
    const month = Math.abs(lunar.getMonth());
    const year = lunar.getYear();
    const isLeapMonth = lunar.getMonth() < 0;

    const canIndex = (((year - 4) % 10) + 10) % 10;
    const chiIndex = (((year - 4) % 12) + 12) % 12;
    const yearName = `${CAN_VI[canIndex]} ${CHI_VI[chiIndex]}`;

    const leapStr = isLeapMonth ? 'n' : '';
    return `${day}/${month}${leapStr} ${yearName}`;
}
