const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, '../admin-dashboard/src/app/(storefront)/layout.tsx');
let content = fs.readFileSync(layoutPath, 'utf8');

// replace zustand stores
content = content.replace('const cartItemsCount = useCartStore((state) => state.totalItems())', 'const cartItemsCount = 0;');
content = content.replace('const { isAuthenticated } = useCustomerAuthStore()', 'const isAuthenticated = false;');

fs.writeFileSync(layoutPath, content);
console.log('Modified layout.tsx');
