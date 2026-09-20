import React from 'react';
import { DesignState } from '../types';
import { TextBlock, ServiceList, LogoBlock } from '../primitives';

export function PhotoBackgroundTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {state.brand.backgroundImageUrl && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25, backgroundImage: `url(${state.brand.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div style={{ zIndex: 1, backgroundColor: 'rgba(255,255,255,0.90)', margin: state.layout.padding, padding: state.layout.padding, flex: 1, border: `2px solid ${state.colors.accent}`, display: 'flex', flexDirection: 'column' }}>
         <LogoBlock state={state} />
         <TextBlock state={state} text={state.content.businessName} type="heading" />
         <TextBlock state={state} text={state.content.subheading} type="subheading" />
         <div style={{ flex: 1, overflow: 'hidden' }}>
           <ServiceList state={state} />
         </div>
      </div>
    </div>
  );
}
