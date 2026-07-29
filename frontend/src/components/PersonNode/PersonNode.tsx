'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import Image from 'next/image';
import React, { memo } from 'react';
import { Gender, PersonNodeHeight, PersonNodeWidth } from 'src/constants';
import { Avatar_Female, Avatar_Male } from 'src/constants/imagePaths';
import { PersonInfo } from 'src/schema/PersonInfo';
import { isMale } from 'src/utils/genderUtils';
import { toVietnameseLunarDateShort } from 'src/utils/lunarDateUtils';

export type TPersionNode = Omit<Node, 'data' | 'type'> & {
    data: PersonInfo;
    type: 'person';
};

export type PersonNodeProps = Omit<NodeProps, 'data'> & {
    data: PersonInfo & { _id?: string };
    onClick?: (personData: PersonInfo & { _id?: string }) => void;
};
const PersonNode = memo(function PersonNode(props: PersonNodeProps) {
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

    // Format death date + lunar conversion
    const deathDate = props.data.death ? (typeof props.data.death === 'string' ? new Date(props.data.death) : props.data.death) : null;
    const deathLunarStr = deathDate ? toVietnameseLunarDateShort(deathDate) : '';

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
        ageStr = `Hưởng thọ: ${age} tuổi`;
    }

    return (
        <div
            className={`relative border-2 rounded-[12px] p-2 text-center cursor-pointer transition-all duration-150 hover:scale-[1.03]`}
            style={{
                minWidth: PersonNodeWidth,
                maxWidth: PersonNodeWidth,
                height: PersonNodeHeight,
                backgroundColor: '#fefef9',
                borderColor: isMale(props.data.gender) ? '#1a3a3a' : '#ff4d8b',
                boxShadow: isMale(props.data.gender) ? '0 0 0 1px rgba(26,58,58,0.08)' : '0 0 0 1px rgba(255,77,139,0.08)',
            }}
            onClick={handleClick}
        >
            <Handle type="target" position={Position.Top} id={'tt'} style={{ opacity: 0 }} />
            <Image
                src={avatarSrc}
                alt={props.data.name}
                width={50}
                height={50}
                className={`rounded-full mx-auto w-[50px] h-[50px] object-cover ${props.data.isDead ? 'grayscale opacity-70' : ''}`}
                onError={(e) => {
                    e.currentTarget.src = isMale(props.data.gender) ? Avatar_Male : Avatar_Female;
                }}
            />
            {props.data.isDead && (
                <div className="absolute top-[-5px] left-1/2 transform -translate-x-1/2 z-10">
                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="20" cy="10" rx="18" ry="6" stroke="#e8b94a" strokeWidth="2" fill="none" />
                    </svg>
                </div>
            )}
            <p className="text-[13px] font-semibold leading-tight mt-1" style={{ color: '#0a0a0a', letterSpacing: '-0.2px' }}>
                {props.data.name}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: '#6a6a6a' }}>
                {birthStr}
            </p>
            {deathLunarStr && (
                <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#c0392b' }}>
                    {deathLunarStr}
                </p>
            )}
            {ageStr && (
                <p className="text-[10px]" style={{ color: '#6a6a6a' }}>
                    {ageStr}
                </p>
            )}
            <Handle type="source" position={Position.Bottom} id={'sb'} style={{ opacity: 0 }} />
        </div>
    );
});

export default PersonNode;
