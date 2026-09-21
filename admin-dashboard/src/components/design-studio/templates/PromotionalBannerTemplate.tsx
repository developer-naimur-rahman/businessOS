import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function PromotionalBannerTemplate({ state }: { state: DesignState }) {
  const gradient = state.aesthetics?.gradientBackground || `linear-gradient(135deg, ${state.colors.background}, ${state.colors.accent})`;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: state.colors.background }}>
      <div style={{ 
        background: gradient, 
        color: '#fff', 
        padding: `calc(${state.layout.padding} * 1.5) ${state.layout.padding}`, 
        textAlign: 'center', 
        position: 'relative',
        clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
         <div style={{ display: 'inline-block', backgroundColor: '#fff', color: state.colors.accent, padding: '0.2em 0.8em', borderRadius: '1in', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: `calc(${state.typography.bodySize} * 0.8)`, marginBottom: '1em' }}>
           Special Offer
         </div>
         <LogoBlock state={state} />
         <TextBlock state={state} text={state.content.promotionalText} type="promotional" color="#fff" textShadow="0 4px 12px rgba(0,0,0,0.3)" />
         <TextBlock state={state} text={state.content.businessName} type="subheading" color="rgba(255,255,255,0.9)" />
      </div>
      <div style={{ padding: state.layout.padding, flex: 1, display: 'flex', flexDirection: 'column' }}>
         <div style={{ flex: 1, overflow: 'hidden', marginTop: '-0.5in' }}>
           <ServiceList state={{...state, aesthetics: {...state.aesthetics, dropShadow: 'lg', cornerRadius: 'md'} as any}} />
         </div>
      </div>
    </div>
  );
}
