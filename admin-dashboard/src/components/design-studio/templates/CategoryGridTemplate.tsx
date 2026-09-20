import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function CategoryGridTemplate({ state }: { state: DesignState }) {
  const gridState = { ...state, layout: { ...state.layout, serviceListMode: 'grid' as const } };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', borderBottom: "4px solid ", paddingBottom: '1rem' }}>
        <LogoBlock state={state} />
        <TextBlock state={state} text={state.content.businessName} type="heading" />
      </div>
      <div style={{ flex: 1, marginTop: state.layout.sectionSpacing }}>
        <ServiceList state={gridState} />
      </div>
    </div>
  );
}
