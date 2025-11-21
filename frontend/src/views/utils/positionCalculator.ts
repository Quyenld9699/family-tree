import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/services';
import { PERSON_WIDTH, HORIZONTAL_GAP } from '../constants/layoutConstants';
import { sortSpouses, getChildId, getSpousePersonId } from '../utils/treeHelpers';

interface PositionMaps {
    nodeXPositions: Map<string, number>;
    relationshipXPositions: Map<string, number>;
    spouseNodeXPositions: Map<string, number>;
}

/**
 * Calculate X positions for all nodes using bottom-up algorithm
 */
export const calculateNodePositions = (
    generations: Person[][],
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personGeneration: Map<string, number>,
    childrenByParent: Map<string, string[]>,
): PositionMaps => {
    const nodeXPositions = new Map<string, number>();
    const relationshipXPositions = new Map<string, number>();
    const spouseNodeXPositions = new Map<string, number>();

    const lastGenIndex = generations.length - 1;

    // BƯỚC 1A: Layout thế hệ cuối (sequential grouped by parent)
    if (lastGenIndex >= 0) {
        layoutLastGeneration(generations[lastGenIndex], lastGenIndex, childrenByParent, spouseMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
    }

    // BƯỚC 1B: Bottom-up calculation for other generations
    for (let genIndex = generations.length - 2; genIndex >= 0; genIndex--) {
        calculateGenerationPositions(generations[genIndex], spouseMap, childrenMap, nodeXPositions, relationshipXPositions, spouseNodeXPositions, personGeneration);
    }

    return { nodeXPositions, relationshipXPositions, spouseNodeXPositions };
};

/**
 * Layout last generation (grouped by parent)
 */
function layoutLastGeneration(
    lastGen: Person[],
    lastGenIndex: number,
    childrenByParent: Map<string, string[]>,
    spouseMap: Map<string, SpouseWithDetails[]>,
    personGeneration: Map<string, number>,
    nodeXPositions: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>,
): void {
    let currentX = 100;
    const processedChildren = new Set<string>();

    // Layout children theo groups từ prevGen
    if (lastGenIndex > 0) {
        childrenByParent.forEach((childIds) => {
            childIds.forEach((childId) => {
                if (processedChildren.has(childId)) return;
                processedChildren.add(childId);

                currentX = layoutPersonWithSpouses(childId, currentX, spouseMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
            });

            currentX += HORIZONTAL_GAP; // Gap between family groups
        });
    }

    // Process remaining children
    lastGen.forEach((person) => {
        const personId = person._id!;
        if (processedChildren.has(personId)) return;
        processedChildren.add(personId);

        currentX = layoutPersonWithSpouses(personId, currentX, spouseMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
    });
}

/**
 * Layout a person with their spouses
 */
function layoutPersonWithSpouses(
    personId: string,
    currentX: number,
    spouseMap: Map<string, SpouseWithDetails[]>,
    personGeneration: Map<string, number>,
    nodeXPositions: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>,
): number {
    const personSpouses = spouseMap.get(personId) || [];
    const numSpouses = personSpouses.length;

    if (numSpouses > 0) {
        const totalWidth = numSpouses * PERSON_WIDTH + (numSpouses - 1) * HORIZONTAL_GAP;
        const personX = currentX + totalWidth / 2 - PERSON_WIDTH / 2;
        nodeXPositions.set(personId, personX);

        personSpouses.forEach((spouse, idx) => {
            const spouseX = currentX + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
            relationshipXPositions.set(spouse._id!, spouseX);

            const spousePersonId = getSpousePersonId(spouse, personId);
            const spouseGen = personGeneration.get(spousePersonId!);

            if (spouseGen === undefined) {
                const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${personId}_${idx}`;
                spouseNodeXPositions.set(uniqueSpouseNodeId, spouseX);
            }
        });

        return currentX + totalWidth + HORIZONTAL_GAP;
    } else {
        nodeXPositions.set(personId, currentX);
        return currentX + PERSON_WIDTH + HORIZONTAL_GAP;
    }
}

/**
 * Calculate positions for a generation based on children
 */
function calculateGenerationPositions(
    genPersons: Person[],
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    nodeXPositions: Map<string, number>,
    relationshipXPositions: Map<string, number>,
    spouseNodeXPositions: Map<string, number>,
    personGeneration: Map<string, number>,
): void {
    // First pass: Calculate X for persons with children
    genPersons.forEach((person) => {
        const personId = person._id!;
        const personSpouses = spouseMap.get(personId) || [];

        if (personSpouses.length === 0) return;

        const sortedSpouses = sortSpouses(personSpouses);
        const spouseXArray: number[] = [];

        sortedSpouses.forEach((spouse, idx) => {
            const spouseId = spouse._id!;
            const children = childrenMap.get(spouseId) || [];

            if (children.length > 0) {
                const childPositions = children
                    .map((pc) => {
                        const childId = getChildId(pc);
                        return childId ? nodeXPositions.get(childId) : undefined;
                    })
                    .filter((x) => x !== undefined) as number[];

                if (childPositions.length > 0) {
                    const minChildX = Math.min(...childPositions);
                    const maxChildX = Math.max(...childPositions);
                    const spouseX = (minChildX + maxChildX) / 2;
                    spouseXArray.push(spouseX);
                    relationshipXPositions.set(spouseId, spouseX);

                    const spousePersonId = getSpousePersonId(spouse, personId);
                    const spouseGen = personGeneration.get(spousePersonId!);

                    if (spouseGen === undefined) {
                        const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${personId}_${idx}`;
                        spouseNodeXPositions.set(uniqueSpouseNodeId, spouseX);
                    }
                } else {
                    const fallbackX = 100 + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
                    spouseXArray.push(fallbackX);
                    relationshipXPositions.set(spouseId, fallbackX);
                }
            } else {
                const fallbackX = 100 + idx * (PERSON_WIDTH + HORIZONTAL_GAP);
                spouseXArray.push(fallbackX);
                relationshipXPositions.set(spouseId, fallbackX);
            }
        });

        if (spouseXArray.length > 0) {
            const minSpouseX = Math.min(...spouseXArray);
            const maxSpouseX = Math.max(...spouseXArray);
            const personX = (minSpouseX + maxSpouseX) / 2;
            nodeXPositions.set(personId, personX);
        }
    });

    // Second pass: Layout persons without children sequentially
    let currentX = 100;
    genPersons.forEach((person) => {
        const personId = person._id!;

        if (nodeXPositions.has(personId)) {
            const existingX = nodeXPositions.get(personId)!;
            currentX = Math.max(currentX, existingX + PERSON_WIDTH + HORIZONTAL_GAP);
        } else {
            nodeXPositions.set(personId, currentX);
            currentX += PERSON_WIDTH + HORIZONTAL_GAP;
        }
    });
}
