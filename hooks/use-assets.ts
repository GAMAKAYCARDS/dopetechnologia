import { useState, useEffect } from 'react'
import { getLogoUrl, getVideoUrl, uploadAsset, listAssets, deleteAsset } from '@/lib/assets'
import type { Asset } from '@/lib/assets'

export function useAssets() {
  const [logoUrl, setLogoUrl] = useState<string>('/logo/dopelogo.svg')
  const [videoUrl, setVideoUrl] = useState<string>('/video/footervid.mp4')
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load assets on mount
  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load logo and video URLs
      const [logo, video] = await Promise.all([
        getLogoUrl(),
        getVideoUrl()
      ])

      setLogoUrl(logo)
      setVideoUrl(video)

      // Load all assets list
      const allAssets = await listAssets()
      setAssets(allAssets)

    } catch (err) {
      console.error('Error loading assets:', err)
      setError('Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  const uploadAssetFile = async (
    file: File,
    name: string,
    type: 'logo' | 'video' | 'image'
  ) => {
    try {
      setError(null)
      const result = await uploadAsset(file, name, type)
      
      if (result.success) {
        // Reload assets after successful upload
        await loadAssets()
        return { success: true, url: result.url }
      } else {
        setError(result.error || 'Upload failed')
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Error uploading asset:', err)
      setError('Upload failed')
      return { success: false, error: 'Upload failed' }
    }
  }

  const deleteAssetFile = async (fileName: string) => {
    try {
      setError(null)
      const success = await deleteAsset(fileName)
      
      if (success) {
        // Reload assets after successful deletion
        await loadAssets()
        return { success: true }
      } else {
        setError('Failed to delete asset')
        return { success: false, error: 'Failed to delete asset' }
      }
    } catch (err) {
      console.error('Error deleting asset:', err)
      setError('Failed to delete asset')
      return { success: false, error: 'Failed to delete asset' }
    }
  }

  const refreshAssets = () => {
    loadAssets()
  }

  return {
    logoUrl,
    videoUrl,
    assets,
    loading,
    error,
    uploadAsset: uploadAssetFile,
    deleteAsset: deleteAssetFile,
    refreshAssets
  }
}

// Hook for getting just the logo URL
export function useLogoUrl() {
  const [logoUrl, setLogoUrl] = useState<string>('/logo/dopelogo.svg')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const url = await getLogoUrl()
        setLogoUrl(url)
      } catch (err) {
        console.error('Error loading logo:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLogo()
  }, [])

  return { logoUrl, loading }
}

// Hook for getting just the video URL
export function useVideoUrl() {
  const [videoUrl, setVideoUrl] = useState<string>('/video/footervid.mp4')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const url = await getVideoUrl()
        setVideoUrl(url)
      } catch (err) {
        console.error('Error loading video:', err)
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [])

  return { videoUrl, loading }
}
