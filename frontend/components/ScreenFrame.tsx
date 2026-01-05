import React from "react"
import { Rnd } from "react-rnd"
import { GripVertical } from "lucide-react"

interface ScreenFrameProps {
    id?: string
    name: string
    preview: string | null
    width: number
    height: number
    x: number
    y: number
    onDragStop: (x: number, y: number) => void
    onResizeStop: (width: number, height: number, x: number, y: number) => void
    loading?: boolean
}

export const ScreenFrame: React.FC<ScreenFrameProps> = ({
    name,
    preview,
    width,
    height,
    x,
    y,
    onDragStop,
    onResizeStop,
    loading = false,
}) => {
    return (
        <Rnd
            size={{ width, height }}
            position={{ x, y }}
            onDragStop={(e, d) => onDragStop(d.x, d.y)}
            onResizeStop={(e, direction, ref, delta, position) => {
                onResizeStop(
                    parseInt(ref.style.width),
                    parseInt(ref.style.height),
                    position.x,
                    position.y
                )
            }}
            dragHandleClassName="drag-handle"
            bounds="parent"
            className="flex flex-col bg-white shadow-xl border border-slate-200 rounded-lg overflow-hidden"
        >
            {/* Header */}
            <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 cursor-move drag-handle select-none">
                <GripVertical className="w-4 h-4 text-slate-400 mr-2" />
                <span className="text-xs font-medium text-slate-600 truncate">{name}</span>
            </div>

            {/* Content */}
            <div className="flex-1 relative w-full h-full bg-slate-50 overflow-hidden">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 animate-pulse bg-white z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Generating...</span>
                        </div>
                    </div>
                ) : preview ? (
                    <iframe
                        srcDoc={preview}
                        className="w-full h-full border-0 pointer-events-auto"
                        title={name}
                        sandbox="allow-scripts allow-forms allow-popups allow-modals"
                        style={{ width: "100%", height: "100%" }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 p-4 text-center">
                        <span className="text-sm">No preview available</span>
                    </div>
                )}

                {/* Overlay to prevent iframe from capturing mouse events while dragging/resizing if needed */}
                {/* In react-rnd, dragging usually works via handle, but for resizing we might need an overlay if iframe captures clicks. 
            However, react-zoom-pan-pinch wraps everything, so we'll see. 
            Usually a transparent overlay during drag/resize is good practice, but let's stick to simple first.
        */}
            </div>
        </Rnd>
    )
}
