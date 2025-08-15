import { supabase } from './supabase';

// Product type definition
export interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number;
  image_url: string;
  category: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  in_stock: boolean;
  discount: number;
  hidden_on_home?: boolean;
}

// Fetch products directly from Supabase
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('hidden_on_home', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
}

// Fetch a single product by ID
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('hidden_on_home', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

// Get random dope picks (maximum 6 products)
export async function getDopePicks(maxCount: number = 6): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('hidden_on_home', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Randomly shuffle the products and take up to maxCount
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(maxCount, shuffled.length));
  } catch (error) {
    console.error('❌ Error fetching dope picks:', error);
    return [];
  }
}

// Get random weekly picks (maximum 4 products)
export async function getWeeklyPicks(maxCount: number = 4): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('hidden_on_home', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Randomly shuffle the products and take up to maxCount
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(maxCount, shuffled.length));
  } catch (error) {
    console.error('❌ Error fetching weekly picks:', error);
    return [];
  }
}

 