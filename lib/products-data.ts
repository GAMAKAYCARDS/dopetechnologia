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

// Sample products for fallback when Supabase is not available
const sampleProducts: Product[] = [
  {
    id: 1,
    name: "Razer Kraken X Gaming Headset",
    price: 999.99,
    original_price: 1199.99,
    image_url: "https://images.unsplash.com/photo-1544866092-1677b00f868b?w=400&h=400&fit=crop&crop=center",
    category: "audio",
    rating: 4.5,
    reviews: 24,
    description: "Premium gaming headset with 7.1 surround sound",
    features: ["7.1 Surround Sound", "Lightweight Design", "Noise Cancelling"],
    in_stock: true,
    discount: 17,
    hidden_on_home: false
  },
  {
    id: 2,
    name: "Ajazz AK820 Pro Mechanical Keyboard",
    price: 1299.99,
    original_price: 1499.99,
    image_url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&h=400&fit=crop&crop=center",
    category: "keyboard",
    rating: 4.8,
    reviews: 12,
    description: "Customizable TFT screen with hot-swappable switches",
    features: ["TFT Screen", "Hot-swappable", "Tri-mode Connectivity"],
    in_stock: true,
    discount: 13,
    hidden_on_home: false
  },
  {
    id: 3,
    name: "HKC 27\" QHD Gaming Monitor",
    price: 2499.99,
    original_price: 2999.99,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center",
    category: "monitor",
    rating: 4.7,
    reviews: 23,
    description: "180Hz refresh rate with 1ms response time",
    features: ["180Hz Refresh Rate", "1ms Response Time", "QHD Resolution"],
    in_stock: true,
    discount: 17,
    hidden_on_home: false
  },
  {
    id: 4,
    name: "Ajazz AJ139 V2 Gaming Mouse",
    price: 899.99,
    original_price: 1099.99,
    image_url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop&crop=center",
    category: "mouse",
    rating: 4.6,
    reviews: 23,
    description: "18,000 DPI with magnetic charging dock",
    features: ["18,000 DPI", "Magnetic Dock", "RGB Lighting"],
    in_stock: true,
    discount: 18,
    hidden_on_home: false
  },
  {
    id: 5,
    name: "Premium Gaming Setup Bundle",
    price: 3999.99,
    original_price: 4999.99,
    image_url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop&crop=center",
    category: "accessory",
    rating: 4.9,
    reviews: 42,
    description: "Complete gaming setup with all peripherals",
    features: ["Complete Setup", "Premium Quality", "Warranty Included"],
    in_stock: true,
    discount: 20,
    hidden_on_home: false
  },
  {
    id: 6,
    name: "Wireless Gaming Headset Pro",
    price: 1499.99,
    original_price: 1799.99,
    image_url: "https://images.unsplash.com/photo-1544866092-1677b00f868b?w=400&h=400&fit=crop&crop=center",
    category: "audio",
    rating: 4.4,
    reviews: 18,
    description: "Premium wireless gaming headset with noise cancellation",
    features: ["Wireless", "Noise Cancelling", "Long Battery Life"],
    in_stock: true,
    discount: 17,
    hidden_on_home: false
  }
];

// Fetch products from Supabase with proper fallback
export async function getProducts(): Promise<Product[]> {
  try {
    console.log('🔗 Connecting to Supabase to fetch your real data...')
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('hidden_on_home', false)
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Supabase query successful')
    console.log('📦 Your real data received:', data?.length || 0, 'products')
    
    if (data && data.length > 0) {
      console.log('🎉 Using your real Supabase data!')
      return data;
    } else {
      console.log('⚠️ No data from Supabase, using sample products')
      return sampleProducts;
    }
  } catch (error) {
    console.error('❌ Error fetching products from Supabase:', error);
    console.log('🔄 Falling back to sample products...')
    return sampleProducts;
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
      return sampleProducts.find(p => p.id === id) || null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return sampleProducts.find(p => p.id === id) || null;
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
      return sampleProducts.filter(p => p.category === category);
    }

    if (data && data.length > 0) {
      return data;
    } else {
      return sampleProducts.filter(p => p.category === category);
    }
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return sampleProducts.filter(p => p.category === category);
  }
}

 