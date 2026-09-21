import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function ModernDarkTemplate({ state }: { state: DesignState }) {
  const isLandscape = Number(state.width) > Number(state.height);
  const glowShadow = `0 0 1in ${state.colors.accent}40`; // Neon glow based on accent

  return (
    <div style={{ display: 'flex', flexDirection: isLandscape ? 'row' : 'column', height: '100%', backgroundColor: '#09090b', color: '#f8fafc', backgroundImage: `radial-gradient(circle at top right, ${state.colors.accent}15, transparent 50%), radial-gradient(circle at bottom left, ${state.colors.accent}20, transparent 40%)` }}>
       
       <div style={{ flex: isLandscape ? 0.35 : 'none', padding: state.layout.padding, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: isLandscape ? `1px solid rgba(255,255,255,0.1)` : 'none', borderBottom: isLandscape ? 'none' : `1px solid rgba(255,255,255,0.1)` }}>
         <div style={{ padding: '0.2in', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.2in', boxShadow: glowShadow, border: '1px solid rgba(255,255,255,0.05)' }}>
           <LogoBlock state={state} />
           <TextBlock state={state} text={state.content.businessName} type="heading" color="#ffffff" letterSpacing="-0.03em" />
           <TextBlock state={state} text={state.content.subheading} type="subheading" color={state.colors.accent} letterSpacing="0.1em" />
         </div>
       </div>

       <div style={{ flex: 1, padding: state.layout.padding, display: 'flex', flexDirection: 'column' }}>
         <div style={{ flex: 1, overflow: 'hidden' }}>
           <ServiceList state={{...state, colors: { ...state.colors, primaryText: '#f8fafc', secondaryText: '#94a3b8', priceColor: state.colors.accent, background: '#1e293b' }, aesthetics: {...state.aesthetics, glassmorphism: true, dropShadow: 'none', cornerRadius: 'sm'} as any}} />
         </div>
         
         {!isLandscape && state.content.contactInfo && (
            <div style={{ marginTop: '0.5in', paddingTop: '0.2in', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <TextBlock state={state} text={state.content.contactInfo} type="body" color="#94a3b8" />
            </div>
         )}
       </div>
    </div>
  );
}
