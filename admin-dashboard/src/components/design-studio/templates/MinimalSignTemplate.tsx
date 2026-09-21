import React from 'react';
import { DesignState } from '../types';
import { TextBlock } from '../primitives';

export function MinimalSignTemplate({ state }: { state: DesignState }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <TextBlock state={state} text={state.content.mainHeading} type="promotional" size="calc(2 * var(--heading-size, 2rem))" />
      <TextBlock state={state} text={state.content.subheading} type="heading" />
      <div style={{marginTop: '2rem', padding: '1rem', border: `8px solid ${state.colors.accent}`}}>
        <TextBlock state={state} text={state.content.customText} type="heading" color={state.colors.accent} />
      </div>
    </div>
  );
}
