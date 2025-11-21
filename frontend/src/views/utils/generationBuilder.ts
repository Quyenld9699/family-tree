import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/services';
import { sortSpouses, sortChildrenByBirthDate, getChildId } from '../utils/treeHelpers';

/**
 * Build generations array from persons, starting from root
 */
export const buildGenerations = (
    rootPersonId: string,
    personMap: Map<string, Person>,
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    maxGenerations?: number,
): { generations: Person[][]; personGeneration: Map<string, number> } => {
    const generations: Person[][] = [];
    const visited = new Set<string>();
    const personGeneration = new Map<string, number>();

    const buildGen = (personIds: string[], genIndex: number) => {
        if (personIds.length === 0) return;
        if (maxGenerations !== undefined && genIndex >= maxGenerations) return;

        const genPersons: Person[] = [];
        const nextGenIds = new Set<string>();

        personIds.forEach((pid) => {
            if (visited.has(pid)) return;
            visited.add(pid);
            personGeneration.set(pid, genIndex);

            const person = personMap.get(pid);
            if (!person) return;
            genPersons.push(person);

            // Chỉ con cái được thêm vào thế hệ tiếp theo
            const personSpouses = spouseMap.get(pid) || [];
            personSpouses.forEach((spouse) => {
                const children = childrenMap.get(spouse._id!) || [];
                children.forEach((pc) => {
                    const childId = getChildId(pc);
                    if (childId && !visited.has(childId)) nextGenIds.add(childId);
                });
            });
        });

        generations[genIndex] = genPersons;

        if (nextGenIds.size > 0) {
            // Sort nextGen theo birth date trước khi build
            const sortedNextGenIds = Array.from(nextGenIds).sort((a, b) => {
                const personA = personMap.get(a);
                const personB = personMap.get(b);
                if (!personA?.birth || !personB?.birth) return 0;
                return new Date(personA.birth).getTime() - new Date(personB.birth).getTime();
            });
            buildGen(sortedNextGenIds, genIndex + 1);
        }
    };

    const rootPerson = personMap.get(rootPersonId);
    if (rootPerson) {
        buildGen([rootPersonId], 0);
    }

    return { generations, personGeneration };
};

/**
 * Build children map grouped by parent spouse
 */
export const buildChildrenByParentMap = (
    generations: Person[][],
    lastGenIndex: number,
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personMap: Map<string, Person>,
): Map<string, string[]> => {
    const childrenByParent = new Map<string, string[]>();

    if (lastGenIndex > 0) {
        const prevGen = generations[lastGenIndex - 1];

        prevGen.forEach((parent) => {
            const parentSpouses = spouseMap.get(parent._id!) || [];
            const sortedSpouses = sortSpouses(parentSpouses);

            sortedSpouses.forEach((spouse) => {
                const children = childrenMap.get(spouse._id!) || [];
                const sortedChildren = sortChildrenByBirthDate(children, personMap);
                const childIds = sortedChildren.map((pc) => getChildId(pc)).filter((id) => id) as string[];

                if (childIds.length > 0) {
                    childrenByParent.set(spouse._id!, childIds);
                }
            });
        });
    }

    return childrenByParent;
};
