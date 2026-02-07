import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
    address: string;
    size?: number;
    className?: string;
}

export function UserAvatar({ address, size = 40, className }: UserAvatarProps) {
    const avatar = useMemo(() => {
        return createAvatar(avataaars, {
            seed: address,
            size: 128, // Generate high res, display at prop size
        }).toDataUri();
    }, [address]);

    return (
        <img
            src={avatar}
            alt="User Avatar"
            className={cn("rounded-full object-cover bg-sage/10", className)}
            style={{ width: size, height: size }}
        />
    );
}
