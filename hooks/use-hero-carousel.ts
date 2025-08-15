import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface HeroImage {
  id: number
  image_url: string
  title: string
  subtitle: string
  description: string
  is_active: boolean
  display_order: number
}

interface CarouselSlide {
  id: number
  image: string
  header: string
  description: string
  link?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aizgswoelfdkhyosgvzu.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpemdzd29lbGZka2h5b3Nndnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTUyMjUsImV4cCI6MjA3MDYzMTIyNX0.4a7Smvc_bueFLqZNvGk-AW0kD5dJusNwqaSAczJs0hU'
)

export function useHeroCarousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHeroImages() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('hero_images')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        if (data && data.length > 0) {
          const formattedSlides: CarouselSlide[] = (data as unknown as HeroImage[])
            .filter((hero: HeroImage) => hero.title && hero.title.trim() !== '') // Filter out empty titles
            .map((hero: HeroImage) => ({
              id: hero.id,
              image: hero.image_url,
              header: hero.title || 'Premium Tech Gear',
              description: hero.description || hero.subtitle || 'Discover the latest in gaming and professional equipment.',
              link: (hero as any).button_link || undefined
            }))
          
          setSlides(formattedSlides)
        } else {
          // Fallback to default slides if no hero images found
          setSlides([
            {
              id: 1,
              image: '/products/keyboard.png',
              header: 'Premium Gaming Keyboards',
              description: 'Experience ultimate precision and performance with our collection of high-end mechanical keyboards designed for gamers and professionals.',
              link: '/product/1'
            },
            {
              id: 2,
              image: '/products/mouse.png',
              header: 'Ergonomic Gaming Mice',
              description: 'Dominate your games with precision-engineered mice featuring advanced sensors and customizable RGB lighting.',
              link: '/product/2'
            },
            {
              id: 3,
              image: '/products/headphones.png',
              header: 'Immersive Audio Experience',
              description: 'Crystal clear sound and premium comfort with our selection of gaming headsets and professional audio equipment.',
              link: '/product/3'
            },
            {
              id: 4,
              image: '/products/speaker.png',
              header: 'Studio-Quality Speakers',
              description: 'Transform your setup with powerful speakers that deliver rich, detailed sound for music, gaming, and entertainment.',
              link: '/product/4'
            }
          ])
        }
      } catch (err) {
        console.error('Error fetching hero images:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch hero images')
        
        // Fallback to default slides on error
        setSlides([
          {
            id: 1,
            image: '/products/keyboard.png',
            header: 'Premium Gaming Keyboards',
            description: 'Experience ultimate precision and performance with our collection of high-end mechanical keyboards designed for gamers and professionals.',
            link: '/product/1'
          },
          {
            id: 2,
            image: '/products/mouse.png',
            header: 'Ergonomic Gaming Mice',
            description: 'Dominate your games with precision-engineered mice featuring advanced sensors and customizable RGB lighting.',
            link: '/product/2'
          },
          {
            id: 3,
            image: '/products/headphones.png',
            header: 'Immersive Audio Experience',
            description: 'Crystal clear sound and premium comfort with our selection of gaming headsets and professional audio equipment.',
            link: '/product/3'
          },
          {
            id: 4,
            image: '/products/speaker.png',
            header: 'Studio-Quality Speakers',
            description: 'Transform your setup with powerful speakers that deliver rich, detailed sound for music, gaming, and entertainment.',
            link: '/product/4'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchHeroImages()
  }, [])

  return { slides, loading, error }
}
