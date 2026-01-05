"use client"

import React, { useState } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { Copy, Check, Code2 } from "lucide-react"
import { Button } from "@/components/ui"

interface CodePanelProps {
    code: string | null
    language?: string
}

export function CodePanel({ code, language = "tsx" }: CodePanelProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        if (!code) return
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!code) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-slate-400 items-center justify-center p-8 text-center border-l border-slate-800">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <Code2 className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-slate-200 mb-2">No Code Generated</h3>
                <p className="text-sm max-w-xs">
                    Enter a prompt and click Generate to see the React component code here.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-slate-300 border-l border-slate-800">
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-[#1e1e1e]">
                <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-slate-200">Generated Code</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 text-xs hover:bg-slate-800 hover:text-white"
                    disabled={copied}
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                            Copy Code
                        </>
                    )}
                </Button>
            </div>

            {/* Code Area */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <Highlight
                    theme={themes.vsDark}
                    code={code}
                    language={language}
                >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre className="p-4 text-xs font-mono leading-relaxed min-w-full float-left" style={style}>
                            {tokens.map((line, i) => (
                                <div key={i} {...getLineProps({ line })} className="table-row">
                                    <span className="table-cell text-slate-600 select-none pr-4 text-right w-8">
                                        {i + 1}
                                    </span>
                                    <span className="table-cell">
                                        {line.map((token, key) => (
                                            <span key={key} {...getTokenProps({ token })} />
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </pre>
                    )}
                </Highlight>
            </div>
        </div>
    )
}
