const puppeteer = require('puppeteer');
const fs = require('fs');

async function generatePDFs() {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1>');
    
    // 3x8 ft (36x96 inches)
    await page.pdf({
      path: 'test_3x8.pdf',
      width: '36in',
      height: '96in',
      printBackground: true
    });
    
    // 4x12 ft (48x144 inches)
    await page.pdf({
      path: 'test_4x12.pdf',
      width: '48in',
      height: '144in',
      printBackground: true
    });
    
    await browser.close();
    console.log('PDFs generated successfully.');
  } catch(e) {
    console.error('Puppeteer failed:', e.message);
  }
}
generatePDFs();
