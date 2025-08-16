"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Eye,
  Star,
  DollarSign,
  Package,
  LogOut,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Lock,
  ArrowLeft,
  Video,
  FileImage,
  RefreshCw,
  Loader2,
  Smartphone,
  Monitor,
  Settings,
  Users,
  ShoppingCart,
  Activity
} from "lucide-react"
import { getProducts, type Product } from "@/lib/products-data"
import { supabase } from "@/lib/supabase"
import { useAssets } from '@/hooks/use-assets'
import { AssetUploader } from '@/components/asset-uploader'
import { HeroImageManager } from '@/components/hero-image-manager'

interface AdminProduct extends Product {
  isNew?: boolean
  isEditing?: boolean
}

// Memoized product card component
const ProductCard = React.memo(({ 
  product, 
  onEdit, 
  onDelete, 
  isEditing 
}: { 
  product: AdminProduct
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  isEditing: boolean
}) => (
  <div className="group relative overflow-hidden rounded-2xl card-elevated">
    {/* Product Image with Enhanced Hover Effects */}
    <div className="relative image-container overflow-hidden rounded-2xl aspect-square">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-1"
        loading="lazy"
        decoding="async"
      />
      
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Stock Status Badge */}
      {product.in_stock ? (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-medium bg-green-500/20 backdrop-blur-md text-green-100 border border-green-500/30 shadow-lg">
          In Stock
        </div>
      ) : (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-medium bg-red-500/20 backdrop-blur-md text-red-100 border border-red-500/30 shadow-lg">
          Out of Stock
        </div>
      )}

      {/* Product overlay content */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 leading-snug">{product.name}</h3>
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col leading-tight">
            <span className="text-[#F7DD0F] font-bold text-sm">Rs {product.price}</span>
            {product.original_price > product.price && (
              <span className="text-xs text-gray-300 line-through">Rs {product.original_price}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(product)}
              disabled={isEditing}
              className="p-2 bg-[#F7DD0F]/20 hover:bg-[#F7DD0F]/30 rounded-lg transition-all duration-300 text-[#F7DD0F] disabled:opacity-50 hover:scale-110 focus-ring"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              disabled={isEditing}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-300 text-red-400 disabled:opacity-50 hover:scale-110 focus-ring"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center">
            <Star className="w-3 h-3 text-[#F7DD0F] fill-current" />
            <span className="ml-1">{product.rating}</span>
          </div>
          <span className="capitalize">{product.category}</span>
        </div>
        
        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 bg-orange-500/20 backdrop-blur-md text-orange-100 border border-orange-500/30 px-2 py-1 rounded-full text-xs font-medium shadow-lg">
            {product.discount}% OFF
          </div>
        )}
      </div>
    </div>
  </div>
))

ProductCard.displayName = 'ProductCard'

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-[#F7DD0F]" />
  </div>
)

