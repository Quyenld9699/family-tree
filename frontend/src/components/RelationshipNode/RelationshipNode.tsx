'use client';
import { Handle, NodeProps, Position } from '@xyflow/react';
import React from 'react';

export default function RelationshipNode(props: NodeProps) {
    return (
        <div>
            <div className="relative p-2  w-24 h-24 grid place-items-center">
                <div className="absolute top-1/2 left-1/2  border border-gray-300" style={{ width: '70.71%', height: '70.71%', transform: 'translate(-50%, -50%) rotate(45deg)' }}></div>
                <Handle type="target" position={Position.Top} id={'tt'} />
                <div>{props.id}</div>
                <Handle type="source" position={Position.Bottom} id={'sb'} />
            </div>
        </div>
    );
}
