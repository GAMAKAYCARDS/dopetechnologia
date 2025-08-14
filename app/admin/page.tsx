"use client"

import React, { useState, useEffect, useMemo } from "react"
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
  RefreshCw,
  Video,
  Settings,
  Grid3X3,
  FileImage
} from "lucide-react"
import { getProducts, type Product } from "@/lib/products-data"
import { useAssets } from '@/hooks/use-assets'
import { AssetUploader } from '@/components/asset-uploader'
import { supabase } from "@/lib/supabase"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AdminProduct extends Product {
  isNew?: boolean
  isEditing?: boolean
}

export default function AdminPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [activeTab, setActiveTab] = useState("products")

  // Product management state
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

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

  // Authentication handlers
  const handleLogin = () => {
    if (password === 'dopetech2024') {
      setIsAuthenticated(true)
      localStorage.setItem("adminAuthenticated", "true")
      localStorage.setItem("adminLoginTime", new Date().toISOString())
    } else {
      alert('Incorrect password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminLoginTime")
    setPassword("")
  }

  // Product management handlers
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
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()

      if (error) {
        console.error('Error adding product:', error)
        alert('Failed to add product')
        return
      }

      const updatedProducts = await getProducts()
      setProducts(updatedProducts as AdminProduct[])

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

      const updatedProducts = await getProducts()
      setProducts(updatedProducts as AdminProduct[])
      setEditingProduct(null)
      
      alert('Product updated successfully!')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

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

      const updatedProducts = await getProducts()
      setProducts(updatedProducts as AdminProduct[])
      
      alert('Product deleted successfully!')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#F7DD0F]/10 to-[#F7DD0F]/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/80 backdrop-blur-lg border border-[#F7DD0F]/20">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2 text-[#F7DD0F]">
              <Lock className="w-5 h-5" />
              DopeTech Admin Access
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter password to access DopeTech admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-3 bg-white/5 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button 
              onClick={handleLogin} 
              className="w-full bg-[#F7DD0F] text-black hover:bg-[#F7DD0F]/90 font-semibold"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#F7DD0F]/10 to-[#F7DD0F]/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F7DD0F] mb-2">DopeTech Admin Panel</h1>
            <p className="text-gray-300">Manage products and assets for DopeTech</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={refreshAssets}
              disabled={assetsLoading}
              variant="outline"
              className="text-[#F7DD0F] border-[#F7DD0F]/30 hover:bg-[#F7DD0F]/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${assetsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-[#F7DD0F] border-[#F7DD0F]/30 hover:bg-[#F7DD0F]/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {assetsError && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-500/30 text-red-300">
            <AlertDescription>{assetsError}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-[#F7DD0F]/20">
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-[#F7DD0F] data-[state=active]:text-black"
            >
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-[#F7DD0F] data-[state=active]:text-black"
            >
              <FileImage className="w-4 h-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-[#F7DD0F] data-[state=active]:text-black"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border-[#F7DD0F]/30 text-white placeholder-gray-400 focus:border-[#F7DD0F] focus:ring-[#F7DD0F]/20"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48 bg-black/50 border-[#F7DD0F]/30 text-white focus:border-[#F7DD0F] focus:ring-[#F7DD0F]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-[#F7DD0F]/30">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="mouse">Mouse</SelectItem>
                    <SelectItem value="headphones">Headphones</SelectItem>
                    <SelectItem value="speaker">Speaker</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="gamepad">Gamepad</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="smartphone">Smartphone</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-[#F7DD0F] text-black hover:bg-[#F7DD0F]/90 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="bg-black/50 border-[#F7DD0F]/20 hover:border-[#F7DD0F]/40 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="text-[#F7DD0F] hover:text-[#F7DD0F]/80 hover:bg-[#F7DD0F]/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-gray-300">
                        {product.category} • <span className="text-[#F7DD0F] font-semibold">Rs {product.price}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg mb-3 border border-[#F7DD0F]/20"
                      />
                      <p className="text-sm text-gray-300 line-clamp-2">{product.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Add Product Modal */}
          {isAddingProduct && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-black/90 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#F7DD0F]/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#F7DD0F]">Add New Product</h2>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="text-gray-400 hover:text-[#F7DD0F]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Product Name</label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Category</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white"
                      >
                        <option value="keyboard">Keyboard</option>
                        <option value="mouse">Mouse</option>
                        <option value="headphone">Headphone</option>
                        <option value="monitor">Monitor</option>
                        <option value="accessory">Accessory</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Price (Rs)</label>
                      <input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Original Price (Rs)</label>
                      <input
                        type="number"
                        value={newProduct.original_price}
                        onChange={(e) => setNewProduct({...newProduct, original_price: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-white">Description</label>
                      <textarea
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-white">Product Image</label>
                      <div className="space-y-3">
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
                            className="flex-1 px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-sm text-white"
                          />
                          {isUploadingImage && (
                            <div className="flex items-center space-x-2 text-sm text-[#F7DD0F]">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F7DD0F]"></div>
                              <span>Uploading...</span>
                            </div>
                          )}
                        </div>
                        
                        {newProduct.image_url && (
                          <div className="flex items-center space-x-3">
                            <img 
                              src={newProduct.image_url} 
                              alt="Product preview" 
                              className="w-16 h-16 rounded object-cover border border-[#F7DD0F]/30"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-300">Current image URL:</p>
                              <p className="text-xs text-gray-400 truncate">{newProduct.image_url}</p>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-300">Or enter image URL manually:</label>
                          <input
                            type="text"
                            value={newProduct.image_url}
                            onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-sm text-white placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Rating</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={newProduct.rating}
                        onChange={(e) => setNewProduct({...newProduct, rating: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Reviews Count</label>
                      <input
                        type="number"
                        value={newProduct.reviews}
                        onChange={(e) => setNewProduct({...newProduct, reviews: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newProduct.discount}
                        onChange={(e) => setNewProduct({...newProduct, discount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newProduct.in_stock}
                          onChange={(e) => setNewProduct({...newProduct, in_stock: e.target.checked})}
                          className="rounded border-[#F7DD0F]/30 bg-black/50 text-[#F7DD0F] focus:ring-[#F7DD0F]"
                        />
                        <span className="text-sm font-medium text-white">In Stock</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleAddProduct}
                      className="flex-1 px-4 py-2 bg-[#F7DD0F] text-black rounded-lg hover:bg-[#F7DD0F]/90 transition-colors font-semibold"
                    >
                      Add Product
                    </button>
                    <button
                      onClick={() => setIsAddingProduct(false)}
                      className="flex-1 px-4 py-2 bg-black/50 border border-[#F7DD0F]/30 text-white rounded-lg hover:bg-black/70 transition-colors"
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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-black/90 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#F7DD0F]/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#F7DD0F]">Edit Product</h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-[#F7DD0F]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Product Name</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Category</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white"
                      >
                        <option value="keyboard">Keyboard</option>
                        <option value="mouse">Mouse</option>
                        <option value="headphone">Headphone</option>
                        <option value="monitor">Monitor</option>
                        <option value="accessory">Accessory</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Price (Rs)</label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Original Price (Rs)</label>
                      <input
                        type="number"
                        value={editingProduct.original_price}
                        onChange={(e) => setEditingProduct({...editingProduct, original_price: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-white">Description</label>
                      <textarea
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Rating</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={editingProduct.rating}
                        onChange={(e) => setEditingProduct({...editingProduct, rating: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Reviews</label>
                      <input
                        type="number"
                        value={editingProduct.reviews}
                        onChange={(e) => setEditingProduct({...editingProduct, reviews: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-white">Product Image URL</label>
                      <input
                        type="text"
                        value={editingProduct.image_url}
                        onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})}
                        className="w-full px-3 py-2 bg-black/50 border border-[#F7DD0F]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] text-white placeholder-gray-400"
                        placeholder="Enter image URL"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.in_stock}
                          onChange={(e) => setEditingProduct({...editingProduct, in_stock: e.target.checked})}
                          className="rounded border-[#F7DD0F]/30 bg-black/50 text-[#F7DD0F] focus:ring-[#F7DD0F] focus:ring-2"
                        />
                        <span className="text-sm font-medium text-white">In Stock</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4 border-t border-[#F7DD0F]/20">
                    <button
                      onClick={() => handleSaveProduct(editingProduct.id, editingProduct)}
                      className="flex-1 px-4 py-2 bg-[#F7DD0F] text-black rounded-lg hover:bg-[#F7DD0F]/90 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 bg-black/50 border border-[#F7DD0F]/30 text-white rounded-lg hover:bg-black/70 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Current Assets Preview */}
              <div className="space-y-6">
                <Card className="bg-black/50 border-[#F7DD0F]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#F7DD0F]" />
                      Current Logo
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Currently displayed logo on the website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assetsLoading ? (
                      <div className="h-32 bg-black/30 rounded-lg animate-pulse flex items-center justify-center border border-[#F7DD0F]/20">
                        <span className="text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="h-32 bg-black/30 rounded-lg flex items-center justify-center p-4 border border-[#F7DD0F]/20">
                          <img
                            src={logoUrl}
                            alt="Current Logo"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/logo/dopelogo.svg'
                            }}
                          />
                        </div>
                        <p className="text-sm text-gray-300 break-all">{logoUrl}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-[#F7DD0F]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Video className="w-5 h-5 text-[#F7DD0F]" />
                      Current Video
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Currently displayed video on the website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assetsLoading ? (
                      <div className="h-32 bg-black/30 rounded-lg animate-pulse flex items-center justify-center border border-[#F7DD0F]/20">
                        <span className="text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="h-32 bg-black/30 rounded-lg flex items-center justify-center p-4 border border-[#F7DD0F]/20">
                          <video
                            src={videoUrl}
                            className="max-h-full max-w-full object-contain"
                            muted
                            loop
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement
                              target.src = '/video/footervid.mp4'
                            }}
                          />
                        </div>
                        <p className="text-sm text-gray-300 break-all">{videoUrl}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Asset Upload */}
              <div>
                <Card className="bg-black/50 border-[#F7DD0F]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#F7DD0F]" />
                      Upload New Assets
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Upload new logo or video files to replace current assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssetUploader />
                  </CardContent>
                </Card>

                {/* Asset List */}
                {assets.length > 0 && (
                  <Card className="bg-black/50 border-[#F7DD0F]/20 mt-6">
                    <CardHeader>
                      <CardTitle className="text-white">Uploaded Assets</CardTitle>
                      <CardDescription className="text-gray-300">
                        All assets stored in Supabase
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {assets.map((asset, index) => (
                          <div
                            key={asset.id || `${asset.name}-${asset.type}-${index}`}
                            className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#F7DD0F]/10"
                          >
                            <div className="flex items-center gap-3">
                              {asset.type === 'logo' ? (
                                <ImageIcon className="w-4 h-4 text-[#F7DD0F]" />
                              ) : asset.type === 'video' ? (
                                <Video className="w-4 h-4 text-[#F7DD0F]" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-[#F7DD0F]" />
                              )}
                              <div>
                                <p className="text-white font-medium">{asset.name}</p>
                                <p className="text-xs text-gray-300">{asset.type}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAsset(asset.name)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-black/50 border-[#F7DD0F]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-[#F7DD0F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F7DD0F]">{products.length}</div>
                  <p className="text-xs text-gray-300">Active products in store</p>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-[#F7DD0F]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Total Assets</CardTitle>
                  <FileImage className="h-4 w-4 text-[#F7DD0F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F7DD0F]">{assets.length}</div>
                  <p className="text-xs text-gray-300">Logo, video, and image assets</p>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-[#F7DD0F]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Categories</CardTitle>
                  <Grid3X3 className="h-4 w-4 text-[#F7DD0F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F7DD0F]">
                    {new Set(products.map(p => p.category)).size}
                  </div>
                  <p className="text-xs text-gray-300">Product categories</p>
                </CardContent>
              </Card>

              <Card className="bg-black/50 border-[#F7DD0F]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">In Stock</CardTitle>
                  <CheckCircle className="h-4 w-4 text-[#F7DD0F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F7DD0F]">
                    {products.filter(p => p.in_stock).length}
                  </div>
                  <p className="text-xs text-gray-300">Products available</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
