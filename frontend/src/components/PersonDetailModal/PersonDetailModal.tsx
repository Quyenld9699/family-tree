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

interface PersonDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    person: Person | null;
    onAddSpouse: (person: Person) => void;
    onAddChild: (spouseId: string) => void;
    onUpdate?: () => void; // Callback after edit/delete
}

export default function PersonDetailModal({ isOpen, onClose, person, onAddSpouse, onAddChild, onUpdate }: PersonDetailModalProps) {
    const { isAdmin } = useAuth();
    const [spouses, setSpouses] = useState<SpouseWithDetails[]>([]);
    const [children, setChildren] = useState<{ [spouseId: string]: ParentChildWithDetails[] }>({});
    const [loading, setLoading] = useState(false);
    const [spousePersons, setSpousePersons] = useState<{ [personId: string]: Person }>({});
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Person>>({});
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (isOpen && person?._id) {
            loadRelationships();
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

    const loadRelationships = async () => {
        if (!person?._id) return;

        setLoading(true);
        try {
            // Load spouse relationships
            const spousesData = await spouseService.getSpousesByPersonId(person._id);
            setSpouses(spousesData);

            // Load spouse person details if they are IDs
            const spousePersonMap: { [personId: string]: Person } = {};
            for (const spouse of spousesData) {
                const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband?._id;
                const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife?._id;

                // Fetch husband details if it's an ID
                if (typeof spouse.husband === 'string' && husbandId && !spousePersonMap[husbandId]) {
                    try {
                        const husbandPerson = await personService.getPersonById(husbandId);
                        spousePersonMap[husbandId] = husbandPerson;
                    } catch (e) {
                        console.error('Failed to load husband:', e);
                    }
                }

                // Fetch wife details if it's an ID
                if (typeof spouse.wife === 'string' && wifeId && !spousePersonMap[wifeId]) {
                    try {
                        const wifePerson = await personService.getPersonById(wifeId);
                        spousePersonMap[wifeId] = wifePerson;
                    } catch (e) {
                        console.error('Failed to load wife:', e);
                    }
                }
            }
            setSpousePersons(spousePersonMap);

            // Load children for each spouse relationship
            const childrenData: { [key: string]: ParentChildWithDetails[] } = {};
            for (const spouse of spousesData) {
                if (spouse._id) {
                    const kids = await parentChildService.getChildrenByParentId(spouse._id);
                    childrenData[spouse._id] = kids;
                }
            }
            setChildren(childrenData);
        } catch (error) {
            console.error('Failed to load relationships:', error);
        } finally {
            setLoading(false);
        }
    };

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
            } catch (error) {
                console.error('Failed to upload avatar:', error);
                alert('Upload avatar thất bại');
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

    const handleSaveEdit = async () => {
        if (!person?._id) return;

        try {
            setLoading(true);
            await personService.updatePerson(person._id, editForm);
            alert('Cập nhật thành công!');
            setIsEditing(false);
            if (onUpdate) onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Failed to update person:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!person?._id) return;

        const confirmed = confirm(`Bạn có chắc chắn muốn xóa ${person.name}?\n\nLưu ý: Tất cả các mối quan hệ (vợ/chồng, con cái) liên quan đến người này cũng sẽ bị xóa.`);
        if (!confirmed) return;

        try {
            setLoading(true);
            await personService.deletePerson(person._id);
            alert('Xóa thành công!');
            if (onUpdate) onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Failed to delete person:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa!');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSpouse = async (spouseId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mối quan hệ vợ chồng này? Tất cả con cái chung cũng sẽ bị mất liên kết cha mẹ.')) return;
        try {
            await spouseService.deleteSpouse(spouseId);
            loadRelationships();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to delete spouse:', error);
            alert('Xóa thất bại');
        }
    };

    const handleDeleteChild = async (childId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mối quan hệ cha mẹ - con cái này?')) return;
        try {
            await parentChildService.deleteParentChild(childId);
            loadRelationships();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to delete child:', error);
            alert('Xóa thất bại');
        }
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
            <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h3>
                        {!isEditing && isAdmin && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
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

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Avatar Column */}
                        <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                            <div className="relative group">
                                <img
                                    src={person.avatar || (person.gender === Gender.MALE ? Avatar_Male : Avatar_Female)}
                                    alt={person.name}
                                    className={`w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer group-hover:opacity-90 transition-all ${
                                        person.isDead ? 'grayscale' : ''
                                    }`}
                                    onClick={handleAvatarClick}
                                />
                                {/* Halo if dead */}
                                {person.isDead && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                                        <svg width="60" height="30" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <ellipse cx="20" cy="10" rx="18" ry="6" stroke="#FFD700" strokeWidth="2" fill="none" />
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
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${person.isDead ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                {person.isDead ? 'Đã mất' : 'Còn sống'}
                            </div>
                        </div>

                        {/* Info Column */}
                        <div className="flex-grow">
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="col-span-2">
                                        <label className="block text-gray-700 mb-1">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 mb-1">
                                            Giới tính <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={editForm.gender ?? Gender.MALE}
                                            onChange={(e) => setEditForm({ ...editForm, gender: parseInt(e.target.value) as 0 | 1 })}
                                            className="w-full px-3 py-2 border rounded"
                                        >
                                            <option value={Gender.MALE}>Nam</option>
                                            <option value={Gender.FEMALE}>Nữ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 mb-1">
                                            CCCD <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.cccd || ''}
                                            onChange={(e) => setEditForm({ ...editForm, cccd: e.target.value })}
                                            className="w-full px-3 py-2 border rounded"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 mb-1">Ngày sinh</label>
                                        <input
                                            type="date"
                                            value={editForm.birth ? new Date(editForm.birth).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditForm({ ...editForm, birth: e.target.value ? new Date(e.target.value) : undefined })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 mb-1">Ngày mất</label>
                                        <input
                                            type="date"
                                            value={editForm.death ? new Date(editForm.death).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditForm({ ...editForm, death: e.target.value ? new Date(e.target.value) : undefined })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isDead"
                                            checked={editForm.isDead || false}
                                            onChange={(e) => setEditForm({ ...editForm, isDead: e.target.checked })}
                                            className="mr-2"
                                        />
                                        <label htmlFor="isDead" className="text-gray-700">
                                            Đã mất
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-gray-700 mb-1">Địa chỉ</label>
                                        <input
                                            type="text"
                                            value={editForm.address || ''}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-gray-700 mb-1">Mô tả</label>
                                        <textarea
                                            value={editForm.desc || ''}
                                            onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                                            className="w-full px-3 py-2 border rounded"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Name & Basic Info */}
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{person.name}</h2>
                                        <div className="flex items-center text-gray-500 text-sm">
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 py-4 border-t border-b border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Ngày sinh</p>
                                            <p className="text-gray-900 font-medium">{person.birth ? new Date(person.birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Ngày mất</p>
                                            <div className="text-gray-900 font-medium">
                                                {person.death ? (
                                                    <>
                                                        {new Date(person.death).toLocaleDateString('vi-VN')}
                                                        {ageAtDeath !== null && <span className="text-gray-500 text-sm ml-2 font-normal">(Hưởng thọ: {ageAtDeath} tuổi)</span>}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Địa chỉ</p>
                                            <p className="text-gray-900">{person.address || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {person.desc && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Tiểu sử / Mô tả</p>
                                            <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg text-sm">{person.desc}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Spouse Relationships */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Vợ/Chồng ({spouses.length})</h3>
                        <button onClick={() => onAddSpouse(person)} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                            + Thêm vợ/chồng
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Đang tải...</p>
                    ) : spouses.length === 0 ? (
                        <p className="text-sm text-gray-500">Chưa có thông tin vợ/chồng</p>
                    ) : (
                        <div className="space-y-3">
                            {spouses.map((spouse) => (
                                <div key={spouse._id} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium">{getSpouseName(spouse)}</p>
                                            {spouse.marriageDate && <p className="text-xs text-gray-600">Cưới: {new Date(spouse.marriageDate).toLocaleDateString('vi-VN')}</p>}
                                            {spouse.divorceDate && <p className="text-xs text-red-600">Ly hôn: {new Date(spouse.divorceDate).toLocaleDateString('vi-VN')}</p>}
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button onClick={() => spouse._id && onAddChild(spouse._id)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">
                                                    + Thêm con
                                                </button>
                                                <button
                                                    onClick={() => spouse._id && handleDeleteSpouse(spouse._id)}
                                                    className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-100 border border-red-100"
                                                    title="Xóa mối quan hệ vợ chồng"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Children of this spouse */}
                                    {spouse._id && children[spouse._id] && children[spouse._id].length > 0 && (
                                        <div className="mt-2 pl-3 border-l-2 border-gray-300">
                                            <p className="text-xs text-gray-600 mb-1">Con cái:</p>
                                            <div className="space-y-1">
                                                {children[spouse._id].map((child) => (
                                                    <div key={child._id} className="text-sm flex justify-between items-center group hover:bg-gray-50 rounded px-1 -mx-1">
                                                        <span>
                                                            • {typeof child.child !== 'string' && child.child?.name}
                                                            {child.isAdopted && <span className="text-xs text-gray-500"> (nuôi)</span>}
                                                        </span>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => child._id && handleDeleteChild(child._id)}
                                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                                title="Xóa quan hệ con cái"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Gallery Section */}
                {!isEditing && <Gallery personId={person._id} onAvatarUpdate={onUpdate} />}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleCancelEdit} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100">
                                Hủy
                            </button>
                            <button onClick={handleSaveEdit} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
