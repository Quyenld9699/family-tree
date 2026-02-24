import { Person } from 'src/services/personService';
import { SpouseWithDetails } from 'src/services/spouseService';
import { ParentChildWithDetails } from 'src/services/parentChildService';
import { extractId } from './types';

export const getBirthYear = (person: Person): string => {
    if (!person.birth) return '';
    const y = new Date(person.birth).getFullYear();
    return isNaN(y) ? '' : String(y);
};

/** Build set of person IDs that have at least one relationship */
export function buildConnectedIds(spouses: SpouseWithDetails[], parentChilds: ParentChildWithDetails[]): Set<string> {
    const ids = new Set<string>();
    for (const s of spouses) {
        const hId = extractId(s.husband as Person | string);
        const wId = extractId(s.wife as Person | string);
        if (hId) ids.add(hId);
        if (wId) ids.add(wId);
    }
    for (const pc of parentChilds) {
        const childId = extractId(pc.child as Person | string);
        if (childId) ids.add(childId);
        // The parent is a SpouseWithDetails — husband and wife are already covered via spouses loop
        if (typeof pc.parent === 'object' && pc.parent) {
            const pcSpouse = pc.parent as SpouseWithDetails;
            const hId = extractId(pcSpouse.husband as Person | string);
            const wId = extractId(pcSpouse.wife as Person | string);
            if (hId) ids.add(hId);
            if (wId) ids.add(wId);
        }
    }
    return ids;
}
