"use client"

import { useEffect } from "react"

interface SEOOptimizerProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: "website" | "product" | "article"
  structuredData?: object
}

export default function SEOOptimizer({
  title = "DopeTech Nepal - Premium Tech Gear",
  description = "Premium tech gear from DopeTech Nepal. Mechanical keyboards, gaming mice, wireless headphones, and more. Your setup, perfected.",
  keywords = "tech gear, mechanical keyboard, gaming mouse, wireless headphones, Nepal, DopeTech, gaming peripherals, RGB keyboard, wireless mouse",
        image = "/logo/dopelogo.svg",
  url = "https://dopetech-nepal.com",
  type = "website",
  structuredData
}: SEOOptimizerProps) {
  useEffect(() => {
    // Update page title dynamically
    if (title) {
      document.title = title
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description)
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords && keywords) {
      metaKeywords.setAttribute('content', keywords)
    }

    // Add structured data
    if (structuredData) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [title, description, keywords, structuredData])

  return null
}

// Default structured data for the homepage
export const defaultStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "DopeTech Nepal",
  "url": "https://dopetech-nepal.com",
        "logo": "https://dopetech-nepal.com/logo/dopelogo.svg",
  "description": "Premium tech gear from DopeTech Nepal. Mechanical keyboards, gaming mice, wireless headphones, and more.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "NP",
    "addressLocality": "Nepal"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://instagram.com/dopetech_np"
  ]
}

// Product structured data
export function getProductStructuredData(product: {
  name: string
  description: string
  price: number
  image: string
  category: string
  inStock: boolean
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image,
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "NPR",
      "availability": product.inStock 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock"
    }
  }
} 