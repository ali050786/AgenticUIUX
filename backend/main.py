import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

# Load environment variables
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="AI React Component Generator")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Implementation Log
# Date: 2026-01-04
# WHAT: Initial setup of FastAPI backend with LangChain and OpenRouter integration.
# WHY: To enable AI-powered React component generation.
# HOW: Using FastAPI for the API, LangChain for LLM interaction, and OpenRouter as the model provider.


class GenerateRequest(BaseModel):
    prompt: str
    device_type: str = "web"

class GenerateResponse(BaseModel):
    code: str
    html_preview: str
    success: bool

@app.get("/health")
async def health_check():
    return {"status": "ok"}

def generate_system_prompt(device_type: str) -> str:
    return f"""You are an expert Frontend Developer specializing in React, TypeScript, and Tailwind CSS.
Your task is to generate a PRODUCTION-READY React component based on the user's request.

DEVICE CONTEXT: {device_type}
Ensure the design is optimized for this device type.

REQUIREMENTS:
1.  **Framework**: React (Functional Components with Hooks).
2.  **Language**: TypeScript.
3.  **Styling**: Tailwind CSS ONLY. No external CSS files.
4.  **Icons**: Use `lucide-react` for icons if needed.
5.  **Imports**: 
    - You can use `@/components/ui/*` for Shadcn UI components if applicable (Button, Card, Input, etc.).
    - Assume these components exist.
6.  **Accessibility**: Fully accessible (ARIA attributes).
7.  **Quality**:
    - No placeholders (use realistic text/data).
    - Beautiful, modern design with gradients, shadows, and rounded corners.
    - Responsive layout.
8.  **Output Format**:
    - Return ONLY the raw code for the component.
    - DO NOT include markdown backticks (```tsx ... ```).
    - DO NOT include explanations.
    - The file should export the component as `default`.

EXAMPLE OUTPUT START:
import React from 'react';
import {{ Button }} from '@/components/ui/button';

export default function Hero() {{
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-10 rounded-xl">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Button variant="secondary" className="mt-4">Click Me</Button>
    </div>
  );
}}
EXAMPLE OUTPUT END
"""

