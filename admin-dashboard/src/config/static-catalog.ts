export interface CatalogItem {
  id: string
  name: string
  code: string
  description?: string
  type: 'PRODUCT' | 'SERVICE'
  sellingPrice: number
  costPrice?: number
  compareAtPrice?: number
  isActive: boolean
  imageUrl: string
  category?: {
    id: string
    name: string
    slug: string
  }
  variants?: Array<{
    id: string
    sku: string
    retailPrice: number
    costPrice?: number
    status: string
  }>
}

const RAW_STATIC_CATALOG: CatalogItem[] = [
  {
    id: '8a1d961a-3d6a-42d7-8f29-b47614eda74f',
    name: 'Wireless Mouse',
    code: 'ACC-MOU-001',
    description: 'Ergonomic 2.4GHz wireless optical mouse with quiet click and nano USB receiver.',
    type: 'PRODUCT',
    sellingPrice: 450,
    compareAtPrice: 550,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-acc', name: 'Accessories', slug: 'accessories' }
  },
  {
    id: '4312d5bb-2cd1-4f74-a8e6-53d7358ffd4c',
    name: 'USB Keyboard',
    code: 'ACC-KEY-001',
    description: 'Standard full-size USB membrane keyboard with English and Bangla key layout.',
    type: 'PRODUCT',
    sellingPrice: 650,
    compareAtPrice: 750,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-acc', name: 'Accessories', slug: 'accessories' }
  },
  {
    id: '676957a5-b343-46e5-8473-84cb81f7b391',
    name: '64GB Pendrive',
    code: 'STO-USB-64G',
    description: 'High-speed USB 3.0 flash drive with metal swivel casing for durable data transfer.',
    type: 'PRODUCT',
    sellingPrice: 650,
    compareAtPrice: 750,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1624823183493-5f212ceea2eb?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-sto', name: 'Storage Devices', slug: 'storage-devices' }
  },
  {
    id: 'a710f4ee-4649-468a-9c22-d14ca2073eae',
    name: '128GB Pendrive',
    code: 'STO-USB-128G',
    description: 'Ultra-fast USB 3.2 Gen 1 flash drive with 128GB capacity and shock resistance.',
    type: 'PRODUCT',
    sellingPrice: 1100,
    compareAtPrice: 1300,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1624823183493-5f212ceea2eb?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-sto', name: 'Storage Devices', slug: 'storage-devices' }
  },
  {
    id: '0cd8e32d-1c4f-4e6a-928a-4ab763e45ec0',
    name: 'HDMI Cable 2m',
    code: 'ACC-CBL-HD2',
    description: 'High-speed 4K UHD gold-plated HDMI cable 2.0 supporting 60Hz display.',
    type: 'PRODUCT',
    sellingPrice: 300,
    compareAtPrice: 380,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-acc', name: 'Accessories', slug: 'accessories' }
  },
  {
    id: '28462e3e-8fd0-42a0-bfc1-05ace021f30b',
    name: 'SSD 512GB',
    code: 'CMP-SSD-512',
    description: 'SATA III 2.5-inch Internal Solid State Drive with read speeds up to 550MB/s.',
    type: 'PRODUCT',
    sellingPrice: 3800,
    compareAtPrice: 4200,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-cmp', name: 'Computer Components', slug: 'computer-components' }
  },
  {
    id: '16920244-6a46-432b-812e-2f4473ed84ea',
    name: 'RAM 8GB DDR4',
    code: 'CMP-RAM-8GB',
    description: 'High performance 3200MHz DDR4 desktop memory module with aluminum heat sink.',
    type: 'PRODUCT',
    sellingPrice: 2200,
    compareAtPrice: 2600,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-cmp', name: 'Computer Components', slug: 'computer-components' }
  },
  {
    id: 'a6a21164-616c-439f-8bf7-9f1cebe29fcf',
    name: 'RAM 16GB DDR4',
    code: 'CMP-RAM-16GB',
    description: 'High performance 3200MHz DDR4 desktop RAM for multitasking and heavy workflows.',
    type: 'PRODUCT',
    sellingPrice: 3900,
    compareAtPrice: 4500,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-cmp', name: 'Computer Components', slug: 'computer-components' }
  },
  {
    id: '275a6603-c6f0-4e28-99e4-73c286722343',
    name: 'Cat6 Ethernet Cable',
    code: 'ACC-CBL-CAT6',
    description: '10-meter patch cord Cat6 RJ45 network cable for high-speed Gigabit LAN connection.',
    type: 'PRODUCT',
    sellingPrice: 250,
    compareAtPrice: 320,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-acc', name: 'Accessories', slug: 'accessories' }
  },
  {
    id: 'e81a185a-984f-4503-88e7-1015f492047c',
    name: 'Wi-Fi Router AC1200',
    code: 'NET-RTR-1200',
    description: 'Dual-band Wi-Fi router with 4 high-gain antennas for wide home and shop coverage.',
    type: 'PRODUCT',
    sellingPrice: 2400,
    compareAtPrice: 2800,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-net', name: 'Networking', slug: 'networking' }
  },
  {
    id: '11bce527-cab5-40d0-b1bb-113d62f8bdd8',
    name: 'Bluetooth Earbuds',
    code: 'AUD-EAR-TWS',
    description: 'True Wireless Stereo Bluetooth 5.3 earbuds with touch control and charging case.',
    type: 'PRODUCT',
    sellingPrice: 1250,
    compareAtPrice: 1600,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-aud', name: 'Audio & Gadgets', slug: 'audio-gadgets' }
  },
  {
    id: 'd35d9820-21a0-4c3b-8c8a-ecda5c3bf623',
    name: 'Wired Headphones',
    code: 'AUD-HED-W01',
    description: 'Comfortable over-ear wired headset with noise-canceling condenser microphone.',
    type: 'PRODUCT',
    sellingPrice: 850,
    compareAtPrice: 1050,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-aud', name: 'Audio & Gadgets', slug: 'audio-gadgets' }
  },
  {
    id: '44aef709-7e6c-4c69-a551-f048d5dcacf0',
    name: 'Photo Paper 4R',
    code: 'STN-PPR-4R',
    description: 'Glossy 230gsm high-definition 4R photo printing paper pack (50 sheets).',
    type: 'PRODUCT',
    sellingPrice: 180,
    compareAtPrice: 220,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-stn', name: 'Stationery', slug: 'stationery' }
  },
  {
    id: '2f5c9d50-2831-4597-90de-42a41130645b',
    name: 'A4 Printing Paper (Ream)',
    code: 'STN-PPR-A4',
    description: 'Premium 80gsm multipurpose A4 white paper ream (500 sheets) for printing and photocopy.',
    type: 'PRODUCT',
    sellingPrice: 520,
    compareAtPrice: 580,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-stn', name: 'Stationery', slug: 'stationery' }
  },
  {
    id: 'b4112124-9ac7-4b8c-8797-1b0db6adbde5',
    name: 'Ballpoint Pen Box',
    code: 'STN-PEN-BX',
    description: 'Smooth writing 0.7mm blue ink ballpoint pens box (20 pieces).',
    type: 'PRODUCT',
    sellingPrice: 120,
    compareAtPrice: 150,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1585336261026-77825593c66f?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-stn', name: 'Stationery', slug: 'stationery' }
  },
  // Services
  {
    id: '68baaeb0-e371-4df8-810d-a6d116655676',
    name: 'A4 Black & White Print',
    code: 'SRV-PRT-BW',
    description: 'Sharp laser monochrome document printing on 80gsm paper. Fast turnaround.',
    type: 'SERVICE',
    sellingPrice: 5,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-prt', name: 'Printing & Photocopy', slug: 'printing-photocopy' }
  },
  {
    id: '9e165744-f2ae-4b39-8c25-6faa9a994637',
    name: 'A4 Color Print',
    code: 'SRV-PRT-CLR',
    description: 'Vibrant color inkjet and laser document printing for presentations and certificates.',
    type: 'SERVICE',
    sellingPrice: 15,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-prt', name: 'Printing & Photocopy', slug: 'printing-photocopy' }
  },
  {
    id: 'ed917ed8-895e-4ffc-86a1-c52f7e66fdd3',
    name: 'Photocopy A4',
    code: 'SRV-COP-A4',
    description: 'Rapid high-clarity document xerox and duplex photocopy service.',
    type: 'SERVICE',
    sellingPrice: 3,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-prt', name: 'Printing & Photocopy', slug: 'printing-photocopy' }
  },
  {
    id: 'f976388e-0710-4fd5-843f-16bc6f1610a1',
    name: 'Passport Photography',
    code: 'SRV-PHT-PAS',
    description: 'Official biometric passport and visa size photos with instant studio lighting and lab printing.',
    type: 'SERVICE',
    sellingPrice: 100,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-pht', name: 'Photography', slug: 'photography' }
  },
  {
    id: '83a6cdb0-7612-45b1-ac1b-9ae99464c330',
    name: 'Wedding Photography',
    code: 'SRV-PHT-WED',
    description: 'Complete event and cinematic wedding coverage with professional equipment and edited album.',
    type: 'SERVICE',
    sellingPrice: 15000,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-pht', name: 'Photography', slug: 'photography' }
  },
  {
    id: 'ff275ee1-4097-4731-9f38-dcbfece435c2',
    name: 'Online Form Fill-up',
    code: 'SRV-CMP-FRM',
    description: 'Assisted government, university admission, job application, and visa online form submission.',
    type: 'SERVICE',
    sellingPrice: 150,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-cmp', name: 'Computer Services', slug: 'computer-services' }
  },
  {
    id: '1f6e764a-2bb3-4476-8a88-0a6e110e5752',
    name: 'CV Writing',
    code: 'SRV-CMP-CVW',
    description: 'Professional modern ATS-friendly resume and curriculum vitae design & writing.',
    type: 'SERVICE',
    sellingPrice: 300,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-cmp', name: 'Computer Services', slug: 'computer-services' }
  },
  {
    id: '5d23147e-ed4a-4658-a6c4-87190517681c',
    name: 'Logo Design',
    code: 'SRV-DSG-LOG',
    description: 'Custom vector corporate logo and brand identity design with high-resolution source files.',
    type: 'SERVICE',
    sellingPrice: 2500,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-srv-cmp', name: 'Computer Services', slug: 'computer-services' }
  },
  {
    id: '61614bb2-85c9-4b39-83c0-43194da03a9c',
    name: 'HDMI Cable 5m',
    code: 'ACC-CBL-HD5',
    description: 'Extended 5-meter heavy-duty braided HDMI cable for projectors and displays.',
    type: 'PRODUCT',
    sellingPrice: 550,
    compareAtPrice: 650,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-acc', name: 'Accessories', slug: 'accessories' }
  },
  {
    id: '3ecc7917-8819-49e6-aaa6-46115c264128',
    name: 'SSD 256GB',
    code: 'CMP-SSD-256',
    description: 'High-speed 2.5-inch SATA internal SSD to upgrade laptop or PC performance.',
    type: 'PRODUCT',
    sellingPrice: 2200,
    compareAtPrice: 2500,
    isActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop',
    category: { id: 'cat-cmp', name: 'Computer Components', slug: 'computer-components' }
  }
]

export const STATIC_CATALOG: CatalogItem[] = RAW_STATIC_CATALOG.map(item => ({
  ...item,
  variants: (item.variants && item.variants.length > 0) ? item.variants : [
    {
      id: item.id,
      sku: item.code || `SKU-${item.id.slice(0, 8)}`,
      retailPrice: item.sellingPrice || 0,
      posPrice: item.sellingPrice || 0,
      costPrice: item.costPrice || Math.round((item.sellingPrice || 0) * 0.75),
      status: 'ACTIVE',
      attributes: []
    } as any
  ]
}))
