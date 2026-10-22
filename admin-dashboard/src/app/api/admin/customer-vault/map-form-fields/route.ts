import { NextResponse } from 'next/server';
import { getValidBackendUrl } from '../../../../../lib/utils';

const CANONICAL_FIELD_MAP: Record<string, string> = {
  // English identifiers
  'applicant_name': 'nameEn',
  'applicantname': 'nameEn',
  'full_name': 'nameEn',
  'fullname': 'nameEn',
  'name': 'nameEn',
  'father_name': 'fatherNameEn',
  'fathername': 'fatherNameEn',
  'mother_name': 'motherNameEn',
  'mothername': 'motherNameEn',
  'dob': 'dob',
  'date_of_birth': 'dob',
  'dateofbirth': 'dob',
  'birth_date': 'dob',
  'gender': 'gender',
  'sex': 'gender',
  'religion': 'religion',
  'marital_status': 'maritalStatus',
  'maritalstatus': 'maritalStatus',
  'blood_group': 'bloodGroup',
  'bloodgroup': 'bloodGroup',
  'nid': 'nidNumber',
  'nid_number': 'nidNumber',
  'national_id': 'nidNumber',
  'nationalid': 'nidNumber',
  'birth_registration': 'birthRegNumber',
  'birth_reg_no': 'birthRegNumber',
  'birth_reg': 'birthRegNumber',
  'passport_no': 'passportNumber',
  'passport_number': 'passportNumber',
  'mobile': 'phone',
  'mobile_no': 'phone',
  'phone': 'phone',
  'phone_number': 'phone',
  'email': 'email',
  'present_address': 'presentAddress',
  'current_address': 'presentAddress',
  'permanent_address': 'permanentAddress',
  'ssc_roll': 'sscRoll',
  'ssc_reg': 'sscRegistration',
  'ssc_board': 'sscBoard',
  'ssc_gpa': 'sscGpa',
  'ssc_year': 'sscPassingYear',
  'hsc_roll': 'hscRoll',
  'hsc_reg': 'hscRegistration',
  'hsc_board': 'hscBoard',
  'hsc_gpa': 'hscGpa',
  'hsc_year': 'hscPassingYear',
  'photo': 'photoFile',
  'signature': 'signatureFile',

  // Bangla identifiers
  'আবেদনকারীর নাম': 'nameBn',
  'নাম': 'nameBn',
  'পিতার নাম': 'fatherNameBn',
  'পিতা': 'fatherNameBn',
  'মাতার নাম': 'motherNameBn',
  'মাতা': 'motherNameBn',
  'জন্ম তারিখ': 'dob',
  'জন্মতারিখ': 'dob',
  'লিঙ্গ': 'gender',
  'ধর্ম': 'religion',
  'বৈবাহিক অবস্থা': 'maritalStatus',
  'রক্তের গ্রুপ': 'bloodGroup',
  'জাতীয় পরিচয়পত্র নম্বর': 'nidNumber',
  'এনআইডি': 'nidNumber',
  'জাতীয় পরিচয়পত্র': 'nidNumber',
  'জন্ম নিবন্ধন নম্বর': 'birthRegNumber',
  'জন্ম নিবন্ধন': 'birthRegNumber',
  'পাসপোর্ট নম্বর': 'passportNumber',
  'মোবাইল নম্বর': 'phone',
  'মোবাইল': 'phone',
  'ফোন নম্বর': 'phone',
  'ইমেইল': 'email',
  'বর্তমান ঠিকানা': 'presentAddress',
  'স্থায়ী ঠিকানা': 'permanentAddress',
  'এসএসসি রোল': 'sscRoll',
  'এইচএসসি রোল': 'hscRoll',
  'ছবি': 'photoFile',
  'স্বাক্ষর': 'signatureFile'
};

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON request body' }, { status: 400 });
  }

  const { fields, targetDomain, applicationType } = body || {};
  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ message: 'Fields array is required and cannot be empty' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const backendUrl = getValidBackendUrl();

  if (backendUrl && authHeader) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/customer-vault/map-form-fields`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local deterministic mapping
    }
  }

  // Local deterministic mapping
  const mappings = fields.slice(0, 150).map((f: any) => {
    const rawLabel = (f.label || f.name || f.placeholder || f.fieldId || '').trim();
    const cleanLower = rawLabel.toLowerCase().replace(/[:_*\-.]/g, ' ').replace(/\s+/g, ' ').trim();
    const slug = cleanLower.replace(/\s+/g, '_');

    let canonicalKey: string | null = null;
    let confidence = 0.0;
    let mappingSource: 'DETERMINISTIC_DICTIONARY' | 'HEURISTIC_RULE' | 'UNMAPPED' = 'UNMAPPED';

    if (CANONICAL_FIELD_MAP[rawLabel]) {
      canonicalKey = CANONICAL_FIELD_MAP[rawLabel];
      confidence = 0.98;
      mappingSource = 'DETERMINISTIC_DICTIONARY';
    } else if (CANONICAL_FIELD_MAP[slug]) {
      canonicalKey = CANONICAL_FIELD_MAP[slug];
      confidence = 0.95;
      mappingSource = 'DETERMINISTIC_DICTIONARY';
    } else if (cleanLower.includes('father') || cleanLower.includes('পিতা')) {
      canonicalKey = cleanLower.includes('bangla') || cleanLower.includes('বাংলা') ? 'fatherNameBn' : 'fatherNameEn';
      confidence = 0.88;
      mappingSource = 'HEURISTIC_RULE';
    } else if (cleanLower.includes('mother') || cleanLower.includes('মাতা')) {
      canonicalKey = cleanLower.includes('bangla') || cleanLower.includes('বাংলা') ? 'motherNameBn' : 'motherNameEn';
      confidence = 0.88;
      mappingSource = 'HEURISTIC_RULE';
    } else if (cleanLower.includes('name') || cleanLower.includes('নাম')) {
      canonicalKey = cleanLower.includes('bangla') || cleanLower.includes('বাংলা') ? 'nameBn' : 'nameEn';
      confidence = 0.85;
      mappingSource = 'HEURISTIC_RULE';
    } else if (cleanLower.includes('nid') || cleanLower.includes('national id') || cleanLower.includes('পরিচয়পত্র')) {
      canonicalKey = 'nidNumber';
      confidence = 0.92;
      mappingSource = 'HEURISTIC_RULE';
    } else if (cleanLower.includes('birth reg') || cleanLower.includes('নিবন্ধন')) {
      canonicalKey = 'birthRegNumber';
      confidence = 0.90;
      mappingSource = 'HEURISTIC_RULE';
    } else if (cleanLower.includes('mobile') || cleanLower.includes('phone') || cleanLower.includes('মোবাইল')) {
      canonicalKey = 'phone';
      confidence = 0.92;
      mappingSource = 'HEURISTIC_RULE';
    } else if (cleanLower.includes('email') || cleanLower.includes('ইমেইল')) {
      canonicalKey = 'email';
      confidence = 0.95;
      mappingSource = 'HEURISTIC_RULE';
    }

    return {
      fieldId: f.fieldId,
      canonicalKey,
      confidence,
      mappingSource,
      requiresReview: confidence < 0.90
    };
  });

  return NextResponse.json({
    totalFields: fields.length,
    mappedFields: mappings.filter((m: any) => m.canonicalKey !== null).length,
    unmappedFields: mappings.filter((m: any) => m.canonicalKey === null).length,
    targetDomain: targetDomain || 'generic',
    applicationType: applicationType || 'GENERAL_CIVIC',
    mappings
  });
}
