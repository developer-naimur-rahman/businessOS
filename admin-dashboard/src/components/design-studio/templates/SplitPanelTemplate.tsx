import React from 'react';
import { DesignState } from '../types';
import { TextBlock, LogoBlock, ServiceList } from '../primitives';

export function SplitPanelTemplate({ state }: { state: DesignState }) {
  const isLandscape = Number(state.width) > Number(state.height);
  const clipPath = isLandscape ? 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' : 'polygon(0 0, 100% 0, 100% 85%, 0 100%)';

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: isLandscape ? 'row' : 'column', backgroundColor: state.colors.background, position: 'relative' }}>
      
      <div style={{ 
        flex: isLandscape ? 0.45 : 'none', 
        minHeight: isLandscape ? 'auto' : '35%',
        backgroundColor: state.colors.accent, 
        color: '#fff', 
        padding: state.layout.padding, 
        paddingRight: isLandscape ? `calc(${state.layout.padding} * 2)` : state.layout.padding,
        paddingBottom: isLandscape ? state.layout.padding : `calc(${state.layout.padding} * 2)`,
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        clipPath: clipPath,
        position: 'relative',
        zIndex: 2,
        boxShadow: '5px 0 15px rgba(0,0,0,0.2)'
      }}>
        {/* Subtle geometric pattern overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)`, backgroundSize: '0.4in 0.4in', backgroundPosition: '0 0, 0.2in 0.2in', zIndex: -1 }} />
        
        <LogoBlock state={{...state, layout: {...state.layout, logoPlacement: 'top-left'}}} />
        <TextBlock state={state} text={state.content.businessName} type="heading" color="#fff" letterSpacing="-0.02em" textShadow="0 2px 8px rgba(0,0,0,0.2)" />
        <TextBlock state={state} text={state.content.mainHeading} type="promotional" color="rgba(255,255,255,0.95)" />
        <div style={{marginTop: 'auto', paddingTop: '0.5in'}}>
            <TextBlock state={state} text={state.content.contactInfo} color="#fff" weight="600" opacity={0.9} />
            <TextBlock state={state} text={state.content.website} color="#fff" opacity={0.8} />
        </div>
      </div>

      <div style={{ flex: 1, padding: state.layout.padding, paddingLeft: isLandscape ? '0' : state.layout.padding, paddingTop: isLandscape ? state.layout.padding : '0', overflow: 'hidden', position: 'relative', zIndex: 1, marginLeft: isLandscape ? '-5%' : '0', marginTop: isLandscape ? '0' : '-5%' }}>
        <ServiceList state={state} />
      </div>
    </div>
  );
}
