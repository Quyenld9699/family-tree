'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Person } from 'src/services/personService';
import { useAuth } from 'src/context/AuthContext';
import { useFamilyData } from 'src/hooks/useFamilyData';
import LoadingOverlay from 'src/components/LoadingOverlay/LoadingOverlay';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import GuestCodeModal from 'src/components/GuestCodeModal/GuestCodeModal';

import { toast } from 'react-toastify';
import eventService from 'src/services/eventService';

import Header from './components/Header';
import Toolbar from './components/Toolbar';
import PersonList from './components/PersonList';
import Pagination from './components/Pagination';
import { FilterMode, PageSize, SortDirection, SortField } from './types';
import { buildConnectedIds } from './utils';

export default function PersonsView() {
    const router = useRouter();
    const { isAdmin, isEditor, logout, user, loading: authLoading } = useAuth();

    // Redirect non-logged-in users
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // Modal state
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);

    // List state
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Relationship index
    const connectedIds = useMemo(() => buildConnectedIds(spouses, parentChilds), [spouses, parentChilds]);

    const personById = useMemo(() => {
        const map = new Map<string, Person>();
        persons.forEach((p) => {
            if (p._id) map.set(p._id, p);
        });
        return map;
    }, [persons]);

    // Sync selected person after refetch
    useEffect(() => {
        if (selectedPerson?._id) {
            const updated = personById.get(selectedPerson._id);
            if (updated && updated !== selectedPerson) setSelectedPerson(updated);
        }
    }, [personById, selectedPerson]);

    // Filtered list
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = persons.filter((p) => {
            if (q && !p.name.toLowerCase().includes(q)) return false;
            // Also search by CCCD
            if (q && p.cccd && p.cccd.toLowerCase().includes(q)) return true;
            if (q && !p.cccd && !p.name.toLowerCase().includes(q)) return false;

            if (filterMode === 'isolated' && p._id && connectedIds.has(p._id)) return false;
            return true;
        });

        return result.sort((a, b) => {
            let res = 0;
            switch (sortField) {
                case 'name': {
                    const getName = (name: string) => {
                        const parts = name.trim().split(/\s+/);
                        // Lấy tên cuối cùng, nếu không có thì lấy chuỗi trống
                        return parts.length > 0 ? parts[parts.length - 1] : '';
                    };
                    const nameA = getName(a.name);
                    const nameB = getName(b.name);
                    // Dùng localeCompare để sort tiếng Việt chuẩn
                    res = nameA.localeCompare(nameB, 'vi');
                    // Nếu tên giống nhau thì so sánh full name
                    if (res === 0) res = a.name.localeCompare(b.name, 'vi');
                    break;
                }
                case 'birth': {
                    // Lấy năm sinh, ưu tiên người có năm sinh rõ ràng lên trước/sau
                    // Note: logic slightly different from inline to ensure empty dates are handled consistently
                    const getYear = (d?: Date) => (d ? new Date(d).getFullYear() : sortDirection === 'asc' ? 9999 : -9999);
                    const yearA = getYear(a.birth);
                    const yearB = getYear(b.birth);
                    res = yearA - yearB;
                    break;
                }
                case 'status': {
                    // Còn sống (false) lên trước, đã mất (true) xuống sau hoặc ngược lại
                    const deadA = a.isDead ? 1 : 0;
                    const deadB = b.isDead ? 1 : 0;
                    res = deadA - deadB;
                    break;
                }
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [persons, search, filterMode, connectedIds, sortField, sortDirection]);

    const isolatedCount = useMemo(() => persons.filter((p) => p._id && !connectedIds.has(p._id)).length, [persons, connectedIds]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // Handlers
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value) as PageSize);
        setCurrentPage(1);
    }, []);

    const handleFilterMode = useCallback((mode: FilterMode) => {
        setFilterMode(mode);
        setCurrentPage(1);
    }, []);

    const handleSort = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortField(field);
                setSortDirection('asc');
            }
        },
        [sortField, sortDirection],
    );

    const handlePersonClick = useCallback((person: Person) => {
        setSelectedPerson(person);
        setPersonDetailModalOpen(true);
    }, []);

    const handlePushEvent = useCallback(async (person: Person) => {
        if (!person._id) return;
        try {
            await eventService.syncPerson(person._id);
            toast.success(`Đã cập nhật sự kiện cho ${person.name}`);
        } catch (e: any) {
            toast.error('Lỗi: ' + (e?.response?.data?.message || e.message));
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

    const handleOpenGuestCodeModal = useCallback(() => setGuestCodeModalOpen(true), []);
    const handleCloseGuestCodeModal = useCallback(() => setGuestCodeModalOpen(false), []);
    const handleClosePersonDetailModal = useCallback(() => setPersonDetailModalOpen(false), []);
    const handleCloseAddSpouseModal = useCallback(() => setAddSpouseModalOpen(false), []);
    const handleCloseAddChildModal = useCallback(() => setAddChildModalOpen(false), []);
    const handleCloseAddPersonModal = useCallback(() => setAddPersonModalOpen(false), []);

    if (authLoading || !user) return null;

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50">
            <Header isolatedCount={isolatedCount} filterMode={filterMode} onFilterModeChange={handleFilterMode} onOpenGuestCodeModal={handleOpenGuestCodeModal} />

            <Toolbar search={search} onSearchChange={handleSearch} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} onAddPerson={() => setAddPersonModalOpen(true)} />

            <LoadingOverlay isLoading={isLoading} />

            <div className="flex-1 overflow-auto bg-gray-50 p-4">
                <div className="max-w-[900px] mx-auto bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                    <PersonList
                        paginated={paginated}
                        connectedIds={connectedIds}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        onPersonClick={handlePersonClick}
                        canEdit={isAdmin || isEditor}
                        onPushEvent={handlePushEvent}
                    />
                </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} />

            {/* Modals */}
            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={handleClosePersonDetailModal}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
                onUpdate={refetchAll}
            />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={handleCloseAddSpouseModal} onSuccess={handleSpouseModalSuccess} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={handleCloseAddChildModal} onSuccess={handleChildModalSuccess} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={handleCloseAddPersonModal} onSuccess={handlePersonModalSuccess} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={handleCloseGuestCodeModal} />
        </div>
    );
}
