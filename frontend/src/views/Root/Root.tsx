'use client';
import { useState, useCallback, useMemo } from 'react';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { useAuth } from 'src/context/AuthContext';
import { useFamilyData } from 'src/hooks/useFamilyData';
import FamilyTreeFlow from 'src/components/FamilyTree/FamilyTreeFlow';
import TopBar from './components/TopBar';
import FloatingControls from './components/FloatingControls';
import RootModals from './components/RootModals';
import { useRootModals } from './hooks/useRootModals';

export default function Root() {
    const { isAdmin, isEditor, logout, user } = useAuth();
    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // Search state
    const [searchRootPersonId, setSearchRootPersonId] = useState<string | null>(null);
    const [searchGenerations, setSearchGenerations] = useState<number | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);

    // Index maps for O(1) lookups
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

    // All modal + selection state in one reducer
    const modals = useRootModals(personById, spouseById, refetchAll);

    // Tree click handlers — stable because personById/spouseById refs change only on data refresh
    const handlePersonNodeClick = useCallback(
        (personData: any) => {
            const person = personById.get(personData.id);
            if (person) modals.openPersonDetail(person);
        },
        [personById, modals.openPersonDetail],
    );

    const handleRelationshipNodeClick = useCallback(
        (spouseData: any) => {
            const spouse = spouseById.get(spouseData.id);
            if (spouse) modals.openRelationshipDetail(spouse);
        },
        [spouseById, modals.openRelationshipDetail],
    );

    // Search handlers
    const handleSearch = useCallback((personId: string, generations: number) => {
        setSearchRootPersonId(personId);
        setSearchGenerations(generations);
        setSearchOpen(false);
    }, []);

    const handleResetSearch = useCallback(() => {
        setSearchRootPersonId(null);
        setSearchGenerations(null);
    }, []);

    const isSearchActive = searchRootPersonId !== null || searchGenerations !== null;

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <TopBar
                user={user}
                isAdmin={isAdmin}
                onLogout={logout}
                onOpenGuestCodeModal={modals.openGuestCode}
                onOpenSearch={() => setSearchOpen(true)}
                isSearchActive={isSearchActive}
                persons={persons}
            />

            <FloatingControls
                isAdmin={isAdmin}
                isEditor={isEditor}
                isLoading={isLoading}
                onSearch={handleSearch}
                onAddPerson={modals.openAddPerson}
                isSearchActive={isSearchActive}
                onResetSearch={handleResetSearch}
                searchOpen={searchOpen}
                onCloseSearch={() => setSearchOpen(false)}
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
                personDetailModalOpen={modals.state.personDetailOpen}
                setPersonDetailModalOpen={(open) => (open ? undefined : modals.closePersonDetail())}
                addSpouseModalOpen={modals.state.addSpouseOpen}
                setAddSpouseModalOpen={(open) => (open ? undefined : modals.closeAddSpouse())}
                addChildModalOpen={modals.state.addChildOpen}
                setAddChildModalOpen={(open) => (open ? undefined : modals.closeAddChild())}
                addPersonModalOpen={modals.state.addPersonOpen}
                setAddPersonModalOpen={(open) => (open ? undefined : modals.closeAddPerson())}
                relationshipDetailModalOpen={modals.state.relationshipDetailOpen}
                setRelationshipDetailModalOpen={(open) => (open ? undefined : modals.closeRelationshipDetail())}
                guestCodeModalOpen={modals.state.guestCodeOpen}
                setGuestCodeModalOpen={(open) => (open ? undefined : modals.closeGuestCode())}
                selectedPerson={modals.state.selectedPerson}
                selectedSpouse={modals.state.selectedSpouse}
                selectedSpouseIdForChild={modals.state.selectedSpouseIdForChild}
                onAddSpouseFromPerson={modals.openAddSpouse}
                onAddChildFromSpouse={modals.openAddChild}
                onSpouseSuccess={modals.onSpouseSuccess}
                onChildSuccess={modals.onChildSuccess}
                onPersonSuccess={modals.onPersonSuccess}
                onRefetch={refetchAll}
            />
        </div>
    );
}
