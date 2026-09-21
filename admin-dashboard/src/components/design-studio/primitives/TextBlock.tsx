import React from 'react';
import { DesignState } from '../types';

interface TextBlockProps {
  state: DesignState;
  text: string;
  type?: 'heading' | 'subheading' | 'body' | 'promotional';
  color?: string;
  size?: string;
  weight?: string | number;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  textShadow?: string;
  lineHeight?: number | string;
  opacity?: number;
}

export function TextBlock({ 
  state, 
  text, 
  type = 'body', 
  color: customColor, 
  size: customSize,
  weight: customWeight,
  letterSpacing: customLetterSpacing,
  textTransform = 'none',
  textShadow,
  lineHeight: customLineHeight,
  opacity = 1
}: TextBlockProps) {
  if (!text) return null;

  let fontSize = state.typography.bodySize;
  let fontWeight: string | number = state.typography.fontWeight;
  let color = state.colors.primaryText;
  let marginBottom = '0.5em';
  let lineHeight: number | string = 1.2;
  let letterSpacing = 'normal';

  switch (type) {
    case 'heading':
      fontSize = state.typography.headingSize;
      fontWeight = 800; // Extra bold for premium feel
      marginBottom = '0.15em';
      letterSpacing = '-0.02em';
      lineHeight = 1.1;
      break;
    case 'subheading':
      fontSize = `calc(${state.typography.headingSize} * 0.45)`;
      fontWeight = 600;
      color = state.colors.secondaryText;
      letterSpacing = '0.05em';
      textTransform = textTransform !== 'none' ? textTransform : 'uppercase';
      break;
    case 'promotional':
      fontSize = `calc(${state.typography.headingSize} * 1.5)`;
      fontWeight = 900; // Black weight
      color = state.colors.accent;
      lineHeight = 1;
      letterSpacing = '-0.04em';
      textTransform = textTransform !== 'none' ? textTransform : 'uppercase';
      break;
    case 'body':
    default:
      fontSize = state.typography.bodySize;
      color = state.colors.primaryText;
      lineHeight = 1.5;
      break;
  }

  // Overrides
  if (customColor) color = customColor;
  if (customSize) fontSize = customSize;
  if (customWeight) fontWeight = customWeight;
  if (customLetterSpacing) letterSpacing = customLetterSpacing;
  if (customLineHeight) lineHeight = customLineHeight;

  return (
    <div 
      style={{
        fontSize,
        fontWeight,
        color,
        marginBottom,
        lineHeight,
        letterSpacing,
        textTransform,
        textShadow,
        opacity,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
    >
      {text}
    </div>
  );
}
