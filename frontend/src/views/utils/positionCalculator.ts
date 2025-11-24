import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/services';
import { PERSON_WIDTH, HORIZONTAL_GAP } from '../constants/layoutConstants';
import { sortSpouses, getChildId, getSpousePersonId, sortChildrenByBirthDate } from '../utils/treeHelpers';

interface PositionMaps {
    nodeXPositions: Map<string, number>;
    relationshipXPositions: Map<string, number>;
    spouseNodeXPositions: Map<string, number>;
}

interface LayoutNode {
    personId: string;
    width: number;
    center: number;
    spouseGroupOffset: number;
    spouses: LayoutSpouse[];
}

interface LayoutSpouse {
    spouse: SpouseWithDetails;
    width: number;
    relCenter: number;
    childrenOffset: number;
    children: LayoutNode[];
}

/**
 * Calculate X positions for all nodes using recursive block layout algorithm
 * Ensures proper centering of parents over children and spouses
 */
export const calculateNodePositions = (
    generations: Person[][],
    spouseMap: Map<string, SpouseWithDetails[]>,
    childrenMap: Map<string, ParentChildWithDetails[]>,
    personGeneration: Map<string, number>,
    childrenByParent: Map<string, string[]>,
    personMap: Map<string, Person>,
): PositionMaps => {
    const nodeXPositions = new Map<string, number>();
    const relationshipXPositions = new Map<string, number>();
    const spouseNodeXPositions = new Map<string, number>();
    const visited = new Set<string>();

    // Recursive function to calculate subtree layout dimensions
    const calculateLayout = (personId: string): LayoutNode => {
        // Prevent infinite recursion in case of cycles
        if (visited.has(personId)) {
            return {
                personId,
                width: PERSON_WIDTH,
                center: PERSON_WIDTH / 2,
                spouseGroupOffset: 0,
                spouses: [],
            };
        }
        visited.add(personId);

        const personSpouses = spouseMap.get(personId) || [];
        const sortedSpouses = sortSpouses(personSpouses);

        // Base case: No spouses
        if (sortedSpouses.length === 0) {
            return {
                personId,
                width: PERSON_WIDTH,
                center: PERSON_WIDTH / 2,
                spouseGroupOffset: 0,
                spouses: [],
            };
        }

        const spouseLayouts: LayoutSpouse[] = [];

        sortedSpouses.forEach((spouse) => {
            const children = childrenMap.get(spouse._id!) || [];
            const sortedChildren = sortChildrenByBirthDate(children, personMap);
            const childLayouts: LayoutNode[] = [];

            // Recursively layout children
            sortedChildren.forEach((pc) => {
                const childId = getChildId(pc);
                if (childId) {
                    childLayouts.push(calculateLayout(childId));
                }
            });

            // Calculate dimensions for this spouse/relationship block
            let childrenTotalWidth = 0;
            let childrenCenter = 0;
            let childrenOffset = 0;

            if (childLayouts.length > 0) {
                // Calculate total width of children group
                childrenTotalWidth = childLayouts.reduce((sum, child) => sum + child.width, 0) + (childLayouts.length - 1) * HORIZONTAL_GAP;

                // Calculate center of children group (midpoint of first and last child centers)
                let currentX = 0;
                const firstChildCenter = currentX + childLayouts[0].center;

                // Calculate last child center
                let lastChildX = 0;
                for (let i = 0; i < childLayouts.length - 1; i++) {
                    lastChildX += childLayouts[i].width + HORIZONTAL_GAP;
                }
                const lastChildCenter = lastChildX + childLayouts[childLayouts.length - 1].center;

                childrenCenter = (firstChildCenter + lastChildCenter) / 2;
            }

            // Determine Relationship Center (X_rel) and Block Width
            let relCenter = 0;
            let blockWidth = 0;

            if (childLayouts.length > 0) {
                relCenter = childrenCenter;

                // Ensure space for Spouse Node (width PERSON_WIDTH) centered at relCenter
                const spouseNodeHalfWidth = PERSON_WIDTH / 2;
                const minX = Math.min(0, relCenter - spouseNodeHalfWidth);
                const maxX = Math.max(childrenTotalWidth, relCenter + spouseNodeHalfWidth);

                blockWidth = maxX - minX;

                // Adjust relCenter and childrenOffset relative to the new block left edge (minX)
                relCenter -= minX;
                childrenOffset = -minX;
            } else {
                blockWidth = PERSON_WIDTH;
                relCenter = PERSON_WIDTH / 2;
                childrenOffset = 0;
            }

            spouseLayouts.push({
                spouse,
                width: blockWidth,
                relCenter,
                childrenOffset,
                children: childLayouts,
            });
        });

        // Combine spouse blocks
        let totalSpousesWidth = 0;
        if (spouseLayouts.length > 0) {
            totalSpousesWidth = spouseLayouts.reduce((sum, s) => sum + s.width, 0) + (spouseLayouts.length - 1) * HORIZONTAL_GAP;
        }

        // Calculate Main Person Center
        // Center over all relationship nodes
        let currentSpouseX = 0;
        const relCenters: number[] = [];
        spouseLayouts.forEach((s) => {
            relCenters.push(currentSpouseX + s.relCenter);
            currentSpouseX += s.width + HORIZONTAL_GAP;
        });

        const mainPersonCenter = (relCenters[0] + relCenters[relCenters.length - 1]) / 2;

        // Calculate Total Block Width
        // Must contain all spouse blocks (0 to totalSpousesWidth)
        // Must contain Main Person (centered at mainPersonCenter)
        const mainPersonHalfWidth = PERSON_WIDTH / 2;
        const minX = Math.min(0, mainPersonCenter - mainPersonHalfWidth);
        const maxX = Math.max(totalSpousesWidth, mainPersonCenter + mainPersonHalfWidth);
        const totalWidth = maxX - minX;

        // Adjust center and spouseGroupOffset relative to new block
        const finalCenter = mainPersonCenter - minX;
        const spouseGroupOffset = -minX;

        return {
            personId,
            width: totalWidth,
            center: finalCenter,
            spouseGroupOffset,
            spouses: spouseLayouts,
        };
    };

    // Apply layout to maps
    const applyLayout = (layout: LayoutNode, startX: number) => {
        // Set Main Person Position
        const personX = startX + layout.center;
        nodeXPositions.set(layout.personId, personX);

        let currentSpouseX = startX + layout.spouseGroupOffset;

        layout.spouses.forEach((spouseLayout, idx) => {
            // Relationship Node
            const relX = currentSpouseX + spouseLayout.relCenter;
            relationshipXPositions.set(spouseLayout.spouse._id!, relX);

            // Spouse Node (if needed)
            const spousePersonId = getSpousePersonId(spouseLayout.spouse, layout.personId);
            const spouseGen = personGeneration.get(spousePersonId!);

            if (spouseGen === undefined) {
                const uniqueSpouseNodeId = `spouse_${spousePersonId}_of_${layout.personId}_${idx}`;
                spouseNodeXPositions.set(uniqueSpouseNodeId, relX); // Align spouse node with relationship node
            }

            // Children
            let currentChildX = currentSpouseX + spouseLayout.childrenOffset;
            spouseLayout.children.forEach((childLayout) => {
                applyLayout(childLayout, currentChildX);
                currentChildX += childLayout.width + HORIZONTAL_GAP;
            });

            currentSpouseX += spouseLayout.width + HORIZONTAL_GAP;
        });
    };

    // Start layout from roots (Generation 0)
    if (generations.length > 0) {
        let currentRootX = 100; // Initial padding
        generations[0].forEach((rootPerson) => {
            // Only process if not already visited (though gen 0 should be distinct roots usually)
            if (!nodeXPositions.has(rootPerson._id!)) {
                // Reset visited for calculation to allow this root to traverse its tree
                // But we need to be careful not to re-traverse nodes if they are shared (unlikely in tree)
                // Actually, we should clear visited or use a new set?
                // If the graph is a forest, we want to process each tree.
                // If we share nodes, the first one wins.

                const layout = calculateLayout(rootPerson._id!);
                applyLayout(layout, currentRootX);
                currentRootX += layout.width + HORIZONTAL_GAP;
            }
        });
    }

    return { nodeXPositions, relationshipXPositions, spouseNodeXPositions };
};

// Remove unused functions
