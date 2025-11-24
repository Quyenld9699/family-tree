import { Node, Edge, Position } from '@xyflow/react';
import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/services';
import {
    PERSON_WIDTH,
    RELATIONSHIP_WIDTH,
    GEN_VERTICAL_SPACE,
    GEN_GAP,
    OFFSET_PERSON,
    OFFSET_RELATIONSHIP,
    OFFSET_SPOUSE,
    PERSON_NODE_STYLE,
    RELATIONSHIP_NODE_STYLE,
    SPOUSE_NODE_STYLE,
    DEFAULT_EDGE_STYLE,
    GENERATION_BOX_STYLE,
} from '../constants/layoutConstants';
import { mapGender, getChildId, getSpousePersonId, sortSpouses } from './treeHelpers';
export interface RenderResult {
    nodes: Node[];
    edges: Edge[];
}

/**
 * Render all nodes and edges for the family tree
 */
export const renderFamilyTree = (
    generations: Person[][],
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personGeneration: Map<string, number>,
    nodeXPositions: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>,
): RenderResult => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate global generation box bounds
    const absoluteMinX = Math.min(...Array.from(nodeXPositions.values()));
    const absoluteMaxX = Math.max(...Array.from(nodeXPositions.values()).map((x) => x + PERSON_WIDTH));

    // Render each generation
    generations.forEach((genPersons, genIndex) => {
        const genY = genIndex * GEN_VERTICAL_SPACE;

        // Add generation box
        const groupX = absoluteMinX - 100;
        const groupY = genY - 30;
        const groupWidth = absoluteMaxX - absoluteMinX + 200;
        const groupHeight = GEN_VERTICAL_SPACE - GEN_GAP;

        // Add generation box (no label inside)
        nodes.push({
            id: `gen_${genIndex}_box`,
            type: 'default',
            position: { x: groupX, y: groupY },
            data: { label: '' },
            draggable: false,
            selectable: false,
            connectable: false,
            style: {
                ...GENERATION_BOX_STYLE,
                width: groupWidth,
                height: groupHeight,
            },
        });

        // Add generation label outside on the left
        nodes.push({
            id: `gen_${genIndex}_label`,
            type: 'default',
            position: { x: groupX - 120, y: groupY + groupHeight / 2 - 20 },
            data: { label: `Thế hệ ${genIndex + 1}` },
            draggable: false,
            selectable: false,
            connectable: false,
            style: {
                background: 'transparent',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#dc2626',
                padding: 0,
                width: 100,
                height: 40,
                textAlign: 'center',
                pointerEvents: 'none',
            },
        });

        // Render persons in this generation
        genPersons.forEach((person) => {
            renderPerson(person, genIndex, genY, spouseMap, childrenMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions, nodes, edges);
        });
    });

    return { nodes, edges };
};

/**
 * Render a person with their spouses, relationships, and children
 */
