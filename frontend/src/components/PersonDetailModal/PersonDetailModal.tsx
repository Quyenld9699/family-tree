'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal/Modal';
import Gallery from '../Gallery/Gallery';
import { Person } from 'src/services/personService';
import personService from 'src/services/personService';
import galleryService from 'src/services/galleryService';
import spouseService, { SpouseWithDetails } from 'src/services/spouseService';
import parentChildService, { ParentChildWithDetails } from 'src/services/parentChildService';
import { getGenderText, Gender } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface PersonDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    person: Person | null;
    onAddSpouse: (person: Person) => void;
    onAddChild: (spouseId: string) => void;
    onUpdate?: () => void; // Callback after edit/delete
}

export default function PersonDetailModal({ isOpen, onClose, person, onAddSpouse, onAddChild, onUpdate }: PersonDetailModalProps) {
    const { isAdmin, isEditor } = useAuth();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Person>>({});
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Queries
    const { data: spouses = [], isLoading: loadingSpouses } = useQuery({
        queryKey: ['spouses', person?._id],
        queryFn: () => spouseService.getSpousesByPersonId(person!._id!),
        enabled: !!isOpen && !!person?._id,
        staleTime: 5 * 60 * 1000,
    });

    const { data: parents = [], isLoading: loadingParents } = useQuery({
        queryKey: ['parents', person?._id],
        queryFn: () => parentChildService.getParentsByChildId(person!._id!),
        enabled: !!isOpen && !!person?._id,
        staleTime: 5 * 60 * 1000,
    });

    // Children queries
    const childrenQueries = useQueries({
        queries: spouses.map((spouse) => ({
            queryKey: ['children', spouse._id],
            queryFn: () => parentChildService.getChildrenByParentId(spouse._id!),
            enabled: !!isOpen && !!spouse._id,
            staleTime: 5 * 60 * 1000,
        })),
    });

    const children: { [spouseId: string]: ParentChildWithDetails[] } = {};
    spouses.forEach((spouse, index) => {
        if (spouse._id && childrenQueries[index].data) {
            children[spouse._id] = childrenQueries[index].data;
        }
    });

    // Spouse Persons Queries (for when husband/wife are strings)
    const spouseIdsToFetch = spouses.reduce((acc, spouse) => {
        const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband?._id;
        const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife?._id;

        if (typeof spouse.husband === 'string' && husbandId && !acc.includes(husbandId)) acc.push(husbandId);
        if (typeof spouse.wife === 'string' && wifeId && !acc.includes(wifeId)) acc.push(wifeId);
        return acc;
    }, [] as string[]);

    const spousePersonQueries = useQueries({
        queries: spouseIdsToFetch.map((id) => ({
            queryKey: ['person', id],
            queryFn: () => personService.getPersonById(id),
            staleTime: 5 * 60 * 1000,
        })),
    });

    const spousePersons: { [personId: string]: Person } = {};
    spouseIdsToFetch.forEach((id, index) => {
        if (spousePersonQueries[index].data) {
            spousePersons[id] = spousePersonQueries[index].data;
        }
    });

    // Mutations
    const updatePersonMutation = useMutation({
        mutationFn: (data: Partial<Person>) => personService.updatePerson(person!._id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            queryClient.invalidateQueries({ queryKey: ['person', person?._id] });
            toast.success('Cập nhật thành công!');
            setIsEditing(false);
            if (onUpdate) onUpdate();
            onClose();
        },
        onError: (error: any) => {
            console.error('Failed to update person:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
        },
    });

    const deletePersonMutation = useMutation({
        mutationFn: (id: string) => personService.deletePerson(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['persons'] });
            toast.success('Xóa thành công!');
            if (onUpdate) onUpdate();
            onClose();
        },
        onError: (error: any) => {
            console.error('Failed to delete person:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa!');
        },
    });

    const deleteSpouseMutation = useMutation({
        mutationFn: (id: string) => spouseService.deleteSpouse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spouses', person?._id] });
            toast.success('Xóa quan hệ vợ chồng thành công!');
            if (onUpdate) onUpdate();
        },
        onError: (error) => {
            console.error('Failed to delete spouse:', error);
            toast.error('Xóa thất bại');
        },
    });

    const deleteChildMutation = useMutation({
        mutationFn: (id: string) => parentChildService.deleteParentChild(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
            toast.success('Xóa quan hệ con cái thành công!');
            if (onUpdate) onUpdate();
        },
        onError: (error) => {
            console.error('Failed to delete child:', error);
            toast.error('Xóa thất bại');
        },
    });

    const loading =
        loadingSpouses ||
        loadingParents ||
        childrenQueries.some((q) => q.isLoading) ||
        updatePersonMutation.isPending ||
        deletePersonMutation.isPending ||
        deleteSpouseMutation.isPending ||
        deleteChildMutation.isPending;

    useEffect(() => {
        if (isOpen && person?._id) {
            setIsEditing(false);
            setEditForm({
                name: person.name,
                gender: person.gender,
                cccd: person.cccd,
                birth: person.birth,
                death: person.death,
                isDead: person.isDead,
                address: person.address,
                desc: person.desc,
            });
        }
    }, [isOpen, person]);

    if (!person) return null;

    const getSpouseName = (spouse: SpouseWithDetails) => {
        // Xác định ID của husband và wife
        const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband?._id;
        const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife?._id;

        // Xác định người nào là spouse (không phải person hiện tại)
        const spouseId = husbandId === person._id ? wifeId : husbandId;

        // Lấy thông tin spouse
        if (!spouseId) return 'Unknown';

        // Check if spouse data is already populated as object
        if (husbandId === person._id) {
            // Current person is husband, so spouse is wife
            if (typeof spouse.wife !== 'string' && spouse.wife?.name) {
                return spouse.wife.name;
            }
        } else {
            // Current person is wife (or other), so spouse is husband
            if (typeof spouse.husband !== 'string' && spouse.husband?.name) {
                return spouse.husband.name;
            }
        }

        // If not populated, look up in spousePersons map
        const spousePerson = spousePersons[spouseId];
        return spousePerson?.name || 'Unknown';
    };

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && person?._id) {
            const file = e.target.files[0];
            setUploadingAvatar(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('personId', person._id);
                formData.append('setAsAvatar', 'true');
                formData.append('description', 'Ảnh đại diện');

                await galleryService.uploadImage(formData);
                if (onUpdate) onUpdate();
                toast.success('Cập nhật ảnh đại diện thành công!');
            } catch (error) {
                console.error('Failed to upload avatar:', error);
                toast.error('Upload avatar thất bại');
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            name: person?.name,
            gender: person?.gender,
            cccd: person?.cccd,
            birth: person?.birth,
            death: person?.death,
            isDead: person?.isDead,
            address: person?.address,
            desc: person?.desc,
        });
    };

    const handleSaveEdit = () => {
        if (!person?._id) return;
        updatePersonMutation.mutate(editForm);
    };

    const handleDelete = () => {
        if (!person?._id) return;

        const confirmed = confirm(`Bạn có chắc chắn muốn xóa ${person.name}?\n\nLưu ý: Tất cả các mối quan hệ (vợ/chồng, con cái) liên quan đến người này cũng sẽ bị xóa.`);
        if (!confirmed) return;

        deletePersonMutation.mutate(person._id);
    };

    const handleDeleteSpouse = (spouseId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mối quan hệ vợ chồng này? Tất cả con cái chung cũng sẽ bị mất liên kết cha mẹ.')) return;
        deleteSpouseMutation.mutate(spouseId);
    };

    const handleDeleteChild = (childId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mối quan hệ cha mẹ - con cái này?')) return;
        deleteChildMutation.mutate(childId);
    };

    const getAgeAtDeath = () => {
        if (person.isDead && person.birth && person.death) {
            const birth = new Date(person.birth);
            const death = new Date(person.death);
            let age = death.getFullYear() - birth.getFullYear();
            const m = death.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }
        return null;
    };

    const ageAtDeath = getAgeAtDeath();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thông tin: ${person.name}`}>
            <div className="space-y-4">
                {/* Personal Information */}
                <div className="clay-card">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="clay-section-title mb-0">Thông tin cá nhân</h3>
                        {!isEditing && (isAdmin || isEditor) && (
                            <div className="flex gap-2">
                                <button onClick={handleEdit} className="clay-btn-ghost flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    Sửa
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="clay-btn-danger flex items-center gap-1 disabled:opacity-50"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Xóa
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 mt-4">
                        {/* Avatar Column */}
                        <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                            <div className="relative group">
                                <img
                                    src={person.avatar || (person.gender === Gender.MALE ? Avatar_Male : Avatar_Female)}
                                    alt={person.name}
                                    className={`w-36 h-36 rounded-full object-cover cursor-pointer group-hover:opacity-90 transition-all ${person.isDead ? 'grayscale opacity-80' : ''}`}
                                    style={{ border: `3px solid ${person.gender === Gender.MALE ? '#1a3a3a' : '#ff4d8b'}` }}
                                    onClick={handleAvatarClick}
                                />
                                {/* Halo if dead */}
                                {person.isDead && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                                        <svg width="60" height="30" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <ellipse cx="20" cy="10" rx="18" ry="6" stroke="#e8b94a" strokeWidth="2" fill="none" />
                                        </svg>
                                    </div>
                                )}
                                {/* Upload overlay */}
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all pointer-events-none">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                        />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                                <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                            </div>

                            {/* Status Badge */}
                            <div
                                className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                                style={person.isDead ? { backgroundColor: '#f3f0e8', color: '#6a6a6a' } : { backgroundColor: '#dcfce7', color: '#16a34a' }}
                            >
                                {person.isDead ? 'Đã mất' : 'Còn sống'}
                            </div>
                        </div>

                        {/* Info Column */}
                        <div className="flex-grow">
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="clay-label">
                                            Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="clay-input" required />
                                    </div>
                                    <div>
                                        <label className="clay-label">
                                            Giới tính <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            value={editForm.gender ?? Gender.MALE}
                                            onChange={(e) => setEditForm({ ...editForm, gender: parseInt(e.target.value) as 0 | 1 })}
                                            className="clay-select"
                                        >
                                            <option value={Gender.MALE}>Nam</option>
                                            <option value={Gender.FEMALE}>Nữ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="clay-label">
                                            CCCD <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input type="text" value={editForm.cccd || ''} onChange={(e) => setEditForm({ ...editForm, cccd: e.target.value })} className="clay-input" required />
                                    </div>
                                    <div>
                                        <label className="clay-label">Ngày sinh</label>
                                        <input
                                            type="date"
                                            value={editForm.birth ? new Date(editForm.birth).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditForm({ ...editForm, birth: e.target.value ? new Date(e.target.value) : undefined })}
                                            className="clay-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="clay-label">Ngày mất</label>
                                        <input
                                            type="date"
                                            value={editForm.death ? new Date(editForm.death).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditForm({ ...editForm, death: e.target.value ? new Date(e.target.value) : undefined })}
                                            className="clay-input"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isDead"
                                            checked={editForm.isDead || false}
                                            onChange={(e) => setEditForm({ ...editForm, isDead: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label htmlFor="isDead" className="text-[13px]" style={{ color: '#3a3a3a' }}>
                                            Đã mất
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="clay-label">Địa chỉ</label>
                                        <input type="text" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="clay-input" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="clay-label">Mô tả</label>
                                        <textarea value={editForm.desc || ''} onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })} className="clay-textarea" rows={3} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Name & Basic Info */}
                                    <div>
                                        <h2 className="text-[20px] font-semibold mb-1" style={{ color: '#0a0a0a', letterSpacing: '-0.4px' }}>
                                            {person.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: '#6a6a6a' }}>
                                            <span className="mr-3 flex items-center">
                                                {person.gender === Gender.MALE ? (
                                                    <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                                            clipRule="evenodd"
                                                            fillRule="evenodd"
                                                        ></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 mr-1 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                                            clipRule="evenodd"
                                                            fillRule="evenodd"
                                                        ></path>
                                                    </svg>
                                                )}
                                                {getGenderText(person.gender)}
                                            </span>
                                            {person.cccd && (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                                        />
                                                    </svg>
                                                    {person.cccd}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid #e5e5e5' }}>
                                        <div className="clay-card-inner">
                                            <p className="clay-label mb-1">Ngày sinh</p>
                                            <p className="text-[13px] font-medium" style={{ color: '#0a0a0a' }}>
                                                {person.birth ? new Date(person.birth).toLocaleDateString('vi-VN') : '—'}
                                            </p>
                                        </div>
                                        <div className="clay-card-inner">
                                            <p className="clay-label mb-1">Ngày mất</p>
                                            <div className="text-[13px] font-medium" style={{ color: '#0a0a0a' }}>
                                                {person.death ? (
                                                    <>
                                                        {new Date(person.death).toLocaleDateString('vi-VN')}
                                                        {ageAtDeath !== null && (
                                                            <span className="font-normal ml-1 text-[11px]" style={{ color: '#6a6a6a' }}>
                                                                (Hưởng thọ: {ageAtDeath} tuổi)
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#9a9a9a' }}>—</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="clay-card-inner sm:col-span-2">
                                            <p className="clay-label mb-1">Địa chỉ</p>
                                            <p className="text-[13px]" style={{ color: '#0a0a0a' }}>
                                                {person.address || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {person.desc && (
                                        <div className="clay-card-inner">
                                            <p className="clay-label mb-1">Tiểu sử / Mô tả</p>
                                            <p className="text-[13px] leading-relaxed" style={{ color: '#3a3a3a' }}>
                                                {person.desc}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Parents Info */}
                {loadingParents ? (
                    <div className="clay-card flex items-center gap-2 py-3 text-[13px]" style={{ color: '#6a6a6a' }}>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: '#1a3a3a', borderTopColor: 'transparent' }} />
                        Đang tải thông tin cha mẹ...
                    </div>
                ) : parents.length > 0 ? (
                    <div className="clay-card">
                        <h4 className="clay-section-title">Cha mẹ</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {parents.map((pc, index) => {
                                const parentSpouse = pc.parent as SpouseWithDetails;
                                const father = typeof parentSpouse.husband === 'object' ? (parentSpouse.husband as Person) : null;
                                const mother = typeof parentSpouse.wife === 'object' ? (parentSpouse.wife as Person) : null;
                                return (
                                    <div key={index} className="clay-card-inner">
                                        {father && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[11px] font-semibold uppercase tracking-wide w-8" style={{ color: '#1a3a3a' }}>
                                                    Cha
                                                </span>
                                                <span className="text-[13px] font-medium" style={{ color: '#0a0a0a' }}>
                                                    {father.name}
                                                </span>
                                            </div>
                                        )}
                                        {mother && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-semibold uppercase tracking-wide w-8" style={{ color: '#ff4d8b' }}>
                                                    Mẹ
                                                </span>
                                                <span className="text-[13px] font-medium" style={{ color: '#0a0a0a' }}>
                                                    {mother.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* Spouse Relationships */}
                <div className="clay-card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="clay-section-title mb-0">
                            Vợ / Chồng{' '}
                            <span className="text-[13px] font-normal" style={{ color: '#6a6a6a' }}>
                                ({spouses.length})
                            </span>
                        </h3>
                        {(isAdmin || isEditor) && (
                            <button onClick={() => onAddSpouse(person)} className="clay-btn-teal" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                + Thêm vợ/chồng
                            </button>
                        )}
                    </div>

                    {loadingSpouses ? (
                        <div className="flex items-center gap-2 py-3 text-[13px]" style={{ color: '#6a6a6a' }}>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: '#1a3a3a', borderTopColor: 'transparent' }} />
                            Đang tải...
                        </div>
                    ) : spouses.length === 0 ? (
                        <p className="text-[13px]" style={{ color: '#9a9a9a' }}>
                            Chưa có thông tin vợ/chồng
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {spouses.map((spouse, index) => (
                                <div key={spouse._id} className="clay-card-inner">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-[14px] font-semibold" style={{ color: '#0a0a0a' }}>
                                                {getSpouseName(spouse)}
                                            </p>
                                            {spouse.marriageDate && (
                                                <p className="text-[11px] mt-0.5" style={{ color: '#6a6a6a' }}>
                                                    Cưới: {new Date(spouse.marriageDate).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                            {spouse.divorceDate && (
                                                <p className="text-[11px]" style={{ color: '#ef4444' }}>
                                                    Ly hôn: {new Date(spouse.divorceDate).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                        {(isAdmin || isEditor) && (
                                            <div className="flex gap-1.5">
                                                <button onClick={() => spouse._id && onAddChild(spouse._id)} className="clay-btn-ghost">
                                                    + Thêm con
                                                </button>
                                                <button onClick={() => spouse._id && handleDeleteSpouse(spouse._id)} className="clay-btn-danger" style={{ padding: '4px 10px', fontSize: '11px' }}>
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {childrenQueries[index]?.isLoading ? (
                                        <div className="flex items-center gap-1.5 mt-2 text-[11px]" style={{ color: '#6a6a6a' }}>
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-t-transparent" style={{ borderColor: '#6a6a6a', borderTopColor: 'transparent' }} />
                                            Đang tải con cái...
                                        </div>
                                    ) : (
                                        spouse._id &&
                                        children[spouse._id] &&
                                        children[spouse._id].length > 0 && (
                                            <div className="mt-2 pt-2" style={{ borderTop: '1px solid #e5e5e5' }}>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6a6a6a' }}>
                                                    Con cái
                                                </p>
                                                <div className="space-y-0.5">
                                                    {children[spouse._id].map((child) => (
                                                        <div
                                                            key={child._id}
                                                            className="text-[13px] flex justify-between items-center group rounded-[8px] px-2 py-1 -mx-1 transition-colors"
                                                            style={{ color: '#3a3a3a' }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f7f2')}
                                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                                                        >
                                                            <span>
                                                                · {typeof child.child !== 'string' && child.child?.name}
                                                                {child.isAdopted && (
                                                                    <span className="text-[10px] ml-1" style={{ color: '#6a6a6a' }}>
                                                                        (nuôi)
                                                                    </span>
                                                                )}
                                                            </span>
                                                            {(isAdmin || isEditor) && (
                                                                <button
                                                                    onClick={() => child._id && handleDeleteChild(child._id)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                                                                    style={{ color: '#ef4444' }}
                                                                    title="Xóa"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Gallery Section */}
                {!isEditing && <Gallery personId={person._id} onAvatarUpdate={onUpdate} />}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancelEdit} disabled={loading} className="clay-btn-secondary">
                                Hủy
                            </button>
                            <button onClick={handleSaveEdit} disabled={loading} className="clay-btn-primary">
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="clay-btn-secondary">
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
