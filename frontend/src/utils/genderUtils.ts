import { Gender } from 'src/constants';

export { Gender };

export type GenderValue = Gender | 'MALE' | 'FEMALE';

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
    return 'Không xác định';
};
