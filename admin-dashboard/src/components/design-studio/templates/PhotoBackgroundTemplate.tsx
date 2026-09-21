import React from 'react';
import { DesignState } from '../types';
import { TextBlock, ServiceList, LogoBlock } from '../primitives';

export function PhotoBackgroundTemplate({ state }: { state: DesignState }) {
  const overlayOpacity = state.aesthetics?.overlayOpacity ?? 0.8;
  const gradient = `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity * 0.9}), rgba(0,0,0,${overlayOpacity * 0.5}) 30%, rgba(0,0,0,${overlayOpacity * 0.9}))`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', backgroundColor: '#000' }}>
      {/* Background Image */}
      {state.brand.backgroundImageUrl && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${state.brand.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      )}
      
      {/* Dramatic Vignette Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: gradient, zIndex: 1 }} />
      
      {/* Content */}
      <div style={{ zIndex: 2, padding: state.layout.padding, flex: 1, display: 'flex', flexDirection: 'column', color: '#fff' }}>
         <LogoBlock state={state} />
         
         <div style={{ textAlign: state.typography.textAlignment, marginTop: state.layout.sectionSpacing }}>
           <TextBlock state={state} text={state.content.businessName} type="heading" color="#ffffff" textShadow="0 4px 12px rgba(0,0,0,0.5)" />
           <div style={{ width: '1in', height: '0.05in', backgroundColor: state.colors.accent, margin: state.typography.textAlignment === 'center' ? '0.2in auto' : '0.2in 0' }} />
           <TextBlock state={state} text={state.content.subheading} type="subheading" color="rgba(255,255,255,0.9)" />
         </div>

         <div style={{ flex: 1, overflow: 'hidden', marginTop: state.layout.sectionSpacing, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>
           <ServiceList state={{...state, colors: { ...state.colors, primaryText: '#fff', secondaryText: '#ccc', background: '#000000' }, aesthetics: {...state.aesthetics, glassmorphism: true, dropShadow: 'lg', cornerRadius: 'md'} as any}} />
         </div>
      </div>
    </div>
  );
}
