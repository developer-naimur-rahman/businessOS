import { 
  StandardListTemplate, 
  SplitPanelTemplate, 
  CategoryGridTemplate, 
  MinimalSignTemplate, 
  PromotionalBannerTemplate, 
  ModernDarkTemplate, 
  FooterHeavyTemplate, 
  PhotoBackgroundTemplate, 
  CompactFlyerTemplate 
} from './templates';
import { DesignState } from './types';
import React from 'react';

export const TEMPLATES: Record<string, { name: string, component: React.FC<{ state: DesignState }> }> = {
  'StandardListTemplate': { name: 'Standard List', component: StandardListTemplate },
  'SplitPanelTemplate': { name: 'Split Panel', component: SplitPanelTemplate },
  'CategoryGridTemplate': { name: 'Category Grid', component: CategoryGridTemplate },
  'MinimalSignTemplate': { name: 'Minimal Sign', component: MinimalSignTemplate },
  'PromotionalBannerTemplate': { name: 'Promotional Banner', component: PromotionalBannerTemplate },
  'ModernDarkTemplate': { name: 'Modern Dark', component: ModernDarkTemplate },
  'FooterHeavyTemplate': { name: 'Footer Heavy', component: FooterHeavyTemplate },
  'PhotoBackgroundTemplate': { name: 'Photo Background', component: PhotoBackgroundTemplate },
  'CompactFlyerTemplate': { name: 'Compact Flyer', component: CompactFlyerTemplate },
};
