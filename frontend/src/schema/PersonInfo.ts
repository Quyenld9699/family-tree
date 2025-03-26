import { Gender } from 'src/constants';

export type PersonInfo = {
    id: string;
    cccd: string;
    name: string;
    avatar: string;
    gender: Gender;
    birth?: Date;
    death?: Date;
    isDead: boolean;
    address: string;
    desc: string;
};