def generate_html_preview(react_code: str) -> str:
    """
    Wraps the generated React code in an HTML template for preview.
    Note: faster implementation using UMD React/ReactDOM/Babel.
    """
    # Escape closing script tags to prevent breaking HTML structure
    safe_code = react_code.replace("</script>", "<\\/script>")
    
    # Simple regex to find the component name
    import re
    component_name = "Component"
    
    # Try to find: export default function ComponentName
    match = re.search(r'export default function (\w+)', react_code)
    if match:
        component_name = match.group(1)
    else:
        # Try to find: export default ComponentName
        match = re.search(r'export default (\w+)', react_code)
        if match:
            component_name = match.group(1)

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body {{ background-color: #f3f4f6; padding: 20px; }}</style>
</head>
<body>
    <div id="root"></div>
    
    <!-- Inject code as plain text to avoid JS interpolation issues -->
    <script id="generated-code" type="text/plain">
{safe_code}
    </script>

    <script type="text/babel">
        // Mock Imports
        const {{ useState, useEffect, useRef }} = React;
        const lucideIcons = window.lucide;
        const {{ Button: MockButton }} = {{ Button: (props) => <button className="bg-blue-600 text-white px-4 py-2 rounded" {{...props}} /> }};
        
        // Mock Shadcn UI components as simple HTML wrappers with Tailwind
        const Button = (props) => <button {{...props}} className={{`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-900/90 h-10 px-4 py-2 ${{props.className||''}}`}} >{{props.children}}</button>;
        const Input = (props) => <input {{...props}} className={{`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${{props.className||''}}`}} />;
        const Label = (props) => <label {{...props}} className={{`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${{props.className||''}}`}} >{{props.children}}</label>;
        const Textarea = (props) => <textarea {{...props}} className={{`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${{props.className||''}}`}} />;
        const Checkbox = (props) => <button {{...props}} role="checkbox" className={{`peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${{props.className||''}}`}} >{{props.checked ? '✓' : ''}}</button>;
        const Separator = (props) => <div {{...props}} className={{`shrink-0 bg-border h-[1px] w-full ${{props.className||''}}`}} />;
        const Avatar = (props) => <div {{...props}} className={{`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${{props.className||''}}`}} >{{props.children}}</div>;
        const AvatarImage = (props) => <img {{...props}} className="aspect-square h-full w-full" />;
        const AvatarFallback = (props) => <div {{...props}} className="flex h-full w-full items-center justify-center rounded-full bg-muted" >{{props.children}}</div>;
        
        const Card = (props) => <div {{...props}} className={{`rounded-lg border bg-card text-card-foreground shadow-sm ${{props.className||''}}`}} >{{props.children}}</div>;
        const CardHeader = (props) => <div {{...props}} className={{`flex flex-col space-y-1.5 p-6 ${{props.className||''}}`}} >{{props.children}}</div>;
        const CardTitle = (props) => <h3 {{...props}} className={{`text-2xl font-semibold leading-none tracking-tight ${{props.className||''}}`}} >{{props.children}}</h3>;
        const CardDescription = (props) => <p {{...props}} className={{`text-sm text-muted-foreground ${{props.className||''}}`}} >{{props.children}}</p>;
        const CardContent = (props) => <div {{...props}} className={{`p-6 pt-0 ${{props.className||''}}`}} >{{props.children}}</div>;
        const CardFooter = (props) => <div {{...props}} className={{`flex items-center p-6 pt-0 ${{props.className||''}}`}} >{{props.children}}</div>;

        // Mock Lucide React with a Proxy to handle any icon name
        const LucideHandler = {{
            get: function(target, prop) {{
                if (prop === '__esModule') return null;
                return (props) => (
                    <svg {{...props}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{{{verticalAlign: 'middle'}}}}>
                        <rect x="2" y="2" width="20" height="20" rx="4" ry="4" stroke="currentColor" strokeDasharray="4 4" fill="none" opacity="0.5" />
                        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold">Icon</text>
                    </svg>
                );
            }}
        }};
        const LucideProxy = new Proxy({{}}, LucideHandler);

        // Map of all available modules
        const availableModules = {{
            'react': React,
            'lucide-react': LucideProxy,
            '@/components/ui/button': {{ Button }},
            '@/components/ui/input': {{ Input }},
            '@/components/ui/label': {{ Label }},
            '@/components/ui/textarea': {{ Textarea }},
            '@/components/ui/checkbox': {{ Checkbox }},
            '@/components/ui/separator': {{ Separator }},
            '@/components/ui/avatar': {{ Avatar, AvatarImage, AvatarFallback }},
            '@/components/ui/card': {{ Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }},
        }};

        // CommonJS require mock
        const require = (moduleName) => {{
            if (availableModules[moduleName]) return availableModules[moduleName];
            // Fallback for default exports from Shadcn usually
            if (moduleName.startsWith('@/components/ui/')) {{
                // Try to guess by splitting path
                const parts = moduleName.split('/');
                const name = parts[parts.length - 1];
                return {{ [name.charAt(0).toUpperCase() + name.slice(1)]: (props) => <div style={{{{border:'1px dashed red'}}}} {{...props}}>Mocking {{name}}</div> }};
            }}
            console.warn('Missing module:', moduleName);
            return {{}};
        }};

        // CommonJS module emulation
        const module = {{ exports: {{}} }};

        // Retrieve code
        const code = document.getElementById('generated-code').textContent;

        let compilationSuccess = false;

        // Inject and Execute
        try {{
            const transformed = Babel.transform(code, {{ 
                presets: ['env', 'react', 'typescript'], 
                filename: 'component.tsx' 
            }}).code;
            
            // Execute in a function scope to ensure 'exports' references our local variables
            // We pass 'React' explicitly just in case, though it's global
            const scopedEval = new Function("module", "exports", "require", "React", transformed);
            scopedEval(module, module.exports, require, React);
            compilationSuccess = true;
        }} catch (e) {{
            console.error("Evaluation Error:", e);
            document.body.innerHTML += `<div style="color:red; background: #ffe6e6; padding: 10px; border: 1px solid red; border-radius: 4px; margin-bottom: 20px;">
                <strong>Preview Compilation Error:</strong><br/>
                ${{e.message}}
            </div>`;
        }}
        
        // Mount
        if (compilationSuccess) {{
            try {{
                const root = ReactDOM.createRoot(document.getElementById('root'));
                const Component = module.exports.default || module.exports;
                if (Component) {{
                    root.render(<Component />);
                }} else {{
                    root.render(<div className="text-red-500">Component not found. Check console for errors.</div>);
                }}
            }} catch (e) {{
                console.error("Mount Error:", e);
                document.body.innerHTML += '<div style="color:red">Mount Error: ' + e.message + '</div>';
            }}
        }}
    </script>
</body>
</html>
    """
    return html

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_component(request: GenerateRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API Key not configured")

    try:
        chat = ChatOpenAI(
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            model_name=os.getenv("OPENROUTER_MODEL", "tngtech/deepseek-r1t2-chimera:free"),
            temperature=0.7,
            max_tokens=30000
        )

        messages = [
            SystemMessage(content=generate_system_prompt(request.device_type)),
            HumanMessage(content=request.prompt)
        ]

        response = chat.invoke(messages)
        code = response.content

        # Robust Code Extraction
        import re
        pattern = r"```(?:tsx|typescript|jsx|javascript|react)?\s*([\s\S]*?)(?:```|$)"
        match = re.search(pattern, code, re.IGNORECASE)
        if match:
            code = match.group(1).strip()
            logger.info("Code extracted via regex.")
        else:
            logger.warning("No code block found, using raw content.")
            code = code.strip()

        logger.info(f"Extracted Code Start: {code[:100]}")

        html_preview = generate_html_preview(code)

        return GenerateResponse(
            code=code,
            html_preview=html_preview,
            success=True
        )

    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
