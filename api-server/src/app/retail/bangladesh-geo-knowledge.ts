/**
 * Bangladesh Geographic Knowledge Graph & Administrative Hierarchy
 * Supports 8 Divisions, 64 Districts, Thanas/Upazilas, Post Offices, and Postal Codes.
 * Used for clue expansion: inferring postal code, district, and division from village/thana clues.
 */

export interface BangladeshLocationNode {
  divisionBn: string;
  divisionEn: string;
  districtBn: string;
  districtEn: string;
  upazilaThanaBn: string;
  upazilaThanaEn: string;
  postOfficeBn: string;
  postOfficeEn: string;
  postalCode: string;
  aliasesBn?: string[];
  aliasesEn?: string[];
}

export interface StructuredAddress {
  villageArea: string;       // গ্রাম / পাড়া / এলাকা / রোড নং / বাড়ি নং
  postOffice: string;        // ডাকঘর
  postalCode: string;        // পোস্ট কোড (e.g. 1704)
  upazilaThana: string;      // উপজেলা / থানা
  district: string;          // জেলা (e.g. গাজীপুর)
  division: string;          // বিভাগ (e.g. ঢাকা)
  country: string;           // বাংলাদেশ
  inferredFields?: string[]; // e.g. ['postalCode', 'district', 'division']
  inferredClues?: string[];  // e.g. ["ডাকঘর 'কাশিমপুর' থেকে পোস্টকোড ১৭০৪ ও জেলা গাজীপুর সনাক্ত"]
}

// Convert Bengali numerals to English digits
export function banglaDigitsToEnglish(str: string): string {
  if (!str) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(bn[i], 'g'), String(i));
  }
  return res;
}

// Convert English digits to Bengali numerals
export function englishDigitsToBangla(str: string): string {
  if (!str) return '';
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(String(i), 'g'), bn[i]);
  }
  return res;
}

/**
 * Curated knowledge base of prominent administrative locations, post offices, and postal codes.
 */
