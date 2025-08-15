import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface HeroImage {
  id: number
  title: string
  subtitle?: string
  description?: string
  image_url: string
  image_file_name?: string
  button_text?: string
  button_link?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useHeroImages() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHeroImages = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Load from the hero_images table
      const { data: tableData, error: tableError } = await supabase
        .from('hero_images')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (tableError) {
        console.error('Error loading hero images:', tableError)
        setError('Failed to load hero images')
        return
      }

      setHeroImages(tableData ? (tableData as unknown as HeroImage[]) : [])
    } catch (error) {
      console.error('Error loading hero images:', error)
      setError('Failed to load hero images')
    } finally {
      setLoading(false)
    }
  }

  const uploadHeroImage = async (file: File, metadata?: {
    title?: string
    subtitle?: string
    description?: string
    button_text?: string
    button_link?: string
    display_order?: number
  }): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', metadata?.title || '')
      formData.append('subtitle', metadata?.subtitle || '')
      formData.append('description', metadata?.description || '')
      formData.append('display_order', (metadata?.display_order || 0).toString())

      const response = await fetch('/api/hero-images/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      await loadHeroImages() // Reload the images
      return true
    } catch (error) {
      console.error('Error uploading hero image:', error)
      setError('Failed to upload hero image')
      return false
    }
  }

  const deleteHeroImage = async (imageId: number | string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/hero-images/delete?id=${imageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      await loadHeroImages() // Reload the images
      return true
    } catch (error) {
      console.error('Error deleting hero image:', error)
      setError('Failed to delete hero image')
      return false
    }
  }

  const updateHeroImage = async (id: number, updates: Partial<HeroImage>): Promise<boolean> => {
    try {
      const response = await fetch('/api/hero-images/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...updates })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Update failed')
      }

      await loadHeroImages() // Reload the images
      return true
    } catch (error) {
      console.error('Error updating hero image:', error)
      setError('Failed to update hero image')
      return false
    }
  }

  const getActiveHeroImages = (): HeroImage[] => {
    return heroImages.filter(img => img.is_active !== false).slice(0, 5) // Limit to 5 active images
  }

  useEffect(() => {
    loadHeroImages()
  }, [])

  return {
    heroImages,
    activeHeroImages: getActiveHeroImages(),
    loading,
    error,
    uploadHeroImage,
    deleteHeroImage,
    updateHeroImage,
    refreshHeroImages: loadHeroImages
  }
}
