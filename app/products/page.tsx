"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addProduct, deleteProduct, getCategories, getProductById, getProducts,
  getProductsByCategory, Product, searchProducts, updateProduct
} from "@/lib/api/products";

export default function ProductsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const pageParam = Number(params.get("page"));
  const sizeParam = Number(params.get("pageSize"));
  const [page, setPageState] = useState(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
  const [pageSize, setPageSizeState] = useState([10,20,50].includes(sizeParam) ? sizeParam : 10);
  const [search, setSearchState] = useState(params.get("search") || "");
  const [category, setCategoryState] = useState(params.get("category") || "");
  const [sortBy, setSortByState] = useState(params.get("sort") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editing, setEditing] = useState<Product|null>(null);
  const [form, setForm] = useState({ title:"", price:"", category:"", description:"", stock:"" });

  const syncUrl = useCallback((next: {page?:number; pageSize?:number; search?:string; category?:string; sort?:string}) => {
    const q = new URLSearchParams(params.toString());
    const values = { page: next.page ?? page, pageSize: next.pageSize ?? pageSize, search: next.search ?? search, category: next.category ?? category, sort: next.sort ?? sortBy };
    Object.entries(values).forEach(([k,v]) => v ? q.set(k,String(v)) : q.delete(k));
    router.replace(`/products?${q.toString()}`, { scroll:false });
  }, [params, router, page, pageSize, search, category, sortBy]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.replace("/login"); return; }
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, [router]);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true); setError("");
        const skip = (page - 1) * pageSize;
        let data;
        if (search.trim()) data = await searchProducts(search.trim(), pageSize, skip, controller.signal);
        else if (category) data = await getProductsByCategory(category, pageSize, skip);
        else data = await getProducts(pageSize, skip);
        setProducts(data.products); setTotal(data.total);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("Failed to load products.");
      } finally { setLoading(false); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, pageSize, search, category]);

  const sortedProducts = useMemo(() => [...products].sort((a,b) => {
    if (sortBy === "price-asc") return a.price-b.price;
    if (sortBy === "price-desc") return b.price-a.price;
    if (sortBy === "rating-desc") return b.rating-a.rating;
    if (sortBy === "title-asc") return a.title.localeCompare(b.title);
    return 0;
  }), [products, sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.replace("/login"); };

  const openAdd = () => { setEditing(null); setForm({title:"",price:"",category:"",description:"",stock:""}); setModal("add"); };
  const openEdit = (p: Product) => { setEditing(p); setForm({title:p.title,price:String(p.price),category:p.category,description:p.description,stock:String(p.stock)}); setModal("edit"); };

  const saveProduct = async () => {
    if (!form.title.trim() || !form.category.trim() || Number(form.price) <= 0 || Number(form.stock) < 0) return;
    try {
      setLoading(true);
      const payload = { title:form.title.trim(), price:Number(form.price), category:form.category.trim(), description:form.description.trim(), stock:Number(form.stock) };
      if (modal === "add") {
        const created = await addProduct(payload);
        setProducts(p => [{...created, id: created.id || Date.now()}, ...p]);
      } else if (editing) {
        const updated = await updateProduct(editing.id, payload);
        setProducts(p => p.map(x => x.id === editing.id ? {...x, ...updated, ...payload} : x));
      }
      setModal(null);
    } catch { setError("Could not save product."); } finally { setLoading(false); }
  };

  const removeProduct = async (p: Product) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts(current => current.filter(x => x.id !== p.id));
    } catch { setError("Could not delete product."); }
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><h1 className="text-3xl font-bold">Product Dashboard</h1><p className="text-gray-500">Manage products</p></div>
            <div className="flex gap-2"><button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white">+ Add Product</button><button onClick={logout} className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white">Logout</button></div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <input value={search} onChange={e => {setSearchState(e.target.value); setCategoryState(""); setPageState(1); syncUrl({search:e.target.value,category:"",page:1});}} placeholder="Search products..." className="flex-1 rounded-lg border px-4 py-2.5" />
            <select value={category} disabled={!!search.trim()} onChange={e => {setCategoryState(e.target.value);setPageState(1);syncUrl({category:e.target.value,page:1});}} className="rounded-lg border px-4 py-2.5 disabled:bg-gray-100">
              <option value="">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => {setSortByState(e.target.value);syncUrl({sort:e.target.value});}} className="rounded-lg border px-4 py-2.5">
              <option value="">Sort By</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating-desc">Rating: High to Low</option><option value="title-asc">Title: A to Z</option>
            </select>
          </div>
        </header>

        {error && <div className="mb-4 flex items-center justify-between rounded-lg bg-red-100 p-3 text-red-700"><span>{error}</span><button onClick={()=>location.reload()} className="font-semibold underline">Retry</button></div>}

        {loading ? <div className="rounded-2xl bg-white p-12 text-center">Loading products...</div> :
        sortedProducts.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center text-gray-500">No products found.</div> :
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50"><tr className="border-b">
                {["Image","Title","Category","Price","Rating","Stock","Actions"].map(h=><th key={h} className="px-5 py-4 text-left text-sm font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>{sortedProducts.map(p=><tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3"><img src={p.thumbnail || p.images?.[0]} alt={p.title} className="h-12 w-12 rounded-lg object-cover"/></td>
                <td className="px-5 py-3 font-medium">{p.title}</td><td className="px-5 py-3 capitalize text-gray-600">{p.category}</td>
                <td className="px-5 py-3">${p.price.toFixed(2)}</td><td className="px-5 py-3">⭐ {p.rating}</td><td className="px-5 py-3">{p.stock}</td>
                <td className="px-5 py-3"><div className="flex gap-2"><button onClick={()=>router.push(`/products/${p.id}`)} className="rounded border px-2 py-1 text-sm">View</button><button onClick={()=>openEdit(p)} className="rounded border px-2 py-1 text-sm">Edit</button><button onClick={()=>removeProduct(p)} className="rounded border border-red-300 px-2 py-1 text-sm text-red-600">Delete</button></div></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
            <span className="text-sm text-gray-600">Showing {total===0?0:(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} of {total}</span>
            <div className="flex flex-wrap items-center gap-2">
              <select value={pageSize} onChange={e=>{const n=Number(e.target.value);setPageSizeState(n);setPageState(1);syncUrl({pageSize:n,page:1});}} className="rounded border px-2 py-2 text-sm"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select>
              <button disabled={page<=1} onClick={()=>{setPageState(page-1);syncUrl({page:page-1});}} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Previous</button>
              {Array.from({length:Math.min(totalPages,8)},(_,i)=>i+1).map(n=><button key={n} onClick={()=>{setPageState(n);syncUrl({page:n});}} className={`rounded px-3 py-2 text-sm ${page===n?"bg-blue-600 text-white":"border"}`}>{n}</button>)}
              {totalPages>8 && <span>…</span>}
              <button disabled={page>=totalPages} onClick={()=>{setPageState(page+1);syncUrl({page:page+1});}} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>}

        {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{modal==="add"?"Add Product":"Edit Product"}</h2>
            <div className="grid gap-3">
              <input placeholder="Title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded border px-3 py-2"/>
              <input type="number" min="0.01" placeholder="Price *" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="rounded border px-3 py-2"/>
              <input placeholder="Category *" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="rounded border px-3 py-2"/>
              <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="rounded border px-3 py-2"/>
              <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="min-h-24 rounded border px-3 py-2"/>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={()=>setModal(null)} className="rounded border px-4 py-2">Cancel</button><button onClick={saveProduct} disabled={!form.title.trim()||!form.category.trim()||Number(form.price)<=0} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">Save</button></div>
          </div>
        </div>}
      </div>
    </main>
  );
}
