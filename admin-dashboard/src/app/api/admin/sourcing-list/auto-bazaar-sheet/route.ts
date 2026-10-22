import { NextResponse } from 'next/server';

export async function GET() {
  const groupedByMarket: Record<string, any[]> = {
    'Elephant Road Computer City': [
      {
        productName: 'DDR4 8GB 3200MHz Desktop RAM (Corsair / Kingston)',
        suggestedBuyQty: 2,
        unitCostBdt: 2150,
        subtotalCostBdt: 4300,
        sourceType: 'CUSTOMER_WANTED',
        urgency: 'HIGH'
      },
      {
        productName: 'Epson 003 Original 4-Color Ink Bottle Set',
        suggestedBuyQty: 5,
        unitCostBdt: 2800,
        subtotalCostBdt: 14000,
        sourceType: 'LOW_STOCK_ALERT',
        urgency: 'MEDIUM'
      },
      {
        productName: 'A4 80GSM Double A Paper Ream (5 Pcs Box)',
        suggestedBuyQty: 4,
        unitCostBdt: 1950,
        subtotalCostBdt: 7800,
        sourceType: 'LOW_STOCK_ALERT',
        urgency: 'HIGH'
      }
    ],
    'Motijheel / Stadium Market': [
      {
        productName: 'Canon NPG-59 Original Copier Black Toner Bottle',
        suggestedBuyQty: 3,
        unitCostBdt: 1650,
        subtotalCostBdt: 4950,
        sourceType: 'CUSTOMER_WANTED',
        urgency: 'HIGH'
      },
      {
        productName: 'Thermal Receipt Roll 80mm High Density (50 Pcs Box)',
        suggestedBuyQty: 2,
        unitCostBdt: 1400,
        subtotalCostBdt: 2800,
        sourceType: 'LOW_STOCK_ALERT',
        urgency: 'LOW'
      }
    ]
  };

  const totalItemsCount = 5;
  const totalEstimatedBazaarCostBdt = 4300 + 14000 + 7800 + 4950 + 2800;
  const wantedPendingCount = 2;
  const marketsCount = Object.keys(groupedByMarket).length;

  return NextResponse.json({
    totalItemsCount,
    totalEstimatedBazaarCostBdt,
    wantedPendingCount,
    marketsCount,
    groupedByMarket
  });
}
