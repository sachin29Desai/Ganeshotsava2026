import React from 'react';

interface LordGaneshaImageProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  alt?: string;
}

export const LordGaneshaImage: React.FC<LordGaneshaImageProps> = ({
  className = '',
  size = 'md',
  alt = 'Lord Sri Ganesha'
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    custom: ''
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 p-0.5 shadow-xs shrink-0 overflow-hidden ${className}`}
      title={alt}
    >
      <img
        src="/lord_ganesha.svg"
        alt={alt}
        className={`${selectedSize} object-contain rounded-full`}
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );
};
