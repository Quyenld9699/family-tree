'use client';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import React from 'react';
import { Gender, RelationshipNodeSize } from 'src/constants';
import { SpouseInfo } from 'src/schema/Spouse';

export type TRelationshipNode = Omit<Node, 'data' | 'type'> & {
    data: SpouseInfo;
    type: 'relationship';
};

export type RelationshipNodeProps = Omit<NodeProps, 'data'> & {
    data: SpouseInfo;
    onClick?: (data: SpouseInfo) => void;
};
export default function RelationshipNode(props: RelationshipNodeProps) {
    // Format marriage date
    const marriageDate = props.data.marriageDate ? (typeof props.data.marriageDate === 'string' ? new Date(props.data.marriageDate) : props.data.marriageDate) : null;
    const marriageDateStr = marriageDate ? marriageDate.toLocaleDateString() : '';

    // Định nghĩa kích thước hình thoi - 4 ĐỈNH CHẠM CẠNH CONTAINER
    const CONTAINER_SIZE = 128; // Khớp với PERSON_WIDTH
    // Khi xoay 45°, để 4 đỉnh chạm cạnh: diamond_size = container_size / √2 ≈ container_size * 0.707
    const DIAMOND_SIZE = Math.floor(CONTAINER_SIZE * 0.707); // ≈ 85px

    return (
        <div
            style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, position: 'relative' }}
            onClick={() => props.onClick && props.onClick(props.data)}
            className="cursor-pointer hover:scale-105 transition-transform"
        >
            {/* Handles - ĐẶT ĐÚNG VỊ TRÍ HÌNH THOI (center container) */}
            <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0, top: 0 }} />
            <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0, bottom: 0 }} />

            {/* Hình thoi - 4 đỉnh chạm cạnh container */}
            <div
                className="absolute bg-white border-2"
                style={{
                    width: DIAMOND_SIZE,
                    height: DIAMOND_SIZE,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    borderColor: props.data.top === Gender.MALE ? '#1448c5 #E91E63 #E91E63 #1448c5' : '#E91E63 #1448c5 #1448c5 #E91E63',
                }}
            />

            {/* Nội dung text - nằm trên hình thoi */}
            <div className="absolute text-center z-10" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}>
                <p className="text-xs leading-tight">{marriageDateStr}</p>
                <p className="text-xs font-semibold">{props.data.top === Gender.MALE ? 'v' + props.data.wifeOrder : 'c' + props.data.husbandOrder}</p>
            </div>
        </div>
    );
}
