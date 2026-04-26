import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

// ═══ ASSETS ═══
export const getAssets = (params = {}) => api.get('/api/assets', { params })
export const getAsset = (id) => api.get(`/api/assets/${id}`)
export const uploadAsset = (formData, onProgress) =>
  api.post('/api/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
export const checkWatermark = (id) => api.post(`/api/assets/${id}/check-watermark`)
export const getAssetCertificate = (id) => api.get(`/api/assets/${id}/certificate`, { responseType: 'blob' })

// ═══ VIOLATIONS ═══
export const getViolations = (params = {}) => api.get('/api/violations', { params })
export const getViolation = (id) => api.get(`/api/violations/${id}`)
export const updateViolationStatus = (id, status) => api.patch(`/api/violations/${id}/status`, { status })
export const getViolationReport = (id) => api.get(`/api/violations/${id}/report`, { responseType: 'blob' })

// ═══ SCAN ═══
export const scanMatch = (data) => api.post('/api/scan/match', data)
export const crawlAsset = (data) => api.post('/api/scan/crawl', data)

// ═══ VIOLATIONS EXPORT ═══
export const exportViolationsCSV = (params = {}) =>
  api.get('/api/violations/export', { params, responseType: 'blob' })

// ═══ INTELLIGENCE ═══
export const getIntelligenceOverview = () => api.get('/api/intelligence/overview')
export const getSpreadMap = (assetId) => api.get(`/api/intelligence/spread-map/${assetId}`)
export const getIntelligenceReport = () =>
  api.get('/api/intelligence/report', { responseType: 'blob' })

// ═══ SAMPLES ═══
export const getSamples = () => api.get('/api/samples')

export default api
