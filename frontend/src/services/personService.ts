import api from './api';
import authService from './authService';
import personsData from '../data/persons.json';

// Định nghĩa các interface
// Gender enum from backend: MALE = 0, FEMALE = 1
export type Gender = 0 | 1 | 'MALE' | 'FEMALE';

export interface Person {
    _id?: string;
    cccd?: string;
    name: string;
    avatar?: string;
    gender: Gender;
    birth?: Date;
    death?: Date;
    isDead?: boolean;
    address?: string;
    desc?: string;
}

export interface PersonWithGenerations {
    personData: Record<string, Person>;
    treeData: any[];
}

// Person API Service
const personService = {
    // Lấy tất cả người
    getAllPersons: async (): Promise<Person[]> => {
        // If not authenticated, return mock data (Public Visitor)
        if (!authService.isAuthenticated()) {
            return personsData as unknown as Person[];
        }
        // If authenticated (Admin or Family Guest), return real data from API
        const response = await api.get('/person');
        return response.data;
    },

    // Lấy một người theo ID
    getPersonById: async (id: string): Promise<Person> => {
        if (!authService.isAuthenticated()) {
            const person = (personsData as unknown as Person[]).find((p) => p._id === id);
            if (!person) throw new Error('Person not found');
            return person;
        }
        const response = await api.get(`/person/${id}`);
        return response.data;
    },

    // Tạo một người mới
    createPerson: async (personData: Omit<Person, '_id'>): Promise<Person> => {
        const response = await api.post('/person', personData);
        return response.data;
    },

    // Cập nhật thông tin người
    updatePerson: async (id: string, personData: Partial<Person>): Promise<Person> => {
        const response = await api.patch(`/person/${id}`, personData);
        return response.data;
    },

    // Xóa một người
    deletePerson: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/person/${id}`);
        return response.data;
    },

    // Lấy N thế hệ của một người
    getNGenerations: async (personId: string, generations: number): Promise<PersonWithGenerations> => {
        const response = await api.get(`/person/${personId}/generations/${generations}`);
        return response.data;
    },
};

export default personService;
