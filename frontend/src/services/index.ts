import personService, { Person, PersonWithGenerations } from './personService';
import spouseService, { Spouse, SpouseWithDetails } from './spouseService';
import parentChildService, { ParentChild, ParentChildWithDetails } from './parentChildService';

export { personService, spouseService, parentChildService };

// Re-export types
export type { Person, PersonWithGenerations, Spouse, SpouseWithDetails, ParentChild, ParentChildWithDetails };

// Tạo type cho cấu trúc cây gia phả để sử dụng với React Flow
export interface FamilyNode {
    id: string;
    type: 'person' | 'spouse';
    data: {
        person?: Person;
        spouse?: SpouseWithDetails;
        isRoot?: boolean;
    };
    position: { x: number; y: number };
}

export interface FamilyEdge {
    id: string;
    source: string;
    target: string;
    type: 'spouse' | 'parent-child';
    data?: {
        relationship?: Spouse | ParentChild;
    };
}

// Helper function để chuyển đổi dữ liệu từ API sang dạng phù hợp cho React Flow
export const convertToFamilyTree = (data: PersonWithGenerations): { nodes: FamilyNode[]; edges: FamilyEdge[] } => {
    const nodes: FamilyNode[] = [];
    const edges: FamilyEdge[] = [];

    // Xử lý logic chuyển đổi dữ liệu ở đây
    // Đây chỉ là khung, cần phải implement chi tiết dựa vào cấu trúc dữ liệu cụ thể

    return { nodes, edges };
};
