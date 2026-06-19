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

// Generation box styling — Clay theme: ochre dashed border, cream-tinted bg
export const GROUP_PADDING = 100;
export const GENERATION_BOX_STYLE = {
    backgroundColor: 'rgba(249, 247, 242, 0.4)',
    border: '1.5px dashed rgba(232, 185, 74, 0.65)',
    borderRadius: '16px',
};

// Edge styling — Clay theme: soft ink stroke
export const EDGE_STYLE = {
    strokeWidth: 1.5,
    stroke: '#3a3a3a',
    opacity: 0.5,
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
