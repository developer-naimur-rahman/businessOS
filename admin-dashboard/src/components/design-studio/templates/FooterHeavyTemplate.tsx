import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function FooterHeavyTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: state.layout.padding }}>
         <TextBlock state={state} text={state.content.mainHeading} type="heading" />
         <ServiceList state={state} />
      </div>
      <div style={{ backgroundColor: state.colors.accent, padding: state.layout.padding, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
           <TextBlock state={state} text={state.content.businessName} type="heading" color="#ffffff" />
           <TextBlock state={state} text={state.content.address} color="rgba(255,255,255,0.8)" />
         </div>
         <LogoBlock state={state} />
      </div>
    </div>
  );
}
