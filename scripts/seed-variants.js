const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://127.0.0.1:3333/api/auth/admin-pin-login', { pin: '5825825825iW.' });
    const token = res.data.access_token;
    
    // Create an Attribute
    console.log("Adding product with variants...");
    const prodRes = await axios.post('http://127.0.0.1:3333/api/business-core/products', {
      name: "T-Shirt (Demo Variant)",
      type: "PRODUCT",
      costPrice: 200,
      sellingPrice: 350,
      isActive: true,
      code: "TSHIRT-VAR-01",
      variants: [
        {
          sku: "TSHIRT-RED-M",
          costPrice: 200,
          retailPrice: 350,
          attributes: [
            { name: "Color", value: "Red" },
            { name: "Size", value: "M" }
          ]
        },
        {
          sku: "TSHIRT-BLUE-L",
          costPrice: 200,
          retailPrice: 350,
          attributes: [
            { name: "Color", value: "Blue" },
            { name: "Size", value: "L" }
          ]
        }
      ]
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log("Success! Created Product:", prodRes.data.id);
  } catch (err) {
    console.error("Error creating variant product:", err.response ? err.response.data : err.message);
  }
}
run();
