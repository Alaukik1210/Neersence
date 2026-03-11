import type { ChangeEvent } from 'react'
import { Activity, BarChart3, Database, Upload, Zap } from 'lucide-react'
import { useState } from 'react'

type ParameterKey = 'pres' | 'temp' | 'psal'

interface ParameterStats {
  count: number
  mean: number | null
  std: number | null
  min: number | null
  max: number | null
}

interface UploadResult {
  download_url?: string
  filename?: string
  metadata?: {
    statistics?: Record<string, ParameterStats>
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_NETCDF_API_URL ?? 'http://localhost:5000'

const NetCDFUploader = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [binSize, setBinSize] = useState(10)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    if (selectedFile?.name?.toLowerCase().endsWith('.nc')) {
      setFile(selectedFile)
      setError(null)
    } else {
      setError('Please select a valid .nc (NetCDF) file')
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bin_size', String(binSize))

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json().catch(() => ({}))) as UploadResult & { error?: string }
      if (res.ok) {
        setResult(data)
      } else {
        setResult(null)
        setError(data.error || 'Upload failed')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network error'
      setResult(null)
      setError(`Network error: ${message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!result?.download_url) return

    try {
      const res = await fetch(`${API_BASE_URL}${result.download_url}`)
      if (!res.ok) {
        throw new Error(`Download request failed: ${res.status}`)
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || 'processed.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Download failed')
    }
  }

  const renderStatistics = () => {
    if (!result?.metadata?.statistics) return null
    const stats = result.metadata.statistics

    const parameterNames: Record<ParameterKey, string> = { pres: 'Pressure', temp: 'Temperature', psal: 'Salinity' }
    const parameterIcons: Record<ParameterKey, typeof Activity> = { pres: Activity, temp: Zap, psal: Database }
    const parameterColors: Record<ParameterKey, string> = {
      pres: 'from-blue-400 to-cyan-500',
      temp: 'from-orange-400 to-red-500',
      psal: 'from-teal-400 to-emerald-500',
    }

    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 border border-slate-700/50">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl mr-4">
            <BarChart3 className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-100">Oceanographic Parameters</h3>
            <p className="text-slate-300">Statistical analysis of core measurements</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(stats).map(([col, stat]) => {
            const key = (col in parameterNames ? col : null) as ParameterKey | null
            const Icon = key ? parameterIcons[key] : Activity
            const gradient = key ? parameterColors[key] : 'from-slate-500 to-slate-600'
            const displayName = key ? parameterNames[key] : col.toUpperCase()

            return (
              <div key={col} className="group hover:scale-105 transition-all duration-300">
                <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/50 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-gradient-to-r ${gradient} p-3 rounded-lg shadow-lg`}>
                      <Icon className="text-white" size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-600/50 px-2 py-1 rounded-full">
                      {stat.count} samples
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-slate-100 mb-3">{displayName}</h4>
                  <div className="space-y-3">
                    {stat.mean !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Mean</span>
                        <span className="font-mono font-semibold text-slate-100 bg-slate-600/50 px-2 py-1 rounded">
                          {stat.mean.toFixed(3)}
                        </span>
                      </div>
                    )}
                    {stat.std !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Std Dev</span>
                        <span className="font-mono font-semibold text-slate-100 bg-slate-600/50 px-2 py-1 rounded">
                          {stat.std.toFixed(3)}
                        </span>
                      </div>
                    )}
                    {stat.min !== null && stat.max !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Range</span>
                        <span className="font-mono text-xs text-slate-100 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-1 rounded-full border border-cyan-400/30">
                          {stat.min.toFixed(2)} → {stat.max.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/80 border-b border-slate-700/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-2xl mr-4 shadow-lg shadow-cyan-500/20">
            <Database className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              NetCDF Processor
            </h1>
            <p className="text-slate-400 mt-1">Advanced oceanographic data processing platform</p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 border border-slate-700/50">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-3 rounded-xl mr-4 shadow-lg shadow-teal-500/20">
              <Upload className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Upload NetCDF File</h2>
              <p className="text-slate-300">Process your oceanographic data with advanced quality control</p>
            </div>
          </div>
          <div className="space-y-6">
            <input type="file" accept=".nc" onChange={handleFileChange} />
            <input
              type="number"
              value={binSize}
              min={1}
              max={100}
              onChange={(e) => setBinSize(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
            />
            <button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>
            {result?.download_url && (
              <button onClick={handleDownload} className="block">
                Download Processed File
              </button>
            )}
          </div>
        </div>

        {error && <div className="text-red-400 font-bold mb-4">{error}</div>}
        {result && renderStatistics()}
      </div>
    </div>
  )
}

export default NetCDFUploader
