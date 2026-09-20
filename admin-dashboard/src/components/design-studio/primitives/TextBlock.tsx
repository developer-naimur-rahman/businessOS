import React from 'react';
import { DesignState } from '../types';

interface TextBlockProps {
  state: DesignState;
  text: string;
  type?: 'heading' | 'subheading' | 'body' | 'promotional';
  customColor?: string;
  customSize?: string;
}

export function TextBlock({ state, text, type = 'body', customColor, customSize }: TextBlockProps) {
  if (!text) return null;

  let fontSize = state.typography.bodySize;
  let fontWeight = state.typography.fontWeight;
  let color = state.colors.primaryText;
  let marginBottom = '0.5em';
  let lineHeight = 1.2;

  switch (type) {
    case 'heading':
      fontSize = state.typography.headingSize;
      fontWeight = 'bold';
      marginBottom = '0.25em';
      break;
    case 'subheading':
      fontSize = `calc(${state.typography.headingSize} * 0.6)`;
      fontWeight = '600';
      color = state.colors.secondaryText;
      break;
    case 'promotional':
      fontSize = `calc(${state.typography.headingSize} * 1.5)`;
      fontWeight = '900';
      color = state.colors.accent;
      lineHeight = 1;
      break;
    case 'body':
    default:
      fontSize = state.typography.bodySize;
      color = state.colors.primaryText;
      break;
  }

  if (customColor) color = customColor;
  if (customSize) fontSize = customSize;

  // We enforce proper font rendering. If text contains Bengali, the Noto Sans Bengali font
  // defined in state.typography.fontFamily will apply naturally to the canvas.
  
  return (
    <div 
      style={{
        fontSize,
        fontWeight,
        color,
        marginBottom,
        lineHeight,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
    >
      {text}
    </div>
  );
}
