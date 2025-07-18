import React from 'react';

interface DevouLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DevouLogo({ className = '', size = 'md' }: DevouLogoProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} bg-black rounded-xl flex items-center justify-center shadow-lg`}>
        <div className="text-black font-bold text-lg p-4">
          <img src="./devouLogo.png"></img>
        </div>
      </div>
    </div>
  );
}
