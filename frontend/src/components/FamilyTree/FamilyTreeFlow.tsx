import { Background, BackgroundVariant, MiniMap, ReactFlow } from '@xyflow/react';
import { useMemo } from 'react';
import PersonNode from 'src/components/PersonNode/PersonNode';
import RelationshipNode from 'src/components/RelationshipNode/RelationshipNode';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { ParentChildWithDetails } from 'src/services/parentChildService';
import { buildGenerations, buildChildrenByParentMap } from 'src/views/utils/generationBuilder';
import { calculateNodePositions } from 'src/views/utils/positionCalculator';
import { renderFamilyTree } from 'src/views/utils/nodeRenderer';

interface FamilyTreeFlowProps {
    persons: Person[];
    spouses: SpouseWithDetails[];
    parentChilds: ParentChildWithDetails[];
    searchRootPersonId: string | null;
    searchGenerations: number | null;
    onPersonNodeClick: (personData: any) => void;
    onRelationshipNodeClick: (spouseData: any) => void;
}

const FamilyTreeFlow: React.FC<FamilyTreeFlowProps> = ({ persons, spouses, parentChilds, searchRootPersonId, searchGenerations, onPersonNodeClick, onRelationshipNodeClick }) => {
    const nodeTypes = useMemo(
        () => ({
            relationship: (props: any) => <RelationshipNode {...props} onClick={onRelationshipNodeClick} />,
            person: (props: any) => <PersonNode {...props} onClick={onPersonNodeClick} />,
        }),
        [onPersonNodeClick, onRelationshipNodeClick],
    );

    const { nodes, edges } = useMemo(() => {
        if (persons.length === 0) {
            return { nodes: [], edges: [] };
        }

        // Find ROOT_PERSON_ID
        const ROOT_PERSON_ID = searchRootPersonId || persons.find((p) => p.name?.includes('Lê Đình A'))?._id || persons[0]?._id;

        // Build maps
        const personMap = new Map<string, Person>();
        const spouseMap = new Map<string, SpouseWithDetails[]>();
        const childrenMap = new Map<string, ParentChildWithDetails[]>();

        persons.forEach((p) => personMap.set(p._id!, p));

        spouses.forEach((spouse) => {
            const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
            const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;

            if (husbandId) {
                if (!spouseMap.has(husbandId)) spouseMap.set(husbandId, []);
                spouseMap.get(husbandId)!.push(spouse);
            }
            if (wifeId) {
                if (!spouseMap.has(wifeId)) spouseMap.set(wifeId, []);
                spouseMap.get(wifeId)!.push(spouse);
            }
        });

        parentChilds.forEach((pc) => {
            const parentId = typeof pc.parent === 'string' ? pc.parent : pc.parent._id;
            if (parentId) {
                if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
                childrenMap.get(parentId)!.push(pc);
            }
        });

        // Build generations
        const { generations, personGeneration } = buildGenerations(ROOT_PERSON_ID!, personMap, spouseMap, childrenMap, searchGenerations || undefined);

        // Build children by parent map
        const lastGenIndex = generations.length - 1;
        const childrenByParent = buildChildrenByParentMap(generations, lastGenIndex, spouseMap, childrenMap, personMap);

        // Calculate positions
        const { nodeXPositions, relationshipXPositions, spouseNodeXPositions } = calculateNodePositions(generations, spouseMap, childrenMap, personGeneration, childrenByParent, personMap);

        // Render tree
        return renderFamilyTree(generations, spouseMap, childrenMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
    }, [persons, spouses, parentChilds, searchRootPersonId, searchGenerations]);

    return (
        <>
            <style>{`
                .react-flow__node[data-id^="gen_"] .react-flow__handle {
                    display: none !important;
                }
            `}</style>
            <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges}>
                <MiniMap />
                <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
            </ReactFlow>
        </>
    );
};

export default FamilyTreeFlow;
