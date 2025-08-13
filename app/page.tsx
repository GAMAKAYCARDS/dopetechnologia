"use client"

import { useState, useEffect, useRef, useMemo, useCallback, useTransition, Suspense } from "react"
import { useRouter } from "next/navigation"
import {
  Headphones,
  Keyboard,
  Mouse,
  Speaker,
  Search,
  ShoppingBag,
  Camera,
  Cable,
  Plus,
  Minus,
  X,
  Grid,
  Menu,
  Instagram,
  Gamepad2,
  Laptop,
  Smartphone,
  Monitor,
} from "lucide-react"
import dynamic from "next/dynamic"
import LazyAIChat from "@/components/lazy-ai-chat"
import SEOOptimizer, { defaultStructuredData } from "@/components/seo-optimizer"
import SupabaseCheckout from "@/components/supabase-checkout"
import { getProducts, type Product } from "@/lib/products-data"
import { useCart } from "@/contexts/cart-context"

// Lazy load heavy components
const DynamicSupabaseCheckout = dynamic(() => import("@/components/supabase-checkout"), {
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96" />,
  ssr: false
})

// Reusable image component for Supabase data with fallback
const ProductImage = ({ src, alt, className, ...props }: { src: string; alt: string; className?: string; [key: string]: any }) => {
  // Fallback images for when Supabase image_url is empty or invalid
  const fallbackImages = [
    'https://images.unsplash.com/photo-1544866092-1677b00f868b?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop&crop=center'
  ]

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)]
    e.currentTarget.src = randomImage
  }

  // If src is empty or invalid, use a fallback immediately
  const imageSrc = src && src.trim() !== '' ? src : fallbackImages[0]

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}


// Product type is now imported from lib/products-data



