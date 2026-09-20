import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function PromotionalBannerTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ backgroundColor: state.colors.accent, color: '#fff', padding: state.layout.padding, textAlign: 'center', borderRadius: '0 0 50% 50% / 20px' }}>
         <TextBlock state={state} text={state.content.promotionalText} type="promotional" customColor="#fff" customSize="calc(1.5 * var(--heading-size, 2rem))" />
      </div>
      <div style={{ padding: state.layout.padding, flex: 1 }}>
         <ServiceList state={state} />
      </div>
    </div>
  );
}
