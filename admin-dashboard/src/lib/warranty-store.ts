export interface WarrantyItem {
  id: string;
  serialNumber: string;
  productName: string;
  sku: string;
  customerName: string;
  customerPhone: string;
  supplierName: string;
  purchaseDate: string;
  warrantyDurationDays: number;
  warrantyExpiryDate: string;
  daysRemaining: number;
  status: string;
  invoiceNumber?: string;
}

export const registeredWarrantyStore: WarrantyItem[] = [
  {
    id: 'w-1',
    serialNumber: 'SN-GIGABYTE-B550M-8899',
    productName: 'Gigabyte B550M DS3H Motherboard',
    sku: 'MB-GIGA-B550M',
    customerName: 'Shakil Mahmud',
    customerPhone: '01819223344',
    supplierName: 'Smart Technologies BD',
    purchaseDate: '2026-02-10',
    warrantyDurationDays: 1095,
    warrantyExpiryDate: '2029-02-10',
    daysRemaining: 840,
    status: 'ACTIVE'
  },
  {
    id: 'w-2',
    serialNumber: 'SN-LOG-MOU-9921',
    productName: 'Logitech B100 Optical Mouse',
    sku: 'MOU-LOG-B100',
    customerName: 'Karim Rahman',
    customerPhone: '01812345678',
    supplierName: 'Star Tech',
    purchaseDate: '2025-11-01',
    warrantyDurationDays: 1095,
    warrantyExpiryDate: '2028-11-01',
    daysRemaining: 739,
    status: 'ACTIVE'
  },
  {
    id: 'w-3',
    serialNumber: 'SN-HP-5CD1234XYZ',
    productName: 'HP Pavilion 15 Display Panel (FHD IPS)',
    sku: 'DSP-HP-15-FHD',
    customerName: 'Salma Begum',
    customerPhone: '0171635679',
    supplierName: 'UCC Dhaka',
    purchaseDate: '2026-05-10',
    warrantyDurationDays: 365,
    warrantyExpiryDate: '2027-05-10',
    daysRemaining: 200,
    status: 'ACTIVE'
  },
  {
    id: 'w-4',
    serialNumber: 'SN-SSD-SAMS-980PRO-2T',
    productName: 'Samsung 980 PRO 2TB NVMe PCIe 4.0 SSD',
    sku: 'SSD-SAM-980P-2T',
    customerName: 'Tanvir Ahmed',
    customerPhone: '01911223344',
    supplierName: 'Excel Technologies',
    purchaseDate: '2025-01-15',
    warrantyDurationDays: 1825,
    warrantyExpiryDate: '2030-01-15',
    daysRemaining: 1180,
    status: 'ACTIVE'
  }
];

export function addWarrantyRecord(record: WarrantyItem) {
  registeredWarrantyStore.unshift(record);
}
