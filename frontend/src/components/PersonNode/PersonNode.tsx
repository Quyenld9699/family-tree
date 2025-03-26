'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import Image from 'next/image';
import React from 'react';
import { Gender, PersonNodeHeight, PersonNodeWidth } from 'src/constants';
import { Avatar_Female, Avatar_Male } from 'src/constants/imagePaths';
import { PersonInfo } from 'src/schema/PersonInfo';

export type TPersionNode = Omit<Node, 'data' | 'type'> & {
    data: PersonInfo;
    type: 'person';
};

export type PersonNodeProps = Omit<NodeProps, 'data'> & {
    data: PersonInfo;
};
export default function PersonNode(props: PersonNodeProps) {
    return (
        <div
            className={`border-2 ${props.data.gender === Gender.MALE ? 'border-blue-500' : 'border-pink-500'} bg-white rounded-md p-2 text-center`}
            style={{ minWidth: PersonNodeWidth, maxWidth: PersonNodeWidth, height: PersonNodeHeight }}
        >
            <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0 }} />
            <Image
                src={props.data.avatar}
                alt={props.data.name}
                width={50}
                height={50}
                className="rounded-full mx-auto"
                onError={(e) => {
                    e.currentTarget.src = props.data.gender === Gender.MALE ? Avatar_Male : Avatar_Female;
                }}
            />
            <p className="text-sm font-bold">{props.data.name}</p>
            <p className="text-xs text-gray-500">{props.data.birth?.toLocaleDateString() || ''}</p>
            <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0 }} />
        </div>
    );
}
