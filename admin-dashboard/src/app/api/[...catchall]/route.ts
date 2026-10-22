import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../lib/utils';

interface RouteContext {
  params: Promise<{ catchall: string[] }>;
}

async function handleProxyOrMock(req: Request, context: RouteContext, method: string) {
  const { catchall } = await context.params;
  const path = catchall.join('/');
  const fullPath = `/${path}`;
  const url = new URL(req.url);
  const search = url.search;

  // 1. If a valid live backend is configured, attempt proxying first
  const backendBase = getValidBackendUrl();
  if (backendBase) {
    try {
      const targetUrl = `${backendBase}/api/${path}${search}`;
      const headers = new Headers();
      req.headers.forEach((value, key) => {
        if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
          headers.set(key, value);
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      let body = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = await req.text();
        } catch {
          // ignore
        }
      }

      const backendRes = await fetch(targetUrl, {
        method,
        headers,
        body,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Preserve authoritative backend response status and body (both success and error)
      const contentType = backendRes.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await backendRes.json().catch(() => ({}));
      } else {
        const text = await backendRes.text().catch(() => '');
        data = { message: text || backendRes.statusText };
      }
      return NextResponse.json(data, { status: backendRes.status });
    } catch {
      // Backend unreachable, timed out, or connection refused
    }
  }

  // 2. Reject unmatched write mutations (POST, PUT, PATCH, DELETE) when authoritative persistence is unavailable
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return NextResponse.json({
      success: false,
      error: 'BACKEND_PERSISTENCE_UNAVAILABLE',
      message: `Write action (${method} ${fullPath}) cannot be completed in standalone demonstration mode without an active backend persistence server.`
    }, { status: 503 });
  }

  // Handle GET endpoints with structured mock responses
  if (fullPath.includes('admin/quotations')) {
    return NextResponse.json([
      {
        id: 'qt-101',
        quoteNumber: 'Q-2026-001',
        customerName: 'Ahsanullah Institute',
        customerPhone: '01819234567',
        totalAmount: 18500,
        status: 'ACTIVE',
        validUntil: '2026-11-15',
        items: [{ name: 'A4 Printing Paper (10 Reams)', qty: 10, unitPrice: 520 }]
      },
      {
        id: 'qt-102',
        quoteNumber: 'Q-2026-002',
        customerName: 'Dhaka City College IT Lab',
        customerPhone: '01711223344',
        totalAmount: 42000,
        status: 'APPROVED',
        validUntil: '2026-11-20',
        items: [{ name: 'Logitech Wireless Keyboard & Mouse Combo', qty: 15, unitPrice: 2800 }]
      }
    ]);
  }

  if (fullPath.includes('admin/returns')) {
    return NextResponse.json([
      {
        id: 'rma-101',
        rmaNumber: 'RMA-2026-01',
        saleNumber: 'INV-2026-8801',
        productName: 'T800 Ultra Smartwatch',
        customerName: 'Tanvir Ahmed',
        customerPhone: '01711223344',
        reason: 'Display flickering after 2 days',
        status: 'RECEIVED',
        refundAmount: 1250,
        createdAt: new Date().toISOString()
      }
    ]);
  }

  if (fullPath.includes('admin/marketing/campaigns')) {
    return NextResponse.json([
      {
        id: 'cmp-101',
        name: 'Eid Special Gadget Flash Sale',
        channel: 'FACEBOOK_ADS',
        status: 'ACTIVE',
        budgetBdt: 12000,
        spentBdt: 7400,
        clicks: 4850,
        conversions: 88,
        roas: 4.2
      },
      {
        id: 'cmp-102',
        name: 'Student CV & Thesis Printing Promo',
        channel: 'WHATSAPP_BROADCAST',
        status: 'SCHEDULED',
        budgetBdt: 3000,
        spentBdt: 0,
        clicks: 0,
        conversions: 0,
        roas: 0
      }
    ]);
  }

  if (fullPath.includes('admin/marketing/segments')) {
    return NextResponse.json([
      { id: 'seg-1', name: 'VIP Repeat Customers (3+ Orders)', count: 142 },
      { id: 'seg-2', name: 'High School & College Students', count: 480 },
      { id: 'seg-3', name: 'Corporate & Bulk Printing Clients', count: 35 },
      { id: 'seg-4', name: 'Due / Baki Payment Pending', count: 18 }
    ]);
  }

  if (fullPath.includes('admin/hr-payroll')) {
    return NextResponse.json({
      attendance: [
        { id: 'att-1', employeeName: 'Kamal Hossain', designation: 'Store Manager', checkIn: '09:00 AM', status: 'PRESENT' },
        { id: 'att-2', employeeName: 'Rifat Hasan', designation: 'Computer Operator', checkIn: '09:15 AM', status: 'PRESENT' },
        { id: 'att-3', employeeName: 'Sumon Mia', designation: 'Delivery Rider', checkIn: '09:45 AM', status: 'LATE' }
      ],
      payroll: [
        { id: 'pay-1', employeeName: 'Kamal Hossain', baseSalary: 25000, commission: 3200, deductions: 0, netPay: 28200, status: 'PAID' },
        { id: 'pay-2', employeeName: 'Rifat Hasan', baseSalary: 18000, commission: 2100, deductions: 500, netPay: 19600, status: 'DRAFT' }
      ]
    });
  }

  if (fullPath.includes('admin/staff-commissions')) {
    return NextResponse.json({
      totalCommissionBdt: 8500,
      paidCommissionBdt: 5200,
      unpaidCommissionBdt: 3300,
      topPerformers: [
        { staffName: 'Kamal Hossain', salesCount: 42, commissionBdt: 3200 },
        { staffName: 'Rifat Hasan', salesCount: 31, commissionBdt: 2100 }
      ],
      rules: [
        { id: 'rule-1', name: 'Service Job Delivery Commission', ratePercent: 5 },
        { id: 'rule-2', name: 'Dropshipping High Margin Sales', ratePercent: 8 }
      ]
    });
  }

  if (fullPath.includes('admin/barcode-studio/presets')) {
    return NextResponse.json([
      { id: 'pre-1', name: 'Thermal Single Label 40x30mm (Retail SKU)', widthMm: 40, heightMm: 30, cols: 1 },
      { id: 'pre-2', name: 'Dual Column 50x25mm (Stationery / Mobile)', widthMm: 50, heightMm: 25, cols: 2 },
      { id: 'pre-3', name: 'Shipping Box Label 100x150mm (4x6 Courier)', widthMm: 100, heightMm: 150, cols: 1 }
    ]);
  }

  if (fullPath.includes('admin/storefront-config')) {
    return NextResponse.json({
      storeName: 'My Business OS',
      heroTitle: 'One-Stop Business & Printing Solution',
      heroSubtitle: 'Stationery, IT Gadgets, Document Studio & Nationwide Delivery',
      contactPhone: '01700000000',
      contactEmail: 'contact@businessos.com',
      address: 'Dhaka, Bangladesh',
      whatsappNumber: '01700000000'
    });
  }

  if (fullPath.includes('admin/coupons')) {
    return NextResponse.json([
      { id: 'cp-1', code: 'BIZOS10', discountPercent: 10, maxDiscountBdt: 500, isActive: true },
      { id: 'cp-2', code: 'WELCOME100', discountAmountBdt: 100, minSpendBdt: 1000, isActive: true }
    ]);
  }

  if (fullPath.includes('admin/inquiries')) {
    return NextResponse.json([
      {
        id: 'inq-1',
        customerName: 'Farhana Yeasmin',
        customerPhone: '01711223344',
        subject: 'Bulk A4 Paper Reams Order',
        message: 'Do you provide delivery to Gazipur for 50 reams?',
        status: 'NEW',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  if (fullPath.includes('admin/loyalty')) {
    return NextResponse.json({
      customers: [
        { id: 'loy-1', customerName: 'Local High School', phone: '0171974862', points: 340, tier: 'GOLD' },
        { id: 'loy-2', customerName: 'XYZ Small Business', phone: '0171677894', points: 180, tier: 'SILVER' }
      ],
      rules: { pointsPer100Bdt: 1, pointRedemptionValueBdt: 1 }
    });
  }

  if (fullPath.includes('admin/automation/order-bot')) {
    return NextResponse.json({
      queue: [
        {
          id: 'bot-1',
          customerName: 'Sabbir Ahmed',
          phone: '01812345678',
          orderAmount: 1850,
          riskScore: 'LOW',
          verificationStatus: 'CONFIRMED_VIA_WHATSAPP',
          createdAt: new Date().toISOString()
        }
      ]
    });
  }

  if (fullPath.includes('admin/suppliers')) {
    return NextResponse.json({
      suppliers: [
        { id: 'sup-1', supplierName: 'Smart Technologies BD', balanceDue: 45000, contact: '01711000001' },
        { id: 'sup-2', supplierName: 'Star Tech Wholesale Hub', balanceDue: 28000, contact: '01711000002' },
        { id: 'sup-3', supplierName: 'UCC Dhaka', balanceDue: 12000, contact: '01711000003' }
      ]
    });
  }

  if (fullPath.includes('finance/accounts')) {
    return NextResponse.json([
      { id: 'acc-1', code: '1010', name: 'Cash in Hand (Counter Drawer)', type: 'ASSET', balanceBdt: 24500 },
      { id: 'acc-2', code: '1020', name: 'Bkash Merchant Account', type: 'ASSET', balanceBdt: 18200 },
      { id: 'acc-3', code: '1030', name: 'Nagad Merchant Account', type: 'ASSET', balanceBdt: 9500 },
      { id: 'acc-4', code: '2010', name: 'Accounts Payable (Suppliers)', type: 'LIABILITY', balanceBdt: 85000 },
      { id: 'acc-5', code: '4010', name: 'Sales & Service Revenue', type: 'REVENUE', balanceBdt: 385000 }
    ]);
  }

  if (fullPath.includes('finance/journal-entries')) {
    return NextResponse.json([
      {
        id: 'je-1',
        entryNumber: 'JE-2026-001',
        date: new Date().toISOString().split('T')[0],
        narration: 'Daily Sales Cash Collection & Drawer Balance',
        debitBdt: 24500,
        creditBdt: 24500
      }
    ]);
  }

  if (fullPath.includes('purchases')) {
    return NextResponse.json([
      {
        id: 'po-1',
        purchaseNumber: 'PO-2026-001',
        supplierName: 'Smart Technologies BD',
        totalAmount: 52000,
        paidAmount: 25000,
        dueAmount: 27000,
        status: 'RECEIVED',
        date: '2026-10-18'
      }
    ]);
  }

  if (fullPath.includes('admin/dropshipping/orders')) {
    return NextResponse.json([
      {
        id: 'dso-1',
        productName: 'T800 Ultra Smartwatch',
        customerName: 'Tanvir Ahmed',
        customerPhone: '01711223344',
        supplierPrice: 650,
        sellingPrice: 1850,
        profitMargin: 1200,
        supplierStatus: 'ORDERED_WITH_SUPPLIER',
        customerStatus: 'PROCESSING'
      }
    ]);
  }

  if (fullPath.includes('admin/dropshipping/watchlist')) {
    return NextResponse.json([
      {
        id: 'wl-1',
        productName: 'ANC Bluetooth Wireless Earbuds Pro',
        sourcePlatform: 'ALIEXPRESS',
        supplierPriceBdt: 480,
        suggestedSellingPrice: 1450,
        trendingScore: 92
      }
    ]);
  }

  // Generic fallback for any other GET endpoint
  return NextResponse.json({
    isDemoData: true,
    data: [],
    items: [],
    total: 0,
    page: 1
  });
}

export async function GET(req: Request, context: RouteContext) {
  return handleProxyOrMock(req, context, 'GET');
}

export async function POST(req: Request, context: RouteContext) {
  return handleProxyOrMock(req, context, 'POST');
}

export async function PUT(req: Request, context: RouteContext) {
  return handleProxyOrMock(req, context, 'PUT');
}

export async function PATCH(req: Request, context: RouteContext) {
  return handleProxyOrMock(req, context, 'PATCH');
}

export async function DELETE(req: Request, context: RouteContext) {
  return handleProxyOrMock(req, context, 'DELETE');
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
    },
  });
}