export const BANGLADESH_GEO_RECORDS: BangladeshLocationNode[] = [
  // Gazipur
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'কাশিমপুর',
    upazilaThanaEn: 'Kashimpur',
    postOfficeBn: 'কাশিমপুর',
    postOfficeEn: 'Kashimpur',
    postalCode: '1704',
    aliasesBn: ['বাঘিয়া', 'কাশিমপুর', 'সারদাগঞ্জ', 'পানিশাইল', 'কাশিমপুর বাজার', 'নয়াপাড়া'],
    aliasesEn: ['baghiya', 'kashimpur', 'saradaganj', 'panishail']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'গাজীপুর সদর',
    upazilaThanaEn: 'Gazipur Sadar',
    postOfficeBn: 'জয়দেবপুর',
    postOfficeEn: 'Joydebpur',
    postalCode: '1700',
    aliasesBn: ['জয়দেবপুর', 'গাজীপুর সদর', 'শিববাড়ি', 'চান্দনা চৌরাস্তা', 'সালনা', 'রাজবাড়ী'],
    aliasesEn: ['joydebpur', 'gazipur sadar', 'chandana chowrasta', 'salna']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'টঙ্গী',
    upazilaThanaEn: 'Tongi',
    postOfficeBn: 'টঙ্গী',
    postOfficeEn: 'Tongi',
    postalCode: '1710',
    aliasesBn: ['টঙ্গী', 'চেরাগআলী', 'স্টেশন রোড টঙ্গী', 'হোসেন মার্কেট', 'বোর্ড বাজার'],
    aliasesEn: ['tongi', 'cherag ali', 'station road tongi', 'board bazar']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'কালিয়াকৈর',
    upazilaThanaEn: 'Kaliakair',
    postOfficeBn: 'কালিয়াকৈর',
    postOfficeEn: 'Kaliakair',
    postalCode: '1750',
    aliasesBn: ['কালিয়াকৈর', 'চন্দ্রা', 'সফিপুর', 'মৌচাক'],
    aliasesEn: ['kaliakair', 'chandra', 'safipur', 'mouchak']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'শ্রীপুর',
    upazilaThanaEn: 'Sreepur',
    postOfficeBn: 'শ্রীপুর',
    postOfficeEn: 'Sreepur',
    postalCode: '1740',
    aliasesBn: ['শ্রীপুর', 'মাওনা', 'কাওরাইদ', 'মাওনা চৌরাস্তা'],
    aliasesEn: ['sreepur', 'maona', 'kawraid']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'কাপাসিয়া',
    upazilaThanaEn: 'Kapasia',
    postOfficeBn: 'কাপাসিয়া',
    postOfficeEn: 'Kapasia',
    postalCode: '1730',
    aliasesBn: ['কাপাসিয়া', 'টোক'],
    aliasesEn: ['kapasia', 'tok']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'গাজীপুর',
    districtEn: 'Gazipur',
    upazilaThanaBn: 'কালীগঞ্জ',
    upazilaThanaEn: 'Kaliganj',
    postOfficeBn: 'কালীগঞ্জ',
    postOfficeEn: 'Kaliganj',
    postalCode: '1720',
    aliasesBn: ['কালীগঞ্জ', 'উলুখোলা', 'পূবাইল'],
    aliasesEn: ['kaliganj', 'pubail']
  },

  // Dhaka Metro
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'ধানমন্ডি',
    upazilaThanaEn: 'Dhanmondi',
    postOfficeBn: 'ধানমন্ডি',
    postOfficeEn: 'Dhanmondi',
    postalCode: '1205',
    aliasesBn: ['ধানমন্ডি', 'সোবহানবাগ', 'শংকুর', 'ঝিগাতলা'],
    aliasesEn: ['dhanmondi', 'sobanbag', 'jigatola']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'মিরপুর',
    upazilaThanaEn: 'Mirpur',
    postOfficeBn: 'মিরপুর',
    postOfficeEn: 'Mirpur',
    postalCode: '1216',
    aliasesBn: ['মিরপুর', 'মিরপুর-১', 'মিরপুর-১০', 'মিরপুর-২', 'মিরপুর-১১', 'শেওড়াপাড়া', 'কাজীপাড়া'],
    aliasesEn: ['mirpur', 'mirpur-1', 'mirpur-10', 'shewrapara', 'kazipara']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'উত্তরা',
    upazilaThanaEn: 'Uttara',
    postOfficeBn: 'উত্তরা',
    postOfficeEn: 'Uttara',
    postalCode: '1230',
    aliasesBn: ['উত্তরা', 'আজমপুর', 'আব্দুল্লাহপুর', 'দিয়াবাড়ী', 'উত্তরা সেক্টর'],
    aliasesEn: ['uttara', 'azampur', 'abdullahpur', 'diyabari']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'সাভার',
    upazilaThanaEn: 'Savar',
    postOfficeBn: 'সাভার',
    postOfficeEn: 'Savar',
    postalCode: '1340',
    aliasesBn: ['সাভার', 'আশুলিয়া', 'নবীনগর', 'জিরাবো', 'বাইপাইল', 'ডিইপিজেড', 'হেমায়েতপুর'],
    aliasesEn: ['savar', 'ashulia', 'navinagar', 'jirabo', 'baipail', 'hemayetpur']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'গুলশান',
    upazilaThanaEn: 'Gulshan',
    postOfficeBn: 'গুলশান',
    postOfficeEn: 'Gulshan',
    postalCode: '1212',
    aliasesBn: ['গুলশান', 'বাড্ডা', 'শাহজাদপুর', 'নতুন বাজার'],
    aliasesEn: ['gulshan', 'badda', 'notun bazar']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'বনানী',
    upazilaThanaEn: 'Banani',
    postOfficeBn: 'বনানী',
    postOfficeEn: 'Banani',
    postalCode: '1213',
    aliasesBn: ['বনানী', 'মহাখালী', 'কড়াইল'],
    aliasesEn: ['banani', 'mohakhali']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'মোহাম্মদপুর',
    upazilaThanaEn: 'Mohammadpur',
    postOfficeBn: 'মোহাম্মদপুর',
    postOfficeEn: 'Mohammadpur',
    postalCode: '1207',
    aliasesBn: ['মোহাম্মদপুর', 'কাটাসুর', 'বসিলা', 'নূরজাহান রোড', 'শামলী'],
    aliasesEn: ['mohammadpur', 'bosila', 'shyamoli']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'মতিঝিল',
    upazilaThanaEn: 'Motijheel',
    postOfficeBn: 'ঢাকা জিপিও',
    postOfficeEn: 'Dhaka GPO',
    postalCode: '1000',
    aliasesBn: ['মতিঝিল', 'দিলকুশা', 'পল্টন', 'প্রেসক্লাব', 'তোপখানা'],
    aliasesEn: ['motijheel', 'dilkusha', 'paltan']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'যাত্রাবাড়ী',
    upazilaThanaEn: 'Jatrabari',
    postOfficeBn: 'যাত্রাবাড়ী',
    postOfficeEn: 'Jatrabari',
    postalCode: '1204',
    aliasesBn: ['যাত্রাবাড়ী', 'শনির আখড়া', 'ধোলাইপাড়', 'রায়েরবাগ'],
    aliasesEn: ['jatrabari', 'shanir akhra']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ঢাকা',
    districtEn: 'Dhaka',
    upazilaThanaBn: 'তেজগাঁও',
    upazilaThanaEn: 'Tejgaon',
    postOfficeBn: 'তেজগাঁও',
    postOfficeEn: 'Tejgaon',
    postalCode: '1215',
    aliasesBn: ['তেজগাঁও', 'ফার্মগেট', 'কাওরান বাজার', 'বিজয় সরণি'],
    aliasesEn: ['tejgaon', 'farmgate', 'kawran bazar']
  },

  // Other Districts & Sub-divisions
  {
    divisionBn: 'রাজশাহী',
    divisionEn: 'Rajshahi',
    districtBn: 'বগুড়া',
    districtEn: 'Bogura',
    upazilaThanaBn: 'বগুড়া সদর',
    upazilaThanaEn: 'Bogura Sadar',
    postOfficeBn: 'বগুড়া প্রধান ডাকঘর',
    postOfficeEn: 'Bogura Head Post Office',
    postalCode: '5800',
    aliasesBn: ['বগুড়া', 'বগুড়া সদর', 'সাতমাথা', 'বানেশ্বর', 'শেরপুর বগুড়া'],
    aliasesEn: ['bogura', 'bogra', 'bogura sadar', 'satmatha']
  },
  {
    divisionBn: 'চট্টগ্রাম',
    divisionEn: 'Chattogram',
    districtBn: 'কুমিল্লা',
    districtEn: 'Cumilla',
    upazilaThanaBn: 'চৌদ্দগ্রাম',
    upazilaThanaEn: 'Chauddagram',
    postOfficeBn: 'চৌদ্দগ্রাম',
    postOfficeEn: 'Chauddagram',
    postalCode: '3550',
    aliasesBn: ['চৌদ্দগ্রাম', 'মিয়াবাজার', 'গুণবতী'],
    aliasesEn: ['chauddagram', 'chowddagram', 'miabazar']
  },
  {
    divisionBn: 'চট্টগ্রাম',
    divisionEn: 'Chattogram',
    districtBn: 'কুমিল্লা',
    districtEn: 'Cumilla',
    upazilaThanaBn: 'কুমিল্লা সদর',
    upazilaThanaEn: 'Cumilla Sadar',
    postOfficeBn: 'কুমিল্লা প্রধান ডাকঘর',
    postOfficeEn: 'Cumilla Head Post Office',
    postalCode: '3500',
    aliasesBn: ['কুমিল্লা', 'কুমিল্লা সদর', 'কান্দিরপাড়', 'টমছম ব্রিজ'],
    aliasesEn: ['cumilla', 'comilla', 'kandirpar']
  },
  {
    divisionBn: 'চট্টগ্রাম',
    divisionEn: 'Chattogram',
    districtBn: 'চট্টগ্রাম',
    districtEn: 'Chattogram',
    upazilaThanaBn: 'পটিয়া',
    upazilaThanaEn: 'Patiya',
    postOfficeBn: 'পটিয়া',
    postOfficeEn: 'Patiya',
    postalCode: '4370',
    aliasesBn: ['পটিয়া', 'ইন্দিরা পুল', 'মনসা'],
    aliasesEn: ['patiya', 'pathiya']
  },
  {
    divisionBn: 'চট্টগ্রাম',
    divisionEn: 'Chattogram',
    districtBn: 'চট্টগ্রাম',
    districtEn: 'Chattogram',
    upazilaThanaBn: 'কোতোয়ালী',
    upazilaThanaEn: 'Kotwali',
    postOfficeBn: 'চট্টগ্রাম জিপিও',
    postOfficeEn: 'Chattogram GPO',
    postalCode: '4000',
    aliasesBn: ['চট্টগ্রাম', 'আগ্রাবাদ', 'নিউ মার্কেট চট্টগ্রাম', 'জিইসি', 'চকবাজার চট্টগ্রাম'],
    aliasesEn: ['chattogram', 'chittagong', 'agrabad', 'gec']
  },
  {
    divisionBn: 'সিলেট',
    divisionEn: 'Sylhet',
    districtBn: 'সিলেট',
    districtEn: 'Sylhet',
    upazilaThanaBn: 'সিলেট সদর',
    upazilaThanaEn: 'Sylhet Sadar',
    postOfficeBn: 'সিলেট প্রধান ডাকঘর',
    postOfficeEn: 'Sylhet Head Post Office',
    postalCode: '3100',
    aliasesBn: ['সিলেট', 'সিলেট সদর', 'জিন্দাবাজার', 'আম্বরখানা', 'কোর্ট পয়েন্ট'],
    aliasesEn: ['sylhet', 'zindabazar', 'amberkhana']
  },
  {
    divisionBn: 'রাজশাহী',
    divisionEn: 'Rajshahi',
    districtBn: 'রাজশাহী',
    districtEn: 'Rajshahi',
    upazilaThanaBn: 'বোয়ালিয়া',
    upazilaThanaEn: 'Boalia',
    postOfficeBn: 'রাজশাহী জিপিও',
    postOfficeEn: 'Rajshahi GPO',
    postalCode: '6000',
    aliasesBn: ['রাজশাহী', 'সাহেব বাজার', 'জিরো পয়েন্ট রাজশাহী', 'তালাইমারী'],
    aliasesEn: ['rajshahi', 'shaheb bazar', 'talaimari']
  },
  {
    divisionBn: 'খুলনা',
    divisionEn: 'Khulna',
    districtBn: 'খুলনা',
    districtEn: 'Khulna',
    upazilaThanaBn: 'খুলনা সদর',
    upazilaThanaEn: 'Khulna Sadar',
    postOfficeBn: 'খুলনা প্রধান ডাকঘর',
    postOfficeEn: 'Khulna Head Post Office',
    postalCode: '9100',
    aliasesBn: ['খুলনা', 'দৌলতপুর', 'খালিশপুর', 'ডাকবাংলো মোড়'],
    aliasesEn: ['khulna', 'daulatpur', 'khalishpur']
  },
  {
    divisionBn: 'বরিশাল',
    divisionEn: 'Barishal',
    districtBn: 'বরিশাল',
    districtEn: 'Barishal',
    upazilaThanaBn: 'বরিশাল সদর',
    upazilaThanaEn: 'Barishal Sadar',
    postOfficeBn: 'বরিশাল প্রধান ডাকঘর',
    postOfficeEn: 'Barishal Head Post Office',
    postalCode: '8200',
    aliasesBn: ['বরিশাল', 'সদর রোড বরিশাল', 'নথুল্লাবাদ'],
    aliasesEn: ['barishal', 'barisal', 'nathullabad']
  },
  {
    divisionBn: 'রংপুর',
    divisionEn: 'Rangpur',
    districtBn: 'রংপুর',
    districtEn: 'Rangpur',
    upazilaThanaBn: 'রংপুর সদর',
    upazilaThanaEn: 'Rangpur Sadar',
    postOfficeBn: 'রংপুর প্রধান ডাকঘর',
    postOfficeEn: 'Rangpur Head Post Office',
    postalCode: '5400',
    aliasesBn: ['রংপুর', 'জাহাজ কোম্পানি মোড়', 'মডার্ন মোড়'],
    aliasesEn: ['rangpur']
  },
  {
    divisionBn: 'ময়মনসিংহ',
    divisionEn: 'Mymensingh',
    districtBn: 'ময়মনসিংহ',
    districtEn: 'Mymensingh',
    upazilaThanaBn: 'ময়মনসিংহ সদর',
    upazilaThanaEn: 'Mymensingh Sadar',
    postOfficeBn: 'ময়মনসিংহ প্রধান ডাকঘর',
    postOfficeEn: 'Mymensingh Head Post Office',
    postalCode: '2200',
    aliasesBn: ['ময়মনসিংহ', 'গাঙ্গিনার পাড়', 'টাউন হল ময়মনসিংহ'],
    aliasesEn: ['mymensingh']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'ফরিদপুর',
    districtEn: 'Faridpur',
    upazilaThanaBn: 'বোয়ালমারী',
    upazilaThanaEn: 'Boalmari',
    postOfficeBn: 'বোয়ালমারী',
    postOfficeEn: 'Boalmari',
    postalCode: '7860',
    aliasesBn: ['বোয়ালমারী'],
    aliasesEn: ['boalmari']
  },
  {
    divisionBn: 'ঢাকা',
    divisionEn: 'Dhaka',
    districtBn: 'নারায়ণগঞ্জ',
    districtEn: 'Narayanganj',
    upazilaThanaBn: 'নারায়ণগঞ্জ সদর',
    upazilaThanaEn: 'Narayanganj Sadar',
    postOfficeBn: 'নারায়ণগঞ্জ প্রধান ডাকঘর',
    postOfficeEn: 'Narayanganj Head Post Office',
    postalCode: '1400',
    aliasesBn: ['নারায়ণগঞ্জ', 'চাষাড়া', 'নিতাইগঞ্জ'],
    aliasesEn: ['narayanganj', 'chasara']
  }
];

