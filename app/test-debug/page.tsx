"use client"

import { useEffect, useState } from 'react'
import { getProducts } from '@/lib/products-data'
import { getLogoUrl, getVideoUrl } from '@/lib/assets'
import { supabase } from '@/lib/supabase'

export default function TestDebug() {
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testConnections = async () => {
      const results: any = {}

      // Test Supabase connection
      try {
        console.log('Testing Supabase connection...')
        const { data, error } = await supabase.from('products').select('count').limit(1)
        results.supabase = error ? { error: error.message } : { success: true, data }
      } catch (err) {
        results.supabase = { error: err }
      }

      // Test products loading
      try {
        console.log('Testing products loading...')
        const products = await getProducts()
        results.products = { success: true, count: products.length }
      } catch (err) {
        results.products = { error: err }
      }

      // Test asset loading
      try {
        console.log('Testing asset loading...')
        const [logoUrl, videoUrl] = await Promise.all([
          getLogoUrl(),
          getVideoUrl()
        ])
        results.assets = { success: true, logoUrl, videoUrl }
      } catch (err) {
        results.assets = { error: err }
      }

      // Test local assets
      try {
        console.log('Testing local assets...')
        const logoResponse = await fetch('/logo/dopelogo.svg')
        const videoResponse = await fetch('/video/footervid.mp4')
        results.localAssets = {
          success: true,
          logoStatus: logoResponse.status,
          videoStatus: videoResponse.status
        }
      } catch (err) {
        results.localAssets = { error: err }
      }

      setStatus(results)
      setLoading(false)
    }

    testConnections()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Connections...</h1>
        <div className="animate-spin">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Test Results</h1>
      
      <div className="space-y-6">
        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Supabase Connection</h2>
          <pre className="bg-gray-800 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status.supabase, null, 2)}
          </pre>
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Products Loading</h2>
          <pre className="bg-gray-800 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status.products, null, 2)}
          </pre>
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Asset Loading</h2>
          <pre className="bg-gray-800 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status.assets, null, 2)}
          </pre>
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Local Assets</h2>
          <pre className="bg-gray-800 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(status.localAssets, null, 2)}
          </pre>
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <pre className="bg-gray-800 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set',
              supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
              serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
