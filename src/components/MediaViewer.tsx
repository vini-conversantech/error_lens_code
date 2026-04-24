import React from 'react'
import { Tab } from '../store/appStore'
import { FileImage, Film, Info, Maximize2, RotateCcw, Loader2 } from 'lucide-react'

interface MediaViewerProps {
  tab: Tab
}

export default function MediaViewer({ tab }: MediaViewerProps) {
  const [zoom, setZoom] = React.useState(100)
  const [rotation, setRotation] = React.useState(0)
  const [dataUrl, setDataUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const loadMedia = async () => {
      try {
        const result = await window.electronAPI.readMedia(tab.path)
        if (mounted) {
          if (result.success && result.content) {
            setDataUrl(result.content)
          } else {
            setError(result.error || 'Failed to load media content')
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMedia()
    return () => { mounted = false }
  }, [tab.path])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 400))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25))
  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  if (loading) {
    return (
      <div className="h-full w-full bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <span className="text-sm text-muted">Loading media...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">Failed to Load Media</h3>
        <p className="text-sm text-muted max-w-md">{error}</p>
        <p className="text-xs text-muted mt-4 font-mono break-all opacity-50">{tab.path}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Toolbar */}
      <div className="h-10 bg-panel border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          {tab.type === 'image' ? (
            <FileImage className="w-4 h-4 text-primary" />
          ) : (
            <Film className="w-4 h-4 text-primary" />
          )}
          <span className="text-[11px] font-medium text-text truncate max-w-[300px]">
            {tab.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {tab.type === 'image' && (
            <div className="flex items-center gap-1 bg-background/50 rounded-md px-2 py-0.5 border border-border">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:text-text text-muted transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono w-10 text-center">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:text-text text-muted transition-colors"
                title="Zoom In"
              >
                +
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {tab.type === 'image' && (
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-white/5 rounded-md text-muted hover:text-text transition-all"
                title="Rotate 90°"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-white/5 rounded-md text-muted hover:text-text transition-all"
              title="Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#1a202c_1px,transparent_1px)] [background-size:16px_16px]">
        {tab.type === 'image' ? (
          <div
            className="relative transition-transform duration-200 ease-out shadow-2xl"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={dataUrl || ''}
              alt={tab.name}
              className="max-w-none rounded-sm bg-white/5 shadow-inner"
              style={{ maxHeight: '85vh' }}
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5">
            <video
              src={dataUrl || ''}
              controls
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div className="h-8 bg-panel border-t border-border flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-4 text-[10px] text-muted font-mono">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            <span>PATH:</span>
            <span className="text-text/70">{tab.path}</span>
          </div>
        </div>
        <div className="text-[10px] text-muted">
          {tab.type.toUpperCase()} PREVIEW (DATA URL)
        </div>
      </div>
    </div>
  )
}
