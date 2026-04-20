import React from 'react';
import { getInitials, getAvatarColor } from '../utils/avatarUtils';

interface UserAvatarProps {
  name: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, isOnline = false, size = 'md' }) => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const statusDotSize = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-3 w-3',
  };

  return (
    <div className="relative shrink-0">
      <div className={`${sizeClasses[size]} ${bgColor} flex items-center justify-center rounded-full text-white font-semibold`}>
        {initials}
      </div>
      {isOnline && (
        <div className={`${statusDotSize[size]} absolute bottom-0 right-0 rounded-full bg-[#25d366] ring-2 ring-white`} />
      )}
    </div>
  );
};
