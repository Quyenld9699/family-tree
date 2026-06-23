import { useQuery } from '@tanstack/react-query';
import eventService from 'src/services/eventService';

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: eventService.getAllEvents,
        staleTime: 5 * 60 * 1000,
    });
};

export const useEventNotifications = () => {
    return useQuery({
        queryKey: ['event-notifications'],
        queryFn: eventService.getNotifications,
        staleTime: 5 * 60 * 1000,
    });
};
