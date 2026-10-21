const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, '../admin-dashboard/src/app/(storefront)/layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Replace indigo colors with #04BBFD
layoutContent = layoutContent
  .replace(/indigo-600/g, '[#04BBFD]')
  .replace(/indigo-700/g, '[#03a0d9]')
  .replace(/indigo-50/g, 'sky-50')
  .replace(/indigo-400/g, 'sky-400');

// Update navigation
layoutContent = layoutContent.replace(
  /<nav className="flex items-center gap-8 font-medium text-sm text-slate-600">[\s\S]*?<\/nav>/,
  `<nav className="flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="/" className="hover:text-[#04BBFD] transition-colors">Home</Link>
            <Link href="/products" className="hover:text-[#04BBFD] transition-colors">Products</Link>
            <Link href="/services" className="hover:text-[#04BBFD] transition-colors">Services</Link>
            <Link href="/printing" className="hover:text-[#04BBFD] transition-colors">Printing</Link>
          </nav>`
);

// Update footer links
layoutContent = layoutContent.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">[\s\S]*?<\/div>\s*<\/div>\s*<div className="pt-8/,
  `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 bg-[#04BBFD] rounded-xl flex items-center justify-center shadow-lg shadow-[#04BBFD]/20">
                  <span className="text-white font-bold text-sm tracking-wider">MB</span>
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-white">My Business</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-sm">
                Your trusted partner for computer, printing, photography, and digital services in Bangladesh.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Products</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/products?category=stationery" className="hover:text-white transition-colors">Stationery</Link></li>
                <li><Link href="/products?category=electronics" className="hover:text-white transition-colors">Electronics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Services</h4>
              <ul className="space-y-4">
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="/printing" className="hover:text-white transition-colors">Printing</Link></li>
                <li><Link href="/services?category=photography" className="hover:text-white transition-colors">Photography</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Help & Support</h4>
              <ul className="space-y-4">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8`
);

fs.writeFileSync(layoutPath, layoutContent);

const pagePath = path.join(__dirname, '../admin-dashboard/src/app/(storefront)/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Replace indigo colors
pageContent = pageContent
  .replace(/indigo-600/g, '[#04BBFD]')
  .replace(/indigo-700/g, '[#03a0d9]')
  .replace(/indigo-400/g, 'sky-400')
  .replace(/indigo-300/g, 'sky-300');

// Replace API endpoints
pageContent = pageContent.replace(/api\.get\('\/public\/catalog\/products'\)/g, `api.get('/storefront/catalog/products')`);
pageContent = pageContent.replace(/api\.get\('\/public\/catalog\/categories\?type=PRODUCT'\)/g, `api.get('/storefront/catalog/services')`);

// Update logic to extract categories from products and services
const fetchDataRegex = /setProducts\(productsRes\.data\.items \|\| productsRes\.data \|\| \[\]\)[\s\S]*?setCategories\(categoriesRes\.data\.items \|\| categoriesRes\.data \|\| \[\]\)/;
pageContent = pageContent.replace(fetchDataRegex, `
        const productsData = productsRes.data.items || productsRes.data || [];
        const servicesData = categoriesRes.data.items || categoriesRes.data || [];
        setProducts([...productsData, ...servicesData]);
        
        // Extract unique product categories
        const prodCats = Array.from(new Map(productsData.filter((p: any) => p.category).map((p: any) => [p.category.id, p.category])).values());
        // Extract unique service categories
        const servCats = Array.from(new Map(servicesData.filter((s: any) => s.category).map((s: any) => [s.category.id, s.category])).values());
        
        setCategories([...prodCats, ...servCats]);
`);

// Add Printing CTA before TrustSection
pageContent = pageContent.replace(/<TrustSection \/>/g, `
      {/* Printing CTA */}
      <section className="bg-slate-100 py-16 px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Need Printing Services?</h2>
          <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">Upload your documents, choose your paper size and finishing options, and get an instant quote for pickup or delivery.</p>
          <Link href="/printing" className="inline-flex items-center gap-2 bg-[#04BBFD] hover:bg-[#03a0d9] text-white px-8 py-4 rounded-full font-bold transition-colors shadow-lg hover:shadow-xl">
            Start Printing Order <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      
      <TrustSection />
`);

fs.writeFileSync(pagePath, pageContent);
console.log('Successfully updated layout.tsx and page.tsx');
