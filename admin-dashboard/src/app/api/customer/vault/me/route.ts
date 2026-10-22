import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    id: 'vault-demo-01',
    customerId: 'cust-karim-004',
    nameEn: 'Karim Rahman',
    nameBn: 'করিম রহমান',
    phone: '01812345678',
    email: 'karim@demo.local',
    nidNumber: '19902692012345678',
    dob: '1990-06-15',
    bloodGroup: 'B+',
    fatherNameEn: 'Abdul Rahman',
    motherNameEn: 'Halima Khatun',
    presentAddress: 'House 12, Road 4, Sector 7, Uttara, Dhaka',
    permanentAddress: 'Village: Bilashpur, Thana: Shibganj, Bogura',
    documents: [
      {
        id: 'doc-1',
        title: 'National ID Card (Smart Card Front & Back)',
        docType: 'NID',
        fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800',
        uploadedAt: '2026-09-10T10:00:00Z'
      },
      {
        id: 'doc-2',
        title: 'Formal Passport Size Studio Portrait Photo',
        docType: 'PHOTO',
        fileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
        uploadedAt: '2026-10-01T12:00:00Z'
      }
    ]
  });
}