export default function DopeTechAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Asset management state
  const { 
    logoUrl, 
    videoUrl, 
    assets, 
    loading: assetsLoading, 
    error: assetsError, 
    deleteAsset, 
    refreshAssets 
  } = useAssets()

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    original_price: 0,
    description: "",
    category: "keyboard",
    image_url: "",
    rating: 0,
    reviews: 0,
    features: [""],
    in_stock: true,
    discount: 0
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Check for existing admin session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const isAdmin = localStorage.getItem("adminAuthenticated") === "true"
        const loginTime = localStorage.getItem("adminLoginTime")
        
        if (isAdmin && loginTime) {
          const loginDate = new Date(loginTime)
          const now = new Date()
          const hoursSinceLogin = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceLogin < 8) {
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem("adminAuthenticated")
            localStorage.removeItem("adminLoginTime")
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error checking admin session:", error)
        setIsAuthenticated(false)
      }
    }
  }, [])

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const supabaseProducts = await getProducts()
        setProducts(supabaseProducts as AdminProduct[])
      } catch (error) {
        console.error('Error loading products:', error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      loadProducts()
    }
  }, [isAuthenticated])

  const handleImageUpload = async (file: File) => {
    if (!file) return

    setIsUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading image:', error)
        alert('Failed to upload image')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      setNewProduct(prev => ({ ...prev, image_url: publicUrl }))
      setImageFile(null)
      alert('Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill in product name and price')
      return
    }

    try {
      // Prepare product data for Supabase (Supabase will auto-generate id)
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()

      if (error) {
        console.error('Error adding product:', error)
        alert('Failed to add product')
        return
      }

      // Refresh products from Supabase
      const updatedProducts = await getProducts()
      setProducts(updatedProducts as AdminProduct[])

      // Reset form
      setNewProduct({
        name: "",
        price: 0,
        original_price: 0,
        description: "",
        category: "keyboard",
        image_url: "",
        rating: 0,
        reviews: 0,
        features: [""],
        in_stock: true,
        discount: 0
      })
      setIsAddingProduct(false)
      
      alert('Product added successfully!')
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
  }

  const handleSaveProduct = async (productId: number, updatedData: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', productId)

      if (error) {
        console.error('Error updating product:', error)
        alert('Failed to update product')
        return
      }

      // Refresh products from Supabase
      const updatedProducts = await getProducts()
      setProducts(updatedProducts as AdminProduct[])

      // Close edit modal
      setEditingProduct(null)

      alert('Product updated successfully!')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)

        if (error) {
          console.error('Error deleting product:', error)
          alert('Failed to delete product')
          return
        }

        // Refresh products from Supabase
        const updatedProducts = await getProducts()
        setProducts(updatedProducts as AdminProduct[])

        alert('Product deleted successfully!')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      }
    }
  }

  const handleLogin = () => {
    if (password === "dopetech2024") {
      setIsAuthenticated(true)
      localStorage.setItem("adminAuthenticated", "true")
      localStorage.setItem("adminLoginTime", new Date().toISOString())
    } else {
      alert("Incorrect password!")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminLoginTime")
  }

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))]
    return ["all", ...uniqueCategories]
  }, [products])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-bg-dopetech">
        <div className="card-elevated p-8 max-w-md w-full animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[#F7DD0F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#F7DD0F]" />
              </div>
              <h1 className="text-4xl font-bold text-gradient mb-3">DopeTech Admin</h1>
              <p className="text-gray-300 text-lg">Enter password to access admin panel</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="input-glass w-full"
                placeholder="Enter admin password"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="btn-primary w-full"
            >
              <Lock className="w-5 h-5 mr-2" />
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white gradient-bg-dopetech">
      {/* Enhanced Header */}
      <div className="glass-dark border-b border-white/10 shadow-lg">
        <div className="container-max">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#F7DD0F]/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#F7DD0F]" />
                </div>
                <h1 className="text-3xl font-bold text-gradient">DopeTech Admin</h1>
              </div>
              <div className="flex items-center space-x-3 px-4 py-2 glass rounded-xl">
                <Package className="w-5 h-5 text-[#F7DD0F]" />
                <span className="text-gray-200 font-semibold">{products.length} Products</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all duration-300 text-red-400 hover:scale-105 focus-ring"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
              <div className="container-max section-padding">
        {/* Enhanced Tab Navigation */}
        <div className="glass rounded-2xl p-2 mb-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 font-semibold focus-ring ${
                activeTab === "products"
                  ? "bg-[#F7DD0F] text-black shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105"
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveTab("assets")}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 font-semibold focus-ring ${
                activeTab === "assets"
                  ? "bg-[#F7DD0F] text-black shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105"
              }`}
            >
              <FileImage className="w-5 h-5" />
              <span>Assets</span>
            </button>
            <button
              onClick={() => setActiveTab("carousel")}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 font-semibold focus-ring ${
                activeTab === "carousel"
                  ? "bg-[#F7DD0F] text-black shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105"
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Carousel Editor</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {assetsError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{assetsError}</p>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {/* Enhanced Controls */}
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    <span>Add Product</span>
                  </button>
                  
                  <div className="flex items-center space-x-3 px-4 py-2 glass rounded-xl">
                    <Package className="w-5 h-5 text-[#F7DD0F]" />
                    <span className="text-gray-200 font-semibold">{filteredProducts.length} Products</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-glass pl-12 pr-4 w-64"
                    />
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-glass px-4 py-3"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

        {/* Enhanced Add Product Modal */}
        {isAddingProduct && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="card-elevated p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#F7DD0F]/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[#F7DD0F]" />
                  </div>
                  <h2 className="text-3xl font-bold text-gradient">Add New Product</h2>
                </div>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 focus-ring"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Name</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    >
                      <option value="keyboard">Keyboard</option>
                      <option value="mouse">Mouse</option>
                      <option value="headphone">Headphone</option>
                      <option value="monitor">Monitor</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (Rs)</label>
                    <input
                      type="number"
                      value={newProduct.price || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewProduct({...newProduct, price: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Original Price (Rs)</label>
                    <input
                      type="number"
                      value={newProduct.original_price || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewProduct({...newProduct, original_price: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Product Image</label>
                    <div className="space-y-3">
                      {/* Image Upload */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setImageFile(file)
                              handleImageUpload(file)
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-sm"
                        />
                        {isUploadingImage && (
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F7DD0F]"></div>
                            <span>Uploading...</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Current Image Preview */}
                      {newProduct.image_url && (
                        <div className="flex items-center space-x-3">
                          <img 
                            src={newProduct.image_url} 
                            alt="Product preview" 
                            className="w-16 h-16 rounded object-cover border border-gray-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">Current image URL:</p>
                            <p className="text-xs text-gray-500 truncate">{newProduct.image_url}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Manual URL Input */}
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-400">Or enter image URL manually:</label>
                        <input
                          type="text"
                          value={newProduct.image_url}
                          onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={newProduct.rating || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewProduct({...newProduct, rating: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Reviews Count</label>
                    <input
                      type="number"
                      value={newProduct.reviews || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value)
                        setNewProduct({...newProduct, reviews: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProduct.discount || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value)
                        setNewProduct({...newProduct, discount: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newProduct.in_stock}
                        onChange={(e) => setNewProduct({...newProduct, in_stock: e.target.checked})}
                        className="rounded border-gray-600 bg-gray-700 text-[#F7DD0F] focus:ring-[#F7DD0F]"
                      />
                      <span className="text-sm font-medium">In Stock</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 px-4 py-2 bg-[#F7DD0F] text-black rounded-lg hover:bg-[#F7DD0F]/90 transition-colors"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {isAddingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Add New Product</h2>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Name</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    >
                      <option value="keyboard">Keyboard</option>
                      <option value="mouse">Mouse</option>
                      <option value="headphone">Headphone</option>
                      <option value="monitor">Monitor</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (Rs)</label>
                    <input
                      type="number"
                      value={newProduct.price || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewProduct({...newProduct, price: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Original Price (Rs)</label>
                    <input
                      type="number"
                      value={newProduct.original_price || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewProduct({...newProduct, original_price: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Product Image</label>
                    <div className="space-y-3">
                      {/* Image Upload */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setImageFile(file)
                              handleImageUpload(file)
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-sm"
                        />
                        {isUploadingImage && (
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F7DD0F]"></div>
                            <span>Uploading...</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Current Image Preview */}
                      {newProduct.image_url && (
                        <div className="flex items-center space-x-3">
                          <img 
                            src={newProduct.image_url} 
                            alt="Product preview" 
                            className="w-16 h-16 rounded object-cover border border-gray-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-400">Current image URL:</p>
                            <p className="text-xs text-gray-500 truncate">{newProduct.image_url}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Manual URL Input */}
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-400">Or enter image URL manually:</label>
                        <input
                          type="text"
                          value={newProduct.image_url}
                          onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={newProduct.rating || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewProduct({...newProduct, rating: isNaN(value) ? 0 : value})
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Reviews Count</label>
                    <input
                      type="number"
                      value={newProduct.reviews}
                      onChange={(e) => setNewProduct({...newProduct, reviews: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProduct.discount}
                      onChange={(e) => setNewProduct({...newProduct, discount: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F]"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newProduct.in_stock}
                        onChange={(e) => setNewProduct({...newProduct, in_stock: e.target.checked})}
                        className="rounded border-gray-600 bg-gray-700 text-[#F7DD0F] focus:ring-[#F7DD0F]"
                      />
                      <span className="text-sm font-medium">In Stock</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAddProduct}
                    className="flex-1 px-4 py-2 bg-[#F7DD0F] text-black rounded-lg hover:bg-[#F7DD0F]/90 transition-colors"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#F7DD0F]">Edit Product</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white"
                    >
                      <option value="keyboard">Keyboard</option>
                      <option value="mouse">Mouse</option>
                      <option value="headphone">Headphone</option>
                      <option value="monitor">Monitor</option>
                      <option value="accessory">Accessory</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (Rs)</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Original Price (Rs)</label>
                    <input
                      type="number"
                      value={editingProduct.original_price}
                      onChange={(e) => setEditingProduct({...editingProduct, original_price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={editingProduct.rating}
                      onChange={(e) => setEditingProduct({...editingProduct, rating: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Reviews</label>
                    <input
                      type="number"
                      value={editingProduct.reviews}
                      onChange={(e) => setEditingProduct({...editingProduct, reviews: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Product Image URL</label>
                    <input
                      type="text"
                      value={editingProduct.image_url}
                      onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      placeholder="Enter image URL"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingProduct.in_stock}
                        onChange={(e) => setEditingProduct({...editingProduct, in_stock: e.target.checked})}
                        className="rounded border-white/20 bg-white/5 text-[#F7DD0F] focus:ring-[#F7DD0F] focus:ring-2"
                      />
                      <span className="text-sm font-medium">In Stock</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleSaveProduct(editingProduct.id, editingProduct)}
                    className="flex-1 px-4 py-2 bg-[#F7DD0F] text-black rounded-lg hover:bg-[#F7DD0F]/90 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Display */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                isEditing={!!editingProduct && editingProduct.id === product.id}
              />
            ))}
          </div>
        )}
          </>
        )}

        {/* Enhanced Assets Tab */}
        {activeTab === "assets" && (
          <div className="space-y-8">
            {/* Enhanced Header Controls */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#F7DD0F]/20 rounded-xl flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-[#F7DD0F]" />
                  </div>
                  <h2 className="text-3xl font-bold text-gradient">Asset Management</h2>
                </div>
                <button
                  onClick={refreshAssets}
                  disabled={assetsLoading}
                  className="flex items-center space-x-3 px-6 py-3 glass hover:bg-white/15 hover:scale-105 transition-all duration-300 text-white focus-ring disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 text-[#F7DD0F] ${assetsLoading ? 'animate-spin' : ''}`} />
                  <span className="font-semibold">Refresh</span>
                </button>
              </div>
            </div>

            {/* Enhanced Current Assets Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Logo Preview */}
              <div className="card-elevated p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-[#F7DD0F]/20 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-[#F7DD0F]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Current Logo</h3>
                </div>
                {assetsLoading ? (
                  <div className="h-32 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl animate-pulse flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F7DD0F]" />
                      <span className="text-gray-300">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-32 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl flex items-center justify-center p-4 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
                      <img
                        src={logoUrl}
                        alt="Current Logo"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/logo/dopelogo.svg'
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-300 break-all bg-white/5 rounded-lg p-2 backdrop-blur-sm">{logoUrl}</p>
                  </div>
                )}
              </div>

              {/* Enhanced Video Preview */}
              <div className="card-elevated p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-[#F7DD0F]/20 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-[#F7DD0F]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Current Video</h3>
                </div>
                {assetsLoading ? (
                  <div className="h-32 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl animate-pulse flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#F7DD0F]" />
                      <span className="text-gray-300">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-32 bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl flex items-center justify-center p-4 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
                      <video
                        src={videoUrl}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        muted
                        loop
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement
                          target.src = '/video/footervid.mp4'
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-300 break-all bg-white/5 rounded-lg p-2 backdrop-blur-sm">{videoUrl}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Asset Upload */}
            <div className="card-elevated p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-[#F7DD0F]/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#F7DD0F]" />
                </div>
                <h3 className="text-xl font-semibold text-white">Upload New Assets</h3>
              </div>
              <AssetUploader />
            </div>

            {/* Enhanced Asset List */}
            {assets.length > 0 && (
              <div className="card-elevated p-6">
                <h3 className="text-xl font-semibold mb-6 text-white">Uploaded Assets</h3>
                <div className="space-y-3">
                  {assets.map((asset, index) => (
                    <div
                      key={asset.id || `${asset.name}-${asset.type}-${index}`}
                      className="group/item flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        {asset.type === 'logo' ? (
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <ImageIcon className="w-4 h-4 text-blue-400" />
                          </div>
                        ) : asset.type === 'video' ? (
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Video className="w-4 h-4 text-green-400" />
                          </div>
                        ) : (
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <ImageIcon className="w-4 h-4 text-purple-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{asset.name}</p>
                          <p className="text-xs text-gray-300 capitalize">{asset.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAsset(asset.name)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-300 text-red-400 hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carousel Editor Tab */}
        {activeTab === "carousel" && (
          <div className="space-y-8">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#F7DD0F]">Carousel Editor</h2>
              <p className="text-gray-400">Manage hero carousel images and content visibility</p>
            </div>

            {/* Carousel Editor Component */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <HeroImageManager />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
