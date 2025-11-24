import { Gender } from 'src/constants';
import { Person, SpouseWithDetails, ParentChildWithDetails } from 'src/services';

/**
 * Map gender value to Gender enum
 */
export const mapGender = (genderValue: any): Gender => {
    if (genderValue === 0 || genderValue === '0') return Gender.MALE;
    if (genderValue === 1 || genderValue === '1') return Gender.FEMALE;
    return Gender.MALE;
};

/**
 * Sort spouses by order or marriage date
 * For a husband with multiple wives: sort by wifeOrder (wife 1, wife 2, ...)
 * For a wife with multiple husbands: sort by husbandOrder (husband 1, husband 2, ...)
 */
export const sortSpouses = (spouses: SpouseWithDetails[]): SpouseWithDetails[] => {
    if (spouses.length === 0) return [];

    return [...spouses].sort((a, b) => {
        // Check if we're sorting wives (wifeOrder will vary) or husbands (husbandOrder will vary)
        const aWifeOrder = a.wifeOrder || 1;
        const bWifeOrder = b.wifeOrder || 1;
        const aHusbandOrder = a.husbandOrder || 1;
        const bHusbandOrder = b.husbandOrder || 1;

        // If wifeOrder differs, we're sorting wives of one husband
        if (aWifeOrder !== bWifeOrder) {
            return aWifeOrder - bWifeOrder;
        }

        // If husbandOrder differs, we're sorting husbands of one wife
        if (aHusbandOrder !== bHusbandOrder) {
            return aHusbandOrder - bHusbandOrder;
        }

        // Fall back to marriage date
        if (a.marriageDate && b.marriageDate) {
            return new Date(a.marriageDate).getTime() - new Date(b.marriageDate).getTime();
        }
        return 0;
    });
};

/**
 * Sort children by birth date
 */
export const sortChildrenByBirthDate = (children: ParentChildWithDetails[], personMap: Map<string, Person>): ParentChildWithDetails[] => {
    return children.sort((a, b) => {
        const childA = typeof a.child === 'string' ? personMap.get(a.child) : a.child;
        const childB = typeof b.child === 'string' ? personMap.get(b.child) : b.child;

        if (!childA?.birth || !childB?.birth) return 0;

        const dateA = new Date(childA.birth).getTime();
        const dateB = new Date(childB.birth).getTime();

        return dateA - dateB;
    });
};

/**
 * Extract child ID from ParentChildWithDetails
 */
export const getChildId = (pc: ParentChildWithDetails): string | undefined => {
    return typeof pc.child === 'string' ? pc.child : pc.child._id;
};

/**
 * Extract spouse person ID (the other person in the relationship)
 */
export const getSpousePersonId = (spouse: SpouseWithDetails, personId: string): string | undefined => {
    const husbandId = typeof spouse.husband === 'string' ? spouse.husband : spouse.husband._id;
    const wifeId = typeof spouse.wife === 'string' ? spouse.wife : spouse.wife._id;
    return husbandId === personId ? wifeId : husbandId;
};
