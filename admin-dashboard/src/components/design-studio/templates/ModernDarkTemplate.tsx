import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function ModernDarkTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#111', color: '#eee' }}>
       <div style={{ padding: state.layout.padding }}>
         <LogoBlock state={state} />
         <TextBlock state={state} text={state.content.businessName} type="heading" customColor="#fff" />
         <TextBlock state={state} text={state.content.subheading} type="subheading" customColor="#aaa" />
       </div>
       <div style={{ flex: 1, padding: state.layout.padding }}>
         <ServiceList state={{...state, colors: { ...state.colors, primaryText: '#fff', secondaryText: '#aaa', priceColor: state.colors.accent }}} />
       </div>
    </div>
  );
}
