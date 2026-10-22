import { Test, TestingModule } from '@nestjs/testing';
import { UniversalDocumentService, DEFAULT_UNIVERSAL_TEMPLATES } from './universal-document.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CustomerVaultService } from './customer-vault.service';
import { PrintQueueService } from './print-queue.service';
import { NotificationService } from '../common/notifications/notification.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UniversalDocumentService', () => {
  let service: UniversalDocumentService;
  let mockPrisma: any;
  let mockVaultService: any;
  let mockPrintQueueService: any;
  let mockNotificationService: any;

  beforeEach(async () => {
    mockPrisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'log-123', ...args.data })),
        update: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.where.id, ...args.data })),
      },
    };

    mockVaultService = {
      getProfile: jest.fn(),
    };

    mockPrintQueueService = {
      submitPrintDrop: jest.fn().mockResolvedValue({ tokenNumber: 'PRT-999', success: true }),
    };

    mockNotificationService = {
      notifyCvStudioPurchase: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniversalDocumentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CustomerVaultService, useValue: mockVaultService },
        { provide: PrintQueueService, useValue: mockPrintQueueService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<UniversalDocumentService>(UniversalDocumentService);
  });

  describe('Universal Templates Registry', () => {
    it('should return all default templates including CV and non-CV categories', async () => {
      const templates = await service.getTemplates('org-1');
      expect(templates.length).toBeGreaterThanOrEqual(10);

      const categories = templates.map((t) => t.category);
      expect(categories).toContain('CAREER_JOB');
      expect(categories).toContain('BUSINESS_PROPOSAL');
      expect(categories).toContain('LETTERS_FORMS');
      expect(categories).toContain('STUDENT_ACADEMIC');
    });

    it('should filter templates by category', async () => {
      const careerTemplates = await service.getTemplates('org-1', 'CAREER_JOB');
      careerTemplates.forEach((t) => expect(t.category).toBe('CAREER_JOB'));

      const businessTemplates = await service.getTemplates('org-1', 'BUSINESS_PROPOSAL');
      businessTemplates.forEach((t) => expect(t.category).toBe('BUSINESS_PROPOSAL'));
    });
  });

  describe('Document Orders & Immutable Snapshots (Mode A vs Mode B)', () => {
    it('should create Mode A (Template-Based) order with exact snapshot data', async () => {
      const order = await service.createDocumentOrder('org-1', 'user-1', {
        customerName: 'Md. Naimur Rahman',
        customerPhone: '01712345678',
        customerEmail: 'naimur@example.com',
        category: 'CAREER_JOB',
        templateId: 'minimal-clean',
        serviceMode: 'TEMPLATE_BASED',
        snapshotData: {
          nameEn: 'Md. Naimur Rahman',
          phone: '01712345678',
          summaryEn: 'Software Engineer',
          education: [{ degree: 'B.Sc. CSE', institution: 'DUET', passingYear: '2021', resultGpa: '3.78' }],
        },
        paymentStatus: 'PAID',
      });

      expect(order.orderNumber).toMatch(/^DOC-\d{4}-\d+/);
      expect(order.serviceMode).toBe('TEMPLATE_BASED');
      expect(order.financials.basePriceBdt).toBe(50);
      expect(order.financials.paidAmountBdt).toBe(50);
      expect(order.financials.dueAmountBdt).toBe(0);
      expect(order.paymentStatus).toBe('PAID');
      expect(order.watermarkRemoved).toBe(true);
      expect(order.snapshotData.nameEn).toBe('Md. Naimur Rahman');
      expect(order.snapshotData.education?.[0].institution).toBe('DUET');
    });

    it('should create Mode B (Custom-Made) order with quotation and assigned designer', async () => {
      const order = await service.createDocumentOrder('org-1', 'user-1', {
        customerName: 'Acme Corp',
        customerPhone: '01987654321',
        category: 'BUSINESS_PROPOSAL',
        templateId: 'company-profile',
        serviceMode: 'CUSTOM_MADE',
        customDesignFeeBdt: 1200,
        assignedStaffName: 'Ripon Senior Designer',
        deliveryDeadline: '2026-10-30',
        customRequirementsNotes: 'Special dark indigo theme with gold accents for tender bid',
        snapshotData: {
          nameEn: 'Acme Solutions Ltd',
          summaryEn: 'Leading infrastructure contractors',
        },
        paymentStatus: 'PARTIALLY_PAID',
        paidAmountBdt: 500,
      });

      expect(order.serviceMode).toBe('CUSTOM_MADE');
      expect(order.financials.customDesignFeeBdt).toBe(1200);
      expect(order.financials.paidAmountBdt).toBe(500);
      expect(order.financials.dueAmountBdt).toBe(700);
      expect(order.paymentStatus).toBe('PARTIALLY_PAID');
      expect(order.watermarkRemoved).toBe(false); // Unlocked only when fully paid
      expect(order.customWorkDetails?.assignedStaffName).toBe('Ripon Senior Designer');
      expect(order.customWorkDetails?.quotationStatus).toBe('ESTIMATED');
    });

    it('should throw BadRequestException if customerName or phone is missing', async () => {
      await expect(
        service.createDocumentOrder('org-1', 'user-1', {
          customerName: '',
          customerPhone: '01712345678',
          category: 'CAREER_JOB',
          templateId: 'minimal-clean',
          serviceMode: 'TEMPLATE_BASED',
          snapshotData: {},
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Print Shop Integration', () => {
    it('should automatically enqueue print drop when printOptions.requested is true', async () => {
      const order = await service.createDocumentOrder('org-1', 'user-1', {
        customerName: 'Rahim Khan',
        customerPhone: '01711223344',
        category: 'CAREER_JOB',
        templateId: 'ats-friendly',
        serviceMode: 'TEMPLATE_BASED',
        snapshotData: { nameEn: 'Rahim Khan' },
        paymentStatus: 'PAID',
        printOptions: {
          requested: true,
          copies: 5,
          colorMode: 'FULL_COLOR',
          paperSize: 'A4',
          binding: 'LAMINATION',
        },
      });

      expect(mockPrintQueueService.submitPrintDrop).toHaveBeenCalled();
      expect(order.printFulfillment?.requested).toBe(true);
      expect(order.printFulfillment?.printTokenNumber).toBe('PRT-999');
      // Full color = 20 * 5 = 100, Lamination = 20 * 5 = 100. Printing fee = 200.
      expect(order.financials.printingFeeBdt).toBe(200);
    });
  });

  describe('Order Status & Revision Tracking', () => {
    it('should update status and record revision history', async () => {
      mockPrisma.auditLog.findFirst.mockResolvedValue({
        id: 'log-1',
        entityId: 'DOC-2026-1001',
        newData: {
          orderNumber: 'DOC-2026-1001',
          customerName: 'Test Customer',
          financials: { totalAmountBdt: 100, paidAmountBdt: 50, dueAmountBdt: 50 },
          paymentStatus: 'PARTIALLY_PAID',
          fulfillmentStatus: 'IN_PROGRESS',
          revisionHistory: [{ revNumber: 1, timestamp: new Date().toISOString() }],
        },
      });

      const res = await service.updateOrderStatus('org-1', 'user-1', 'DOC-2026-1001', {
        paidAmountBdt: 50, // Clears remaining 50 due
        fulfillmentStatus: 'READY_FOR_DELIVERY',
        notes: 'Final payment received at desk, ready for pickup',
      });

      expect(res.success).toBe(true);
      expect(res.order.fulfillmentStatus).toBe('READY_FOR_DELIVERY');
      expect(res.order.paymentStatus).toBe('PAID');
      expect(res.order.financials.dueAmountBdt).toBe(0);
      expect(res.order.watermarkRemoved).toBe(true);
      expect(res.order.revisionHistory.length).toBe(2);
    });
  });
});
