"use client"

import { useState } from "react"
import { SettingsSidebar } from "@/components/SettingsSidebar"
import { Canvas } from "@/components/Canvas"
import { CodePanel } from "@/components/CodePanel"
import { Button, Input, Card } from "@/components/ui"
import { generateComponent } from "@/lib/api"
import { Loader2, Wand2, Maximize2, Columns } from "lucide-react"
import NoSSR from "@/components/NoSSR"

export default function Home() {
  const [deviceType, setDeviceType] = useState<"mobile" | "web" | "tablet">("web")
  const [projectName, setProjectName] = useState("Untitled Project")
  const [theme, setTheme] = useState("light")
  const [prompt, setPrompt] = useState("")
  const [code, setCode] = useState<string | null>(null)

  // Layout state
  const [showCode, setShowCode] = useState(true)

  const [screens, setScreens] = useState<import("@/components/Canvas").ScreenData[]>([
    {
      id: "main",
      name: "App Screen",
      html: null,
      w: 1024,
      h: 768,
      x: 0,
      y: 0,
      loading: false,
    },
  ])

  // Update screen dimensions when device type changes
  const handleDeviceChange = (type: "mobile" | "web" | "tablet") => {
    setDeviceType(type)
    setScreens((prev) =>
      prev.map((s) => {
        // Only update the main screen or all screens? Let's check if it's a new screen or default one
        // For now, let's just update based on standard sizes if they haven't been manually resized (tracked elsewhere, but simplified here)
        let w = 1024
        let h = 768

        switch (type) {
          case "mobile": w = 375; h = 812; break;
          case "tablet": w = 768; h = 1024; break;
          case "web": default: w = 1024; h = 768; break;
        }

        return { ...s, w, h }
      })
    )
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    // Set loading state for screens
    setScreens((prev) =>
      prev.map((s) => ({ ...s, loading: true, html: null }))
    )
    setCode(null)

    try {
      const response = await generateComponent(prompt, deviceType)
      if (response.success) {
        setCode(response.code)
        // Ensure iframe update
        setTimeout(() => {
          setScreens((prev) =>
            prev.map((s) => ({ ...s, html: response.html_preview, loading: false }))
          )
        }, 100)
      } else {
        setScreens((prev) =>
          prev.map((s) => ({ ...s, loading: false }))
        )
        alert("Generation failed (no success flag).")
      }
    } catch (error) {
      console.error(error)
      alert("Failed to generate component. Please try again.")
      setScreens((prev) =>
        prev.map((s) => ({ ...s, loading: false }))
      )
    }
  }

  const handleScreenUpdate = (id: string, data: Partial<import("@/components/Canvas").ScreenData>) => {
    setScreens((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
  }

  const handleAddScreen = () => {
    const w = deviceType === "mobile" ? 375 : deviceType === "tablet" ? 768 : 1024
    const h = deviceType === "mobile" ? 812 : deviceType === "tablet" ? 1024 : 768

    const newScreen: import("@/components/Canvas").ScreenData = {
      id: `screen-${Date.now()}`,
      name: `Screen ${screens.length + 1}`,
      html: screens[0]?.html || null, // Inherit content from first screen if available
      w,
      h,
      x: 50 + (screens.length * 20),
      y: 50 + (screens.length * 20),
      loading: screens[0]?.loading || false,
    }
    setScreens((prev) => [...prev, newScreen])
  }

  const handleDownload = () => {
    alert("Download functionality coming soon!")
  }

  return (
    <NoSSR>
      <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
        {/* Sidebar */}
        <SettingsSidebar
          projectName={projectName}
          setProjectName={setProjectName}
          theme={theme}
          setTheme={setTheme}
          deviceType={deviceType}
          setDeviceType={handleDeviceChange}
          onAddScreen={handleAddScreen}
          onDownload={handleDownload}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top Bar */}
          <header className="h-14 border-b border-slate-200 bg-white flex items-center px-4 justify-between shrink-0 z-10">
            <div className="flex-1 flex max-w-3xl mx-auto items-center space-x-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Describe your UI (e.g. 'Login screen with email, password and social auth')..."
                  className="pl-4 pr-10 border-slate-200 focus:border-indigo-500 shadow-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
                <div className="absolute right-1 top-1 bottom-1">
                  <Button
                    size="sm"
                    className="h-full px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleGenerate}
                    disabled={screens.some(s => s.loading) || !prompt.trim()}
                  >
                    {screens.some(s => s.loading) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className={showCode ? "bg-slate-100 text-slate-900" : "text-slate-500"}
                title="Toggle Code Panel"
              >
                <Columns className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Workspace Split */}
          <div className="flex-1 flex overflow-hidden relative">

            {/* Left: Canvas */}
            <div className={`flex-1 relative transition-all duration-300 ease-in-out ${showCode ? "w-[60%]" : "w-full"}`}>
              <Canvas screens={screens} onScreenUpdate={handleScreenUpdate} />
            </div>

            {/* Right: Code Panel */}
            {showCode && (
              <div className="w-[40%] border-l border-slate-200 flex flex-col bg-slate-900 transition-all duration-300 ease-in-out">
                <CodePanel code={code} />
              </div>
            )}
          </div>
        </div>
      </div>
    </NoSSR>
  )
}
