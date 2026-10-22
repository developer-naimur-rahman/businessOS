import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HybridIntelligenceService } from '../common/services/hybrid-intelligence.service';

export interface EducationEntry {
  degree: 'SSC' | 'HSC' | 'GRADUATION' | 'POST_GRADUATION' | 'OTHER';
  examTitle: string;
  boardOrUniversity: string;
  rollNumber?: string;
  regNumber?: string;
  passingYear: string;
  resultGpa: string;
}

export interface CustomerVaultItem {
  id: string;
  docType: 'PHOTO' | 'SIGNATURE' | 'NID' | 'BIRTH_CERTIFICATE' | 'ACADEMIC_CERT' | 'TRADE_LICENSE' | 'CITIZEN_CERT' | 'OTHER';
  title: string;
  fileUrlOrBase64: string;
  mimeType: string;
  sizeBytes?: number;
  uploadedAt: string;
  isVerified: boolean;
  extractedTextPreview?: string;
}

export interface CustomerVaultProfile {
  id: string;
  organizationId: string;
  phone: string;
  email?: string;
  nameBn: string;
  nameEn: string;
  fatherNameBn?: string;
  fatherNameEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  dob: string; // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  nidNumber?: string;
  birthRegNumber?: string;
  presentAddress: string;
  permanentAddress: string;
  educationHistory: EducationEntry[];
  documents: CustomerVaultItem[];
  photoUrl?: string;
  signatureUrl?: string;
  consentRecord: {
    consentGiven: boolean;
    consentGivenAt: string;
    purposeBn: string;
    aiProcessingConsented: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CustomerVaultService {
  private readonly logger = new Logger(CustomerVaultService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hybridIntelligence: HybridIntelligenceService
  ) {}

  /**
   * Find or retrieve customer vault profile by phone or customerId
   */
  async getProfile(organizationId: string, phoneOrId: string): Promise<CustomerVaultProfile | null> {
    const cleanPhone = phoneOrId.replace(/[^0-9]/g, '');

    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'CustomerVaultProfile',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const match = logs.find(l => {
      const data = (l.newData as any) || {};
      const savedPhone = (data.phone || '').replace(/[^0-9]/g, '');
      return data.id === phoneOrId || (cleanPhone.length >= 10 && savedPhone.includes(cleanPhone));
    });

    if (!match) return null;
    return (match.newData as any) as CustomerVaultProfile;
  }

  /**
   * Create or update customer profile in the secure vault with audit trail
   */
  async upsertProfile(
    organizationId: string,
    userId: string | null,
    profileData: Partial<CustomerVaultProfile> & { phone: string; nameEn: string }
  ): Promise<CustomerVaultProfile> {
    if (!profileData.phone || !profileData.nameEn) {
      throw new BadRequestException('Phone number and English name are mandatory for customer vault registration.');
    }

    const cleanPhone = profileData.phone.replace(/[^0-9]/g, '');
    const existing = await this.getProfile(organizationId, cleanPhone);

    const nowIso = new Date().toISOString();
    const id = existing?.id || `VAULT-${cleanPhone.slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const mergedDocs = [...(existing?.documents || [])];
    if (profileData.documents && profileData.documents.length > 0) {
      for (const newDoc of profileData.documents) {
        const docIdx = mergedDocs.findIndex(d => d.id === newDoc.id || d.docType === newDoc.docType);
        if (docIdx >= 0) {
          mergedDocs[docIdx] = { ...mergedDocs[docIdx], ...newDoc, uploadedAt: nowIso };
        } else {
          mergedDocs.push({
            ...newDoc,
            id: newDoc.id || `doc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            uploadedAt: nowIso,
            isVerified: false,
          });
        }
      }
    }

    const updatedProfile: CustomerVaultProfile = {
      id,
      organizationId,
      phone: profileData.phone.trim(),
      email: profileData.email || existing?.email,
      nameBn: profileData.nameBn || existing?.nameBn || '',
      nameEn: profileData.nameEn.trim(),
      fatherNameBn: profileData.fatherNameBn || existing?.fatherNameBn,
      fatherNameEn: profileData.fatherNameEn || existing?.fatherNameEn,
      motherNameBn: profileData.motherNameBn || existing?.motherNameBn,
      motherNameEn: profileData.motherNameEn || existing?.motherNameEn,
      dob: profileData.dob || existing?.dob || '',
      gender: profileData.gender || existing?.gender || 'MALE',
      nidNumber: profileData.nidNumber || existing?.nidNumber,
      birthRegNumber: profileData.birthRegNumber || existing?.birthRegNumber,
      presentAddress: profileData.presentAddress || existing?.presentAddress || '',
      permanentAddress: profileData.permanentAddress || existing?.permanentAddress || '',
      educationHistory: profileData.educationHistory || existing?.educationHistory || [],
      documents: mergedDocs,
      photoUrl: profileData.photoUrl || existing?.photoUrl,
      signatureUrl: profileData.signatureUrl || existing?.signatureUrl,
      consentRecord: profileData.consentRecord || existing?.consentRecord || {
        consentGiven: true,
        consentGivenAt: nowIso,
        purposeBn: 'সরকারি ও অনলাইন সেবা ফরম পূরণের জন্য নাগরিকের সম্মতিক্রমে তথ্য সংরক্ষণ।',
        aiProcessingConsented: true,
      },
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    // Also link with Prisma Customer model if not existing
    try {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          phone: { contains: cleanPhone.slice(-10) },
        },
      });

      if (!existingCustomer) {
        await this.prisma.customer.create({
          data: {
            organizationId,
            name: updatedProfile.nameEn,
            phone: updatedProfile.phone,
            email: updatedProfile.email,
            address: updatedProfile.presentAddress,
            notes: `Vault Profile ID: ${id}. NID: ${updatedProfile.nidNumber || 'N/A'}`,
          },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Could not sync Customer entity: ${e.message}`);
    }

    // Save in AuditLog with entityType='CustomerVaultProfile'
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        entityType: 'CustomerVaultProfile',
        entityId: id,
        action: existing ? 'UPDATE_VAULT_PROFILE' : 'CREATE_VAULT_PROFILE',
        oldData: (existing as any) || undefined,
        newData: updatedProfile as any,
      },
    });

    return updatedProfile;
  }

  /**
   * Document OCR & AI Structured Field Extraction Helper
   */
  async extractDocumentFields(fileBase64OrText: string, docTypeHint: string): Promise<{
    extractedNameBn?: string;
    extractedNameEn?: string;
    extractedDob?: string;
    extractedNidOrReg?: string;
    confidence: number;
    rawText: string;
    engine: 'AI_GEMINI' | 'ALGORITHMIC_FALLBACK';
  }> {
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

    if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes('placeholder')) {
      try {
        const prompt = `You are an expert OCR and identity document parser for Bangladesh (NID, Birth Certificate, Educational Certificates).
Extract the person's identity information from the following document data or OCR text:
Hint: Document is "${docTypeHint}".
Content snippet:
${fileBase64OrText.slice(0, 3000)}

Respond strictly in JSON format (no markdown, no backticks):
{
  "nameBn": "<Name in Bengali if found, else empty>",
  "nameEn": "<Name in English CAPS if found, else empty>",
  "dob": "<Date of Birth in YYYY-MM-DD if found, else empty>",
  "nidOrReg": "<NID or Birth Registration Number if found, else empty>",
  "confidence": <confidence score between 0.0 and 1.0>,
  "rawSummary": "<Concise summary of detected document>"
}`;

        const model = 'gemini-3.5-flash-lite';
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            return {
              extractedNameBn: parsed.nameBn || undefined,
              extractedNameEn: parsed.nameEn || undefined,
              extractedDob: parsed.dob || undefined,
              extractedNidOrReg: parsed.nidOrReg || undefined,
              confidence: Number(parsed.confidence) || 0.85,
              rawText: parsed.rawSummary || 'Parsed via Google Gemini',
              engine: 'AI_GEMINI',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini OCR helper failed: ${err.message}. Using regex heuristic.`);
      }
    }

    // Algorithmic Fallback Regex Heuristic
    const text = fileBase64OrText;
    const nidMatch = text.match(/\b(19\d{15}|20\d{15}|\d{13}|\d{10})\b/);
    const dobMatch = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);

    return {
      extractedNidOrReg: nidMatch ? nidMatch[0] : undefined,
      extractedDob: dobMatch ? dobMatch[0] : undefined,
      confidence: nidMatch || dobMatch ? 0.65 : 0.4,
      rawText: 'Extracted using local regex heuristics.',
      engine: 'ALGORITHMIC_FALLBACK',
    };
  }
}
