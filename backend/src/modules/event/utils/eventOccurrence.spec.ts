import { EventCalendar, EventTrigger } from '../constants';
import { nextOccurrence, getActiveTriggers, OccurrenceInput } from './eventOccurrence';

const solarEvent: OccurrenceInput = { calendar: EventCalendar.SOLAR, day: 15, month: 6 };

describe('nextOccurrence (solar)', () => {
    it('returns this year occurrence when not yet passed', () => {
        const occ = nextOccurrence(solarEvent, new Date(2026, 5, 1)); // 1 Jun 2026
        expect(occ).toEqual(new Date(2026, 5, 15));
    });

    it('rolls to next year when already passed', () => {
        const occ = nextOccurrence(solarEvent, new Date(2026, 5, 20)); // 20 Jun 2026
        expect(occ).toEqual(new Date(2027, 5, 15));
    });
});

describe('getActiveTriggers (solar)', () => {
    it('fires day_of on the exact day', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 15));
        expect(t).toContain(EventTrigger.DAY_OF);
    });

    it('fires 1_week exactly 7 days before', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 8));
        expect(t).toContain(EventTrigger.ONE_WEEK);
    });

    it('fires 1_month exactly one month before', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 4, 15));
        expect(t).toContain(EventTrigger.ONE_MONTH);
    });

    it('fires month_start on the 1st of the occurrence month', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 1));
        expect(t).toContain(EventTrigger.MONTH_START);
    });

    it('returns empty on an unrelated day', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 2, 3));
        expect(t).toEqual([]);
    });
});

describe('lunar occurrence', () => {
    it('computes a valid solar Date for a lunar event', () => {
        const lunar: OccurrenceInput = { calendar: EventCalendar.LUNAR, day: 10, month: 3, isLeapMonth: false };
        const occ = nextOccurrence(lunar, new Date(2026, 0, 1));
        expect(occ).toBeInstanceOf(Date);
        expect(occ!.getFullYear()).toBeGreaterThanOrEqual(2026);
    });
});