function renderPerson(
    person: Person,
    genIndex: number,
    genY: number,
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personGeneration: Map<string, number>,
    nodeXPositions: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>,
    nodes: Node[],
    edges: Edge[],
): void {
    const personId = person._id!;
    const personX = nodeXPositions.get(personId);
    if (personX === undefined) return;

    const personY = genY + OFFSET_PERSON;
    const personGender = mapGender(person.gender);

    // Add person node
    nodes.push({
        id: personId,
        type: 'person',
        position: { x: personX, y: personY },
        data: {
            id: personId,
            cccd: person.cccd || '',
            name: person.name,
            avatar: person.avatar || '',
            gender: personGender,
            birth: person.birth,
            death: person.death,
            isDead: person.isDead || false,
            address: person.address || '',
            desc: person.desc || '',
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        parentId: `gen${genIndex}`,
        draggable: false,
        style: PERSON_NODE_STYLE,
    });

    const personSpouses = spouseMap.get(personId) || [];
    if (personSpouses.length === 0) return;

    const sortedSpouses = sortSpouses(personSpouses);

    // Render each spouse relationship
    sortedSpouses.forEach((spouse, idx) => {
        renderSpouseRelationship(spouse, personId, personGender, genIndex, genY, idx, childrenMap, personGeneration, relationshipXPositions, spouseNodeXPositions, nodes, edges);
    });
}

/**
 * Render spouse relationship node and edges
 */
function renderSpouseRelationship(
    spouse: SpouseWithDetails,
    personId: string,
    personGender: any,
    genIndex: number,
    genY: number,
    spouseIdx: number,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personGeneration: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>,
    nodes: Node[],
    edges: Edge[],
): void {
    const spouseId = spouse._id!;
    const spouseX = relationshipXPositions.get(spouseId);
    if (spouseX === undefined) return;

    const relationshipY = genY + OFFSET_RELATIONSHIP;
    const spouseY = genY + OFFSET_SPOUSE;

    // Add relationship node
    const relationshipId = `R_${spouseId}`;
    nodes.push({
        id: relationshipId,
        type: 'relationship',
        position: { x: spouseX, y: relationshipY },
        data: {
            id: spouseId,
            top: personGender,
            husbandOrder: spouse.husbandOrder || 1,
            wifeOrder: spouse.wifeOrder || 1,
            marriageDate: spouse.marriageDate,
            divorceDate: spouse.divorceDate,
        },
        parentId: `gen${genIndex}`,
        draggable: false,
        style: RELATIONSHIP_NODE_STYLE,
    });

    // Edge from person to relationship
    edges.push({
        id: `${personId}_to_${relationshipId}`,
        source: personId,
        target: relationshipId,
        sourceHandle: 'sb',
        targetHandle: 'tt',
        type: 'smoothstep',
        style: DEFAULT_EDGE_STYLE,
    });

    // Determine target spouse node ID for edges
    const spousePersonId = getSpousePersonId(spouse, personId);
    const spouseGen = personGeneration.get(spousePersonId!);
    let targetSpouseId: string;

    if (spouseGen === undefined) {
        // Spouse không có trong tree → tạo spouse node
        const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${personId}_${spouseIdx}`;
        targetSpouseId = uniqueSpouseNodeId;
        const spouseNodeX = spouseNodeXPositions.get(uniqueSpouseNodeId);

        if (spouseNodeX !== undefined) {
            const husbandIdCheck = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
            const spousePersonData = husbandIdCheck === personId ? spouse.wife : spouse.husband;
            const spousePersonObj = typeof spousePersonData === 'string' ? null : spousePersonData;

            if (spousePersonObj) {
                nodes.push({
                    id: uniqueSpouseNodeId,
                    type: 'person',
                    position: { x: spouseNodeX, y: spouseY },
                    data: {
                        id: spousePersonId!,
                        cccd: spousePersonObj.cccd || '',
                        name: spousePersonObj.name,
                        avatar: spousePersonObj.avatar || '',
                        gender: mapGender(spousePersonObj.gender),
                        birth: spousePersonObj.birth,
                        death: spousePersonObj.death,
                        isDead: spousePersonObj.isDead || false,
                        address: spousePersonObj.address || '',
                        desc: spousePersonObj.desc || '',
                    },
                    sourcePosition: Position.Bottom,
                    targetPosition: Position.Top,
                    parentId: `gen${genIndex}`,
                    draggable: false,
                    style: SPOUSE_NODE_STYLE,
                });

                // Edge from relationship to spouse node
                edges.push({
                    id: `${relationshipId}_to_${uniqueSpouseNodeId}`,
                    source: relationshipId,
                    target: uniqueSpouseNodeId,
                    sourceHandle: 'sb',
                    targetHandle: 'tt',
                    type: 'smoothstep',
                    style: DEFAULT_EDGE_STYLE,
                });
            }
        }
    } else {
        // Spouse có trong tree → dùng ID gốc
        targetSpouseId = spousePersonId!;
    }

    // Render children edges - NỐI TỪ SPOUSE NODE (hàng 3), KHÔNG PHẢI RELATIONSHIP (hàng 2)
    const children = childrenMap.get(spouseId) || [];
    children.forEach((pc) => {
        const childId = getChildId(pc);
        if (childId) {
            edges.push({
                id: `${targetSpouseId}_to_child_${childId}`,
                source: targetSpouseId, // Nối từ spouse node, không phải relationship
                target: childId,
                sourceHandle: 'sb',
                targetHandle: 'tt',
                type: 'smoothstep',
                animated: true,
                style: DEFAULT_EDGE_STYLE,
            });
        }
    });
}
