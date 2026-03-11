// hooks/useTrajectories.ts
import { useState, useEffect, useCallback } from 'react'
import { getMockTrajectories, type Trajectory } from '@/lib/dashboard-mock-data'

interface UseTrajectoriesParams {
  floatId?: string
  status?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseTrajectoriesReturn {
  trajectories: Trajectory[]
  loading: boolean
  error: string | null
  isFallback: boolean
  fallbackMessage: string | null
  refetch: () => Promise<void>
}

interface TrajectoryApiResponse {
  success?: boolean
  data?: unknown
  error?: string
  fallback?: boolean
  message?: string
}

export function useTrajectories({
  floatId,
  status,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: UseTrajectoriesParams = {}): UseTrajectoriesReturn {
  const [trajectories, setTrajectories] = useState<Trajectory[]>([])
  const [loading, setLoading] = useState(true) // Start with loading = true
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)

  // 🔒 Hardcoded date range (Jan 2024 - Dec 2024)
  const startDate = "2024-01-01"
  const endDate = "2024-12-31"

  const fetchTrajectories = useCallback(async () => {
    setLoading(true)
    setError(null)

    const applyFallback = (message: string) => {
      setTrajectories(getMockTrajectories(floatId))
      setIsFallback(true)
      setFallbackMessage(message)
      setError(null)
    }
    
    try {
      console.log('Fetching trajectories with params:', { floatId, startDate, endDate, status })
      
      const params = new URLSearchParams()
      if (floatId) params.append('floatId', floatId)
      params.append('startDate', startDate)
      params.append('endDate', endDate)
      if (status) params.append('status', status)
      
      const url = `/api/traj?${params}`
      console.log('Request URL:', url)
      
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        applyFallback(`HTTP ${response.status}: trajectory API unavailable`)
        return
      }
      
      const data = (await response.json()) as TrajectoryApiResponse
      console.log('Response data:', data)
      
      if (!data.success) {
        applyFallback(data.error || 'Trajectory API reported failure')
        return
      }

      if (data.fallback) {
        applyFallback(data.message || 'Trajectory API returned fallback mode')
        return
      }
      
      // Validate that we have trajectory data in the expected format
      if (!Array.isArray(data.data)) {
        console.warn('Expected array of trajectories, got:', typeof data.data)
        applyFallback('Trajectory payload format invalid')
      } else {
        console.log(`Successfully loaded ${data.data.length} trajectories`)
        setTrajectories(data.data as Trajectory[])
        setIsFallback(false)
        setFallbackMessage(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      console.error('Error fetching trajectories:', err)
      applyFallback(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [floatId, status, startDate, endDate])

  // Initial fetch
  useEffect(() => {
    fetchTrajectories()
  }, [fetchTrajectories])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing trajectories...')
      fetchTrajectories()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchTrajectories])

  return {
    trajectories,
    loading,
    error,
    isFallback,
    fallbackMessage,
    refetch: fetchTrajectories
  }
}
