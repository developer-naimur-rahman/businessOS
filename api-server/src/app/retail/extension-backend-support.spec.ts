import { Test, TestingModule } from '@nestjs/testing';
import { CustomerVaultService } from './customer-vault.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AI Application Assistant — Extension Backend Support (Phase 2)', () => {
  let service: CustomerVaultService;
  let mockPrisma: any;

  const mockOrgId = 'org-test-101';
  const mockStaffId = 'staff-usr-555';
  const mockCustomerId = 'cust-test-001';
  const mockVaultId = 'VAULT-test-001';

  const mockCustomerRecord = {
    id: mockCustomerId,
    organizationId: mockOrgId,
    phone: '01812345678',
    name: 'MD. KARIM RAHMAN',
    email: 'karim@prismex.local',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockVaultProfile = {
    id: mockVaultId,
    customerId: mockCustomerId,
    organizationId: mockOrgId,
    nameEn: 'MD. KARIM RAHMAN',
    nameBn: 'মোঃ করিম রহমান',
    fatherNameEn: 'MD. ABDUR RAHIM',
    fatherNameBn: 'মোঃ আব্দুর রহিম',
    motherNameEn: 'MST. ROKEYA BEGUM',
    motherNameBn: 'মোসাঃ রোকেয়া বেগম',
    dob: '1998-04-15',
    gender: 'MALE',
    nidNumber: '19982692019000124',
    phone: '01812345678',
    presentAddress: 'Sector 7, Uttara, Dhaka-1230',
    permanentAddress: 'Baghiya, Kashimpur, Gazipur',
    documents: [
      {
        id: 'doc-photo-300',
        docType: 'PHOTO',
        title: 'Applicant Passport Photo',
        mimeType: 'image/jpeg',
        sizeBytes: 85 * 1024,
        fileUrlOrBase64: 'https://storage.prismex.local/photo.jpg',
        isVerified: true
      },
      {
        id: 'doc-sig-300',
        docType: 'SIGNATURE',
        title: 'Applicant Signature Scan',
        mimeType: 'image/png',
        sizeBytes: 42 * 1024,
        fileUrlOrBase64: 'https://storage.prismex.local/sig.png',
        isVerified: true
      }
    ],
    dynamicFields: [],
    educationHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockAuditRecord = {
    id: 'audit-log-1',
    organizationId: mockOrgId,
    entityType: 'CustomerVaultProfile',
    entityId: mockVaultId,
    action: 'VAULT_PROFILE_UPSERT',
    newData: mockVaultProfile,
    createdAt: new Date()
  };

  beforeEach(async () => {
    mockPrisma = {
      customer: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.organizationId === mockOrgId && (where.phone === '01812345678' || where.id === mockCustomerId)) {
            return Promise.resolve(mockCustomerRecord);
          }
          return Promise.resolve(null);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockCustomerId) return Promise.resolve(mockCustomerRecord);
          return Promise.resolve(null);
        })
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: mockStaffId, name: 'Staff User' }),
        findUnique: jest.fn().mockResolvedValue({ id: mockStaffId, name: 'Staff User' })
      },
      auditLog: {
        findFirst: jest.fn().mockResolvedValue(mockAuditRecord),
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.organizationId === mockOrgId && where.entityType === 'CustomerVaultProfile') {
            return Promise.resolve([mockAuditRecord]);
          }
          return Promise.resolve([]);
        }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'audit-new-123', createdAt: new Date(), ...data }))
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerVaultService,
        {
          provide: PrismaService,
          useValue: mockPrisma
        },
        {
          provide: HybridIntelligenceService,
          useValue: {
            consult: jest.fn().mockResolvedValue({ answer: 'Mock response' }),
            processWithGemini: jest.fn().mockResolvedValue({}),
          }
        }
      ]
    }).compile();

    service = module.get<CustomerVaultService>(CustomerVaultService);
  });


  describe('3.1 Customer Vault Access (getExtensionProfile)', () => {
    it('should retrieve authorized customer profile, addresses, and documents by phone', async () => {
      const result = await service.getExtensionProfile(mockOrgId, '01812345678');
      expect(result).toBeDefined();
      expect(result.customerId).toBe(mockCustomerId);
      expect(result.profile.nameEn).toBe('MD. KARIM RAHMAN');
      expect(result.profile.nidNumber).toBe('19982692019000124');
      expect(result.documents.length).toBe(2);
      expect(result.canonicalValues.nameEn).toBe('MD. KARIM RAHMAN');
      expect(result.canonicalValues.phone).toBe('01812345678');
    });

    it('should reject retrieval with NotFoundException when customer does not exist in the organization', async () => {
      await expect(service.getExtensionProfile(mockOrgId, '01999999999')).rejects.toThrow(NotFoundException);
    });

    it('should prevent cross-organization customer retrieval', async () => {
      await expect(service.getExtensionProfile('org-another-202', '01812345678')).rejects.toThrow(NotFoundException);
    });
  });

  describe('3.2 Approved Vault Updates (syncExtensionUpdates)', () => {
    it('should reject empty updates array with BadRequestException', async () => {
      await expect(
        service.syncExtensionUpdates(mockOrgId, mockStaffId, mockCustomerId, 'https://alljobs.teletalk.com.bd', [])
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect stale concurrency conflict when oldValue differs from server value', async () => {
      const result = await service.syncExtensionUpdates(
        mockOrgId,
        mockStaffId,
        mockCustomerId,
        'https://alljobs.teletalk.com.bd',
        [
          {
            canonicalKey: 'presentAddress',
            oldValue: 'Old Stale Address', // server has 'Sector 7, Uttara, Dhaka-1230'
            newValue: 'New Address, Dhaka'
          }
        ]
      );

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0].canonicalKey).toBe('presentAddress');
      expect(result.conflicts[0].reason).toContain('Stale update');
    });

    it('should flag sensitive identity fields like nidNumber when not staffConfirmed', async () => {
      const result = await service.syncExtensionUpdates(
        mockOrgId,
        mockStaffId,
        mockCustomerId,
        'https://alljobs.teletalk.com.bd',
        [
          {
            canonicalKey: 'nidNumber',
            oldValue: '19982692019000124',
            newValue: '19982692019999999',
            staffConfirmed: false
          }
        ]
      );

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.conflicts[0].requiresConfirmation).toBe(true);
    });

    it('should successfully update vault and record audit history when staff explicitly confirms update', async () => {
      const result = await service.syncExtensionUpdates(
        mockOrgId,
        mockStaffId,
        mockCustomerId,
        'https://alljobs.teletalk.com.bd',
        [
          {
            canonicalKey: 'nidNumber',
            oldValue: '19982692019000124',
            newValue: '19982692019999999',
            staffConfirmed: true
          }
        ]
      );

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'EXTENSION_VAULT_SYNC',
            entityType: 'CustomerVaultProfile',
            userId: mockStaffId
          })
        })
      );
    });
  });

  describe('3.3 Form Mapping API (mapFormFields)', () => {
    it('should perform deterministic dictionary mapping for English labels', async () => {
      const result = await service.mapFormFields({
        hostname: 'alljobs.teletalk.com.bd',
        pageTitle: 'Teletalk Government Job Application',
        detectedFields: [
          { id: 'f1', label: 'Applicant Name', name: 'applicant_name' },
          { id: 'f2', label: "Father's Name", name: 'father_name' },
          { id: 'f3', label: 'Date of Birth', name: 'dob' },
          { id: 'f4', label: 'National ID Number', name: 'nid' },
          { id: 'f5', label: 'Mobile Number', name: 'mobile' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.mappedCount).toBe(5);
      const nameMapping = result.mappings.find((m) => m.fieldId === 'f1');
      expect(nameMapping?.canonicalKey).toBe('nameEn');
      expect(nameMapping?.confidence).toBeGreaterThanOrEqual(0.85);

      const nidMapping = result.mappings.find((m) => m.fieldId === 'f4');
      expect(nidMapping?.canonicalKey).toBe('nidNumber');
    });

    it('should perform semantic deterministic mapping for Bengali (বাংলা) form labels', async () => {
      const result = await service.mapFormFields({
        hostname: 'bdris.gov.bd',
        pageTitle: 'Online Birth Registration System',
        detectedFields: [
          { id: 'b1', label: 'আবেদনকারীর নাম (বাংলা)' },
          { id: 'b2', label: 'পিতার নাম (বাংলা)' },
          { id: 'b3', label: 'জন্ম তারিখ' },
          { id: 'b4', label: 'জাতীয় পরিচয়পত্র নম্বর' },
          { id: 'b5', label: 'বর্তমান ঠিকানা' }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.mappedCount).toBe(5);
      expect(result.mappings.find((m) => m.fieldId === 'b1')?.canonicalKey).toBe('nameBn');
      expect(result.mappings.find((m) => m.fieldId === 'b2')?.canonicalKey).toBe('fatherNameBn');
      expect(result.mappings.find((m) => m.fieldId === 'b3')?.canonicalKey).toBe('dob');
      expect(result.mappings.find((m) => m.fieldId === 'b4')?.canonicalKey).toBe('nidNumber');
      expect(result.mappings.find((m) => m.fieldId === 'b5')?.canonicalKey).toBe('presentAddress');
    });

    it('should cap fields analysis to max 150 items', async () => {
      const oversizeFields = Array.from({ length: 180 }, (_, idx) => ({
        id: `field_${idx}`,
        label: `Field Label ${idx}`
      }));

      const result = await service.mapFormFields({
        hostname: 'example.com',
        detectedFields: oversizeFields
      });

      expect(result.totalDetected).toBe(150);
    });
  });

  describe('3.4 Document Access (getDocumentAccess)', () => {
    it('should return short-lived access URL and Teletalk compliance specs for Photo (300x300, <=100KB)', async () => {
      const docAccess = await service.getDocumentAccess(mockOrgId, mockCustomerId, 'doc-photo-300');
      expect(docAccess).toBeDefined();
      expect(docAccess.docId).toBe('doc-photo-300');
      expect(docAccess.dimensions).toEqual({ width: 300, height: 300, maxKb: 100 });
      expect(docAccess.accessUrl).toBe('https://storage.prismex.local/photo.jpg');
      expect(docAccess.expiresAt).toBeDefined();
    });

    it('should return compliance specs for Signature (300x80, <=60KB)', async () => {
      const docAccess = await service.getDocumentAccess(mockOrgId, mockCustomerId, 'doc-sig-300');
      expect(docAccess).toBeDefined();
      expect(docAccess.dimensions).toEqual({ width: 300, height: 80, maxKb: 60 });
    });

    it('should reject access with NotFoundException if document does not exist for this customer', async () => {
      await expect(service.getDocumentAccess(mockOrgId, mockCustomerId, 'non-existent-doc')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('3.5 Application Event Logging (logExtensionEvent)', () => {
    it('should sanitize payloads and log extension workflow events into AuditLog', async () => {
      const res = await service.logExtensionEvent(mockOrgId, mockStaffId, {
        customerId: mockCustomerId,
        targetDomain: 'alljobs.teletalk.com.bd',
        targetUrl: 'https://alljobs.teletalk.com.bd/apply/102',
        eventType: 'AUTOFILL_PERFORMED',
        details: {
          fieldsFilledCount: 14,
          fieldsSkippedCount: 2,
          token: 'sensitive-token',       // should be removed
          password: 'secret-password'    // should be removed
        }
      });

      expect(res.success).toBe(true);
      expect(res.eventId).toBe('audit-new-123');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'EXTENSION_AUTOFILL_PERFORMED',
            entityType: 'ExtensionWorkflowEvent',
            entityId: mockCustomerId,
            newData: expect.objectContaining({
              targetDomain: 'alljobs.teletalk.com.bd',
              details: {
                fieldsFilledCount: 14,
                fieldsSkippedCount: 2
              }
            })
          })
        })
      );
    });

    it('should reject logging if customerId or eventType is missing', async () => {
      await expect(
        service.logExtensionEvent(mockOrgId, mockStaffId, {
          customerId: '',
          targetDomain: 'test.com',
          targetUrl: 'https://test.com',
          eventType: ''
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
