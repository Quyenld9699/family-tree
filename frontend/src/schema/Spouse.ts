import { Gender } from 'src/constants';

export type SpouseInfo = {
    id: string;
    top: Gender;
    husbandOrder?: number;
    wifeOrder?: number;
    marriageDate?: Date;
    divorceDate?: Date;
};
