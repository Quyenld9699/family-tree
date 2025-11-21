'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { Person } from 'src/services/personService';
import personService from 'src/services/personService';
import spouseService, { SpouseWithDetails } from 'src/services/spouseService';
import parentChildService, { ParentChildWithDetails } from 'src/services/parentChildService';

interface PersonDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    person: Person | null;
    onAddSpouse: (person: Person) => void;
    onAddChild: (spouseId: string) => void;
}

export default function PersonDetailModal({ isOpen, onClose, person, onAddSpouse, onAddChild }: PersonDetailModalProps) {
    const [spouses, setSpouses] = useState<SpouseWithDetails[]>([]);
    const [children, setChildren] = useState<{ [spouseId: string]: ParentChildWithDetails[] }>({});
    const [loading, setLoading] = useState(false);
    const [spousePersons, setSpousePersons] = useState<{ [personId: string]: Person }>({});

    useEffect(() => {
        if (isOpen && person?._id) {
            loadRelationships();
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
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thông tin: ${person.name}`}>
            <div className="space-y-4">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-600">Giới tính:</span> <span className="font-medium">{person.gender === 'MALE' ? 'Nam' : person.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
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
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                        Đóng
                    </button>
                </div>
            </div>
        </Modal>
    );
}
