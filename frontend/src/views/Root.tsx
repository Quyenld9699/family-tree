'use client';
import { Background, BackgroundVariant, MiniMap, ReactFlow } from '@xyflow/react';
import PersonNode from 'src/components/PersonNode/PersonNode';
import RelationshipNode from 'src/components/RelationshipNode/RelationshipNode';
import { useState, useEffect, useCallback, useMemo } from 'react';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import AddPersonButton from 'src/components/AddPersonButton/AddPersonButton';
import SearchBar from 'src/components/SearchBar/SearchBar';
import personService, { Person } from 'src/services/personService';
import spouseService, { SpouseWithDetails } from 'src/services/spouseService';
import parentChildService, { ParentChildWithDetails } from 'src/services/parentChildService';
import { buildGenerations, buildChildrenByParentMap } from './utils/generationBuilder';
import { calculateNodePositions } from './utils/positionCalculator';
import { renderFamilyTree } from './utils/nodeRenderer';

export default function Root() {
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);
    const [persons, setPersons] = useState<Person[]>([]);
    const [spouses, setSpouses] = useState<SpouseWithDetails[]>([]);
    const [parentChilds, setParentChilds] = useState<ParentChildWithDetails[]>([]);
    const [searchRootPersonId, setSearchRootPersonId] = useState<string | null>(null);
    const [searchGenerations, setSearchGenerations] = useState<number | null>(null);

    const handlePersonNodeClick = useCallback(
        (personData: any) => {
            const fullPerson = persons.find((p) => p._id === personData.id);
            if (fullPerson) {
                setSelectedPerson(fullPerson);
                setPersonDetailModalOpen(true);
            }
        },
        [persons],
    );

    const nodeTypes = useMemo(
        () => ({
            relationship: RelationshipNode,
            person: (props: any) => <PersonNode {...props} onClick={handlePersonNodeClick} />,
        }),
        [handlePersonNodeClick],
    );

    useEffect(() => {
        loadAllData();
    }, []);

    // Build family tree with memoization
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
        const { nodeXPositions, relationshipXPositions, spouseNodeXPositions } = calculateNodePositions(generations, spouseMap, childrenMap, personGeneration, childrenByParent);

        // Render tree
        return renderFamilyTree(generations, spouseMap, childrenMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
    }, [persons, spouses, parentChilds, searchRootPersonId, searchGenerations]);

    const loadAllData = useCallback(async () => {
        try {
            const [personsData, spousesData, parentChildsData] = await Promise.all([personService.getAllPersons(), spouseService.getAllSpouses(), parentChildService.getAllParentChildRelationships()]);
            setPersons(personsData);
            setSpouses(spousesData);
            setParentChilds(parentChildsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }, []);

    const handleAddSpouseFromPerson = useCallback((person: Person) => {
        setSelectedPerson(person);
        setPersonDetailModalOpen(false);
        setAddSpouseModalOpen(true);
    }, []);

    const handleAddChildFromSpouse = useCallback((spouseId: string) => {
        setSelectedSpouseIdForChild(spouseId);
        setPersonDetailModalOpen(false);
        setAddChildModalOpen(true);
    }, []);

    const handleSpouseModalSuccess = useCallback(() => {
        loadAllData();
        setAddSpouseModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [loadAllData]);

    const handleChildModalSuccess = useCallback(() => {
        loadAllData();
        setAddChildModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [loadAllData]);

    const handlePersonModalSuccess = useCallback(() => {
        loadAllData();
        setAddPersonModalOpen(false);
    }, [loadAllData]);

    const handleSearch = useCallback((personId: string, generations: number) => {
        setSearchRootPersonId(personId);
        setSearchGenerations(generations);
    }, []);

    const handleResetSearch = useCallback(() => {
        setSearchRootPersonId(null);
        setSearchGenerations(null);
    }, []);

    return (
        <div style={{ width: '100vw', height: '100svh', position: 'relative' }}>
            <style>{`
                .react-flow__node[data-id^="gen_"] .react-flow__handle {
                    display: none !important;
                }
            `}</style>

            <SearchBar onSearch={handleSearch} />
            <AddPersonButton onClick={() => setAddPersonModalOpen(true)} />

            {(searchRootPersonId || searchGenerations) && (
                <button
                    onClick={handleResetSearch}
                    className="fixed z-10 w-12 h-12 bg-gray-500 text-red-600 rounded-full shadow-lg hover:bg-gray-600 flex items-center justify-center"
                    title="Xem toàn bộ cây gia phả"
                    style={{ top: '40px', right: '20px' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                </button>
            )}

            <ReactFlow nodeTypes={nodeTypes} nodes={nodes} edges={edges}>
                <MiniMap />
                <Background variant={BackgroundVariant.Lines} gap={12} size={1} />
            </ReactFlow>

            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={() => setPersonDetailModalOpen(false)}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
                onUpdate={loadAllData}
            />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={() => setAddSpouseModalOpen(false)} onSuccess={handleSpouseModalSuccess} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={() => setAddChildModalOpen(false)} onSuccess={handleChildModalSuccess} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSuccess={handlePersonModalSuccess} />
        </div>
    );
}
