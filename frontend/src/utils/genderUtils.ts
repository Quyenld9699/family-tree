// Gender enum from backend: MALE = 0, FEMALE = 1, OTHER = 2
export const Gender = {
    MALE: 0,
    FEMALE: 1,
    OTHER: 2,
} as const;

export type GenderValue = 0 | 1 | 2 | 'MALE' | 'FEMALE' | 'OTHER';

/**
 * Check if gender is MALE (handles both number and string)
 */
export const isMale = (gender: GenderValue | undefined): boolean => {
    return gender === 0 || gender === 'MALE';
};

/**
 * Check if gender is FEMALE (handles both number and string)
 */
export const isFemale = (gender: GenderValue | undefined): boolean => {
    return gender === 1 || gender === 'FEMALE';
};

/**
 * Get gender display text in Vietnamese
 */
export const getGenderText = (gender: GenderValue | undefined): string => {
    if (isMale(gender)) return 'Nam';
    if (isFemale(gender)) return 'Nữ';
    return 'Khác';
};