export default function DopeTechEcommerce() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scrollY, setScrollY] = useState(0)
  
  // Performance monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.loadEventStart, 'ms')
          }
        }
      })
      observer.observe({ entryTypes: ['navigation'] })
      return () => observer.disconnect()
    }
  }, [])
  const [products, setProducts] = useState<Product[]>([])
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    getCartCount, 
    getCartTotal, 
    clearCart,
    cartOpen, 
    setCartOpen,
    checkoutModalOpen,
    setCheckoutModalOpen
  } = useCart()

  // Get products from Supabase (no local storage fallback)
  const getLocalProducts = (): Product[] => {
    return products
  }
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchDraft, setSearchDraft] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchModalReady, setSearchModalReady] = useState(false)
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [showBackToCategories, setShowBackToCategories] = useState(false)
  const [isCategoryInView, setIsCategoryInView] = useState(true)
  const [categoryIconIndex, setCategoryIconIndex] = useState(0)
  const [headerOffset, setHeaderOffset] = useState<number>(72)
  const [isAdmin, setIsAdmin] = useState(false)
  const [promoOrder, setPromoOrder] = useState<number[]>([])
  const [draggedPromoIndex, setDraggedPromoIndex] = useState<number | null>(null)

  const [userBehavior, setUserBehavior] = useState({
    viewedProducts: [] as number[],
    cartItems: [] as number[],
    searchHistory: [] as string[]
  })


  const [animationKey, setAnimationKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [posterIndex, setPosterIndex] = useState(0)
  const searchModalRef = useRef<HTMLDivElement>(null)
  const categorySectionRef = useRef<HTMLDivElement>(null)

  // Throttled scroll handler for better performance
  const throttledScrollHandler = useCallback(
    throttle(() => {
      if (typeof window !== 'undefined') {
        setScrollY(window.scrollY)
      }
    }, 16), // ~60fps
    []
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener("scroll", throttledScrollHandler, { passive: true })
      return () => window.removeEventListener("scroll", throttledScrollHandler)
    }
  }, [throttledScrollHandler])

  // Throttle utility function
  function throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout | null = null
    let lastExecTime = 0
    return ((...args: any[]) => {
      const currentTime = Date.now()
      
      if (currentTime - lastExecTime > delay) {
        func(...args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func(...args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }) as T
  }

  // Simplified product fetching with immediate loading
  useEffect(() => {
    let isMounted = true

    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        console.log('🔄 Starting to fetch products...')
        
        // Fetch products from Supabase
        const fetchedProducts = await getProducts()
        
        if (isMounted) {
          console.log('✅ Products loaded successfully!')
          console.log('📦 Number of products:', fetchedProducts.length)
          console.log('🏷️ First product:', fetchedProducts[0]?.name)
          console.log('🖼️ First product image:', fetchedProducts[0]?.image_url)
          setProducts(fetchedProducts)
          setIsLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error fetching products:', error)
          console.log('🔄 Falling back to sample products...')
          setProducts(sampleProducts)
          setIsLoading(false)
        }
      }
    }

    // Add a timeout to ensure loading state is always cleared
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ Loading timeout reached, using sample products')
        setProducts(sampleProducts)
        setIsLoading(false)
      }
    }, 2000) // 2 second timeout for faster loading on Netlify

    fetchProducts()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Optimized header height measurement with debounced resize
  const debouncedUpdateOffset = useCallback(
    debounce(() => {
      if (typeof window === 'undefined') return
      const header = document.querySelector('header.dopetech-nav') as HTMLElement | null
      const h = header ? header.getBoundingClientRect().height : 56
      const extra = window.innerWidth >= 1024 ? 8 : 16
      setHeaderOffset(Math.round(h + extra))
    }, 100),
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const header = document.querySelector('header.dopetech-nav') as HTMLElement | null

    debouncedUpdateOffset()

    const onResize = debouncedUpdateOffset
    window.addEventListener('resize', onResize, { passive: true })

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && header) {
      ro = new ResizeObserver(debouncedUpdateOffset)
      ro.observe(header)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      if (ro) ro.disconnect()
    }
  }, [debouncedUpdateOffset, isMobileMenuOpen, isSearchOpen])

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout | null = null
    return ((...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  }

  // Optimized search debouncing with useCallback
  const debouncedSetSearchQuery = useCallback(
    debounce((query: string) => {
      setSearchQuery(query)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSetSearchQuery(searchDraft)
  }, [searchDraft, debouncedSetSearchQuery])

  // Sample products for fallback when Supabase data is not available
  const sampleProducts = [
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
  ]

  // Update products when products state changes
  useEffect(() => {
    console.log('🔄 Products state changed:', products.length, 'products')
    if (products.length > 0) {
      console.log('📦 First product:', products[0])
      console.log('🖼️ First product image URL:', products[0]?.image_url)
      setCurrentProducts(products)
    } else {
      console.log('⚠️ No products from Supabase, using sample data')
      setCurrentProducts(sampleProducts)
    }
  }, [products])

  // Auto-shuffle poster products
  useEffect(() => {
    if (products.length === 0) return
    
    const interval = setInterval(() => {
      const container = document.querySelector('.flex.overflow-x-auto.scrollbar-hide') as HTMLElement;
      if (container && !container.classList.contains('user-interacting')) {
        const productsToShow = products.filter((p: any) => !p.hidden_on_home).slice(0, 6);
        if (productsToShow.length === 0) return
        
        const currentIndex = posterIndex;
        const nextIndex = (currentIndex + 1) % productsToShow.length;
        
        // Scroll to the next slide
        const slideWidth = container.clientWidth;
        const newScrollLeft = nextIndex * slideWidth;
        
        container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
        setPosterIndex(nextIndex);
      }
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [posterIndex, products])

  // Initialize admin mode and promo order preferences
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const flag = localStorage.getItem('adminAuthenticated') === 'true'
      setIsAdmin(!!flag)
      const stored = localStorage.getItem('promoOrderV1')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setPromoOrder(parsed.filter((id: any) => Number.isFinite(id)))
        }
      }
    } catch (e) {
      console.error('Error reading admin/promo order:', e)
    }
  }, [])



  // Handle keyboard events and click outside for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false)
        setSearchQuery("")
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(e.target as Node) && searchModalReady) {
        console.log("Click outside detected")
        setIsSearchOpen(false)
        setSearchQuery("")
      }
    }

    const handleTouchOutside = (e: TouchEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(e.target as Node) && searchModalReady) {
        console.log("Touch outside detected")
        setIsSearchOpen(false)
        setSearchQuery("")
      }
    }

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleTouchOutside)
      // Prevent body scroll when search is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleTouchOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isSearchOpen, searchModalReady])

  // Set modal as ready after a short delay to prevent immediate closing
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        setSearchModalReady(true)
      }, 100)
      return () => {
        clearTimeout(timer)
        setSearchModalReady(false)
      }
    } else {
      setSearchModalReady(false)
    }
  }, [isSearchOpen])

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    // Check on initial load as well
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsMobileMenuOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileMenuOpen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Force dark mode
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } catch (error) {
        console.error('Error setting theme:', error)
      }
    }
  }, [])



  // DopeTech animation restart effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1)
    }, 20000) // Restart animation every 20 seconds

    return () => clearInterval(interval)
  }, [])

  // Track category section visibility and show the button only when it's out of view
  useEffect(() => {
    const el = categorySectionRef.current
    if (!el || typeof window === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setIsCategoryInView(entry.isIntersecting),
      { root: null, threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setShowBackToCategories(!isCategoryInView)
  }, [isCategoryInView])

  // Cycle through category icons while the button is visible
  // (moved below categories state declaration to avoid TS order error)





  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    // Clear search when switching categories
    setSearchQuery("")
    
    // Smooth scroll to products section with offset
    setTimeout(() => {
      const productsSection = document.querySelector('[data-products-section]')
      if (productsSection) {
        // Calculate the target scroll position with measured header height
        const header = document.querySelector('header.dopetech-nav') as HTMLElement | null
        const headerHeight = header ? header.offsetHeight + 12 : 72
        const rect = productsSection.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const targetPosition = scrollTop + rect.top - headerHeight
        
        // Smooth scroll to the calculated position
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        })
      }
    }, 60)
  }

  const scrollToCategoryFilters = () => {
    setTimeout(() => {
      const header = document.querySelector('header.dopetech-nav') as HTMLElement | null
      const headerHeight = header ? header.offsetHeight + 12 : 72
      const elem = categorySectionRef.current
      if (elem) {
        const rect = elem.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const targetPosition = scrollTop + rect.top - headerHeight
        window.scrollTo({ top: targetPosition, behavior: 'smooth' })
      }
    }, 0)
  }



  const handleAddToCartWithTracking = useCallback((product: Product) => {
    startTransition(() => {
      addToCart(product, 1)
      
      // Track user behavior for AI recommendations
      setUserBehavior(prev => ({
        ...prev,
        cartItems: [...prev.cartItems, product.id]
      }))
    })
  }, [addToCart])

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!")
      return
    }
    
    setCheckoutModalOpen(true)
  }

  const handleCartReset = () => {
    // Reset cart and close checkout modal
    setCheckoutModalOpen(false)
  }

  const filteredProducts = useMemo(() => {
    if (!currentProducts.length) return []
    
    const query = searchQuery.toLowerCase().trim()
    const category = selectedCategory
    
    return currentProducts.filter(product => {
      // Hide products explicitly flagged to be hidden on home
      if ((product as any).hidden_on_home) return false
      
      // If there's a search query, prioritize search results over category filtering
      if (query) {
        return product.name.toLowerCase().includes(query) ||
               product.description.toLowerCase().includes(query)
      }
      
      // If no search query, filter by category
      return category === "all" || product.category === category
    })
  }, [currentProducts, searchQuery, selectedCategory])

  // Optimized promo products calculation
  const promoProducts = useMemo(() => {
    if (!currentProducts.length) return []
    
    const PROMO_CARD_MAX = 6
    const visible = currentProducts.filter((p) => !(p as any).hidden_on_home)
    
    if (!visible.length) return []
    
    // Reorder by admin preference
    const orderSet = new Set(promoOrder)
    const orderedByAdmin = [
      ...promoOrder
        .map((id) => visible.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
      ...visible.filter((p) => !orderSet.has(p.id)),
    ]
    
    const base = orderedByAdmin.slice(0, PROMO_CARD_MAX)
    if (base.length === PROMO_CARD_MAX) return base
    
    const remaining = PROMO_CARD_MAX - base.length
    const restPool = orderedByAdmin.slice(base.length)
    const extras = restPool.slice(0, remaining)
    
    // If still short, repeat from base with a deterministic offset
    if (extras.length < remaining && base.length > 0) {
      const start = currentProducts.length % base.length
      for (let i = 0; extras.length < remaining; i++) {
        const idx = (start + i) % base.length
        extras.push(base[idx])
      }
    }
    
    return [...base, ...extras]
  }, [currentProducts, promoOrder])

  // Optimized desktop extra promo products
  const promoProductsDesktopExtra = useMemo(() => {
    if (!currentProducts.length) return []
    
    const EXTRA_MAX = 6
    const visible = currentProducts.filter((p) => !(p as any).hidden_on_home)
    
    if (!visible.length) return []
    
    const orderSet = new Set(promoOrder)
    const orderedByAdmin = [
      ...promoOrder
        .map((id) => visible.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined),
      ...visible.filter((p) => !orderSet.has(p.id)),
    ]
    
    // Skip the first 6 used in the main grid
    const start = 6
    return orderedByAdmin.slice(start, start + EXTRA_MAX)
  }, [currentProducts, promoOrder])

  // Debug logging removed for performance

  // Get categories from localStorage or use defaults
  // SVG Icon Component
  const SvgIcon = ({ svgContent, className }: { svgContent: string, className?: string }) => (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'currentColor'
      }}
    />
  )

  // Type for category icons
  type CategoryIcon = React.ComponentType<{ className?: string }> | { type: 'svg', content: string }

  // Helper function to render category icons
  const renderCategoryIcon = (icon: CategoryIcon, className: string) => {
    if (typeof icon === 'object' && 'type' in icon && icon.type === 'svg') {
      return <SvgIcon svgContent={icon.content} className={className} />
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>
    return <IconComp className={className} />
  }

  // Promo card shape options and deterministic picker
  // Use a consistent radius across all promo cards to avoid visual unevenness
  const promoShapeOptions = [
    "rounded-2xl",
  ] as const

  // Deterministic shape picker to avoid hydration mismatches (SSR = Client)
  // Still gives variety across items by using id + index salt.
  const getPromoShape = (id: number, index: number) => {
    const seed = Number.isFinite(id) ? id + index * 7 : index
    const idx = Math.abs(seed) % promoShapeOptions.length
    return promoShapeOptions[idx]
  }

  // Mosaic layout for exactly up to 6 items (desktop-friendly, no gaps)
  // xs: all squares; sm+: hero + vertical + horizontals arranged to fill 3 columns
  const getPromoLayout = (index: number, total: number) => {
    // Always squares on xs
    const xs = "col-span-1 row-span-1"
    if (total <= 4) {
      return { wrapper: xs, ratio: "" }
    }
    if (total === 5) {
      // Layout for 5: hero(2x2), one vertical, two squares
      const map = [
        `${xs} sm:col-span-2 sm:row-span-2`, // 0 hero
        `${xs} sm:col-span-1 sm:row-span-2`, // 1 vertical
        xs,                                   // 2 square
        xs,                                   // 3 square
        xs,                                   // 4 square
      ]
      return { wrapper: map[index % 5], ratio: "" }
    }
    // total >= 6 (we cap at 6)
    // Layout for 6: hero(2x2), vertical(1x2), horizontal(2x1), square, horizontal(2x1), square
    // This produces two fully-filled rows after the top block (no gaps)
    const map6 = [
      `${xs} sm:col-span-2 sm:row-span-2`, // 0 hero
      `${xs} sm:col-span-1 sm:row-span-2`, // 1 vertical
      `${xs} sm:col-span-2 sm:row-span-1`, // 2 horizontal
      xs,                                   // 3 square
      `${xs} sm:col-span-2 sm:row-span-1`, // 4 horizontal
      xs,                                   // 5 square
    ]
    return { wrapper: map6[index % 6], ratio: "" }
  }

  // Admin drag helpers
  const handlePromoDragStart = (index: number) => {
    if (!isAdmin) return
    setDraggedPromoIndex(index)
  }

  const handlePromoDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return
    e.preventDefault()
  }

  const handlePromoDrop = (dropIndex: number) => {
    if (!isAdmin) return
    if (draggedPromoIndex === null || draggedPromoIndex === dropIndex) return
    // Combine both grids for unified ordering on desktop
    const currentIds = [...promoProducts, ...promoProductsDesktopExtra].map((p) => p.id)
    const moved = [...currentIds]
    const [m] = moved.splice(draggedPromoIndex, 1)
    if (m === undefined) return
    moved.splice(Math.min(dropIndex, moved.length), 0, m)
    // Merge moved order to the front of existing preference
    const merged = [...moved, ...promoOrder.filter((id) => !moved.includes(id))]
    setPromoOrder(merged)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('promoOrderV1', JSON.stringify(merged))
        window.dispatchEvent(new Event('promoOrderUpdated'))
      }
    } catch {}
    setDraggedPromoIndex(null)
  }

  const getCategories = () => {
    if (typeof window !== 'undefined') {
      try {
        const adminCategories = localStorage.getItem('adminCategories')
        if (adminCategories) {
          try {
            const parsed = JSON.parse(adminCategories)
            // Add icons to categories
            const result = parsed.map((cat: any) => {
              // If category has a custom icon, use it
              if (cat.icon && cat.icon !== "Grid") {
                if (cat.icon.startsWith('<svg')) {
                  // Return SVG content as a special object that will be handled by SvgIcon
                  return {
                    ...cat,
                    icon: { type: 'svg', content: cat.icon }
                  }
                } else {
                  // Map common Lucide icon names to components
                  const iconComponent = 
                    cat.icon === "Gamepad2" ? Gamepad2 :
                    cat.icon === "Laptop" ? Laptop :
                    cat.icon === "Smartphone" ? Smartphone :
                    cat.icon === "Headphones" ? Headphones :
                    cat.icon === "Speaker" ? Speaker :
                    cat.icon === "Monitor" ? Monitor :
                    cat.icon === "Cable" ? Cable :
                    cat.icon === "Keyboard" ? Keyboard :
                    cat.icon === "Mouse" ? Mouse :
                    cat.icon === "Camera" ? Camera :
                    Grid // Default fallback
                  
                  return {
                    ...cat,
                    icon: iconComponent as React.ComponentType<{ className?: string }>
                  }
                }
              }
              
              // Use default icon mapping for existing categories
              return {
                ...cat,
                icon: (cat.id === "all" ? Grid :
                      cat.id === "keyboard" ? Keyboard :
                      cat.id === "mouse" ? Mouse :
                      cat.id === "audio" ? Headphones :
                      cat.id === "speaker" ? Speaker :
                      cat.id === "monitor" ? Camera :
                      cat.id === "accessory" ? Cable : Grid) as React.ComponentType<{ className?: string }>
              }
            })
            return result
          } catch (e) {
            console.error('Error parsing admin categories:', e)
          }
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error)
      }
    }
    return [
      { id: "all", name: "All Products", icon: Grid },
      { id: "keyboard", name: "Keyboards", icon: Keyboard },
      { id: "mouse", name: "Mouse", icon: Mouse },
      { id: "audio", name: "Audio", icon: Headphones },
      { id: "speaker", name: "Speakers", icon: Speaker },
      { id: "monitor", name: "Monitors", icon: Camera },
      { id: "accessory", name: "Accessories", icon: Cable },
    ]
  }

  const [categories, setCategories] = useState<{ id: string; name: string; icon: CategoryIcon }[]>([
    { id: "all", name: "All Products", icon: Grid },
    { id: "keyboard", name: "Keyboards", icon: Keyboard },
    { id: "mouse", name: "Mouse", icon: Mouse },
    { id: "audio", name: "Audio", icon: Headphones },
    { id: "speaker", name: "Speakers", icon: Speaker },
    { id: "monitor", name: "Monitors", icon: Camera },
    { id: "accessory", name: "Accessories", icon: Cable },
  ])

  // Update categories from localStorage or defaults
  useEffect(() => {
    const categoriesFromStorage = getCategories()
    setCategories(categoriesFromStorage)
  }, [])

  // Cycle through category icons while the button is visible
  useEffect(() => {
    if (!showBackToCategories || categories.length === 0) return
    const id = setInterval(() => {
      setCategoryIconIndex((prev) => (prev + 1) % categories.length)
    }, 900)
    return () => clearInterval(id)
  }, [showBackToCategories, categories])



  return (
    <div className="text-white min-h-screen transition-colors duration-100 tap-feedback scrollbar-hide gradient-bg">
      <SEOOptimizer structuredData={defaultStructuredData} />
      
      {/* Enhanced Loading Overlay with Skeleton */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            {/* Animated Logo */}
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F7DD0F] to-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                  <img 
                    src="/logo/dopelogo.svg" 
                    alt="DopeTech" 
                    className="w-16 h-16 animate-pulse"
                  />
                </div>
              </div>
              <div className="absolute -inset-4 bg-[#F7DD0F]/20 rounded-full animate-ping"></div>
            </div>
            
            {/* Loading Text */}
            <h2 className="text-[#F7DD0F] font-bold text-xl mb-2 animate-fade-in">
              Loading DopeTech...
            </h2>
            <p className="text-gray-300 text-sm mb-6 animate-fade-in-up">
              Preparing your premium tech experience
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#F7DD0F] to-yellow-400 rounded-full animate-progress-bar"></div>
            </div>
            
            {/* Animated Dots */}
            <div className="flex justify-center space-x-2 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-[#F7DD0F] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            
            {/* Skip Button */}
            <button 
              onClick={() => {
                setIsLoading(false)
              }}
              className="px-6 py-3 bg-[#F7DD0F]/10 text-[#F7DD0F] border border-[#F7DD0F]/30 rounded-xl hover:bg-[#F7DD0F]/20 hover:border-[#F7DD0F]/50 transition-all duration-300 font-medium"
            >
              Skip Loading
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Mobile Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 dopetech-nav animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3">
          <nav className="flex items-center justify-between h-auto min-h-16">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 min-w-0 flex-1 pt-1">
              <img src="/logo/dopelogo.svg" alt="DopeTech" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 logo-adaptive flex-shrink-0 origin-left scale-[1.3]" />
              
              {/* Tagline - Mobile: Headline Only, Desktop: Both */}
              <div className="ml-2 md:ml-3">
                <p className="text-xs md:text-sm text-gray-300 font-medium leading-tight">
                  Your Setup, <span className="text-[#F7DD0F]">Perfected</span>
                </p>
                <p className="hidden md:block text-xs text-gray-400 leading-tight">
                  Premium Tech Gear from <span className="text-[#F7DD0F]">DopeTech</span> Nepal
                </p>
              </div>
              

            </div>

            {/* Right Side - Controls */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 flex-shrink-0 pt-1">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 touch-target flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-6 h-6 sm:w-6 sm:h-6 md:w-6 md:h-6 hover:text-[#F7DD0F] transition-colors" />
              </button>

              {/* Shopping Cart with Badge */}
              <button 
                onClick={() => setCartOpen(true)}
                className="relative p-2 touch-target flex items-center justify-center" 
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-6 h-6 sm:w-6 sm:h-6 md:w-6 md:h-6 hover:text-[#F7DD0F] transition-colors" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-1 sm:-right-1 md:-top-2 md:-right-2 bg-[#F7DD0F] text-black text-xs rounded-full w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center font-bold animate-bounce">
                    {getCartCount()}
                  </span>
                )}
              </button>

              {/* Instagram Button */}
              <a
                href="https://www.instagram.com/dopetech_np/?hl=ne"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 touch-target flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 sm:w-6 sm:h-6 md:w-6 md:h-6 hover:text-[#F7DD0F] transition-colors" />
              </a>



              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 touch-target flex items-center justify-center"
                aria-label="Menu"
                data-mobile-menu
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 hover:text-[#F7DD0F] transition-colors animate-scale-in" />
                ) : (
                  <Menu className="w-6 h-6 hover:text-[#F7DD0F] transition-colors" />
                )}
              </button>
            </div>
          </nav>



          {/* Enhanced Desktop Search Modal */}
          {isSearchOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in"
            >
              <div 
                ref={searchModalRef}
                className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 animate-scale-in mt-20 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Search Products</h3>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery("")
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors hover:scale-105"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for keyboards, mice, headphones, speakers..."
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7DD0F] focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                    autoFocus
                  />
                </div>
                
                {/* Search Results Preview */}
                {searchDraft.trim() && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          router.push(`/product/${product.id}`)
                          setIsSearchOpen(false)
                          setSearchQuery("")
                        }}
                      >
                        <ProductImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{product.name}</h4>
                          <p className="text-[#F7DD0F] font-semibold">Rs {product.price}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startTransition(() => addToCart(product))
                          }}
                          className="p-2 bg-[#F7DD0F] text-black rounded-full hover:bg-[#F7DD0F]/90 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 animate-slide-in-down bg-black/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-gray-700 shadow-2xl md:hidden mobile-menu-enhanced z-50" data-mobile-menu>

              {/* Mobile Tagline */}
              <div className="text-center mb-4 pb-4 border-b border-gray-700">
                <p className="text-sm text-gray-300 font-medium">
                  Your Setup, <span className="text-[#F7DD0F]">Perfected</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Premium Tech Gear from <span className="text-[#F7DD0F]">DopeTech</span> Nepal
                </p>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleCategoryClick(category.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 sm:space-x-4 px-4 sm:px-5 py-3 sm:py-4 rounded-xl transition-all duration-200 touch-target mobile-menu-item ${
                      selectedCategory === category.id
                        ? "bg-[#F7DD0F] text-black shadow-lg"
                        : "text-white bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/10 hover:border-white/30 shadow-lg"
                    }`}
                    style={{ minHeight: '56px' }}
                  >
                    {/* Category Icon */}
                    <div className={`flex-shrink-0 ${
                      selectedCategory === category.id ? "text-black" : "text-[#F7DD0F]"
                    }`}>
                      {renderCategoryIcon(category.icon, "w-5 h-5 sm:w-6 sm:h-6")}
                    </div>
                    
                    {/* Category Name */}
                    <span className="font-medium text-base sm:text-lg">{category.name}</span>
                  </button>
                ))}
                

              </div>
            </div>
          )}
        </div>
      </header>

      {/* Welcome Section - Mobile Optimized */}
      <section className="safe-top pb-4 sm:pb-8 md:pb-12 relative mobile-hero" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a0a 50%, #000000 100%)', paddingTop: headerOffset }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            {/* Hero heading removed - now in navigation */}
            {/* Tagline removed - now in navigation */}
            
            {/* Big Sliding Poster - Hero area */}
            <div className="w-full mx-auto mt-3 sm:mt-4 md:mt-6 lg:mt-8 mb-3 sm:mb-4 md:mb-6 lg:mb-6 animate-fade-in-up stagger-3">
              {/* Big Poster with Smooth Shuffling - Larger Size */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm shadow-2xl">
                <div className="relative h-72 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] overflow-hidden">
                  {/* Hero Carousel Navigation Buttons - Glassy Style */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                    <button
                      onClick={() => {
                        const container = document.querySelector('.flex.overflow-x-auto.scrollbar-hide') as HTMLElement;
                        if (container) {
                          const slideWidth = container.clientWidth;
                          const currentScroll = container.scrollLeft;
                          const newScroll = Math.max(0, currentScroll - slideWidth);
                          container.scrollTo({ left: newScroll, behavior: 'smooth' });
                          
                          // Update poster index
                          const newIndex = Math.round(newScroll / slideWidth);
                          setPosterIndex(Math.max(0, newIndex));
                        }
                      }}
                      disabled={posterIndex === 0}
                      className={`w-12 h-12 rounded-full hero-nav-button left-nav flex items-center justify-center transition-all duration-300 ${
                        posterIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                      }`}
                      aria-label="Previous slide"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                    <button
                      onClick={() => {
                        const container = document.querySelector('.flex.overflow-x-auto.scrollbar-hide') as HTMLElement;
                        if (container) {
                          const slideWidth = container.clientWidth;
                          const currentScroll = container.scrollLeft;
                          const maxScroll = container.scrollWidth - container.clientWidth;
                          const newScroll = Math.min(maxScroll, currentScroll + slideWidth);
                          container.scrollTo({ left: newScroll, behavior: 'smooth' });
                          
                          // Update poster index
                          const newIndex = Math.round(newScroll / slideWidth);
                          const maxIndex = products.filter((p: any) => !p.hidden_on_home).slice(0, 6).length - 1;
                          setPosterIndex(Math.min(maxIndex, newIndex));
                        }
                      }}
                      disabled={posterIndex === products.filter((p: any) => !p.hidden_on_home).slice(0, 6).length - 1}
                                              className={`w-12 h-12 rounded-full hero-nav-button right-nav flex items-center justify-center transition-all duration-300 ${
                          posterIndex === products.filter((p: any) => !p.hidden_on_home).slice(0, 6).length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                      }`}
                      aria-label="Next slide"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>


                  
                  {/* Manually Scrollable Product Images */}
                  <div 
                    className="flex overflow-x-auto scrollbar-hide h-full scroll-smooth"
                    style={{ scrollSnapType: 'x mandatory' }}
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const scrollPosition = target.scrollLeft;
                                                const slideWidth = target.scrollWidth / products.filter((p: any) => !p.hidden_on_home).slice(0, 6).length;
                      const currentIndex = Math.round(scrollPosition / slideWidth);
                      setPosterIndex(currentIndex);
                    }}
                    onTouchStart={(e) => {
                      // Pause auto-scroll on touch
                      const container = e.currentTarget as HTMLDivElement & { autoResumeTimer?: NodeJS.Timeout };
                      container.classList.add('user-interacting');
                      if (container.autoResumeTimer) {
                        clearTimeout(container.autoResumeTimer);
                      }
                    }}
                    onTouchEnd={(e) => {
                      // Resume auto-scroll after touch ends
                      const container = e.currentTarget as HTMLDivElement & { autoResumeTimer?: NodeJS.Timeout };
                      container.classList.remove('user-interacting');
                      container.autoResumeTimer = setTimeout(() => {
                        if (!container.classList.contains('user-interacting')) {
                          container.classList.remove('user-interacting');
                        }
                      }, 3000); // Resume after 3 seconds of no interaction
                    }}
                    onMouseDown={(e) => {
                      // Pause auto-scroll on mouse down
                      const container = e.currentTarget as HTMLDivElement & { autoResumeTimer?: NodeJS.Timeout };
                      container.classList.add('user-interacting');
                      if (container.autoResumeTimer) {
                        clearTimeout(container.autoResumeTimer);
                      }
                    }}
                    onMouseUp={(e) => {
                      // Resume auto-scroll after mouse up
                      const container = e.currentTarget as HTMLDivElement & { autoResumeTimer?: NodeJS.Timeout };
                      container.classList.remove('user-interacting');
                      container.autoResumeTimer = setTimeout(() => {
                        if (!container.classList.contains('user-interacting')) {
                          container.classList.remove('user-interacting');
                        }
                      }, 3000); // Resume after 3 seconds of no interaction
                    }}
                    onMouseLeave={(e) => {
                      // Resume auto-scroll when mouse leaves
                      const container = e.currentTarget as HTMLDivElement & { autoResumeTimer?: NodeJS.Timeout };
                      container.classList.remove('user-interacting');
                      container.autoResumeTimer = setTimeout(() => {
                        if (!container.classList.contains('user-interacting')) {
                          container.classList.remove('user-interacting');
                        }
                      }, 1000); // Resume faster when mouse leaves
                    }}
                    onKeyDown={(e) => {
                      const target = e.currentTarget as HTMLDivElement & { autoResumeTimer?: NodeJS.Timeout };
                      const slideWidth = target.clientWidth;
                      
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        target.scrollBy({ left: -slideWidth, behavior: 'smooth' });
                        // Pause auto-scroll on keyboard interaction
                        target.classList.add('user-interacting');
                        if (target.autoResumeTimer) {
                          clearTimeout(target.autoResumeTimer);
                        }
                        target.autoResumeTimer = setTimeout(() => {
                          if (!target.classList.contains('user-interacting')) {
                            target.classList.remove('user-interacting');
                          }
                        }, 3000);
                      } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        target.scrollBy({ left: slideWidth, behavior: 'smooth' });
                        // Pause auto-scroll on keyboard interaction
                        target.classList.add('user-interacting');
                        if (target.autoResumeTimer) {
                          clearTimeout(target.autoResumeTimer);
                        }
                        target.autoResumeTimer = setTimeout(() => {
                          if (!target.classList.contains('user-interacting')) {
                            target.classList.remove('user-interacting');
                          }
                        }, 3000);
                      }
                    }}
                    tabIndex={0}
                    role="region"
                    aria-label="Hero product carousel - use arrow keys or drag to scroll"
                  >
                    {products.filter((p: any) => !p.hidden_on_home).slice(0, 6).map((product, index) => (
                      <div 
                        key={`poster-${product.id}`} 
                        className="relative flex-shrink-0 w-full h-full"
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <ProductImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Product Info Overlay - Simplified */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 lg:p-6">
                          <div className="max-w-xs sm:max-w-sm md:max-w-xl mx-auto text-center">
                            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-1 sm:mb-2 md:mb-3 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-3 md:mb-4 max-w-xs sm:max-w-sm md:max-w-md line-clamp-2">
                              Experience premium quality and cutting-edge technology
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation Dots - Mobile Optimized */}
                  <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2">
                    {products.filter((p: any) => !p.hidden_on_home).slice(0, 6).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const container = document.querySelector('.flex.overflow-x-auto.scrollbar-hide') as HTMLElement;
                          if (container) {
                            const slideWidth = container.clientWidth;
                            container.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
                            setPosterIndex(index);
                          }
                        }}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                          index === posterIndex 
                            ? 'bg-[#F7DD0F] scale-125' 
                            : 'bg-white/30 hover:bg-white/60'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  

                </div>
              </div>
            </div>

            {/* Dope Picks Section - Now in main content area */}
            <div className="w-full mx-auto mt-6 sm:mt-8 md:mt-10 mb-6 sm:mb-8 md:mb-10 animate-fade-in-up stagger-4">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                  Dope <span className="text-[#F7DD0F]">Picks</span>
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-400">
                  Latest dope drops
                </p>
              </div>
              
              {/* Marquee Layout - All Devices */}
              <div className="relative overflow-hidden cv-auto">
                
                <div 
                  className="flex space-x-4 sm:space-x-6 md:space-x-8 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 scroll-smooth"
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollLeft > 0) {
                      target.classList.add('user-scrolling');
                    } else {
                      target.classList.remove('user-scrolling');
                    }
                  }}
                  onTouchStart={() => {
                    const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                    if (marquee) marquee.style.animationPlayState = 'paused';
                  }}
                  onTouchEnd={() => {
                    const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                    if (marquee) marquee.style.animationPlayState = 'running';
                  }}
                  onMouseDown={() => {
                    const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                    if (marquee) marquee.style.animationPlayState = 'paused';
                  }}
                  onMouseUp={() => {
                    const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                    marquee.style.animationPlayState = 'running';
                  }}
                  onMouseLeave={() => {
                    const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                    if (marquee) marquee.style.animationPlayState = 'running';
                  }}
                  onKeyDown={(e) => {
                    const target = e.currentTarget;
                    const scrollAmount = 200;
                    
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      target.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                      const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                      if (marquee) marquee.style.animationPlayState = 'paused';
                      setTimeout(() => {
                        if (marquee) marquee.style.animationPlayState = 'running';
                      }, 1000);
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      target.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      const marquee = document.querySelector('.animate-marquee') as HTMLElement;
                      if (marquee) marquee.style.animationPlayState = 'paused';
                      setTimeout(() => {
                        if (marquee) marquee.style.animationPlayState = 'running';
                      }, 1000);
                    }
                  }}
                  tabIndex={0}
                  role="region"
                  aria-label="Product carousel - use arrow keys or drag to scroll"
                >
                  {/* Continuous Marquee Row */}
                  <div className="flex animate-marquee space-x-4 sm:space-x-6 md:space-x-8 min-w-max">
                    {/* First set of products */}
                    {products.filter((p: any) => !p.hidden_on_home).map((product, index) => (
                      <div key={`marquee-first-${product.id}`} className="group relative flex-shrink-0">
                        <div className="relative overflow-hidden rounded-2xl w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-1"
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Product Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-2 line-clamp-2">{product.name}</h3>
                            <p className="text-[#F7DD0F] font-bold text-sm sm:text-base md:text-lg mb-3">Rs {product.price}</p>
                            <button
                              onClick={() => handleAddToCartWithTracking(product)}
                              className="bg-[#F7DD0F] text-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-full font-semibold hover:bg-[#F7DD0F]/90 transition-all duration-200 hover:scale-105 shadow-lg text-xs sm:text-sm w-full"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Duplicate set for seamless loop */}
                    {products.filter((p: any) => !p.hidden_on_home).map((product, index) => (
                      <div key={`marquee-second-${product.id}`} className="group relative flex-shrink-0">
                        <div className="relative overflow-hidden rounded-2xl w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:rotate-1"
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Product Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-2 line-clamp-2">{product.name}</h3>
                            <p className="text-[#F7DD0F] font-bold text-sm sm:text-base md:text-lg mb-3">Rs {product.price}</p>
                            <button
                              onClick={() => handleAddToCartWithTracking(product)}
                              className="bg-[#F7DD0F] text-black px-3 py-2 sm:px-4 sm:py-2.5 rounded-full font-semibold hover:bg-[#F7DD0F]/90 transition-all duration-200 hover:scale-105 shadow-lg text-xs sm:text-sm w-full"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Scroll Hint */}
                <div className="text-center mt-2 text-xs text-gray-500 scroll-hint">
                  <span className="hidden sm:inline">← Drag to scroll • </span>
                  <span className="sm:hidden">← Swipe to scroll • </span>
                  Auto-scrolls when idle
                </div>
              </div>
            </div>

            {/* Dope Weekly Picks Section - 2x2 Grid */}
            <div className="w-full mx-auto mt-8 sm:mt-10 md:mt-12 mb-6 sm:mb-8 md:mb-10 animate-fade-in-up stagger-5">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                  Dope <span className="text-[#F7DD0F]">Weekly Picks</span>
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-400">
                  This week's featured selections
                </p>
              </div>
              
              {/* 2x2 Grid Layout - 2x Bigger than Marquee */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
                {products.filter((p: any) => !p.hidden_on_home).slice(0, 4).map((product, index) => (
                  <div key={`weekly-pick-${product.id}`} className="group relative animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div 
                      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/5 to-white/10 border-0 sm:border sm:border-white/10 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-rotate-1 cursor-pointer"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      {/* 2x Bigger than marquee: w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] */}
                      <div className="w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem] mx-auto">
                        <ProductImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                        />
                      </div>
                      
                      {/* Enhanced Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      
                      {/* Product Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <div className="space-y-3 sm:space-y-4">
                          <h3 className="text-white font-bold text-lg sm:text-xl lg:text-2xl mb-2 line-clamp-2 leading-tight">{product.name}</h3>
                          <p className="text-[#F7DD0F] font-bold text-xl sm:text-2xl lg:text-3xl mb-3">Rs {product.price}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCartWithTracking(product)
                            }}
                            className="bg-[#F7DD0F] text-black px-4 py-2 sm:px-5 sm:py-3 rounded-xl font-bold hover:bg-[#F7DD0F]/90 transition-all duration-300 hover:shadow-2xl w-full text-sm sm:text-base shadow-lg z-10 relative cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                      

                      

                      

                      
                      {/* Floating Elements */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                        <div className="w-3 h-3 bg-[#F7DD0F] rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dope Categories Header */}
            <div className="text-center mb-4 sm:mb-6 animate-fade-in-up stagger-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                Dope <span className="text-[#F7DD0F]">Categories</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400">
                Filter by your favorite tech categories
              </p>
            </div>

            {/* Category Filter - Mobile Optimized with Smaller Touch Targets */}
            <div ref={categorySectionRef} className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-10 px-2 animate-fade-in-up stagger-5 hero-spacing">
              {/* First row */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 w-full">
                {categories.slice(0, 3).map((category, index) => (
                  <div key={category.id} className="relative animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`flex items-center space-x-2 px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 rounded-full transition-all duration-200 cursor-pointer text-xs sm:text-sm md:text-base touch-target hover-scale hover-glow min-h-[36px] ${
                        selectedCategory === category.id
                          ? "bg-[#F7DD0F] text-black shadow-lg animate-pulse font-bold"
                          : "bg-white/5 backdrop-blur-md border-0 sm:border sm:border-white/20 hover:bg-white/10 sm:hover:border-white/30 font-medium shadow-lg"
                      }`}
                      aria-label={`Filter by ${category.name}`}
                    >
                      {/* Category Icon */}
                      <div className={`flex-shrink-0 ${
                        selectedCategory === category.id ? "text-black" : "text-[#F7DD0F]"
                      }`}>
                        {renderCategoryIcon(category.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                      </div>
                      
                      {/* Category Name */}
                      <span>{category.name}</span>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-2 sm:my-3 opacity-50"></div>
              
              {/* Second row */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 w-full">
                {categories.slice(3).map((category, index) => (
                  <div key={category.id} className="relative animate-fade-in-up" style={{ animationDelay: `${(index + 3) * 0.1}s` }}>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`flex items-center space-x-2 px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 rounded-full transition-all duration-200 cursor-pointer text-xs sm:text-sm md:text-base touch-target hover-scale hover-glow min-h-[36px] ${
                        selectedCategory === category.id
                          ? "bg-[#F7DD0F] text-black shadow-lg animate-pulse font-bold"
                          : "bg-white/5 backdrop-blur-md border-0 sm:border sm:border-white/20 hover:bg-white/10 sm:hover:border-white/30 font-medium shadow-lg"
                      }`}
                      aria-label={`Filter by ${category.name}`}
                    >
                      {/* Category Icon */}
                      <div className={`flex-shrink-0 ${
                        selectedCategory === category.id ? "text-black" : "text-[#F7DD0F]"
                      }`}>
                        {renderCategoryIcon(category.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                      </div>
                      
                      {/* Category Name */}
                      <span>{category.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid - Enhanced Mobile & Desktop UX with Skeleton Loading */}
          <div 
            data-products-section
            className={`grid gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10 cv-auto ${
              viewMode === "grid" 
                ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-1"
            }`}>
            
            {/* Skeleton Loading */}
            {isLoading && Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="animate-pulse">
                <div className="bg-gray-800/50 rounded-2xl aspect-square mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800/50 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-800/50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
            
            {/* Actual Products */}
            {!isLoading && filteredProducts.map((product, index) => (
              <div 
                key={product.id} 
                data-product-id={product.id} 
                className="group animate-fade-in-up mobile-product-card hover-lift transform-gpu" 
                style={{ 
                  animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                  willChange: 'transform'
                }}
              >
                <div 
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform-gpu"
                  onClick={() => startTransition(() => router.push(`/product/${product.id}`))}
                >
                  {/* Product Image with Enhanced Hover Effects */}
                  <div className="relative image-container overflow-hidden rounded-2xl aspect-square">
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-1 transform-gpu"
                      loading="lazy"
                      decoding="async"
                      onLoad={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        // Add loaded class for smooth transitions
                        e.currentTarget.classList.add('loaded')
                      }}
                    />
                    
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Mobile In-Stock badge at top-right */}
                    {product.in_stock && (
                      <div className="absolute top-2 right-2 sm:hidden px-2 py-1 rounded-full text-[10px] font-medium bg-green-500/20 backdrop-blur-md text-green-100 border border-green-500/30 shadow-lg">
                        In Stock
                      </div>
                    )}

                    {/* Product overlay content - Mobile & Desktop */}
                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-2 mb-1 leading-snug">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[#F7DD0F] font-bold text-xs sm:text-sm">Rs {product.price}</span>
                          {product.original_price > product.price && (
                            <span className="text-[10px] sm:text-xs text-gray-300 line-through">Rs {product.original_price}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startTransition(() => addToCart(product))
                            }}
                            disabled={!product.in_stock}
                            aria-label="Add to cart"
                            className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow transition-all duration-200 active:scale-95 cursor-pointer z-10 relative transform-gpu ${
                              product.in_stock
                                ? "bg-[#F7DD0F] text-black hover:bg-[#F7DD0F]/90 hover:scale-105"
                                : "bg-gray-500/40 text-gray-300 cursor-not-allowed"
                            }`}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stock Status Badge */}
                    {!product.in_stock && (
                      <div className="absolute top-3 right-3 bg-red-500/20 backdrop-blur-md text-red-100 border border-red-500/30 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        Out of Stock
                      </div>
                    )}
                    
                    {/* Quick View Overlay */}
                    <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                        Quick View
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {!isLoading && currentProducts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No products available</h3>
                  <p className="text-sm">Check your Supabase connection and database</p>
                </div>
              </div>
            )}
            
            {/* No Filtered Results */}
            {!isLoading && products.length > 0 && filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No products found</h3>
                  <p className="text-sm">Try adjusting your search or category filters</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Section - Replaced GIF with video */}
      <section className="pt-8 sm:pt-12 pb-20 sm:pb-24 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a0a 50%, #000000 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
              Dope <span className="text-[#F7DD0F]">Recommendations</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">
              Grab these and more on our Instagram
            </p>
          </div>

          {/* Video Container */}
          <div className="w-full mx-auto animate-fade-in-up borderless-glow cv-auto rounded-2xl overflow-hidden ring-1 ring-white/10">
            <video
              src="/footervid.mp4"
              className="w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 shadow-xl object-cover object-center"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              key={animationKey}
              onError={(e) => {
                console.error('Video failed to load:', e)
                // Fallback to a gradient background if video fails
                const videoElement = e.currentTarget
                videoElement.style.display = 'none'
                const container = videoElement.parentElement
                if (container) {
                  container.style.background = 'linear-gradient(135deg, #000000 0%, #1a1a0a 50%, #000000 100%)'
                  container.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                      <div class="text-center">
                        <h3 class="text-xl font-bold text-white mb-2">Dope <span class="text-[#F7DD0F]">Recommendations</span></h3>
                        <p class="text-gray-400">Check out our latest products</p>
                      </div>
                    </div>
                  `
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Shopping Cart Sidebar - Mobile Optimized */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          
          {/* Cart Panel */}
          <div className="relative ml-auto w-full max-w-sm sm:max-w-md bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-l-2xl">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold">Shopping Cart</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors touch-target"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-400">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-xs sm:text-sm line-clamp-2 leading-tight">{item.name}</h3>
                          <p className="text-[#F7DD0F] font-bold text-sm sm:text-base">Rs {item.price}</p>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded touch-target"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                          >
                            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded touch-target"
                            style={{ minHeight: '44px', minWidth: '44px' }}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 sm:p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500 touch-target"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="text-base sm:text-lg font-semibold">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-[#F7DD0F]">Rs {getCartTotal().toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-[#F7DD0F] text-black py-3 sm:py-3.5 md:py-4 px-4 rounded-xl font-medium hover:bg-[#F7DD0F]/90 transition-colors touch-target"
                    style={{ minHeight: '48px' }}
                  >
                    Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer - Mobile Optimized */}
      <footer className="bg-black py-4 sm:py-6 border-t-2 border-[#F7DD0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <img src="/logo/dopelogo.svg" alt="DopeTech" className="w-10 h-10 sm:w-12 sm:h-12 logo-adaptive" />
              <span className="text-xs sm:text-sm text-white jakarta-light">© 2025 DopeTech Nepal. All rights reserved.</span>
            </div>

            <div className="flex space-x-6 sm:space-x-8">
              <a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-[#F7DD0F] transition-colors cursor-hover jakarta-light">
                Privacy Policy
              </a>
              <a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-[#F7DD0F] transition-colors cursor-hover jakarta-light">
                Terms of Use
              </a>
              <a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-[#F7DD0F] transition-colors cursor-hover jakarta-light">
                Support
              </a>
              <a 
                href="/doptechadmin" 
                className="text-xs sm:text-sm text-gray-400 hover:text-[#F7DD0F] transition-colors cursor-hover jakarta-light"
                title="Admin Panel"
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </footer>



      {/* Jump to Categories floating button */}
      {showBackToCategories && !cartOpen && !checkoutModalOpen && (
        <button
          onClick={scrollToCategoryFilters}
          className="fixed right-4 md:right-6 bottom-24 md:bottom-28 z-50 flex items-center gap-2 px-4 py-3 rounded-full frosted-glass-yellow frosted-glass-yellow-hover"
          aria-label="Jump to categories"
        >
          {/* Circle icon wrapper styled like the chat icon */}
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F7DD0F] text-black shadow-lg overflow-hidden">
            {(() => {
              const item = categories[categoryIconIndex]
              if (!item) return null
              const key = `${item.id}-${categoryIconIndex}`
              const commonClasses = "w-5 h-5 animate-fade-in animate-scale-in will-change-opacity will-change-transform"
              if (typeof item.icon === 'object' && 'type' in item.icon && (item.icon as any).type === 'svg') {
                return (
                  <span key={key} className="inline-flex items-center justify-center">
                    <SvgIcon svgContent={(item.icon as { type: 'svg', content: string }).content} className={commonClasses} />
                  </span>
                )
              }
              const IconComp = item.icon as React.ComponentType<{ className?: string }>
              return (
                <span key={key} className="inline-flex items-center justify-center">
                  <IconComp className={commonClasses} />
                </span>
              )
            })()}
          </span>
          <span className="text-sm font-bold">Jump to <span className="text-[#F7DD0F]">Categories</span></span>
        </button>
      )}

      {/* AI Chat Assistant (lazy) - hidden during checkout or cart open */}
      {!checkoutModalOpen && !cartOpen && (
        <Suspense fallback={
          <div className="fixed bottom-4 right-4 w-14 h-14 bg-[#F7DD0F] rounded-full shadow-lg animate-pulse cursor-pointer" />
        }>
          <LazyAIChat products={products} onAddToCart={addToCart} />
        </Suspense>
      )}

      {/* Checkout Modal - Lazy Loaded */}
      <Suspense fallback={
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 animate-pulse">
            <div className="w-8 h-8 bg-[#F7DD0F] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-center">Loading checkout...</p>
          </div>
        </div>
      }>
        <DynamicSupabaseCheckout
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          cart={cart}
          total={getCartTotal()}
          onCartReset={handleCartReset}
        />
      </Suspense>
    </div>
  )
}
