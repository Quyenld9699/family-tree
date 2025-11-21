'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { Person } from 'src/services/personService';
import personService from 'src/services/personService';
import spouseService, { SpouseWithDetails } from 'src/services/spouseService';
import parentChildService, { ParentChildWithDetails } from 'src/services/parentChildService';
import { getGenderText, Gender } from 'src/utils/genderUtils';

interface PersonDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    person: Person | null;
    onAddSpouse: (person: Person) => void;
    onAddChild: (spouseId: string) => void;
    onUpdate?: () => void; // Callback after edit/delete
}

export default function PersonDetailModal({ isOpen, onClose, person, onAddSpouse, onAddChild, onUpdate }: PersonDetailModalProps) {
    const [spouses, setSpouses] = useState<SpouseWithDetails[]>([]);
    const [children, setChildren] = useState<{ [spouseId: string]: ParentChildWithDetails[] }>({});
    const [loading, setLoading] = useState(false);
    const [spousePersons, setSpousePersons] = useState<{ [personId: string]: Person }>({});
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Person>>({});

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thông tin: ${person.name}`}>
            <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Thông tin cá nhân</h3>
                        {!isEditing && (
                            <div className="flex gap-2">
                                <button onClick={handleEdit} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                    Sửa
                                </button>
                                <button onClick={handleDelete} disabled={loading} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:bg-gray-400">
                                    Xóa
                                </button>
                            </div>
                        )}
                    </div>

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
                            <div className="col-span-2">
                                <label className="block text-gray-700 mb-1">Địa chỉ</label>
                                <input type="text" value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-gray-700 mb-1">Mô tả</label>
                                <textarea value={editForm.desc || ''} onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })} className="w-full px-3 py-2 border rounded" rows={3} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-600">Giới tính:</span> <span className="font-medium">{getGenderText(person.gender)}</span>
                            </div>
                            {person.cccd && (
                                <div>
                                    <span className="text-gray-600">CCCD:</span> <span className="font-medium">{person.cccd}</span>
                                </div>
                            )}
                            {person.birth && (
                                <div>
                                    <span className="text-gray-600">Ngày sinh:</span> <span className="font-medium">{new Date(person.birth).toLocaleDateString('vi-VN')}</span>
                                </div>
                            )}
                            {person.death && (
                                <div>
                                    <span className="text-gray-600">Ngày mất:</span> <span className="font-medium">{new Date(person.death).toLocaleDateString('vi-VN')}</span>
                                </div>
                            )}
                            {person.address && (
                                <div className="col-span-2">
                                    <span className="text-gray-600">Địa chỉ:</span> <span className="font-medium">{person.address}</span>
                                </div>
                            )}
                            {person.desc && (
                                <div className="col-span-2">
                                    <span className="text-gray-600">Mô tả:</span> <span className="font-medium">{person.desc}</span>
                                </div>
                            )}
                        </div>
                    )}
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
                                        <button onClick={() => spouse._id && onAddChild(spouse._id)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">
                                            + Thêm con
                                        </button>
                                    </div>

                                    {/* Children of this spouse */}
                                    {spouse._id && children[spouse._id] && children[spouse._id].length > 0 && (
                                        <div className="mt-2 pl-3 border-l-2 border-gray-300">
                                            <p className="text-xs text-gray-600 mb-1">Con cái:</p>
                                            <div className="space-y-1">
                                                {children[spouse._id].map((child) => (
                                                    <div key={child._id} className="text-sm">
                                                        • {typeof child.child !== 'string' && child.child?.name}
                                                        {child.isAdopted && <span className="text-xs text-gray-500"> (nuôi)</span>}
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
