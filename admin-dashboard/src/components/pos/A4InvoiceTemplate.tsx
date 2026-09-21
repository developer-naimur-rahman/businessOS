import React from 'react';

export function A4InvoiceTemplate({ sale, businessDetails = null }: { sale: any, businessDetails?: any }) {
  if (!sale) return null;

  return (
    <div className="print-a4-container font-sans text-black p-8 max-w-[210mm] mx-auto bg-white min-h-[297mm]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-a4-container, .print-a4-container * { visibility: visible; }
          .print-a4-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20mm; }
          @page { size: A4; margin: 0; }
        }
      `}} />
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">{businessDetails?.name || 'My Business'}</h1>
          <p className="text-sm text-slate-600">{businessDetails?.address || '123 Business Road, City, Country'}</p>
          <p className="text-sm text-slate-600">Phone: {businessDetails?.phone || '01700-000000'}</p>
          <p className="text-sm text-slate-600">Email: {businessDetails?.email || 'contact@mybusiness.com'}</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-2">Invoice</h2>
          <p className="font-semibold text-slate-900">Invoice No: {sale.saleNumber}</p>
          <p className="text-sm text-slate-600">Date: {new Date(sale.createdAt || new Date()).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8 p-4 bg-slate-50 rounded-lg">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
        {sale.customer ? (
          <>
            <p className="font-semibold text-slate-900">{sale.customer.name}</p>
            {sale.customer.phone && <p className="text-sm text-slate-600">{sale.customer.phone}</p>}
            {sale.customer.email && <p className="text-sm text-slate-600">{sale.customer.email}</p>}
          </>
        ) : (
          <p className="text-slate-500 italic">Walk-in Customer</p>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="py-3 px-2 text-sm font-bold text-slate-600">Description</th>
            <th className="py-3 px-2 text-sm font-bold text-slate-600 text-center w-24">Qty</th>
            <th className="py-3 px-2 text-sm font-bold text-slate-600 text-right w-32">Unit Price</th>
            <th className="py-3 px-2 text-sm font-bold text-slate-600 text-right w-32">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line: any, idx: number) => (
            <tr key={idx} className="border-b border-slate-100">
              <td className="py-3 px-2">
                <p className="font-medium text-slate-900">{line.productNameSnapshot || line.product?.name || line.productName || 'Item'}</p>
                {(line.skuSnapshot || line.productCode || line.product?.code) && <p className="text-xs text-slate-500">SKU: {line.skuSnapshot || line.productCode || line.product?.code}</p>}
              </td>
              <td className="py-3 px-2 text-center text-slate-700">{Number(line.quantity)}</td>
              <td className="py-3 px-2 text-right text-slate-700">৳{Number(line.unitPrice).toLocaleString()}</td>
              <td className="py-3 px-2 text-right font-medium text-slate-900">৳{Number(line.lineTotal || (line.unitPrice * line.quantity)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>৳{Number(sale.subtotal).toLocaleString()}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span>-৳{Number(sale.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl text-slate-900 pt-3 border-t-2 border-slate-200">
            <span>Grand Total</span>
            <span>৳{Number(sale.total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-8 text-sm text-slate-500 text-center">
        <p className="mb-1 font-medium text-slate-700">Thank you for your business.</p>
        <p>If you have any questions about this invoice, please contact us.</p>
      </div>
    </div>
  );
}
