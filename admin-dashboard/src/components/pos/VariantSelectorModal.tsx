import React from 'react';
import { X, Search } from 'lucide-react';

export function VariantSelectorModal({ product, isOpen, onClose, onSelect }: { product: any, isOpen: boolean, onClose: () => void, onSelect: (variant: any, product: any) => void }) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
            <p className="text-sm text-slate-500">Select a variant to add to cart</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variant List */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar">
          <div className="grid gap-3">
            {product.variants?.filter((v: any) => v.status === 'ACTIVE').map((variant: any) => {
              const price = Number(variant.posPrice || variant.retailPrice || product.sellingPrice || 0);
              const attrs = variant.attributes?.map((a: any) => a.attributeValue?.value).join(' / ') || '';
              
              return (
                <button
                  key={variant.id}
                  onClick={() => {
                    onSelect(variant, product);
                    onClose();
                  }}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-lg group-hover:text-indigo-700 transition-colors">
                      {attrs || 'Standard Variant'}
                    </span>
                    <span className="text-sm text-slate-500">SKU: {variant.sku}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-indigo-600 text-lg">
                      ৳{price.toLocaleString()}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Search className="w-4 h-4" /> {/* Or Plus */}
                    </div>
                  </div>
                </button>
              );
            })}
            
            {(!product.variants || product.variants.filter((v: any) => v.status === 'ACTIVE').length === 0) && (
              <div className="text-center p-8 text-slate-500">
                No active variants available for this product.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
