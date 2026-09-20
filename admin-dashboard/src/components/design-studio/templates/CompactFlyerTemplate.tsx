import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function CompactFlyerTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: "10px solid ", padding: state.layout.padding }}>
      <LogoBlock state={state} />
      <TextBlock state={state} text={state.content.promotionalText} type="promotional" />
      <div style={{ columns: 2, columnGap: '2rem', marginTop: '1rem', flex: 1 }}>
         <ServiceList state={state} />
      </div>
    </div>
  );
}
