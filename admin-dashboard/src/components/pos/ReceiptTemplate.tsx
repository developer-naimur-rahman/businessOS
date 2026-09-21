import React from 'react';

export function ReceiptTemplate({ sale, businessDetails = null }: { sale: any, businessDetails?: any }) {
  if (!sale) return null;

  return (
    <div className="print-receipt-container font-sans text-[12px] leading-tight text-black p-4 w-[80mm] mx-auto bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-receipt-container, .print-receipt-container * { visibility: visible; }
          .print-receipt-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          @page { size: auto; margin: 0mm; }
        }
      `}} />
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg">{businessDetails?.name || 'My Business'}</h2>
        <p className="text-[10px]">{businessDetails?.address || '123 Business Road'}</p>
        <p className="text-[10px]">{businessDetails?.phone || '01700-000000'}</p>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2">
        <p>Receipt #: {sale.saleNumber}</p>
        <p>Date: {new Date(sale.createdAt || new Date()).toLocaleString()}</p>
      </div>

      <table className="w-full mb-2">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1 w-[60%]">Item</th>
            <th className="text-right py-1 w-[15%]">Qty</th>
            <th className="text-right py-1 w-[25%]">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line: any, idx: number) => (
            <tr key={idx}>
              <td className="py-1 break-words">
                {line.productNameSnapshot || line.product?.name || line.productName || 'Item'}
                {(line.skuSnapshot || line.productCode || line.product?.code) && <div className="text-[9px] text-gray-500">SKU: {line.skuSnapshot || line.productCode || line.product?.code}</div>}
              </td>
              <td className="text-right py-1">{Number(line.quantity)}</td>
              <td className="text-right py-1">৳{Number(line.lineTotal || (line.unitPrice * line.quantity)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>৳{Number(sale.subtotal).toLocaleString()}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-৳{Number(sale.discount).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[14px] mt-1 pt-1 border-t border-black">
          <span>Total:</span>
          <span>৳{Number(sale.total).toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center text-[10px]">
        <p>Thank you for your purchase!</p>
        <p>Powered by My Business OS</p>
      </div>
    </div>
  );
}
