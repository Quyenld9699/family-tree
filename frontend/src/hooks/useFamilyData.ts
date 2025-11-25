import { useQuery } from '@tanstack/react-query';
import personService from 'src/services/personService';
import spouseService from 'src/services/spouseService';
import parentChildService from 'src/services/parentChildService';

export const useFamilyData = () => {
    const {
        data: persons = [],
        isLoading: isLoadingPersons,
        refetch: refetchPersons,
    } = useQuery({
        queryKey: ['persons'],
        queryFn: personService.getAllPersons,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const {
        data: spouses = [],
        isLoading: isLoadingSpouses,
        refetch: refetchSpouses,
    } = useQuery({
        queryKey: ['spouses'],
        queryFn: spouseService.getAllSpouses,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: parentChilds = [],
        isLoading: isLoadingParentChilds,
        refetch: refetchParentChilds,
    } = useQuery({
        queryKey: ['parentChilds'],
        queryFn: parentChildService.getAllParentChildRelationships,
        staleTime: 5 * 60 * 1000,
    });

    const isLoading = isLoadingPersons || isLoadingSpouses || isLoadingParentChilds;

    const refetchAll = async () => {
        await Promise.all([refetchPersons(), refetchSpouses(), refetchParentChilds()]);
    };

    return {
        persons,
        spouses,
        parentChilds,
        isLoading,
        refetchAll,
    };
};