// District mapping to division for general fallback
export const BANGLADESH_DISTRICT_TO_DIVISION: Record<string, { divisionBn: string; divisionEn: string; postalCode?: string }> = {
  'গাজীপুর': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1700' },
  'ঢাকা': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1000' },
  'নারায়ণগঞ্জ': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1400' },
  'নরসিংদী': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1600' },
  'মুন্সীগঞ্জ': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1500' },
  'মানিকগঞ্জ': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1800' },
  'টাঙ্গাইল': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '1900' },
  'কিশোরগঞ্জ': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '2300' },
  'ফরিদপুর': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '7800' },
  'মাদারীপুর': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '7900' },
  'শরীয়তপুর': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '8000' },
  'গোপালগঞ্জ': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '8100' },
  'রাজবাড়ী': { divisionBn: 'ঢাকা', divisionEn: 'Dhaka', postalCode: '7700' },

  'চট্টগ্রাম': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '4000' },
  'কুমিল্লা': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '3500' },
  'ফেনী': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '3900' },
  'ব্রাহ্মণবাড়িয়া': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '3400' },
  'নোয়াখালী': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '3800' },
  'লক্ষ্মীপুর': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '3700' },
  'চাঁদপুর': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '3600' },
  'কক্সবাজার': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '4700' },
  'রাঙ্গামাটি': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '4500' },
  'বান্দরবান': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '4600' },
  'খাগড়াছড়ি': { divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', postalCode: '4400' },

  'রাজশাহী': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '6000' },
  'বগুড়া': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '5800' },
  'পাবনা': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '6600' },
  'সিরাজগঞ্জ': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '6700' },
  'নওগাঁ': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '6500' },
  'নাটোর': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '6400' },
  'চাঁপাইনবাবগঞ্জ': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '6300' },
  'জয়পুরহাট': { divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', postalCode: '5900' },

  'খুলনা': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '9100' },
  'যশোর': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7400' },
  'কুষ্টিয়া': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7000' },
  'সাতক্ষীরা': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '9400' },
  'বাগেরহাট': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '9300' },
  'চুয়াডাঙ্গা': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7200' },
  'ঝিনাইদহ': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7300' },
  'মাগুরা': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7600' },
  'মেহেরপুর': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7100' },
  'নড়াইল': { divisionBn: 'খুলনা', divisionEn: 'Khulna', postalCode: '7500' },

  'বরিশাল': { divisionBn: 'বরিশাল', divisionEn: 'Barishal', postalCode: '8200' },
  'ভোলা': { divisionBn: 'বরিশাল', divisionEn: 'Barishal', postalCode: '8300' },
  'ঝালকাঠি': { divisionBn: 'বরিশাল', divisionEn: 'Barishal', postalCode: '8400' },
  'পিরোজপুর': { divisionBn: 'বরিশাল', divisionEn: 'Barishal', postalCode: '8500' },
  'বরগুনা': { divisionBn: 'বরিশাল', divisionEn: 'Barishal', postalCode: '8700' },
  'পটুয়াখালী': { divisionBn: 'বরিশাল', divisionEn: 'Barishal', postalCode: '8600' },

  'সিলেট': { divisionBn: 'সিলেট', divisionEn: 'Sylhet', postalCode: '3100' },
  'মৌলভীবাজার': { divisionBn: 'সিলেট', divisionEn: 'Sylhet', postalCode: '3200' },
  'হবিগঞ্জ': { divisionBn: 'সিলেট', divisionEn: 'Sylhet', postalCode: '3300' },
  'সুনামগঞ্জ': { divisionBn: 'সিলেট', divisionEn: 'Sylhet', postalCode: '3000' },

  'রংপুর': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5400' },
  'দিনাজপুর': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5200' },
  'গাইবান্ধা': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5700' },
  'কুড়িগ্রাম': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5600' },
  'লালমনিরহাট': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5500' },
  'নীলফামারী': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5300' },
  'পঞ্চগড়': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5000' },
  'ঠাকুরগাঁও': { divisionBn: 'রংপুর', divisionEn: 'Rangpur', postalCode: '5100' },

  'ময়মনসিংহ': { divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', postalCode: '2200' },
  'জামালপুর': { divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', postalCode: '2000' },
  'শেরপুর': { divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', postalCode: '2100' },
  'নেত্রকোণা': { divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', postalCode: '2400' },
};

/**
 * Intelligent Bangladesh Geographic Resolver
 * Decomposes an unparsed clue or address text into atomic fields:
 * - villageArea
 * - postOffice
 * - postalCode
 * - upazilaThana
 * - district
 * - division
 * - country
 */
export function resolveBangladeshAddress(rawText: string): StructuredAddress {
  const result: StructuredAddress = {
    villageArea: '',
    postOffice: '',
    postalCode: '',
    upazilaThana: '',
    district: '',
    division: '',
    country: 'বাংলাদেশ',
    inferredFields: [],
    inferredClues: [],
  };

  if (!rawText || !rawText.trim()) return result;

  const normalized = banglaDigitsToEnglish(rawText).trim();
  const lower = normalized.toLowerCase();

  // 1. Direct Postal Code Match (4 digits)
  const postcodeMatch = normalized.match(/\b([1-9]\d{3})\b/);
  if (postcodeMatch) {
    result.postalCode = postcodeMatch[1];
    // Find node matching this postal code
    const matchingNode = BANGLADESH_GEO_RECORDS.find(n => n.postalCode === result.postalCode);
    if (matchingNode) {
      result.postOffice = result.postOffice || matchingNode.postOfficeBn;
      result.upazilaThana = result.upazilaThana || matchingNode.upazilaThanaBn;
      result.district = result.district || matchingNode.districtBn;
      result.division = result.division || matchingNode.divisionBn;
      result.inferredFields!.push('upazilaThana', 'district', 'division');
      result.inferredClues!.push(`পোস্টকোড ${result.postalCode} থেকে থানা ${matchingNode.upazilaThanaBn}, জেলা ${matchingNode.districtBn} ও বিভাগ ${matchingNode.divisionBn} সনাক্ত হয়েছে।`);
    }
  }

  // 2. Clue / Alias Matching across Knowledge Records
  let matchedNode: BangladeshLocationNode | null = null;
  let matchedClue = '';

  for (const node of BANGLADESH_GEO_RECORDS) {
    const allAliases = [
      node.postOfficeBn,
      node.postOfficeEn,
      node.upazilaThanaBn,
      node.upazilaThanaEn,
      ...(node.aliasesBn || []),
      ...(node.aliasesEn || [])
    ];

    for (const alias of allAliases) {
      if (!alias) continue;
      const cleanAlias = alias.toLowerCase().trim();
      // Look for whole token or substring match
      if (cleanAlias.length >= 3 && lower.includes(cleanAlias)) {
        matchedNode = node;
        matchedClue = alias;
        break;
      }
    }
    if (matchedNode) break;
  }

  if (matchedNode) {
    if (!result.postOffice) {
      result.postOffice = matchedNode.postOfficeBn;
      result.inferredFields!.push('postOffice');
    }
    if (!result.postalCode) {
      result.postalCode = matchedNode.postalCode;
      result.inferredFields!.push('postalCode');
    }
    if (!result.upazilaThana) {
      result.upazilaThana = matchedNode.upazilaThanaBn;
      result.inferredFields!.push('upazilaThana');
    }
    if (!result.district) {
      result.district = matchedNode.districtBn;
      result.inferredFields!.push('district');
    }
    if (!result.division) {
      result.division = matchedNode.divisionBn;
      result.inferredFields!.push('division');
    }

    result.inferredClues!.push(
      `ক্লু '${matchedClue}' থেকে ডাকঘর '${matchedNode.postOfficeBn}', পোস্টকোড '${matchedNode.postalCode}', থানা '${matchedNode.upazilaThanaBn}', জেলা '${matchedNode.districtBn}' ও '${matchedNode.divisionBn}' বিভাগ সনাক্ত হয়েছে।`
    );
  }

  // 3. District Fallback Matching if district still empty
  if (!result.district) {
    for (const [distName, info] of Object.entries(BANGLADESH_DISTRICT_TO_DIVISION)) {
      if (lower.includes(distName.toLowerCase()) || lower.includes(distName)) {
        result.district = distName;
        result.division = info.divisionBn;
        if (!result.postalCode && info.postalCode) {
          result.postalCode = info.postalCode;
          result.inferredFields!.push('postalCode');
        }
        result.inferredFields!.push('district', 'division');
        result.inferredClues!.push(`জেলা '${distName}' থেকে বিভাগ '${info.divisionBn}' সনাক্ত হয়েছে।`);
        break;
      }
    }
  }

  // 4. Village / Area Extraction:
  // Isolate the granular village/area part by stripping known post office, upazila, district, and postal code
  let villageSnippet = rawText;
  const tokensToRemove = [
    result.postalCode,
    englishDigitsToBangla(result.postalCode),
    result.postOffice,
    result.upazilaThana,
    result.district,
    result.division,
    'বাংলাদেশ',
    'ডাকঘর',
    'ডাক:',
    'উপজেলা',
    'থানা',
    'জেলা',
    'বিভাগ',
    'গ্রাম',
    'গ্রাম:',
    'মহল্লা',
    'পাড়া',
    'রোড',
    'বাড়ি'
  ].filter(Boolean);

  // Split by commas, dashes, colons
  const parts = rawText.split(/[,;\n\r]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    // If first part doesn't contain the district/postcode, it is likely the village/area
    const firstPart = parts[0];
    const isFirstPartDistrictOrThana = tokensToRemove.some(t => t && t.length > 2 && firstPart.includes(t) && !firstPart.includes('বাঘিয়া'));
    if (!isFirstPartDistrictOrThana) {
      result.villageArea = firstPart;
    } else {
      // Find candidate part that isn't solely postoffice or district
      const villageCandidate = parts.find(p => !tokensToRemove.some(t => p.trim() === t));
      result.villageArea = villageCandidate || parts[0];
    }
  } else {
    result.villageArea = rawText.trim();
  }

  // Fallback cleanup: if villageArea is identical to postOffice or district, leave as village
  if (result.villageArea === result.district || result.villageArea === result.postOffice) {
    // Keep it if rawText was just that single word
  }

  return result;
}

/**
 * Transliteration & Name Normalization Engine for Bangladesh
 * Converts Bengali names or lowercase English to standard clean UPPERCASE English
 * Normalizes honorifics (Md. / MD., Mst. / MST., Mohammad, etc.)
 */
const BENGALI_NAME_MAP: Record<string, string> = {
  'মোঃ': 'MD.',
  'মো:': 'MD.',
  'মোকাঃ': 'MD.',
  'মোসাঃ': 'MST.',
  'মোছাঃ': 'MST.',
  'মোসাম্মৎ': 'MST.',
  'মুহাম্মদ': 'MUHAMMAD',
  'মোহাম্মদ': 'MOHAMMAD',
  'আহমেদ': 'AHMED',
  'আহমদ': 'AHMED',
  'হোসেন': 'HOSSAIN',
  'হোসাইন': 'HOSSAIN',
  'রহমান': 'RAHMAN',
  'ইসলাম': 'ISLAM',
  'খান': 'KHAN',
  'চৌধুরী': 'CHOWDHURY',
  'আলী': 'ALI',
  'হাসান': 'HASAN',
  'মাহমুদ': 'MAHMUD',
  'নাঈম': 'NAEEM',
  'নাঈমুর': 'NAIMUR',
  'নাঈমুল': 'NAEEMUL',
  'সাকিব': 'SAKIB',
  'সাকিবুল': 'SAKIBUL',
  'রাকিব': 'RAKIB',
  'আরিফ': 'ARIF',
  'আরিফুল': 'ARIFUL',
  'তারিক': 'TARIQ',
  'সোহেল': 'SOHEL',
  'রিপন': 'RIPON',
  'খলিলুর': 'KHALILUR',
  'খলিল': 'KHALIL',
  'নাছিমা': 'NASIMA',
  'নাসিমা': 'NASIMA',
  'আক্তার': 'AKTER',
  'বেগম': 'BEGUM',
  'খাতুন': 'KHATUN',
  'রশিদ': 'RASHID',
  'আব্দুর': 'ABDUR',
  'আব্দুল': 'ABDUL',
  'করিম': 'KARIM',
  'আলম': 'ALAM',
  'জাহাঙ্গীর': 'JAHANGIR',
  'ফারুক': 'FARUK',
  'মিজানুর': 'MIZANUR',
  'আনোয়ার': 'ANWAR',
  'শাহ': 'SHAH',
  'শিকদার': 'SIKDER',
  'সরকার': 'SARKER',
  'মোল্লা': 'MOLLA',
  'কাজী': 'KAZI',
  'শেখ': 'SHEIKH'
};

export function normalizeBanglaEnglishName(nameBn?: string, nameEn?: string): {
  nameBn: string;
  nameEnUpper: string;
  nameEnTitle: string;
  normalizedEn: string;
} {
  const cleanBn = (nameBn || '').trim();
  let cleanEn = (nameEn || '').trim();

  // If English name is missing or purely lowercase, attempt transliteration from Bengali if available
  if (!cleanEn && cleanBn) {
    const tokens = cleanBn.split(/\s+/);
    const transliteratedTokens = tokens.map(tok => {
      const mapped = BENGALI_NAME_MAP[tok];
      if (mapped) return mapped;
      // Phonetic fallback if not in mapping dictionary
      return tok.toUpperCase();
    });
    cleanEn = transliteratedTokens.join(' ');
  }

  // Format English to standard UPPERCASE
  let upper = cleanEn.toUpperCase().replace(/\s+/g, ' ').trim();
  // Standardize MD / MST honorifics
  upper = upper.replace(/\bMD\b/g, 'MD.').replace(/\bMD\.\./g, 'MD.');
  upper = upper.replace(/\bMST\b/g, 'MST.').replace(/\bMST\.\./g, 'MST.');

  // Format Title Case as well for flexibility
  const title = upper
    .toLowerCase()
    .split(' ')
    .map(w => {
      if (w === 'md.') return 'Md.';
      if (w === 'mst.') return 'Mst.';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  return {
    nameBn: cleanBn,
    nameEnUpper: upper || 'CITIZEN APPLICANT',
    nameEnTitle: title || 'Citizen Applicant',
    normalizedEn: upper || 'CITIZEN APPLICANT',
  };
}
