import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function SplitPanelTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: state.width > state.height ? 'row' : 'column' }}>
      <div style={{ flex: 1, backgroundColor: state.colors.accent, color: '#fff', padding: state.layout.padding, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <LogoBlock state={{...state, layout: {...state.layout, logoPlacement: 'top-left'}}} />
        <TextBlock state={state} text={state.content.businessName} type="heading" customColor="#fff" />
        <TextBlock state={state} text={state.content.mainHeading} type="promotional" customColor="#fff" />
        <div style={{marginTop: 'auto'}}>
            <TextBlock state={state} text={state.content.contactInfo} customColor="#fff" />
            <TextBlock state={state} text={state.content.website} customColor="#fff" />
        </div>
      </div>
      <div style={{ flex: 2, padding: state.layout.padding, overflow: 'hidden' }}>
        <ServiceList state={state} />
      </div>
    </div>
  );
}
