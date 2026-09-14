"use client";

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { api } from "../../../lib/api-client";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, User, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  type: string;
}

interface CartItem extends Product {
  cartId: string;
  quantity: number;
  discount: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Hardcoded or dynamically fetched context for POS
  // In a real app, the cashier selects their register/branch session
  const [branchId, setBranchId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchContext();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/business-core/products");
      setProducts(res.data);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchContext = async () => {
    try {
      const branchesRes = await api.get("/operational-structure/branches");
      const warehousesRes = await api.get("/operational-structure/warehouses");
      if (branchesRes.data.length > 0) setBranchId(branchesRes.data[0].id);
      if (warehousesRes.data.length > 0) setWarehouseId(warehousesRes.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, cartId: uuidv4(), quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(cart.map(item => item.cartId === cartId ? { ...item, quantity } : item));
  };

  const updateDiscount = (cartId: string, discount: number) => {
    if (discount < 0) return;
    setCart(cart.map(item => item.cartId === cartId ? { ...item, discount } : item));
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.quantity), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + Number(item.discount), 0);
  const total = subtotal - totalDiscount;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!branchId || !warehouseId) return toast.error("Branch/Warehouse not selected");

    setSubmitting(true);
    try {
      const payload = {
        branchId,
        warehouseId,
        idempotencyKey: uuidv4(),
        lines: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          discount: item.discount,
        })),
        payments: [{
          method: "CASH",
          amount: total,
        }],
      };

      await api.post("/sales/complete-direct", payload);
      toast.success("Sale completed successfully");
      setCart([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 -mx-4 -my-4 sm:-mx-6 lg:-mx-8 overflow-hidden bg-slate-100">
      {/* Product Catalog Side */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between z-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-9 h-10 w-full bg-slate-100 border-none focus-visible:ring-1 focus-visible:bg-white transition-colors" 
              placeholder="Search products, services or scan barcode..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-medium ml-4">
            <Package className="h-4 w-4" /> {filteredProducts.length} Items
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 auto-rows-max">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left flex flex-col h-32 active:scale-95"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{product.type}</span>
                  <span className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{product.name}</span>
                  <span className="mt-auto font-bold text-slate-900 tabular-nums">৳{Number(product.sellingPrice).toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart/Checkout Side */}
      <div className="w-full md:w-96 lg:w-[420px] bg-white flex flex-col h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-5 w-5 text-primary" /> Current Sale
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setCart([])}>
            Clear
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
              </div>
              <span className="font-medium">Cart is empty</span>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.cartId} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2 relative group">
                <div className="flex justify-between items-start gap-2 pr-6">
                  <span className="font-semibold text-sm text-slate-800 leading-tight">{index + 1}. {item.name}</span>
                  <span className="font-bold text-sm tabular-nums whitespace-nowrap">৳{Number(item.sellingPrice).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center bg-slate-100 rounded-md border border-slate-200 p-0.5">
                    <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded text-slate-600 font-bold">-</button>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateQuantity(item.cartId, parseInt(e.target.value) || 1)}
                      className="w-10 h-7 text-center bg-transparent border-none text-sm font-semibold tabular-nums focus:ring-0 p-0"
                    />
                    <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded text-slate-600 font-bold">+</button>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    Disc: ৳ 
                    <input 
                      type="number" 
                      value={item.discount}
                      onChange={e => updateDiscount(item.cartId, parseFloat(e.target.value) || 0)}
                      className="w-12 h-7 px-1 text-right bg-slate-50 border border-slate-200 rounded text-xs tabular-nums focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(item.cartId)}
                  className="absolute top-2 right-2 p-1 text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 space-y-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="tabular-nums">৳{subtotal.toLocaleString()}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>Discount</span>
                <span className="tabular-nums">- ৳{totalDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl text-slate-900 pt-2 border-t border-slate-100 mt-2">
              <span>Total</span>
              <span className="tabular-nums text-primary">৳{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button 
              variant="outline" 
              className="h-12 border-slate-300 text-slate-700 font-semibold"
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
            >
              <Banknote className="mr-2 h-4 w-4" /> Cash
            </Button>
            <Button 
              className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
