'use client';

import React from 'react';
import Modal from '../Modal/Modal';
import { SpouseWithDetails } from 'src/services/spouseService';
import Gallery from '../Gallery/Gallery';
import { Person } from 'src/services/personService';

interface RelationshipDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    spouse: SpouseWithDetails | null;
}

export default function RelationshipDetailModal({ isOpen, onClose, spouse }: RelationshipDetailModalProps) {
    if (!spouse) return null;

    const husband = typeof spouse.husband === 'string' ? null : (spouse.husband as Person);
    const wife = typeof spouse.wife === 'string' ? null : (spouse.wife as Person);

    const husbandName = husband?.name || 'Chồng';
    const wifeName = wife?.name || 'Vợ';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Quan hệ: ${husbandName} - ${wifeName}`}>
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">Thông tin hôn nhân</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Ngày cưới</label>
                            <div className="mt-1 text-gray-900">{spouse.marriageDate ? new Date(spouse.marriageDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Ngày ly hôn</label>
                            <div className="mt-1 text-gray-900">{spouse.divorceDate ? new Date(spouse.divorceDate).toLocaleDateString('vi-VN') : 'Không'}</div>
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                            <div className="text-sm text-gray-700">
                                <p className="mb-1">
                                    <span className="font-medium">{wifeName}</span> là vợ thứ <span className="font-bold text-blue-600">{spouse.wifeOrder || 1}</span> của {husbandName}
                                </p>
                                <p>
                                    <span className="font-medium">{husbandName}</span> là chồng thứ <span className="font-bold text-blue-600">{spouse.husbandOrder || 1}</span> của {wifeName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gallery Section */}
                <Gallery spouseId={spouse._id} />
            </div>
        </Modal>
    );
}
