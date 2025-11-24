'use client';

import React, { useState, useEffect, useRef } from 'react';
import galleryService, { GalleryImage } from 'src/services/galleryService';

interface GalleryProps {
    personId?: string;
    spouseId?: string;
    onAvatarUpdate?: (url: string) => void; // Callback when avatar is updated
}

export default function Gallery({ personId, spouseId, onAvatarUpdate }: GalleryProps) {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [setAsAvatar, setSetAsAvatar] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        loadImages();
    }, [personId, spouseId]);

    const loadImages = async () => {
        setLoading(true);
        try {
            let data: GalleryImage[] = [];
            if (personId) {
                data = await galleryService.getImagesByPerson(personId);
            } else if (spouseId) {
                data = await galleryService.getImagesBySpouse(spouseId);
            }
            setImages(data);
        } catch (error) {
            console.error('Failed to load images:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Just store the file, don't upload yet?
            // Or if we want "select file then show desc", we can do that.
            // But the user said "click icon -> select file -> add desc -> done".
            // So maybe:
            // 1. Click "+" icon -> Open Modal
            // 2. Modal has File Input, Desc Input, Date Input.
            // 3. User fills and clicks "Upload".
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInputRef.current?.files?.[0]) {
            alert('Vui lòng chọn ảnh');
            return;
        }

        const file = fileInputRef.current.files[0];
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (personId) formData.append('personId', personId);
            if (spouseId) formData.append('spouseId', spouseId);
            if (description) formData.append('description', description);
            if (eventDate) formData.append('eventDate', eventDate);
            if (setAsAvatar && personId) formData.append('setAsAvatar', 'true');

            const newImage = await galleryService.uploadImage(formData);
            setImages([newImage, ...images]);

            // Reset form & Close modal
            setDescription('');
            setEventDate('');
            setSetAsAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setShowUploadModal(false);

            // Notify parent if avatar updated
            if (setAsAvatar && personId && onAvatarUpdate) {
                onAvatarUpdate(newImage.url);
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;
        try {
            await galleryService.deleteImage(id);
            setImages(images.filter((img) => img._id !== id));
            if (selectedImage?._id === id) setSelectedImage(null);
        } catch (error) {
            console.error('Failed to delete image:', error);
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Thư viện ảnh</h3>

            {/* Image Grid */}
            {loading ? (
                <div className="text-center py-4">Đang tải ảnh...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Add Button Tile */}
                    <div
                        onClick={() => setShowUploadModal(true)}
                        className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-500 font-medium group-hover:text-blue-600">Thêm ảnh</span>
                    </div>

                    {/* Images */}
                    {images.map((img) => (
                        <div key={img._id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={img.url}
                                alt={img.description || 'Gallery image'}
                                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                onClick={() => setSelectedImage(img)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity pointer-events-none" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(img._id);
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Xóa ảnh"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            {img.description && <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">{img.description}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Tải ảnh lên</h3>
                        <form onSubmit={handleUploadSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ảnh</label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Nhập mô tả ảnh..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sự kiện</label>
                                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                                </div>
                                {personId && (
                                    <div className="flex items-center">
                                        <input type="checkbox" id="modalSetAsAvatar" checked={setAsAvatar} onChange={(e) => setSetAsAvatar(e.target.checked)} className="mr-2" />
                                        <label htmlFor="modalSetAsAvatar" className="text-sm text-gray-700">
                                            Đặt làm ảnh đại diện
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium">
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {uploading && (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    )}
                                    {uploading ? 'Đang tải lên...' : 'Tải lên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-full w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage.url} alt={selectedImage.description} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                        <div className="mt-4 text-white text-center">
                            <p className="text-lg font-medium">{selectedImage.description}</p>
                            <p className="text-sm text-gray-400">{selectedImage.eventDate ? new Date(selectedImage.eventDate).toLocaleDateString('vi-VN') : ''}</p>
                        </div>
                        <button className="absolute top-[-40px] right-0 text-white hover:text-gray-300" onClick={() => setSelectedImage(null)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
