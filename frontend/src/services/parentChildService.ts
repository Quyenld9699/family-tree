import api from './api';
import { Person } from './personService';
import { SpouseWithDetails } from './spouseService';
import authService from './authService';
import parentChildrenData from '../data/parent_children.json';
import personsData from '../data/persons.json';
import spousesData from '../data/spouses.json';

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

// Helper to populate parent-child data for guest mode
const populateParentChild = (pc: any): ParentChildWithDetails => {
    const child = (personsData as any[]).find((p) => p._id === pc.child);

    // Populate parent (spouse)
    const spouse = (spousesData as any[]).find((s) => s._id === pc.parent);
    let populatedSpouse: any = pc.parent;

    if (spouse) {
        const husband = (personsData as any[]).find((p) => p._id === spouse.husband);
        const wife = (personsData as any[]).find((p) => p._id === spouse.wife);
        populatedSpouse = {
            ...spouse,
            husband: husband || spouse.husband,
            wife: wife || spouse.wife,
        };
    }

    return {
        ...pc,
        child: child || pc.child,
        parent: populatedSpouse,
    };
};

// ParentChild API Service
const parentChildService = {
    // Lấy tất cả quan hệ cha mẹ-con
    getAllParentChildRelationships: async (): Promise<ParentChildWithDetails[]> => {
        if (!authService.isAuthenticated()) {
            return (parentChildrenData as any[]).map(populateParentChild);
        }
        const response = await api.get('/parent-child');
        return response.data;
    },

    // Lấy quan hệ cha mẹ-con theo ID
    getParentChildById: async (id: string): Promise<ParentChildWithDetails> => {
        if (!authService.isAuthenticated()) {
            const pc = (parentChildrenData as any[]).find((p) => p._id === id);
            if (!pc) throw new Error('ParentChild not found');
            return populateParentChild(pc);
        }
        const response = await api.get(`/parent-child/${id}`);
        return response.data;
    },

    // Lấy tất cả con của một cặp cha mẹ
    getChildrenByParentId: async (parentId: string): Promise<ParentChildWithDetails[]> => {
        if (!authService.isAuthenticated()) {
            const children = (parentChildrenData as any[]).filter((pc) => pc.parent === parentId);
            return children.map(populateParentChild);
        }
        const response = await api.get(`/parent-child/parent/${parentId}`);
        return response.data;
    },

    // Lấy cha mẹ của một đứa trẻ
    getParentsByChildId: async (childId: string): Promise<ParentChildWithDetails[]> => {
        if (!authService.isAuthenticated()) {
            const parents = (parentChildrenData as any[]).filter((pc) => pc.child === childId);
            return parents.map(populateParentChild);
        }
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
