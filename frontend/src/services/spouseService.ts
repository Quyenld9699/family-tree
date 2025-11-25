import api from './api';
import { Person } from './personService';
import authService from './authService';
import spousesData from '../data/spouses.json';
import personsData from '../data/persons.json';

// Định nghĩa các interface
export interface Spouse {
    _id?: string;
    husband: string;
    wife: string;
    husbandOrder?: number;
    wifeOrder?: number;
    marriageDate?: Date;
    divorceDate?: Date;
}

export interface SpouseWithDetails {
    _id?: string;
    husband: Person | string;
    wife: Person | string;
    husbandOrder?: number;
    wifeOrder?: number;
    marriageDate?: Date;
    divorceDate?: Date;
}

// Helper to populate spouse data for guest mode
const populateSpouse = (spouse: any): SpouseWithDetails => {
    const husband = (personsData as any[]).find((p) => p._id === spouse.husband);
    const wife = (personsData as any[]).find((p) => p._id === spouse.wife);
    return {
        ...spouse,
        husband: husband || spouse.husband,
        wife: wife || spouse.wife,
    };
};

// Spouse API Service
const spouseService = {
    // Lấy tất cả mối quan hệ vợ chồng
    getAllSpouses: async (): Promise<SpouseWithDetails[]> => {
        if (!authService.isAuthenticated()) {
            return (spousesData as any[]).map(populateSpouse);
        }
        const response = await api.get('/spouse');
        return response.data;
    },

    // Lấy mối quan hệ vợ chồng theo ID
    getSpouseById: async (id: string): Promise<SpouseWithDetails> => {
        if (!authService.isAuthenticated()) {
            const spouse = (spousesData as any[]).find((s) => s._id === id);
            if (!spouse) throw new Error('Spouse not found');
            return populateSpouse(spouse);
        }
        const response = await api.get(`/spouse/${id}`);
        return response.data;
    },

    // Lấy tất cả mối quan hệ vợ chồng của một người
    getSpousesByPersonId: async (personId: string): Promise<SpouseWithDetails[]> => {
        if (!authService.isAuthenticated()) {
            const spouses = (spousesData as any[]).filter((s) => s.husband === personId || s.wife === personId);
            return spouses.map(populateSpouse);
        }
        const response = await api.get(`/spouse/person/${personId}`);
        return response.data;
    },

    // Tạo mối quan hệ vợ chồng mới
    createSpouse: async (spouseData: Omit<Spouse, '_id'>): Promise<SpouseWithDetails> => {
        const response = await api.post('/spouse', spouseData);
        return response.data;
    },

    // Cập nhật mối quan hệ vợ chồng
    updateSpouse: async (id: string, spouseData: Partial<Spouse>): Promise<SpouseWithDetails> => {
        const response = await api.patch(`/spouse/${id}`, spouseData);
        return response.data;
    },

    // Xóa mối quan hệ vợ chồng
    deleteSpouse: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/spouse/${id}`);
        return response.data;
    },
};

export default spouseService;
