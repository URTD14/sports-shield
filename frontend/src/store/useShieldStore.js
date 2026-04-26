import { create } from 'zustand'

const useShieldStore = create((set, get) => ({
  // ═══ ASSETS ═══
  assets: [],
  assetsLoading: false,
  setAssets: (assets) => set({ assets }),
  setAssetsLoading: (loading) => set({ assetsLoading: loading }),

  // ═══ VIOLATIONS ═══
  violations: [],
  violationsLoading: false,
  liveViolations: [], // incoming real-time violations
  setViolations: (violations) => set({ violations }),
  addLiveViolation: (violation) =>
    set((state) => ({
      liveViolations: [violation, ...state.liveViolations].slice(0, 50),
    })),
  setViolationsLoading: (loading) => set({ violationsLoading: loading }),

  // ═══ SELECTED ═══
  selectedViolation: null,
  setSelectedViolation: (v) => set({ selectedViolation: v }),

  // ═══ SYSTEM STATUS ═══
  systemStatus: {
    assetsMonitored: 47293,
    violationsToday: 1847,
    platformsMonitored: 23,
    avgDetectionTime: 8.3,
    crawlerStatus: 'ACTIVE',
    lastScan: new Date().toISOString(),
  },
  setSystemStatus: (status) => set({ systemStatus: { ...get().systemStatus, ...status } }),

  // ═══ UPLOAD STATE ═══
  uploadState: {
    file: null,
    status: 'idle', // idle | uploading | extracting | fingerprinting | watermarking | secured
    progress: 0,
    assetId: null,
  },
  setUploadState: (state) => set((s) => ({ uploadState: { ...s.uploadState, ...state } })),

  // ═══ DEMO MODE ═══
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  setDemoMode: (mode) => set({ demoMode: mode }),

  // ═══ INTELLIGENCE ═══
  intelligenceData: null,
  setIntelligenceData: (data) => set({ intelligenceData: data }),

  // ═══ SOCKET CONNECTION ═══
  socketConnected: false,
  setSocketConnected: (connected) => set({ socketConnected: connected }),
}))

export default useShieldStore
