"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductById, Product } from "@/lib/api/products";

export default function ProductDetailsPage() {
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [product, setProduct] = useState<Product|null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.replace("/login"); return; }
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) { setNotFound(true); setLoading(false); return; }
    getProductById(numericId).then(setProduct).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <main className="p-8 text-center">Loading product...</main>;
  if (notFound || !product) return <main className="flex min-h-screen flex-col items-center justify-center gap-4"><h1 className="text-3xl font-bold">Product Not Found</h1><button onClick={()=>router.push("/products")} className="rounded bg-blue-600 px-4 py-2 text-white">Back to Products</button></main>;

  return <main className="min-h-screen p-4 md:p-8"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow">
    <button onClick={()=>router.back()} className="mb-6 text-blue-600">← Back</button>
    <div className="grid gap-8 md:grid-cols-2">
      <div><img src={product.images?.[0] || product.thumbnail} alt={product.title} className="h-96 w-full rounded-xl object-contain bg-gray-50"/></div>
      <div><span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{product.category}</span><h1 className="mt-4 text-3xl font-bold">{product.title}</h1>
        <p className="mt-4 text-gray-600">{product.description}</p><p className="mt-5 text-3xl font-bold">${product.price}</p><p className="mt-2">⭐ {product.rating} · {product.stock} in stock</p>
      </div>
    </div>
    <section className="mt-10"><h2 className="mb-4 text-2xl font-bold">Reviews</h2>
      <div className="space-y-3">{product.reviews?.length ? product.reviews.map((r,i)=><div key={i} className="rounded-xl border p-4"><div className="font-semibold">{r.reviewerName} · ⭐ {r.rating}</div><p className="mt-1 text-gray-600">{r.comment}</p></div>) : <p className="text-gray-500">No reviews available.</p>}</div>
    </section>
  </div></main>;
}
