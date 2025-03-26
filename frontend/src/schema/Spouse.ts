import { Gender } from 'src/constants';

export type SpouseInfo = {
    top: Gender;
    husbandOrder?: number;
    wifeOrder?: number;
    marriageDate?: Date;
    divorceDate?: Date;
};
