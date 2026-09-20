import React from 'react';
import { DesignState } from '../types';

interface LogoBlockProps {
  state: DesignState;
  maxHeight?: string;
}

export function LogoBlock({ state, maxHeight = '2in' }: LogoBlockProps) {
  if (state.layout.logoPlacement === 'hidden') return null;
  if (!state.brand.logoUrl) return null;

  return (
    <div 
      style={{
        display: 'flex',
        justifyContent: 
          state.layout.logoPlacement === 'top-left' ? 'flex-start' : 
          state.layout.logoPlacement === 'top-right' ? 'flex-end' : 
          'center',
        marginBottom: '1rem',
      }}
    >
      <img 
        src={state.brand.logoUrl} 
        alt="Logo" 
        style={{
          maxHeight,
          maxWidth: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
