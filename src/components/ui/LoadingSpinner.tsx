'use client';

import React from 'react';

interface LoadingSpinnerProps {
  showText?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({
  showText = true,
  text = 'Cargando...',
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-14 w-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full animate-spin`}
        style={{
          borderColor: '#C9A84C33',
          borderTopColor: '#C9A84C',
        }}
      />
      {showText && (
        <p className="text-sm text-gray-500 tracking-wide">{text}</p>
      )}
    </div>
  );
}
