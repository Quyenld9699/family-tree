'use client';

import { Handle, NodeProps, Position } from '@xyflow/react';
import React from 'react';

export default function PersonNode(props: NodeProps) {
    return (
        <div className="border border-gray-300 bg-white rounded-md p-2">
            <Handle type="target" position={Position.Top} id={'tt'} />
            Person {props.id}
            <Handle type="source" position={Position.Bottom} id={'sb'} />
        </div>
    );
}
