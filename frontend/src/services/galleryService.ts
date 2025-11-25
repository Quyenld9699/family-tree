import api from './api';
import authService from './authService';

export interface GalleryImage {
    _id: string;
    url: string;
    publicId: string;
    type: 'IMAGE' | 'VIDEO';
    personId?: string;
    spouseId?: string;
    description?: string;
    eventDate?: string;
    createdAt: string;
}

export const galleryService = {
    uploadImage: async (formData: FormData): Promise<GalleryImage> => {
        const response = await api.post('/gallery/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getImagesByPerson: async (personId: string): Promise<GalleryImage[]> => {
        if (!authService.isAuthenticated()) return [];
        const response = await api.get(`/gallery/person/${personId}`);
        return response.data;
    },

    getImagesBySpouse: async (spouseId: string): Promise<GalleryImage[]> => {
        if (!authService.isAuthenticated()) return [];
        const response = await api.get(`/gallery/spouse/${spouseId}`);
        return response.data;
    },

    deleteImage: async (id: string): Promise<void> => {
        await api.delete(`/gallery/${id}`);
    },
};

export default galleryService;
