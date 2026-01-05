import React from "react"
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch"
import { ScreenFrame } from "./ScreenFrame"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "./ui"

export interface ScreenData {
    id: string
    name: string
    html: string | null
    w: number
    h: number
    x: number
    y: number
    loading?: boolean
}

interface CanvasProps {
    screens: ScreenData[]
    onScreenUpdate: (id: string, data: Partial<ScreenData>) => void
}

export function Canvas({ screens, onScreenUpdate }: CanvasProps) {
    return (
        <div className="flex-1 relative bg-slate-100 overflow-hidden h-full">
            <TransformWrapper
                initialScale={1}
                initialPositionX={-2000}
                initialPositionY={-2000}
                minScale={0.4}
                maxScale={4}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: true }}
            >
                {({ zoomIn, zoomOut, resetTransform, ...rest }: any) => {
                    const state = rest.state || rest.transformState || { scale: 1 };
                    return (
                        <>
                            {/* Controls */}
                            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg rounded-lg p-2 border border-slate-200">
                                <div className="flex flex-col gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-slate-100"
                                        onClick={() => zoomIn()}
                                        title="Zoom In"
                                    >
                                        <ZoomIn className="h-4 w-4 text-slate-700" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-slate-100"
                                        onClick={() => zoomOut()}
                                        title="Zoom Out"
                                    >
                                        <ZoomOut className="h-4 w-4 text-slate-700" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-slate-100"
                                        onClick={() => resetTransform()}
                                        title="Reset 100%"
                                    >
                                        <RotateCcw className="h-4 w-4 text-slate-700" />
                                    </Button>
                                </div>
                                <div className="h-px bg-slate-200 my-1" />
                                <div className="text-center text-[10px] font-medium text-slate-500">
                                    {Math.round(state.scale * 100)}%
                                </div>
                            </div>

                            {/* Canvas Content */}
                            <TransformComponent
                                wrapperClass="!w-full !h-full"
                                contentClass="!w-full !h-full"
                            >
                                <div
                                    className="w-[5000px] h-[5000px] relative bg-slate-100" // Giant canvas area
                                    style={{
                                        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                                        backgroundSize: "24px 24px",
                                    }}
                                >
                                    {screens.map((screen) => (
                                        <ScreenFrame
                                            key={screen.id}
                                            name={screen.name}
                                            preview={screen.html}
                                            width={screen.w}
                                            height={screen.h}
                                            x={screen.x + 2500} // Center offset approximately
                                            y={screen.y + 2500}
                                            loading={screen.loading}
                                            onDragStop={(x, y) => onScreenUpdate(screen.id, { x: x - 2500, y: y - 2500 })}
                                            onResizeStop={(w, h, x, y) =>
                                                onScreenUpdate(screen.id, { w, h, x: x - 2500, y: y - 2500 })
                                            }
                                        />
                                    ))}
                                </div>
                            </TransformComponent>
                        </>
                    )
                }}
            </TransformWrapper>
        </div>
    )
}
