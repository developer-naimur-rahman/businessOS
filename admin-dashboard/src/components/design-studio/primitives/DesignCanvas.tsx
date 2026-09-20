import React, { useRef, useEffect, useState } from 'react';
import { DesignState } from '../types';

interface DesignCanvasProps {
  state: DesignState;
  children: React.ReactNode;
  isPrintMode?: boolean;
}

export function DesignCanvas({ state, children, isPrintMode = false }: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // In print mode (e.g. for puppeteer), we don't scale it visually to fit a container,
  // we just render it at the exact physical dimensions specified in inches using CSS absolute units.
  // Wait, rendering huge DOM nodes in inches (e.g. 96in) works fine in modern browsers/PDF engines.
  
  // We define the base CSS width/height for the canvas.
  const physicalWidthInches = state.width;
  const physicalHeightInches = state.height;

  useEffect(() => {
    if (isPrintMode) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current.parentElement;
      if (!container) return;

      // Assume 96 DPI for browser standard CSS inch translation (1in = 96px).
      const rawPixelWidth = physicalWidthInches * 96;
      const rawPixelHeight = physicalHeightInches * 96;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / rawPixelWidth;
      const scaleY = containerHeight / rawPixelHeight;

      // Use the smaller scale to fit within container, with a slight margin
      let newScale = Math.min(scaleX, scaleY) * 0.95;
      if (newScale > 1) newScale = 1; // don't upscale beyond physical if container is huge

      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [physicalWidthInches, physicalHeightInches, isPrintMode]);

  const canvasStyle: React.CSSProperties = {
    width: `${physicalWidthInches}in`,
    height: `${physicalHeightInches}in`,
    backgroundColor: state.colors.background,
    fontFamily: state.typography.fontFamily,
    color: state.colors.primaryText,
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    margin: isPrintMode ? '0' : 'auto',
    // Apply scale using CSS transform for editor preview
    transform: isPrintMode ? 'none' : `scale(${scale})`,
    transformOrigin: 'top center',
    transition: 'transform 0.2s ease-out',
    // Global typography
    textAlign: state.typography.textAlignment,
    fontWeight: state.typography.fontWeight,
    fontSize: state.typography.bodySize,
  };

  const safeAreaStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0.5in',
    left: '0.5in',
    right: '0.5in',
    bottom: '0.5in',
    border: '2px dashed rgba(255, 0, 0, 0.4)',
    pointerEvents: 'none',
    zIndex: 9999,
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={canvasStyle}>
        {/* Render Safe Area overlay if enabled in non-print mode */}
        {!isPrintMode && state.layout.safeAreaEnabled && (
          <div style={safeAreaStyle} />
        )}
        
        {/* The actual design content goes here */}
        <div style={{ width: '100%', height: '100%', padding: state.layout.padding, boxSizing: 'border-box' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
