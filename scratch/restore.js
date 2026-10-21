const fs = require('fs');
const path = require('path');

// Restore page.tsx
const pagePath = path.join(__dirname, '../admin-dashboard/src/app/(storefront)/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace('const addItem = () => {};', 'const addItem = useCartStore(state => state.addItem)');
fs.writeFileSync(pagePath, pageContent);

// Restore layout.tsx
const layoutPath = path.join(__dirname, '../admin-dashboard/src/app/(storefront)/layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
layoutContent = layoutContent.replace('const cartItemsCount = 0;', 'const cartItemsCount = useCartStore((state) => state.totalItems())');
layoutContent = layoutContent.replace('const isAuthenticated = false;', 'const { isAuthenticated } = useCustomerAuthStore()');
fs.writeFileSync(layoutPath, layoutContent);
