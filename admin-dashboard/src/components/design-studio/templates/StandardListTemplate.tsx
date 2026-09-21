import React from 'react';
import { DesignState } from '../types';
import { TextBlock, ServiceList, LogoBlock } from '../primitives';

export function StandardListTemplate({ state }: { state: DesignState }) {
  const isLandscape = Number(state.width) > Number(state.height);
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isLandscape ? 'row' : 'column', 
      height: '100%', 
      backgroundColor: state.colors.background,
      gap: isLandscape ? '2in' : '0'
    }}>
      <div style={{ flex: isLandscape ? 0.4 : 'none', padding: state.layout.padding, backgroundColor: state.colors.accent, color: state.colors.background, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
         <LogoBlock state={state} />
         <TextBlock state={state} text={state.content.businessName} type="heading" color={state.colors.background} />
         <TextBlock state={state} text={state.content.subheading} type="subheading" color={state.colors.background} opacity={0.8} />
         {isLandscape && state.content.contactInfo && (
           <div style={{ marginTop: 'auto' }}>
             <TextBlock state={state} text={state.content.contactInfo} type="body" color={state.colors.background} />
           </div>
         )}
      </div>
      <div style={{ flex: 1, padding: state.layout.padding, display: 'flex', flexDirection: 'column' }}>
         {!isLandscape && <div style={{ height: '0.2in', backgroundColor: state.colors.accent, marginBottom: '1in' }} />}
         <div style={{ flex: 1, overflow: 'hidden' }}>
           <ServiceList state={state} />
         </div>
      </div>
    </div>
  );
}
