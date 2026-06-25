import api from './api';
import authService from './authService';

export type EventCalendar = 'lunar' | 'solar';
export type EventSourceType = 'death' | 'birth' | 'manual';
export type EventTrigger = '1_month' | '1_week' | '1_day' | 'day_of';

export interface FamilyEvent {
    _id: string;
    title: string;
    desc?: string;
    sourceType: EventSourceType;
    sourcePersonId?: string | null;
    calendar: EventCalendar;
    day: number;
    month: number;
    isLeapMonth?: boolean;
    isActive: boolean;
    nextOccurrence?: string | null;
}

export interface EventNotification {
    event: FamilyEvent;
    triggers?: EventTrigger[];
    occurrenceSolar: string | null;
    daysUntil: number | null;
}

export interface CreateEventInput {
    title: string;
    desc?: string;
    calendar: EventCalendar;
    day: number;
    month: number;
    isLeapMonth?: boolean;
    isActive?: boolean;
}

const eventService = {
    getAllEvents: async (): Promise<FamilyEvent[]> => {
        if (!authService.isAuthenticated()) return [];
        const res = await api.get('/event');
        return res.data;
    },

    getNotifications: async (): Promise<EventNotification[]> => {
        if (!authService.isAuthenticated()) return [];
        const res = await api.get('/event/notifications');
        return res.data;
    },

    createEvent: async (input: CreateEventInput): Promise<FamilyEvent> => {
        const res = await api.post('/event', input);
        return res.data;
    },

    updateEvent: async (id: string, input: Partial<CreateEventInput>): Promise<FamilyEvent> => {
        const res = await api.patch(`/event/${id}`, input);
        return res.data;
    },

    deleteEvent: async (id: string): Promise<{ message: string }> => {
        const res = await api.delete(`/event/${id}`);
        return res.data;
    },

    syncAll: async (): Promise<{ processed: number; deletedOrphans: number }> => {
        const res = await api.post('/event/sync-all');
        return res.data;
    },

    syncPerson: async (personId: string): Promise<{ ok: true }> => {
        const res = await api.post(`/event/sync-person/${personId}`);
        return res.data;
    },
};

export default eventService;
