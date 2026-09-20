import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function StandardListTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <LogoBlock state={state} />
      <TextBlock state={state} text={state.content.businessName} type="heading" />
      <TextBlock state={state} text={state.content.mainHeading} type="promotional" />
      <TextBlock state={state} text={state.content.subheading} type="subheading" />
      
      <div style={{ flex: 1, marginTop: state.layout.sectionSpacing }}>
        <ServiceList state={state} />
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: state.layout.sectionSpacing, borderTop: `2px solid ${state.colors.secondaryText}40`, display: 'flex', justifyContent: 'space-between' }}>
        <TextBlock state={state} text={state.content.contactInfo} />
        <TextBlock state={state} text={state.content.address} />
      </div>
    </div>
  );
}
