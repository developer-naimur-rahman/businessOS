import React from 'react';
import { DesignState } from '../types';

interface ServiceListProps {
  state: DesignState;
}

export function ServiceList({ state }: ServiceListProps) {
  const { services, layout, colors, typography, aesthetics } = state;
  if (!services || services.length === 0) return null;

  const isGrid = layout.serviceListMode === 'grid';
  const isSingle = services.length === 1;
  const isLandscape = Number(state.width) > Number(state.height);
  
  // Dynamic scaling factors based on item count
  const scale = isSingle ? 2.5 : (services.length <= 3 ? 1.5 : 1);
  const baseSize = `calc(${typography.bodySize} * ${scale})`;
  const titleSize = `calc(${typography.bodySize} * ${scale * 1.2})`;
  const priceSize = `calc(${typography.priceSize} * ${scale})`;
  const descSize = `calc(${typography.bodySize} * ${scale * 0.8})`;

  // Aesthetics Tokens
  const borderRadiusToken = aesthetics?.cornerRadius === 'none' ? '0' : aesthetics?.cornerRadius === 'sm' ? '0.1in' : aesthetics?.cornerRadius === 'md' ? '0.2in' : aesthetics?.cornerRadius === 'lg' ? '0.4in' : '0.5in';
  const shadowToken = aesthetics?.dropShadow === 'none' ? 'none' : aesthetics?.dropShadow === 'sm' ? '0 0.05in 0.1in rgba(0,0,0,0.05)' : aesthetics?.dropShadow === 'md' ? '0 0.1in 0.2in rgba(0,0,0,0.08)' : aesthetics?.dropShadow === 'lg' ? '0 0.15in 0.3in rgba(0,0,0,0.12)' : '0 0.25in 0.5in rgba(0,0,0,0.15)';
  const bgOpacity = aesthetics?.glassmorphism ? '90' : 'FF'; // Hex opacity
  const backdropFilter = aesthetics?.glassmorphism ? 'blur(10px)' : 'none';

  return (
    <div 
      style={{
        display: isGrid || isSingle ? 'grid' : 'flex',
        gridTemplateColumns: isSingle ? (isLandscape ? '1fr 1fr' : '1fr') : (isGrid ? 'repeat(auto-fit, minmax(3.5in, 1fr))' : 'none'),
        flexDirection: isGrid || isSingle ? 'row' : 'column',
        gap: layout.serviceSpacing || '0.5em',
        width: '100%',
        marginTop: layout.sectionSpacing,
        flex: isSingle ? 1 : 'none',
      }}
    >
      {services.map((s, idx) => (
        <div 
          key={`${s.serviceId}-${idx}`} 
          style={{
            display: 'flex',
            flexDirection: (layout.showServiceImages && s.imageUrl && (isGrid || isSingle)) ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: (layout.showServiceImages && s.imageUrl && (isGrid || isSingle)) ? 'stretch' : 'baseline',
            padding: (isGrid || isSingle) ? '1.5em' : '0.5em 0',
            borderBottom: (isGrid || isSingle) ? 'none' : `1px dashed ${colors.primaryText}40`,
            border: (isGrid || isSingle) ? `1px solid ${colors.primaryText}15` : 'none',
            borderRadius: (isGrid || isSingle) ? borderRadiusToken : '0',
            backgroundColor: (isGrid || isSingle) ? `${colors.background}${bgOpacity}` : 'transparent',
            backdropFilter: (isGrid || isSingle) ? backdropFilter : 'none',
            pageBreakInside: 'avoid',
            boxShadow: (isGrid || isSingle) ? shadowToken : 'none',
            overflow: 'hidden'
          }}
        >
          {/* Service Image */}
          {layout.showServiceImages && s.imageUrl && (isGrid || isSingle) && (
            <div style={{
              height: isSingle ? '40vh' : '2in',
              marginBottom: '1.5em',
              borderRadius: `calc(${borderRadiusToken} / 2)`,
              backgroundImage: `url(${s.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#f1f5f9'
            }} />
          )}

          <div style={{ display: 'flex', flex: 1, flexDirection: (layout.showServiceImages && s.imageUrl && (isGrid || isSingle)) ? 'column' : 'row', justifyContent: 'space-between', gap: '1em' }}>
            {/* Text Content */}
            <div style={{ flex: 1, paddingRight: '1em' }}>
              <span style={{ fontSize: titleSize, fontWeight: 700, color: colors.primaryText, display: 'block', wordBreak: 'break-word', lineHeight: 1.2 }}>
                {s.name}
              </span>
              {(isGrid || isSingle) && s.categoryName && (
                <span style={{ fontSize: descSize, color: colors.accent, fontWeight: 600, display: 'inline-block', marginTop: '0.2em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.categoryName}
                </span>
              )}
              {layout.showDescriptions && s.description && (
                <p style={{ fontSize: descSize, color: colors.primaryText, opacity: 0.8, marginTop: '0.5em', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                  {s.description}
                </p>
              )}
            </div>

            {/* Price Content */}
            <div style={{ whiteSpace: 'nowrap', textAlign: (layout.showServiceImages && s.imageUrl && (isGrid || isSingle)) ? 'left' : 'right', alignSelf: (layout.showServiceImages && s.imageUrl && (isGrid || isSingle)) ? 'flex-start' : 'flex-start' }}>
              <span style={{ fontSize: priceSize, fontWeight: 'bold', color: colors.accent }}>
                ৳{s.price.toFixed(2)}
              </span>
              {s.unit && (
                <span style={{ fontSize: descSize, color: colors.primaryText, opacity: 0.7, display: 'block', marginTop: '0.1em' }}>
                  / {s.unit}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
