// Layout constants cho family tree
export const PERSON_WIDTH = 128;
export const RELATIONSHIP_WIDTH = 128;
export const HORIZONTAL_GAP = 80;
export const GEN_VERTICAL_SPACE = 550;
export const GEN_GAP = 20;

// Vertical offsets trong generation
export const OFFSET_PERSON = 0;
export const OFFSET_RELATIONSHIP = 170;
export const OFFSET_SPOUSE = 350;

// Generation box styling
export const GROUP_PADDING = 100;
export const GENERATION_BOX_STYLE = {
    backgroundColor: 'rgba(255, 200, 200, 0.08)',
    border: '1px dashed rgba(255, 100, 100, 0.6)',
};

// Edge styling
export const EDGE_STYLE = {
    strokeWidth: 2,
};

// Node styles
export const PERSON_NODE_STYLE = {
    width: PERSON_WIDTH,
};

export const RELATIONSHIP_NODE_STYLE = {
    width: RELATIONSHIP_WIDTH,
};

export const SPOUSE_NODE_STYLE = {
    width: PERSON_WIDTH,
};

export const DEFAULT_EDGE_STYLE = EDGE_STYLE;
