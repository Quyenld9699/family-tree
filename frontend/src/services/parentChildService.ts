import api from './api';
import { Person } from './personService';
import { SpouseWithDetails } from './spouseService';

// Định nghĩa các interface
export interface ParentChild {
    _id?: string;
    parent: string;
    child: string;
    isAdopted: boolean;
}

export interface ParentChildWithDetails {
    _id?: string;
    parent: SpouseWithDetails | string;
    child: Person | string;
    isAdopted: boolean;
}

// ParentChild API Service
const parentChildService = {
    // Lấy tất cả quan hệ cha mẹ-con
    getAllParentChildRelationships: async (): Promise<ParentChildWithDetails[]> => {
        const response = await api.get('/parent-child');
        return response.data;
    },

    // Lấy quan hệ cha mẹ-con theo ID
    getParentChildById: async (id: string): Promise<ParentChildWithDetails> => {
        const response = await api.get(`/parent-child/${id}`);
        return response.data;
    },

    // Lấy tất cả con của một cặp cha mẹ
    getChildrenByParentId: async (parentId: string): Promise<ParentChildWithDetails[]> => {
        const response = await api.get(`/parent-child/parent/${parentId}`);
        return response.data;
    },

    // Lấy cha mẹ của một đứa trẻ
    getParentsByChildId: async (childId: string): Promise<ParentChildWithDetails[]> => {
        const response = await api.get(`/parent-child/child/${childId}`);
        return response.data;
    },

    // Tạo quan hệ cha mẹ-con mới
    createParentChild: async (parentChildData: Omit<ParentChild, '_id'>): Promise<ParentChildWithDetails> => {
        const response = await api.post('/parent-child', parentChildData);
        return response.data;
    },

    // Cập nhật quan hệ cha mẹ-con
    updateParentChild: async (id: string, parentChildData: Partial<ParentChild>): Promise<ParentChildWithDetails> => {
        const response = await api.patch(`/parent-child/${id}`, parentChildData);
        return response.data;
    },

    // Xóa quan hệ cha mẹ-con
    deleteParentChild: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/parent-child/${id}`);
        return response.data;
    },
};

export default parentChildService;
