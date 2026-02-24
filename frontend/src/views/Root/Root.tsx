'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { useAuth } from 'src/context/AuthContext';
import { useFamilyData } from 'src/hooks/useFamilyData';
import FamilyTreeFlow from 'src/components/FamilyTree/FamilyTreeFlow';
import TopBar from './components/TopBar';
import FloatingControls from './components/FloatingControls';
import RootModals from './components/RootModals';

export default function Root() {
    const { isAdmin, isEditor, logout, user } = useAuth();

    // Modal state
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [relationshipDetailModalOpen, setRelationshipDetailModalOpen] = useState(false);

    // Selection state
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouse, setSelectedSpouse] = useState<SpouseWithDetails | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);

    // Search state
    const [searchRootPersonId, setSearchRootPersonId] = useState<string | null>(null);
    const [searchGenerations, setSearchGenerations] = useState<number | null>(null);

    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // Data indexing
    const personById = useMemo(() => {
        const map = new Map<string, Person>();
        persons.forEach((p) => {
            if (p._id) map.set(p._id, p);
        });
        return map;
    }, [persons]);

    const spouseById = useMemo(() => {
        const map = new Map<string, SpouseWithDetails>();
        spouses.forEach((s) => {
            if (s._id) map.set(s._id, s);
        });
        return map;
    }, [spouses]);

    // Tree node handlers
    const handlePersonNodeClick = useCallback(
        (personData: any) => {
            const fullPerson = personById.get(personData.id);
            if (fullPerson) {
                setSelectedPerson(fullPerson);
                setPersonDetailModalOpen(true);
            }
        },
        [personById],
    );

    const handleRelationshipNodeClick = useCallback(
        (spouseData: any) => {
            const fullSpouse = spouseById.get(spouseData.id);
            if (fullSpouse) {
                setSelectedSpouse(fullSpouse);
                setRelationshipDetailModalOpen(true);
            }
        },
        [spouseById],
    );

    // Sync selected items with fresh data
    useEffect(() => {
        if (selectedPerson?._id) {
            const updatedPerson = personById.get(selectedPerson._id);
            if (updatedPerson && updatedPerson !== selectedPerson) {
                setSelectedPerson(updatedPerson);
            }
        }
    }, [personById, selectedPerson]);

    useEffect(() => {
        if (selectedSpouse?._id) {
            const updatedSpouse = spouseById.get(selectedSpouse._id);
            if (updatedSpouse && updatedSpouse !== selectedSpouse) {
                setSelectedSpouse(updatedSpouse);
            }
        }
    }, [selectedSpouse, spouseById]);

    // Action handlers
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
        refetchAll();
        setAddSpouseModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [refetchAll]);

    const handleChildModalSuccess = useCallback(() => {
        refetchAll();
        setAddChildModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [refetchAll]);

    const handlePersonModalSuccess = useCallback(() => {
        refetchAll();
        setAddPersonModalOpen(false);
    }, [refetchAll]);

    const handleSearch = useCallback((personId: string, generations: number) => {
        setSearchRootPersonId(personId);
        setSearchGenerations(generations);
    }, []);

    const handleResetSearch = useCallback(() => {
        setSearchRootPersonId(null);
        setSearchGenerations(null);
    }, []);

    const isSearchActive = searchRootPersonId !== null || searchGenerations !== null;
    const handleOpenGuestCodeModal = useCallback(() => setGuestCodeModalOpen(true), []);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <TopBar user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={handleOpenGuestCodeModal} />

            <FloatingControls
                isAdmin={isAdmin}
                isEditor={isEditor}
                isLoading={isLoading}
                onSearch={handleSearch}
                onAddPerson={() => setAddPersonModalOpen(true)}
                isSearchActive={isSearchActive}
                onResetSearch={handleResetSearch}
            />

            <FamilyTreeFlow
                persons={persons}
                spouses={spouses}
                parentChilds={parentChilds}
                searchRootPersonId={searchRootPersonId}
                searchGenerations={searchGenerations}
                onPersonNodeClick={handlePersonNodeClick}
                onRelationshipNodeClick={handleRelationshipNodeClick}
            />

            <RootModals
                personDetailModalOpen={personDetailModalOpen}
                setPersonDetailModalOpen={setPersonDetailModalOpen}
                addSpouseModalOpen={addSpouseModalOpen}
                setAddSpouseModalOpen={setAddSpouseModalOpen}
                addChildModalOpen={addChildModalOpen}
                setAddChildModalOpen={setAddChildModalOpen}
                addPersonModalOpen={addPersonModalOpen}
                setAddPersonModalOpen={setAddPersonModalOpen}
                relationshipDetailModalOpen={relationshipDetailModalOpen}
                setRelationshipDetailModalOpen={setRelationshipDetailModalOpen}
                guestCodeModalOpen={guestCodeModalOpen}
                setGuestCodeModalOpen={setGuestCodeModalOpen}
                selectedPerson={selectedPerson}
                selectedSpouse={selectedSpouse}
                selectedSpouseIdForChild={selectedSpouseIdForChild}
                onAddSpouseFromPerson={handleAddSpouseFromPerson}
                onAddChildFromSpouse={handleAddChildFromSpouse}
                onSpouseSuccess={handleSpouseModalSuccess}
                onChildSuccess={handleChildModalSuccess}
                onPersonSuccess={handlePersonModalSuccess}
                onRefetch={refetchAll}
            />
        </div>
    );
}
