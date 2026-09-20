const fs = require('fs');

function readMediaBox(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  // Match /MediaBox [0 0 w h]
  const match = data.match(/\/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]/);
  if (match) {
    const wPoints = parseFloat(match[1]);
    const hPoints = parseFloat(match[2]);
    // PDF points are 1/72 inch
    const wInches = wPoints / 72;
    const hInches = hPoints / 72;
    console.log(`File: ${filePath} -> Width: ${wInches}in, Height: ${hInches}in`);
  } else {
    console.log(`Could not find MediaBox in ${filePath}`);
  }
}
readMediaBox('test_3x8.pdf');
readMediaBox('test_4x12.pdf');
