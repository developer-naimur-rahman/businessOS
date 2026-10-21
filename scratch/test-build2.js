const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, '../admin-dashboard/src/app/(storefront)/page.tsx');
let content = fs.readFileSync(layoutPath, 'utf8');

// replace zustand store
content = content.replace('const addItem = useCartStore(state => state.addItem)', 'const addItem = () => {};');

fs.writeFileSync(layoutPath, content);
console.log('Modified page.tsx');
