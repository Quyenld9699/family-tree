# Family Tree Visualization Module Structure

## Overview

Code đã được refactor thành các modules độc lập, dễ đọc và dễ bảo trì.

## Module Structure

### Constants (`constants/`)

Chứa tất cả các hằng số cấu hình layout.

#### `layoutConstants.ts`

-   **Purpose**: Centralized configuration cho layout
-   **Exports**:
    -   `PERSON_WIDTH`, `RELATIONSHIP_WIDTH`: Kích thước nodes
    -   `HORIZONTAL_GAP`, `GEN_VERTICAL_SPACE`, `GEN_GAP`: Spacing
    -   `OFFSET_PERSON`, `OFFSET_RELATIONSHIP`, `OFFSET_SPOUSE`: Vertical positions
    -   Style objects: `PERSON_NODE_STYLE`, `RELATIONSHIP_NODE_STYLE`, `SPOUSE_NODE_STYLE`, `DEFAULT_EDGE_STYLE`, `GENERATION_BOX_STYLE`

### Utilities (`utils/`)

Chứa các helper functions và business logic.

#### `treeHelpers.ts`

-   **Purpose**: Utility functions cho tree operations
-   **Exports**:
    -   `mapGender(value)`: Convert gender value to Gender enum
    -   `sortSpouses(spouses)`: Sort spouses by order/marriage date
    -   `sortChildrenByBirthDate(children, personMap)`: Sort children oldest to youngest
    -   `getChildId(pc)`: Extract child ID from parent-child relationship
    -   `getSpousePersonId(spouse, personId)`: Get spouse person ID

#### `generationBuilder.ts`

-   **Purpose**: Build generation arrays từ family data
-   **Exports**:
    -   `buildGenerations(rootPersonId, personMap, spouseMap, childrenMap)`:
        -   Traverses family tree từ root person
        -   Returns: `{ generations, personGeneration }`
        -   Sorts children by birth date
    -   `buildChildrenByParentMap(generations, spouseMap, childrenMap, personMap)`:
        -   Groups children by parent spouse relationships
        -   Returns: `Map<spouseId, childIds[]>`
        -   Maintains sort order from buildGenerations

#### `positionCalculator.ts`

-   **Purpose**: Calculate X positions using bottom-up algorithm
-   **Exports**:
    -   `calculateNodePositions(generations, spouseMap, childrenMap, personGeneration, childrenByParent)`:
        -   Implements bottom-up layout algorithm
        -   Parents center over children
        -   Returns: `{ nodeXPositions, relationshipXPositions, spouseNodeXPositions }`
-   **Algorithm**:
    1. Layout last generation first (grouped by parent)
    2. Calculate parent positions based on children (bottom-up)
    3. First pass: Persons with children
    4. Second pass: Persons without children

#### `nodeRenderer.ts`

-   **Purpose**: Render React Flow nodes and edges
-   **Exports**:
    -   `renderFamilyTree(...)`: Main rendering function
        -   Creates all nodes (person, relationship, spouse, generation boxes)
        -   Creates all edges (person→relationship, relationship→spouse, spouse→children)
        -   Returns: `{ nodes, edges }`
-   **Features**:
    -   Global generation box alignment
    -   Proper edge routing
    -   Spouse node handling (in-tree vs external)

## Main Component

### `Root.tsx`

-   **Purpose**: Main family tree component
-   **Optimizations**:
    -   `useMemo` for buildFamilyTree - avoid recalculation on re-renders
    -   `useCallback` for event handlers
    -   Modular imports from utils
-   **Flow**:
    1. Load data (persons, spouses, parentChilds)
    2. Build maps (personMap, spouseMap, childrenMap)
    3. Build generations
    4. Calculate positions
    5. Render tree
    6. Display in React Flow

## Performance Optimizations

1. **Memoization**:

    - Family tree calculation wrapped in `useMemo`
    - Event handlers wrapped in `useCallback`
    - NodeTypes object memoized

2. **Module Structure**:

    - Clean separation of concerns
    - Easy to test individual functions
    - Reusable utilities

3. **Algorithm Efficiency**:
    - Bottom-up calculation minimizes recalculations
    - Single-pass rendering
    - Map-based lookups (O(1))

## Usage Example

```typescript
import { buildGenerations, calculateNodePositions, renderFamilyTree } from './utils';
import { PERSON_WIDTH, HORIZONTAL_GAP } from './constants';

// Build generations
const { generations, personGeneration } = buildGenerations(rootPersonId, personMap, spouseMap, childrenMap);

// Calculate positions
const { nodeXPositions, relationshipXPositions, spouseNodeXPositions } = calculateNodePositions(generations, spouseMap, childrenMap, personGeneration, childrenByParent);

// Render tree
const { nodes, edges } = renderFamilyTree(generations, spouseMap, childrenMap, personGeneration, nodeXPositions, relationshipXPositions, spouseNodeXPositions);
```

## Future Improvements

1. Add TypeScript strict types
2. Add unit tests for each module
3. Extract node type definitions to separate file
4. Add configuration for ROOT_PERSON_ID
5. Implement caching for expensive calculations
6. Add error boundaries

## Benefits of New Structure

✅ **Maintainability**: Logic phân tách rõ ràng  
✅ **Testability**: Dễ dàng test từng module riêng  
✅ **Performance**: Memoization và optimization tốt hơn  
✅ **Readability**: Code ngắn gọn, dễ hiểu  
✅ **Scalability**: Dễ dàng mở rộng tính năng mới
