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
};
export default function RelationshipNode(props: RelationshipNodeProps) {
    return (
        <div>
            <div className="relative p-2 grid place-items-center" style={{ width: RelationshipNodeSize, height: RelationshipNodeSize }}>
                <div
                    className="absolute top-1/2 left-1/2  border-2 bg-white rounded-sm"
                    style={{
                        width: '70.71%',
                        height: '70.71%',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                        zIndex: 0,
                        borderColor: props.data.top === Gender.MALE ? '#1448c5 #E91E63 #E91E63 #1448c5' : '#E91E63 #1448c5 #1448c5 #E91E63',
                    }}
                ></div>
                <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0 }} />
                <div className="relative text-center">
                    <p className="text-sm">{props.data.marriageDate?.toLocaleDateString()}</p>
                    <p className="text-sm">{props.data.top === Gender.MALE ? 'v' + props.data.wifeOrder : 'c' + props.data.husbandOrder}</p>
                </div>
                <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0 }} />
            </div>
        </div>
    );
}
