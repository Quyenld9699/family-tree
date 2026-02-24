import { Person } from 'src/services/personService';

export type PageSize = 15 | 30 | 50;
export const PAGE_SIZE_OPTIONS: PageSize[] = [15, 30, 50];

export type FilterMode = 'all' | 'isolated';
export type SortField = 'name' | 'birth' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface PersonListState {
    search: string;
    pageSize: PageSize;
    currentPage: number;
    filterMode: FilterMode;
    sortField: SortField;
    sortDirection: SortDirection;
}

export const extractId = (val: Person | string | undefined): string | undefined => {
    if (!val) return undefined;
    return typeof val === 'string' ? val : val._id;
};
