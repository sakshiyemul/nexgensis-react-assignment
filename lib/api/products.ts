import apiClient from "../axios/client";

export interface Product {
  id: number; title: string; description: string; category: string;
  price: number; rating: number; stock: number; thumbnail: string; images: string[];
  reviews?: { rating: number; comment: string; date: string; reviewerName: string; reviewerEmail: string }[];
  brand?: string; discountPercentage?: number;
}
export interface ProductsResponse { products: Product[]; total: number; skip: number; limit: number; }

export const getProducts = async (limit: number, skip: number) =>
  (await apiClient.get<ProductsResponse>("/products", { params: { limit, skip } })).data;

export const searchProducts = async (query: string, limit: number, skip: number, signal?: AbortSignal) =>
  (await apiClient.get<ProductsResponse>("/products/search", { params: { q: query, limit, skip }, signal })).data;

export const getProductsByCategory = async (category: string, limit: number, skip: number) =>
  (await apiClient.get<ProductsResponse>(`/products/category/${encodeURIComponent(category)}`, { params: { limit, skip } })).data;

export const getCategories = async () =>
  (await apiClient.get<string[]>("/products/category-list")).data;

export const getProductById = async (id: number) =>
  (await apiClient.get<Product>(`/products/${id}`)).data;

export const addProduct = async (product: Partial<Product>) =>
  (await apiClient.post<Product>("/products/add", product)).data;

export const updateProduct = async (id: number, product: Partial<Product>) =>
  (await apiClient.put<Product>(`/products/${id}`, product)).data;

export const deleteProduct = async (id: number) =>
  (await apiClient.delete<Product>(`/products/${id}`)).data;
