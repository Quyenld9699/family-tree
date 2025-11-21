import api from './api';
import { Person } from './personService';

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

// Spouse API Service
const spouseService = {
    // Lấy tất cả mối quan hệ vợ chồng
    getAllSpouses: async (): Promise<SpouseWithDetails[]> => {
        const response = await api.get('/spouse');
        return response.data;
    },

    // Lấy mối quan hệ vợ chồng theo ID
    getSpouseById: async (id: string): Promise<SpouseWithDetails> => {
        const response = await api.get(`/spouse/${id}`);
        return response.data;
    },

    // Lấy tất cả mối quan hệ vợ chồng của một người
    getSpousesByPersonId: async (personId: string): Promise<SpouseWithDetails[]> => {
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
