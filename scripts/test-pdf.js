const fs = require('fs');

async function main() {
  const baseUrl = 'http://localhost:3333/api';
  const pin = '5825825825iW.';

  let res = await fetch(`${baseUrl}/auth/admin-pin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const { access_token } = await res.json();
  
  console.log("Fetching PDF...");
  const pdfRes = await fetch(`${baseUrl}/business-core/price-list/pdf?title=TEST&currency=BDT`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  if (!pdfRes.ok) throw new Error(`PDF failed: ${await pdfRes.text()}`);
  
  const buffer = await pdfRes.arrayBuffer();
  fs.writeFileSync('test.pdf', Buffer.from(buffer));
  console.log(`Saved test.pdf, size: ${buffer.byteLength} bytes`);
}

main().catch(console.error);
