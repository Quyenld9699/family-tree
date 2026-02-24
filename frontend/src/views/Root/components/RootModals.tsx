'use client';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import RelationshipDetailModal from 'src/components/RelationshipDetailModal/RelationshipDetailModal';
import GuestCodeModal from 'src/components/GuestCodeModal/GuestCodeModal';

interface RootModalsProps {
    personDetailModalOpen: boolean;
    setPersonDetailModalOpen: (open: boolean) => void;

    addSpouseModalOpen: boolean;
    setAddSpouseModalOpen: (open: boolean) => void;

    addChildModalOpen: boolean;
    setAddChildModalOpen: (open: boolean) => void;

    addPersonModalOpen: boolean;
    setAddPersonModalOpen: (open: boolean) => void;

    relationshipDetailModalOpen: boolean;
    setRelationshipDetailModalOpen: (open: boolean) => void;

    guestCodeModalOpen: boolean;
    setGuestCodeModalOpen: (open: boolean) => void;

    selectedPerson: Person | null;
    selectedSpouse: SpouseWithDetails | null;
    selectedSpouseIdForChild: string | null;

    onAddSpouseFromPerson: (person: Person) => void;
    onAddChildFromSpouse: (spouseId: string) => void;

    onSpouseSuccess: () => void;
    onChildSuccess: () => void;
    onPersonSuccess: () => void;
    onRefetch: () => void;
}

export default function RootModals({
    personDetailModalOpen,
    setPersonDetailModalOpen,
    addSpouseModalOpen,
    setAddSpouseModalOpen,
    addChildModalOpen,
    setAddChildModalOpen,
    addPersonModalOpen,
    setAddPersonModalOpen,
    relationshipDetailModalOpen,
    setRelationshipDetailModalOpen,
    guestCodeModalOpen,
    setGuestCodeModalOpen,
    selectedPerson,
    selectedSpouse,
    selectedSpouseIdForChild,
    onAddSpouseFromPerson,
    onAddChildFromSpouse,
    onSpouseSuccess,
    onChildSuccess,
    onPersonSuccess,
    onRefetch,
}: RootModalsProps) {
    return (
        <>
            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={() => setPersonDetailModalOpen(false)}
                person={selectedPerson}
                onAddSpouse={onAddSpouseFromPerson}
                onAddChild={onAddChildFromSpouse}
                onUpdate={onRefetch}
            />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={() => setAddSpouseModalOpen(false)} onSuccess={onSpouseSuccess} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={() => setAddChildModalOpen(false)} onSuccess={onChildSuccess} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSuccess={onPersonSuccess} />
            <RelationshipDetailModal isOpen={relationshipDetailModalOpen} onClose={() => setRelationshipDetailModalOpen(false)} spouse={selectedSpouse} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={() => setGuestCodeModalOpen(false)} />
        </>
    );
}
