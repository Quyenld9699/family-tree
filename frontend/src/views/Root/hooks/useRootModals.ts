'use client';
import { useReducer, useCallback, useEffect } from 'react';
import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';

// ── State ──────────────────────────────────────────────────────────────────

interface ModalState {
    personDetailOpen: boolean;
    addSpouseOpen: boolean;
    addChildOpen: boolean;
    addPersonOpen: boolean;
    guestCodeOpen: boolean;
    relationshipDetailOpen: boolean;
    selectedPerson: Person | null;
    selectedSpouse: SpouseWithDetails | null;
    selectedSpouseIdForChild: string | null;
}

const initialState: ModalState = {
    personDetailOpen: false,
    addSpouseOpen: false,
    addChildOpen: false,
    addPersonOpen: false,
    guestCodeOpen: false,
    relationshipDetailOpen: false,
    selectedPerson: null,
    selectedSpouse: null,
    selectedSpouseIdForChild: null,
};

// ── Actions ────────────────────────────────────────────────────────────────

type Action =
    | { type: 'OPEN_PERSON_DETAIL'; person: Person }
    | { type: 'CLOSE_PERSON_DETAIL' }
    | { type: 'OPEN_ADD_SPOUSE'; person: Person }
    | { type: 'CLOSE_ADD_SPOUSE' }
    | { type: 'OPEN_ADD_CHILD'; spouseId: string }
    | { type: 'CLOSE_ADD_CHILD' }
    | { type: 'OPEN_ADD_PERSON' }
    | { type: 'CLOSE_ADD_PERSON' }
    | { type: 'OPEN_GUEST_CODE' }
    | { type: 'CLOSE_GUEST_CODE' }
    | { type: 'OPEN_RELATIONSHIP_DETAIL'; spouse: SpouseWithDetails }
    | { type: 'CLOSE_RELATIONSHIP_DETAIL' }
    | { type: 'SYNC_PERSON'; person: Person }
    | { type: 'SYNC_SPOUSE'; spouse: SpouseWithDetails };

// ── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: ModalState, action: Action): ModalState {
    switch (action.type) {
        case 'OPEN_PERSON_DETAIL':
            return { ...state, personDetailOpen: true, selectedPerson: action.person };
        case 'CLOSE_PERSON_DETAIL':
            return { ...state, personDetailOpen: false };

        case 'OPEN_ADD_SPOUSE':
            return { ...state, addSpouseOpen: true, personDetailOpen: false, selectedPerson: action.person };
        case 'CLOSE_ADD_SPOUSE':
            return { ...state, addSpouseOpen: false };

        case 'OPEN_ADD_CHILD':
            return { ...state, addChildOpen: true, personDetailOpen: false, selectedSpouseIdForChild: action.spouseId };
        case 'CLOSE_ADD_CHILD':
            return { ...state, addChildOpen: false };

        case 'OPEN_ADD_PERSON':
            return { ...state, addPersonOpen: true };
        case 'CLOSE_ADD_PERSON':
            return { ...state, addPersonOpen: false };

        case 'OPEN_GUEST_CODE':
            return { ...state, guestCodeOpen: true };
        case 'CLOSE_GUEST_CODE':
            return { ...state, guestCodeOpen: false };

        case 'OPEN_RELATIONSHIP_DETAIL':
            return { ...state, relationshipDetailOpen: true, selectedSpouse: action.spouse };
        case 'CLOSE_RELATIONSHIP_DETAIL':
            return { ...state, relationshipDetailOpen: false };

        // Sync fresh data without changing open/close state
        case 'SYNC_PERSON':
            return { ...state, selectedPerson: action.person };
        case 'SYNC_SPOUSE':
            return { ...state, selectedSpouse: action.spouse };

        default:
            return state;
    }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useRootModals(personById: Map<string, Person>, spouseById: Map<string, SpouseWithDetails>, refetchAll: () => Promise<void>) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Sync selected person/spouse with fresh data after refetch
    useEffect(() => {
        if (state.selectedPerson?._id) {
            const fresh = personById.get(state.selectedPerson._id);
            if (fresh && fresh !== state.selectedPerson) {
                dispatch({ type: 'SYNC_PERSON', person: fresh });
            }
        }
    }, [personById]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (state.selectedSpouse?._id) {
            const fresh = spouseById.get(state.selectedSpouse._id);
            if (fresh && fresh !== state.selectedSpouse) {
                dispatch({ type: 'SYNC_SPOUSE', spouse: fresh });
            }
        }
    }, [spouseById]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Stable handlers ────────────────────────────────────────────────────

    const openPersonDetail = useCallback((person: Person) => {
        dispatch({ type: 'OPEN_PERSON_DETAIL', person });
    }, []);

    const closePersonDetail = useCallback(() => dispatch({ type: 'CLOSE_PERSON_DETAIL' }), []);

    const openAddSpouse = useCallback((person: Person) => {
        dispatch({ type: 'OPEN_ADD_SPOUSE', person });
    }, []);

    const closeAddSpouse = useCallback(() => dispatch({ type: 'CLOSE_ADD_SPOUSE' }), []);

    const openAddChild = useCallback((spouseId: string) => {
        dispatch({ type: 'OPEN_ADD_CHILD', spouseId });
    }, []);

    const closeAddChild = useCallback(() => dispatch({ type: 'CLOSE_ADD_CHILD' }), []);

    const openAddPerson = useCallback(() => dispatch({ type: 'OPEN_ADD_PERSON' }), []);
    const closeAddPerson = useCallback(() => dispatch({ type: 'CLOSE_ADD_PERSON' }), []);

    const openGuestCode = useCallback(() => dispatch({ type: 'OPEN_GUEST_CODE' }), []);
    const closeGuestCode = useCallback(() => dispatch({ type: 'CLOSE_GUEST_CODE' }), []);

    const openRelationshipDetail = useCallback((spouse: SpouseWithDetails) => {
        dispatch({ type: 'OPEN_RELATIONSHIP_DETAIL', spouse });
    }, []);

    const closeRelationshipDetail = useCallback(() => dispatch({ type: 'CLOSE_RELATIONSHIP_DETAIL' }), []);

    // ── Compound success handlers ──────────────────────────────────────────

    const onSpouseSuccess = useCallback(() => {
        refetchAll();
        dispatch({ type: 'CLOSE_ADD_SPOUSE' });
        dispatch({ type: 'OPEN_PERSON_DETAIL', person: state.selectedPerson! });
    }, [refetchAll, state.selectedPerson]);

    const onChildSuccess = useCallback(() => {
        refetchAll();
        dispatch({ type: 'CLOSE_ADD_CHILD' });
        dispatch({ type: 'OPEN_PERSON_DETAIL', person: state.selectedPerson! });
    }, [refetchAll, state.selectedPerson]);

    const onPersonSuccess = useCallback(() => {
        refetchAll();
        dispatch({ type: 'CLOSE_ADD_PERSON' });
    }, [refetchAll]);

    return {
        state,
        openPersonDetail,
        closePersonDetail,
        openAddSpouse,
        closeAddSpouse,
        openAddChild,
        closeAddChild,
        openAddPerson,
        closeAddPerson,
        openGuestCode,
        closeGuestCode,
        openRelationshipDetail,
        closeRelationshipDetail,
        onSpouseSuccess,
        onChildSuccess,
        onPersonSuccess,
    };
}
