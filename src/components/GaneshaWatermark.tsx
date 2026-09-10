import React, { useEffect, useState } from 'react';

interface GaneshaWatermarkProps {
  opacity?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  fit?: 'contain' | 'cover' | 'fill';
}

export const GaneshaWatermark: React.FC<GaneshaWatermarkProps> = ({
  opacity = 0.22,
  className = '',
  size = 'full',
  fit = 'fill'
}) => {
  const [watermarkSrc, setWatermarkSrc] = useState<string>('/ganesha_watermark.svg');

  useEffect(() => {
    const updateSrc = () => {
      try {
        const custom = localStorage.getItem('custom_watermark_data');
        if (custom) {
          setWatermarkSrc(custom);
          return;
        }
      } catch {
        // ignore
      }
      setWatermarkSrc('/ganesha_watermark.svg');
    };

    updateSrc();
    window.addEventListener('watermark_updated', updateSrc);
    return () => window.removeEventListener('watermark_updated', updateSrc);
  }, []);

  const sizingClass =
    size === 'sm'
      ? 'max-w-[300px] max-h-[300px]'
      : size === 'md'
      ? 'max-w-[420px] max-h-[420px]'
      : size === 'lg'
      ? 'max-w-[560px] max-h-[560px]'
      : 'w-full h-full';

  const fitClass =
    fit === 'contain'
      ? 'object-contain'
      : fit === 'cover'
      ? 'object-cover'
      : 'object-fill';

  return (
    <div
      className={`ganesha-watermark absolute inset-0 pointer-events-none flex items-center justify-center select-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{
        opacity,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Divine Lord Ganesha watercolor artwork matching user uploaded reference */}
      <img
        src={watermarkSrc}
        alt="Lord Ganesha Watercolor Watermark"
        className={`w-full h-full ${sizingClass} ${fitClass} transition-opacity duration-200`}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: fit === 'contain' ? 'contain' : fit === 'cover' ? 'cover' : 'fill',
          margin: 0,
          padding: 0
        }}
        loading="eager"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};


