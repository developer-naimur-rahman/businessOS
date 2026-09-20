import React from 'react';
import { DesignState } from '../types';

interface ServiceListProps {
  state: DesignState;
}

export function ServiceList({ state }: ServiceListProps) {
  const { services, layout, colors, typography } = state;
  if (!services || services.length === 0) return null;

  const isGrid = layout.serviceListMode === 'grid';
  
  // Create a grid layout or list layout based on configuration
  return (
    <div 
      style={{
        display: isGrid ? 'grid' : 'flex',
        gridTemplateColumns: isGrid ? 'repeat(auto-fit, minmax(2.5in, 1fr))' : 'none',
        flexDirection: isGrid ? 'row' : 'column',
        gap: layout.serviceSpacing || '0.5em',
        width: '100%',
        marginTop: layout.sectionSpacing,
      }}
    >
      {services.map((s, idx) => (
        <div 
          key={`${s.serviceId}-${idx}`} 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: isGrid ? '0.5em' : '0.25em 0',
            borderBottom: isGrid ? 'none' : `1px dashed ${colors.secondaryText}40`,
            border: isGrid ? `2px solid ${colors.secondaryText}20` : 'none',
            borderRadius: isGrid ? '0.2in' : '0',
            backgroundColor: isGrid ? `${colors.background}80` : 'transparent',
            pageBreakInside: 'avoid',
          }}
        >
          <div style={{ flex: 1, paddingRight: '1em' }}>
            <span style={{ fontSize: typography.bodySize, fontWeight: typography.fontWeight, color: colors.primaryText, display: 'block', wordBreak: 'break-word' }}>
              {s.name}
            </span>
            {isGrid && s.categoryName && (
              <span style={{ fontSize: `calc(${typography.bodySize} * 0.7)`, color: colors.secondaryText }}>
                {s.categoryName}
              </span>
            )}
          </div>
          <div style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
            <span style={{ fontSize: typography.priceSize, fontWeight: 'bold', color: colors.priceColor }}>
              ৳{s.price.toFixed(2)}
            </span>
            {s.unit && (
              <span style={{ fontSize: `calc(${typography.bodySize} * 0.7)`, color: colors.secondaryText, display: 'block' }}>
                / {s.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
