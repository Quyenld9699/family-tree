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
            {/* Handles */}
            <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0, top: 0 }} />
            <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0, bottom: 0 }} />

            {/* Diamond — Clay theme: cream fill, split border teal/pink */}
            <div
                className="absolute"
                style={{
                    width: DIAMOND_SIZE,
                    height: DIAMOND_SIZE,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    backgroundColor: '#fefef9',
                    border: '2px solid',
                    borderColor: props.data.top === Gender.MALE ? '#1a3a3a #ff4d8b #ff4d8b #1a3a3a' : '#ff4d8b #1a3a3a #1a3a3a #ff4d8b',
                    borderRadius: '4px',
                }}
            />

            {/* Text overlay */}
            <div className="absolute text-center z-10" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}>
                <p className="text-[10px] leading-tight" style={{ color: '#6a6a6a' }}>
                    {marriageDateStr}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: '#0a0a0a' }}>
                    {props.data.top === Gender.MALE ? 'v' + props.data.wifeOrder : 'c' + props.data.husbandOrder}
                </p>
            </div>
        </div>
    );
}
