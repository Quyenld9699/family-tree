'use client';
import { Background, BackgroundVariant, MiniMap, Position, ReactFlow } from '@xyflow/react';
import PersonNode from 'src/components/PersonNode/PersonNode';
import RelationshipNode from 'src/components/RelationshipNode/RelationshipNode';

const initialNodes = [
    { id: '1', type: 'person', position: { x: 300, y: 0 }, data: { label: 'Chong' }, sourcePosition: Position.Right },

    { id: 'R12', type: 'relationship', position: { x: 300, y: 100 }, data: { label: 'Vo/Chong 1' } },
    { id: '2', type: 'person', position: { x: 300, y: 250 }, data: { label: 'Person 2' }, sourcePosition: Position.Left },

    { id: 'R13', type: 'relationship', position: { x: 450, y: 100 }, data: { label: 'Vo/Chong 2' } },
    { id: '3', type: 'person', position: { x: 450, y: 250 }, data: { label: 'Person 3' }, sourcePosition: Position.Left },
];

const initialEdges = [
    { id: '1_R12', source: '1', target: 'R12', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
    { id: 'R12_2', source: 'R12', target: '2', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },

    { id: '1_R13', source: '1', target: 'R13', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
    { id: 'R13_3', source: 'R13', target: '3', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
];

const nodeTypes = { relationship: RelationshipNode, person: PersonNode };

export default function Root() {
    return (
        <div style={{ width: '100vw', height: '100svh' }}>
            <ReactFlow nodeTypes={nodeTypes} nodes={initialNodes} edges={initialEdges}>
                <MiniMap />
                <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
