import React from 'react'
import { Monitor, Smartphone, Tablet, Plus, Download, Share2 } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'

interface SettingsSidebarProps {
    projectName: string
    setProjectName: (name: string) => void
    theme: string
    setTheme: (theme: string) => void
    deviceType: "mobile" | "web" | "tablet"
    setDeviceType: (type: "mobile" | "web" | "tablet") => void
    onAddScreen: () => void
    onDownload: () => void
}

export function SettingsSidebar({
    projectName,
    setProjectName,
    theme,
    setTheme,
    deviceType,
    setDeviceType,
    onAddScreen,
    onDownload
}: SettingsSidebarProps) {
    return (
        <aside className="w-80 flex flex-col h-full bg-white border-r border-slate-200 overflow-y-auto">
            <div className="p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">A</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">Antigravity</span>
                </div>

                {/* Project Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Project</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Project Name</label>
                            <Input
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="My Awesome Project"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Theme</label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="light">Light (Default)</option>
                                <option value="netflix">Netflix (Red/Black)</option>
                                <option value="spotify">Spotify (Green/Black)</option>
                                <option value="amazon">Amazon (Orange/Light)</option>
                                <option value="apple">Apple (Minimal Gray)</option>
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Canvas Settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Canvas</h3>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Device Type</label>
                        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setDeviceType("web")}
                                className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${deviceType === "web"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                                title="Web Desktop"
                            >
                                <Monitor size={18} />
                            </button>
                            <button
                                onClick={() => setDeviceType("tablet")}
                                className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${deviceType === "tablet"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                                title="Tablet"
                            >
                                <Tablet size={18} />
                            </button>
                            <button
                                onClick={() => setDeviceType("mobile")}
                                className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${deviceType === "mobile"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                                title="Mobile"
                            >
                                <Smartphone size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Actions</h3>
                    <div className="space-y-2">
                        <Button onClick={onAddScreen} variant="secondary" className="w-full justify-start">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Screen
                        </Button>
                        <Button onClick={onDownload} variant="secondary" className="w-full justify-start">
                            <Download className="mr-2 h-4 w-4" />
                            Download Project
                        </Button>
                        <Button variant="secondary" className="w-full justify-start text-slate-400 cursor-not-allowed">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Project
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-slate-200">
                <div className="text-xs text-slate-400 text-center">
                    v0.1.0-alpha
                </div>
            </div>
        </aside>
    )
}
