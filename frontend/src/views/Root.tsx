'use client';
import { Background, BackgroundVariant, MiniMap, Node, NodeTypes, Position, ReactFlow } from '@xyflow/react';
import PersonNode, { TPersionNode } from 'src/components/PersonNode/PersonNode';
import RelationshipNode, { TRelationshipNode } from 'src/components/RelationshipNode/RelationshipNode';
import { Gender, GenHeight, OffsetY } from 'src/constants';

const initialNodes = [
    { id: 'gen1', type: 'group', data: { label: 'Gen 1' }, position: { x: 200, y: 0 }, style: { width: 1000, height: GenHeight, backgroundColor: 'rgba(255, 0, 255, 0.05)' } },
    {
        id: '1',
        type: 'person',
        position: { x: 300, y: OffsetY.child },
        data: {
            cccd: '1234567890',
            name: 'Lê Đình A',
            birth: new Date('1900-01-24'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            gender: Gender.MALE,
            isDead: false,
            address: 'Hà Nội',
            desc: 'Là người cha của gia tộc',
        },
        sourcePosition: Position.Right,
        parentId: 'gen1',
    } as TPersionNode,
    {
        id: 'R12',
        type: 'relationship',
        position: { x: 300, y: OffsetY.relationship },
        data: { top: Gender.MALE, husbandOrder: 1, wifeOrder: 1, marriageDate: new Date('1920-01-01'), divorceDate: new Date('1920-01-01') },
        parentId: 'gen1',
    } as TRelationshipNode,
    {
        id: '2',
        type: 'person',
        position: { x: 300, y: OffsetY.spouse },
        data: {
            cccd: '1224567890',
            name: 'Dinh Thi X',
            birth: new Date('1900-01-30'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            gender: Gender.FEMALE,
            isDead: false,
            address: 'Hà Nội',
            desc: '',
        },
        sourcePosition: Position.Left,
        parentId: 'gen1',
    } as TPersionNode,
    {
        id: 'R13',
        type: 'relationship',
        position: { x: 450, y: OffsetY.relationship },
        data: { top: Gender.MALE, husbandOrder: 1, wifeOrder: 1, marriageDate: new Date('1920-01-01'), divorceDate: new Date('1920-01-01') },
        parentId: 'gen1',
    } as TRelationshipNode,
    {
        id: '3',
        type: 'person',
        position: { x: 450, y: OffsetY.spouse },
        data: {
            cccd: '4253475475',
            name: 'Nguyen Thi X',
            birth: new Date('1900-01-15'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            gender: Gender.FEMALE,
            isDead: false,
            address: 'Hà Nội',
            desc: '',
        },
        sourcePosition: Position.Left,
        parentId: 'gen1',
    } as TPersionNode,

    { id: 'gen2', type: 'group', data: { label: 'Gen 2' }, position: { x: 200, y: 550 }, style: { width: 1000, height: GenHeight, backgroundColor: 'rgba(255, 0, 255, 0.05)' } },
    {
        id: '4',
        type: 'person',
        position: { x: 300, y: OffsetY.child },
        data: {
            cccd: '56757457765',
            name: 'Le Thi AX',
            birth: new Date('1920-01-25'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            gender: Gender.FEMALE,
            isDead: false,
            address: 'Hà Nội',
            desc: '',
        },
        sourcePosition: Position.Right,
        parentId: 'gen2',
    },
    {
        id: '5',
        type: 'person',
        position: { x: 450, y: OffsetY.child },
        data: {
            cccd: '4564636456',
            name: 'Le Dinh XX',
            birth: new Date('1920-01-01'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            gender: Gender.MALE,
            isDead: false,
            address: 'Hà Nội',
            desc: '',
        },
        sourcePosition: Position.Left,
        parentId: 'gen2',
    },
    {
        id: '6',
        type: 'person',
        position: { x: 150, y: OffsetY.child },
        data: {
            cccd: '3454566334',
            name: 'Le Dinh YX',
            birth: new Date('1920-01-01'),
            avatar: '',
            gender: Gender.MALE,
            isDead: false,
            address: 'Hà Nội',
            desc: '',
        },
        sourcePosition: Position.Left,
        parentId: 'gen2',
    },
    {
        id: 'R24',
        type: 'relationship',
        position: { x: 300, y: OffsetY.relationship },
        data: { top: Gender.FEMALE, husbandOrder: 1, wifeOrder: 1, marriageDate: new Date('1920-01-01'), divorceDate: new Date('1920-01-01') },
        parentId: 'gen2',
    } as TRelationshipNode,
    {
        id: 'R25',
        type: 'relationship',
        position: { x: 450, y: OffsetY.relationship },
        data: { top: Gender.MALE, husbandOrder: 1, wifeOrder: 1, marriageDate: new Date('1920-01-01'), divorceDate: new Date('1920-01-01') },
        parentId: 'gen2',
    } as TRelationshipNode,
] as Node[];

const initialEdges = [
    { id: '1_R12', source: '1', target: 'R12', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
    { id: 'R12_2', source: 'R12', target: '2', sourceHandle: 'sb', targetHandle: 'tt', animated: true },

    { id: '1_R13', source: '1', target: 'R13', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
    { id: 'R13_3', source: 'R13', target: '3', sourceHandle: 'sb', targetHandle: 'tt', animated: true },

    { id: '2_4', source: '2', target: '4', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
    { id: '2_6', source: '2', target: '6', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
    { id: '2_5', source: '2', target: '5', sourceHandle: 'sb', targetHandle: 'tt', type: 'smoothstep', animated: true },
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
