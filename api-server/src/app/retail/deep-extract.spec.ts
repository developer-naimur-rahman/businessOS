import { CustomerVaultService } from './customer-vault.service';

describe('CustomerVaultService - Deep Candidate Extraction & Human Confirmation', () => {
  let service: CustomerVaultService;
  let mockPrisma: any;
  let mockHybridIntelligence: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      customer: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'cust-123', ...args.data })),
      },
    };
    mockHybridIntelligence = {};
    service = new CustomerVaultService(mockPrisma as any, mockHybridIntelligence as any);
  });

  describe('deepExtractCandidate', () => {
    it('should extract candidate with English UPPERCASE name, atomic address, and discrete education fields', async () => {
      const sampleText = `
        প্রার্থীর নাম: মোঃ নাঈমুর রহমান
        পিতার নাম: মোঃ খলিলুর রহমান
        জন্মতারিখ: 1998-05-15
        এনআইডি: 19982690000000000
        ঠিকানা: বাঘিয়া, কাশিমপুর, গাজীপুর
        শিক্ষাগত যোগ্যতা:
        ডিগ্রি: এইচএসসি (HSC)
        বোর্ড: ঢাকা বোর্ড (Dhaka Board)
        রোল নম্বর: 104523
        রেজিস্ট্রেশন নম্বর: 1214567890
        পাসের সন: 2016
        ফলাফল: জিপিএ 5.00
      `;

      const candidate = await service.deepExtractCandidate(sampleText, 'NID_AND_ACADEMIC');

      // 1. Identity & Name Normalization
      expect(candidate.identity.nameBn).toContain('মোঃ নাঈমুর রহমান');
      expect(candidate.identity.nameEnUpper).toBe('MD. NAIMUR RAHMAN');
      expect(candidate.identity.dob).toBe('1998-05-15');
      expect(candidate.identity.nidNumber).toBe('19982690000000000');

      // 2. Atomic Address Decomposition & Geographic Clue Expansion
      expect(candidate.presentAddress.villageArea).toBe('বাঘিয়া');
      expect(candidate.presentAddress.postOffice).toBe('কাশিমপুর');
      expect(candidate.presentAddress.postalCode).toBe('1704');
      expect(candidate.presentAddress.district).toBe('গাজীপুর');
      expect(candidate.presentAddress.division).toBe('ঢাকা');
      expect(candidate.presentAddress.inferredFields).toContain('postalCode');

      // 3. Discrete Education
      expect(candidate.education.length).toBeGreaterThanOrEqual(1);
      const edu = candidate.education[0];
      expect(edu.degree).toBe('HSC');
      expect(edu.boardOrUniversity).toBe('Dhaka Board');
      expect(edu.passingYear).toBe('2016');
      expect(edu.resultGpa).toBe('5.00');
      expect(edu.rollNumber).toBe('104523');
      expect(edu.regNumber).toBe('1214567890');

      // 4. Human Confirmation Workflow
      expect(candidate.requiresUserConfirmation).toBe(true);
    });
  });

  describe('confirmAndApplyExtractedProfile', () => {
    it('should commit confirmed candidate data into vault with atomic structured address', async () => {
      const candidate: any = {
        identity: {
          nameBn: 'মোঃ নাঈমুর রহমান',
          nameEnUpper: 'MD. NAIMUR RAHMAN',
          nameEnTitle: 'Md. Naimur Rahman',
          phone: '01712345678',
          dob: '1998-05-15',
          gender: 'MALE',
          nidNumber: '19982690000000000',
        },
        presentAddress: {
          villageArea: 'বাঘিয়া',
          postOffice: 'কাশিমপুর',
          postalCode: '1704',
          upazilaThana: 'কাশিমপুর',
          district: 'গাজীপুর',
          division: 'ঢাকা',
          country: 'বাংলাদেশ',
        },
        permanentAddress: {
          villageArea: 'বাঘিয়া',
          postOffice: 'কাশিমপুর',
          postalCode: '1704',
          upazilaThana: 'কাশিমপুর',
          district: 'গাজীপুর',
          division: 'ঢাকা',
          country: 'বাংলাদেশ',
        },
        education: [
          {
            degree: 'HSC',
            examTitle: 'Higher Secondary Certificate',
            boardOrUniversity: 'Dhaka Board',
            institution: 'Dhaka College',
            passingYear: '2016',
            resultGpa: '5.00',
            rollNumber: '104523',
            regNumber: '1214567890',
          },
        ],
        experience: [],
        skills: ['TypeScript', 'Next.js'],
        inferredClues: [],
        confidence: 0.95,
        rawSummary: 'Verified candidate',
        engine: 'ALGORITHMIC_FALLBACK',
        requiresUserConfirmation: true,
      };

      const saved = await service.confirmAndApplyExtractedProfile('org-test', '01712345678', candidate);

      expect(saved.nameEn).toBe('MD. NAIMUR RAHMAN');
      expect(saved.phone).toBe('01712345678');
      expect(saved.presentStructuredAddress?.villageArea).toBe('বাঘিয়া');
      expect(saved.presentStructuredAddress?.postalCode).toBe('1704');
      expect(saved.presentAddress).toContain('বাঘিয়া');
      expect(saved.presentAddress).toContain('কাশিমপুর');
      expect(saved.educationHistory[0].boardOrUniversity).toBe('Dhaka Board');
      expect(saved.educationHistory[0].rollNumber).toBe('104523');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
