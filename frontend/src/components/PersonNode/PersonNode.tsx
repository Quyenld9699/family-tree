'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import Image from 'next/image';
import React from 'react';
import { Gender, PersonNodeHeight, PersonNodeWidth } from 'src/constants';
import { Avatar_Female, Avatar_Male } from 'src/constants/imagePaths';
import { PersonInfo } from 'src/schema/PersonInfo';
import { isMale } from 'src/utils/genderUtils';

export type TPersionNode = Omit<Node, 'data' | 'type'> & {
    data: PersonInfo;
    type: 'person';
};

export type PersonNodeProps = Omit<NodeProps, 'data'> & {
    data: PersonInfo & { _id?: string };
    onClick?: (personData: PersonInfo & { _id?: string }) => void;
};
export default function PersonNode(props: PersonNodeProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (props.onClick) {
            props.onClick(props.data);
        }
    };

    // Get avatar URL or default based on gender
    const avatarSrc = props.data.avatar && props.data.avatar.trim() !== '' ? props.data.avatar : isMale(props.data.gender) ? Avatar_Male : Avatar_Female;

    // Format birth date
    const birthDate = props.data.birth ? (typeof props.data.birth === 'string' ? new Date(props.data.birth) : props.data.birth) : null;
    const birthStr = birthDate ? birthDate.toLocaleDateString() : '';

    // Calculate age if dead
    let ageStr = '';
    if (props.data.isDead && props.data.birth && props.data.death) {
        const birth = new Date(props.data.birth);
        const death = new Date(props.data.death);
        let age = death.getFullYear() - birth.getFullYear();
        const m = death.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
            age--;
        }
        ageStr = `(Hưởng thọ: ${age})`;
    }

    return (
        <div
            className={`relative border-2 ${isMale(props.data.gender) ? 'border-blue-500' : 'border-pink-500'} bg-white rounded-md p-2 text-center cursor-pointer hover:shadow-lg transition-shadow`}
            style={{ minWidth: PersonNodeWidth, maxWidth: PersonNodeWidth, height: PersonNodeHeight }}
            onClick={handleClick}
        >
            <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0 }} />
            <Image
                src={avatarSrc}
                alt={props.data.name}
                width={50}
                height={50}
                className={`rounded-full mx-auto w-[50px] h-[50px] object-cover ${props.data.isDead ? 'grayscale' : ''}`}
                onError={(e) => {
                    e.currentTarget.src = isMale(props.data.gender) ? Avatar_Male : Avatar_Female;
                }}
            />
            {props.data.isDead && (
                <div className="absolute top-[-5px] left-1/2 transform -translate-x-1/2 z-10">
                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="20" cy="10" rx="18" ry="6" stroke="#FFD700" strokeWidth="2" fill="none" />
                    </svg>
                </div>
            )}
            <p className="text-sm font-bold">{props.data.name}</p>
            <p className="text-xs text-gray-500">{birthStr}</p>
            {ageStr && <p className="text-xs text-gray-500">{ageStr}</p>}
            <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0 }} />
        </div>
    );
}
