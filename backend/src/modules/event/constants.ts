export enum EventSourceType {
    DEATH = 'death',
    BIRTH = 'birth',
    MANUAL = 'manual',
}

export enum EventCalendar {
    LUNAR = 'lunar',
    SOLAR = 'solar',
}

export enum EventTrigger {
    ONE_MONTH = '1_month',
    ONE_WEEK = '1_week',
    MONTH_START = 'month_start',
    WEEK_START = 'week_start',
    DAY_OF = 'day_of',
}
