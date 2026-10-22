import {
  resolveBangladeshAddress,
  normalizeBanglaEnglishName,
  banglaDigitsToEnglish,
  englishDigitsToBangla
} from './bangladesh-geo-knowledge';

describe('Bangladesh Geo Knowledge & Name Normalization', () => {
  describe('Name Normalization & Transliteration', () => {
    it('should transliterate Bengali name and format in standard UPPERCASE', () => {
      const result = normalizeBanglaEnglishName('মোঃ নাঈমুর রহমান');
      expect(result.nameEnUpper).toBe('MD. NAIMUR RAHMAN');
      expect(result.nameBn).toBe('মোঃ নাঈমুর রহমান');
    });

    it('should format lowercase English name into standard UPPERCASE with proper prefix', () => {
      const result = normalizeBanglaEnglishName('', 'md naimur rahman');
      expect(result.nameEnUpper).toBe('MD. NAIMUR RAHMAN');
    });

    it('should handle female prefixes like মোসাঃ / MST', () => {
      const result = normalizeBanglaEnglishName('মোসাঃ নাছিমা আক্তার');
      expect(result.nameEnUpper).toBe('MST. NASIMA AKTER');
    });
  });

  describe('Geographic Clue Expansion & Atomic Address Decomposition', () => {
    it('should expand village and post office clue (বাঘিয়া, কাশিমপুর) to postalCode 1704, Gazipur, Dhaka', () => {
      const resolved = resolveBangladeshAddress('বাঘিয়া, কাশিমপুর, গাজীপুর');
      expect(resolved.villageArea).toBe('বাঘিয়া');
      expect(resolved.postOffice).toBe('কাশিমপুর');
      expect(resolved.postalCode).toBe('1704');
      expect(resolved.district).toBe('গাজীপুর');
      expect(resolved.division).toBe('ঢাকা');
      expect(resolved.inferredFields).toContain('postalCode');
      expect(resolved.inferredClues && resolved.inferredClues.length).toBeGreaterThan(0);
    });

    it('should expand Dhanmondi, Dhaka to postalCode 1205, Thana Dhanmondi, District Dhaka, Division Dhaka', () => {
      const resolved = resolveBangladeshAddress('হাউস ১২, ধানমন্ডি, ঢাকা');
      expect(resolved.postalCode).toBe('1205');
      expect(resolved.upazilaThana).toBe('ধানমন্ডি');
      expect(resolved.district).toBe('ঢাকা');
      expect(resolved.division).toBe('ঢাকা');
    });

    it('should expand Chauddagram, Cumilla to postalCode 3550 and Chattogram division', () => {
      const resolved = resolveBangladeshAddress('চৌদ্দগ্রাম, কুমিল্লা');
      expect(resolved.postalCode).toBe('3550');
      expect(resolved.district).toBe('কুমিল্লা');
      expect(resolved.division).toBe('চট্টগ্রাম');
    });

    it('should correctly convert Bengali numerals to English digits', () => {
      expect(banglaDigitsToEnglish('১৭০৪')).toBe('1704');
      expect(banglaDigitsToEnglish('০১৭২৩৪৫৬৭৮')).toBe('0172345678');
      expect(englishDigitsToBangla('1704')).toBe('১৭০৪');
    });
  });
});
