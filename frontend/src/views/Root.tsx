'use client';
import { useState, useEffect, useCallback } from 'react';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import AddPersonButton from 'src/components/AddPersonButton/AddPersonButton';
import SearchBar from 'src/components/SearchBar/SearchBar';
import RelationshipDetailModal from 'src/components/RelationshipDetailModal/RelationshipDetailModal';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { useAuth } from '../context/AuthContext';
import GuestCodeModal from 'src/components/GuestCodeModal/GuestCodeModal';
import UserMenu from 'src/components/UserMenu/UserMenu';
import LoadingOverlay from 'src/components/LoadingOverlay/LoadingOverlay';
import { useFamilyData } from 'src/hooks/useFamilyData';
import FamilyTreeFlow from 'src/components/FamilyTree/FamilyTreeFlow';

export default function Root() {
    const { isAdmin, logout, user } = useAuth();
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [relationshipDetailModalOpen, setRelationshipDetailModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouse, setSelectedSpouse] = useState<SpouseWithDetails | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);
    const [searchRootPersonId, setSearchRootPersonId] = useState<string | null>(null);
    const [searchGenerations, setSearchGenerations] = useState<number | null>(null);

    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

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

    const handleRelationshipNodeClick = useCallback(
        (spouseData: any) => {
            const fullSpouse = spouses.find((s) => s._id === spouseData.id);
            if (fullSpouse) {
                setSelectedSpouse(fullSpouse);
                setRelationshipDetailModalOpen(true);
            }
        },
        [spouses],
    );

    // Sync selectedPerson with persons list when it updates
    useEffect(() => {
        if (selectedPerson) {
            const updatedPerson = persons.find((p) => p._id === selectedPerson._id);
            if (updatedPerson && updatedPerson !== selectedPerson) {
                setSelectedPerson(updatedPerson);
            }
        }
    }, [persons, selectedPerson]);

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

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div className="fixed z-50 flex gap-2" style={{ top: '1rem', right: '1rem' }}>
                {!user ? (
                    <a href="/guest-login" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium h-full flex items-center">
                        Đăng nhập
                    </a>
                ) : (
                    <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={() => setGuestCodeModalOpen(true)} />
                )}
            </div>
            <SearchBar onSearch={handleSearch} />
            {isAdmin && <AddPersonButton onClick={() => setAddPersonModalOpen(true)} />}

            <LoadingOverlay isLoading={isLoading} />

            {(searchRootPersonId || searchGenerations) && (
                <button
                    onClick={handleResetSearch}
                    className="fixed z-10 w-12 h-12 bg-gray-500 text-red-600 rounded-full shadow-lg hover:bg-gray-600 flex items-center justify-center"
                    title="Xem toàn bộ cây gia phả"
                    style={{ top: '80px', right: '20px' }}
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

            <FamilyTreeFlow
                persons={persons}
                spouses={spouses}
                parentChilds={parentChilds}
                searchRootPersonId={searchRootPersonId}
                searchGenerations={searchGenerations}
                onPersonNodeClick={handlePersonNodeClick}
                onRelationshipNodeClick={handleRelationshipNodeClick}
            />

            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={() => setPersonDetailModalOpen(false)}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
                onUpdate={refetchAll}
            />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={() => setAddSpouseModalOpen(false)} onSuccess={handleSpouseModalSuccess} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={() => setAddChildModalOpen(false)} onSuccess={handleChildModalSuccess} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSuccess={handlePersonModalSuccess} />
            <RelationshipDetailModal isOpen={relationshipDetailModalOpen} onClose={() => setRelationshipDetailModalOpen(false)} spouse={selectedSpouse} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={() => setGuestCodeModalOpen(false)} />
        </div>
    );
}
