const fs = require('fs');
const path = require('path');

const files = [
  '../admin-dashboard/src/store/useAuthStore.ts',
  '../admin-dashboard/src/store/useCustomerAuthStore.ts',
  '../admin-dashboard/src/store/useCartStore.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // replace persist(...) with just the inner function
  // This is a naive regex but might work
  content = content.replace(/persist\(\s*\([\s\S]*?\)\s*=>\s*\(\{[\s\S]*?\}\),\s*\{[\s\S]*?\}\s*\)/g, (match) => {
    // extract the inner function
    const innerMatch = match.match(/\(\s*(?:set|get|set,\s*get)\s*\)\s*=>\s*\(\{[\s\S]*?\}\)/);
    if (innerMatch) {
      return innerMatch[0];
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content);
}
console.log('Removed persist');
