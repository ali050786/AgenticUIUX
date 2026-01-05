# Canvas Multi-Screen Implementation - Requirements Document

## Executive Summary

This document outlines the requirements to refactor the current single-screen canvas preview tool into a multi-screen project management system, matching the architecture demonstrated in the reference tutorial.

**Current State:** Single-screen preview generator  
**Target State:** Multi-screen canvas with dynamic positioning and two-phase generation  
**Scope:** Canvas implementation only (excludes database, authentication, and other features)

---

## 1. Architecture Overview

### 1.1 Current vs Target Architecture

#### Current Flow (Single-Screen)
```
User Prompt → POST /api/generate → Single HTML → Update single screen state
```

#### Target Flow (Multi-Screen)
```
Phase 1: Config Generation
User Prompt → POST /api/generate-config → Array of screen configs (NO code)
                                        → Store configs in state
                                        → Create empty ScreenFrame components

Phase 2: Sequential UI Generation
For each screen config:
  → POST /api/generate-screen-ui (with screen details)
  → Receive HTML for that specific screen
  → Update that screen's state
  → Display in canvas
```

### 1.2 Key Architectural Principles

1. **Separation of Concerns**: Config generation separate from UI generation
2. **Progressive Loading**: Show screen placeholders immediately, fill progressively
3. **Individual State Management**: Each screen maintains independent state
4. **Dynamic Positioning**: Calculate positions based on device type and screen count
5. **Canvas-Relative Coordinates**: Use offset system for infinite canvas

---

## 2. Backend Requirements

### 2.1 NEW Endpoint: POST /api/generate-config

**Purpose:** Generate project structure and screen configurations without code

**Request Body:**
```typescript
{
  prompt: string          // e.g., "Budget tracker app"
  device_type: string     // "mobile" | "web" | "tablet"
  project_id?: string     // Optional for persistence
}
```

**Response:**
```typescript
{
  project_name: string
  theme: string           // e.g., "light", "netflix", "spotify"
  screens: [
    {
      screen_id: number
      screen_name: string
      purpose: string
      screen_description: string
    }
  ]
}
```

**AI Prompt Requirements:**
- Analyze user intent to determine appropriate screens
- Typical mobile apps: 3-5 screens (splash, main, detail, settings)
- Typical web apps: 2-4 screens (landing, dashboard, profile)
- Output pure JSON (no markdown, no code blocks)
- Use meaningful screen names and descriptions

**Example Output:**
```json
{
  "project_name": "Budget Tracker",
  "theme": "light",
  "screens": [
    {
      "screen_id": 1,
      "screen_name": "Splash Screen",
      "purpose": "Welcome users with app branding",
      "screen_description": "Display app logo, tagline 'Track Your Spending', and Continue button"
    },
    {
      "screen_id": 2,
      "screen_name": "Dashboard",
      "purpose": "Overview of budget status",
      "screen_description": "Show current balance, spending chart, recent transactions list, add expense button"
    },
    {
      "screen_id": 3,
      "screen_name": "Add Expense",
      "purpose": "Form to add new expense",
      "screen_description": "Input fields for amount, category dropdown, date picker, notes textarea, save button"
    }
  ]
}
```

### 2.2 MODIFIED Endpoint: POST /api/generate-screen-ui

**Current Name:** `/api/generate`  
**New Name:** `/api/generate-screen-ui`

**Changes Required:**
- Accept screen-specific configuration instead of generic prompt
- Generate code for single screen only
- Maintain existing HTML preview wrapper

**Request Body:**
```typescript
{
  screen_id: number
  screen_name: string
  purpose: string
  screen_description: string
  device_type: string
  theme?: string          // Optional theme integration
}
```

**Response:** (unchanged)
```typescript
{
  code: string
  html_preview: string
  success: boolean
}
```

**AI Prompt Modifications:**
- Use `screen_description` as primary context
- Include `screen_name` and `purpose` for context
- Apply theme-specific styling if provided
- Maintain existing code quality standards

---

## 3. Frontend Requirements

### 3.1 State Management Changes

#### 3.1.1 Screen State Structure

**Current:**
```typescript
screens: [
  {
    id: "main",
    name: "App Screen",
    html: string | null,
    w: number,
    h: number,
    x: number,
    y: number,
    loading: boolean
  }
]
```

**Required Updates:**
```typescript
screens: [
  {
    id: string,              // screen_id from config
    name: string,            // screen_name from config
    html: string | null,     // null until generated
    w: number,              // calculated based on device
    h: number,              // calculated based on device
    x: number,              // calculated: index * (w + gap)
    y: number,              // always 0 (horizontal layout)
    loading: boolean,       // per-screen loading state
    screen_id: number,      // from config (for API calls)
    purpose: string,        // from config
    description: string     // from config
  }
]
```

#### 3.1.2 Additional State Variables

```typescript
// Generation state
const [configGenerated, setConfigGenerated] = useState(false)
const [generatingScreenIndex, setGeneratingScreenIndex] = useState<number | null>(null)

// Project metadata
const [projectName, setProjectName] = useState("")
const [projectTheme, setProjectTheme] = useState("light")
```

### 3.2 Canvas Component (Canvas.tsx)

#### 3.2.1 TransformWrapper Configuration

**Required Changes:**
```typescript
<TransformWrapper
  initialScale={0.7}           // Changed from: 1
  initialPositionX={50}        // Changed from: -2000
  initialPositionY={50}        // Changed from: -2000
  minScale={0.7}              // Changed from: 0.4
  maxScale={3}                // Changed from: 4
  limitToBounds={false}       // Keep
  wheel={{ step: 0.1 }}       // Keep
  panning={{ 
    velocityDisabled: true    // Keep
  }}
>
```

**Rationale:**
- `initialScale: 0.7` → Provides better overview for multiple screens
- `initialPosition: 50` → Prevents off-screen rendering on load
- `minScale: 0.7` → Matches initial scale for consistent UX
- `maxScale: 3` → Prevents excessive zoom that degrades quality

#### 3.2.2 Canvas Background

**Required Implementation:**
```typescript
<div
  className="w-[5000px] h-[5000px] relative bg-slate-100"
  style={{
    backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
    backgroundSize: "24px 24px"
  }}
>
  {screens.map((screen, index) => (
    <ScreenFrame
      key={screen.id}
      {...screen}
      x={screen.x + 2500}  // Centering offset
      y={screen.y + 2500}  // Centering offset
      onDragStop={(x, y) => handleDragStop(screen.id, x - 2500, y - 2500)}
      onResizeStop={(w, h, x, y) => handleResizeStop(screen.id, w, h, x - 2500, y - 2500)}
    />
  ))}
</div>
```

**Key Requirements:**
- Giant canvas (5000x5000px) for infinite feel
- Dotted grid background for spatial reference
- **+2500 offset** when rendering (centers screens)
- **-2500 offset** when saving positions (normalizes coordinates)

#### 3.2.3 Zoom Controls

**Requirements:**
- Display current zoom percentage (e.g., "70%")
- Zoom In button (step: 0.1)
- Zoom Out button (step: 0.1)
- Reset button (returns to initialScale and position)

### 3.3 Screen Positioning Logic

#### 3.3.1 Position Calculation Function

**Required Implementation:**
```typescript
const calculateScreenPosition = (
  index: number,
  deviceType: "mobile" | "web" | "tablet"
): { x: number; y: number; w: number; h: number } => {
  
  const isMobile = deviceType === "mobile"
  const isTablet = deviceType === "tablet"
  
  // Width calculation
  const w = isMobile ? 400 : isTablet ? 768 : 1024
  
  // Height (consistent for better visual alignment)
  const h = isMobile ? 812 : isTablet ? 1024 : 768
  
  // Gap between screens
  const gap = isMobile ? 30 : 70
  
  // Horizontal layout (all y = 0)
  return {
    x: index * (w + gap),
    y: 0,
    w,
    h
  }
}
```

**Device-Specific Dimensions:**

| Device  | Width | Height | Gap | Example 3-Screen Layout (x positions) |
|---------|-------|--------|-----|----------------------------------------|
| Mobile  | 400   | 812    | 30  | [0, 430, 860]                         |
| Tablet  | 768   | 1024   | 70  | [0, 838, 1676]                        |
| Web     | 1024  | 768    | 70  | [0, 1094, 2188]                       |

#### 3.3.2 Dynamic Repositioning

**Requirement:** When device type changes, recalculate ALL screen positions

```typescript
const handleDeviceChange = (newType: "mobile" | "web" | "tablet") => {
  setDeviceType(newType)
  
  setScreens(prev => prev.map((screen, index) => {
    const { x, y, w, h } = calculateScreenPosition(index, newType)
    return { ...screen, x, y, w, h }
  }))
}
```

### 3.4 ScreenFrame Component (ScreenFrame.tsx)

#### 3.4.1 Props Interface

```typescript
interface ScreenFrameProps {
  id: string
  name: string
  html: string | null
  width: number
  height: number
  x: number
  y: number
  loading: boolean
  theme?: string
  onDragStop: (x: number, y: number) => void
  onResizeStop: (w: number, h: number, x: number, y: number) => void
}
```

#### 3.4.2 Loading State Display

**Requirements:**
- Show skeleton loader when `loading === true`
- Display screen name in header always
- Animate loading indicator (pulsing or spinner)

```typescript
{loading ? (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-400">Generating {name}...</span>
    </div>
  </div>
) : html ? (
  <iframe srcDoc={html} ... />
) : (
  <div className="flex items-center justify-center text-slate-400">
    No preview available
  </div>
)}
```

#### 3.4.3 Drag Handle Requirements

- Visual indicator (grip icon)
- Prevents iframe from capturing mouse events
- Shows screen name
- Uses `dragHandleClassName="drag-handle"` for react-rnd

### 3.5 Generation Flow

#### 3.5.1 Config Generation Phase

```typescript
const handleGenerate = async () => {
  if (!prompt.trim()) return
  
  setLoading(true)
  setLoadingMessage("Generating project structure...")
  
  try {
    // Phase 1: Get screen configurations
    const configResponse = await axios.post('/api/generate-config', {
      prompt,
      device_type: deviceType
    })
    
    const { project_name, theme, screens: screenConfigs } = configResponse.data
    
    setProjectName(project_name)
    setProjectTheme(theme)
    
    // Create empty screen frames with calculated positions
    const initialScreens = screenConfigs.map((config, index) => {
      const position = calculateScreenPosition(index, deviceType)
      return {
        id: `screen-${config.screen_id}`,
        name: config.screen_name,
        html: null,
        loading: true,
        screen_id: config.screen_id,
        purpose: config.purpose,
        description: config.screen_description,
        ...position
      }
    })
    
    setScreens(initialScreens)
    setConfigGenerated(true)
    
    // Immediately start Phase 2
    await generateScreensSequentially(initialScreens)
    
  } catch (error) {
    console.error("Config generation failed:", error)
    alert("Failed to generate project structure")
  } finally {
    setLoading(false)
  }
}
```

#### 3.5.2 Sequential Screen Generation

```typescript
const generateScreensSequentially = async (screenList) => {
  for (let i = 0; i < screenList.length; i++) {
    const screen = screenList[i]
    
    setGeneratingScreenIndex(i)
    setLoadingMessage(`Generating screen ${i + 1} of ${screenList.length}...`)
    
    try {
      const response = await axios.post('/api/generate-screen-ui', {
        screen_id: screen.screen_id,
        screen_name: screen.name,
        purpose: screen.purpose,
        screen_description: screen.description,
        device_type: deviceType,
        theme: projectTheme
      })
      
      // Update ONLY this screen
      setScreens(prev => prev.map((s, idx) => 
        idx === i 
          ? { ...s, html: response.data.html_preview, loading: false }
          : s
      ))
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`Screen ${i + 1} generation failed:`, error)
      
      // Update with error state
      setScreens(prev => prev.map((s, idx) => 
        idx === i 
          ? { ...s, loading: false, html: null }
          : s
      ))
    }
  }
  
  setGeneratingScreenIndex(null)
  setLoadingMessage("")
}
```

**Key Requirements:**
- **Sequential generation** (not parallel) for better UX feedback
- Update individual screens (don't reset all screens)
- Show progress: "Generating screen 2 of 3..."
- Handle errors gracefully (show error state for failed screens)
- Optional delay between screens for visual feedback

---

## 4. User Experience Requirements

### 4.1 Loading States

1. **Phase 1 (Config):** 
   - Show main loading overlay
   - Message: "Generating project structure..."
   - Duration: ~2-5 seconds

2. **Phase 2 (Per Screen):**
   - Show skeleton in each screen frame
   - Progress indicator: "Generating screen X of Y..."
   - Per-screen duration: ~3-8 seconds
   - Total Phase 2 duration: ~10-30 seconds (3-5 screens)

### 4.2 Visual Feedback

1. **Immediate Canvas Population:**
   - Show empty screen frames as soon as config returns
   - Display screen names in headers immediately
   - Show loading animation in each frame

2. **Progressive Enhancement:**
   - Screens appear one by one as they generate
   - Previously generated screens remain visible
   - User can zoom/pan while generation continues

3. **Error Handling:**
   - Failed screens show error state (not blank)
   - Allow retry on individual screen
   - Don't block other screens from generating

### 4.3 Interaction Requirements

1. **During Generation:**
   - Disable prompt input
   - Disable device type change
   - Allow canvas zoom/pan
   - Allow viewing generated screens
   - Show cancel button (optional)

2. **After Generation:**
   - Enable all controls
   - Allow adding new screens
   - Allow regenerating individual screens
   - Allow drag/resize of all screens

---

## 5. Performance Requirements

### 5.1 Response Times

- Config generation: < 5 seconds target
- Per-screen UI generation: < 10 seconds target
- Canvas render/reflow: < 100ms
- Zoom/pan operations: 60 FPS

### 5.2 Optimization Strategies

1. **Lazy Rendering:**
   - Only render iframes for visible screens (optional enhancement)
   - Use intersection observer for off-screen detection

2. **State Updates:**
   - Batch position updates when possible
   - Debounce drag/resize callbacks (100ms)

3. **Memory Management:**
   - Limit maximum screens to 10
   - Warn user if exceeding limits
   - Clean up iframe resources on unmount

---

## 6. Validation Requirements

### 6.1 Input Validation

1. **Prompt:**
   - Minimum length: 10 characters
   - Maximum length: 500 characters
   - Required field

2. **Device Type:**
   - Must be one of: "mobile", "web", "tablet"
   - Default: "web"

3. **Screen Count:**
   - Minimum: 1 screen
   - Maximum: 10 screens
   - Typical: 3-5 screens

### 6.2 Output Validation

1. **Config Response:**
   - Must contain `project_name` (non-empty string)
   - Must contain `screens` array (length 1-10)
   - Each screen must have: screen_id, screen_name, purpose, description

2. **UI Response:**
   - Must contain valid HTML in `html_preview`
   - Must contain code in `code` field
   - Must have `success: true` flag

---

## 7. Testing Requirements

### 7.1 Functional Tests

- [ ] Config generation with various prompts
- [ ] Sequential screen generation (1, 3, 5 screens)
- [ ] Device type switching (recalculates positions)
- [ ] Screen drag and drop
- [ ] Screen resize
- [ ] Zoom controls functionality
- [ ] Canvas panning
- [ ] Error handling (API failures)

### 7.2 Visual Tests

- [ ] Screens don't overlap on initial load
- [ ] Screens positioned horizontally
- [ ] Proper spacing between screens
- [ ] Loading states display correctly
- [ ] Grid background visible
- [ ] Zoom percentage accurate

### 7.3 Edge Cases

- [ ] Single screen generation
- [ ] Maximum screens (10)
- [ ] Very long screen names
- [ ] API timeout handling
- [ ] Partial generation failure (screen 2 of 3 fails)
- [ ] Device switch during generation

---

## 8. Success Criteria

### 8.1 Primary Objectives

✅ **Config Generation Working:**
- User enters prompt → Receives array of screen configs
- Screens displayed as empty frames immediately

✅ **Sequential UI Generation:**
- Each screen generates independently
- Progress visible to user
- Screens populate one by one

✅ **Correct Positioning:**
- No overlapping screens
- Consistent spacing based on device type
- Screens arranged horizontally

✅ **Canvas Interactions:**
- Smooth zoom/pan
- Drag and resize working
- Visual feedback clear

### 8.2 Acceptance Criteria

1. Prompt "Budget tracker app" generates 3-5 screens
2. All screens visible without scrolling (at 70% zoom)
3. Screens can be dragged and resized independently
4. Device switch recalculates positions correctly
5. Generation completes in < 60 seconds for 5 screens

---

## 9. Out of Scope

The following are explicitly **NOT** included in this canvas implementation:

❌ Database integration (Neon PostgreSQL, Drizzle ORM)  
❌ Authentication (Clerk)  
❌ Project persistence  
❌ Theme system (Netflix, Spotify themes)  
❌ Code editing functionality  
❌ Screenshot/export features  
❌ Screen deletion  
❌ Screen regeneration  
❌ Project sharing  

These features may be added in future iterations but are not part of the canvas implementation scope.

---

## 10. Implementation Priority

### Phase 1: Core Multi-Screen (High Priority)
1. Create `/api/generate-config` endpoint
2. Modify frontend generation flow (two-phase)
3. Implement position calculation logic
4. Fix canvas initialization settings

### Phase 2: Visual Polish (Medium Priority)
5. Add per-screen loading states
6. Implement progress indicators
7. Add zoom controls UI

### Phase 3: Interaction (Medium Priority)
8. Test drag/drop with offset compensation
9. Test resize with position updates
10. Add device type switching

### Phase 4: Error Handling (Low Priority)
11. Implement error states
12. Add retry mechanisms
13. Validation and edge cases

---

## Appendix A: Reference Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                       │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ Prompt Input │→│ Device Type│→│  Generate Button  │   │
│  └──────────────┘  └────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: CONFIG GEN                       │
│  POST /api/generate-config                                   │
│  ↓                                                            │
│  {                                                            │
│    project_name: "Budget Tracker",                           │
│    theme: "light",                                            │
│    screens: [                                                 │
│      { id: 1, name: "Splash", description: "..." },          │
│      { id: 2, name: "Dashboard", description: "..." },       │
│      { id: 3, name: "Add Expense", description: "..." }      │
│    ]                                                          │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               CREATE EMPTY SCREEN FRAMES                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Splash     │  │  Dashboard   │  │ Add Expense  │      │
│  │  [LOADING]   │  │  [LOADING]   │  │  [LOADING]   │      │
│  │  x=0         │  │  x=430       │  │  x=860       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 PHASE 2: UI GEN (LOOP)                       │
│                                                               │
│  For i = 0 to 2:                                             │
│    POST /api/generate-screen-ui {                            │
│      screen_id: screens[i].id,                               │
│      description: screens[i].description                     │
│    }                                                          │
│    ↓                                                          │
│    Update screens[i].html = response.html_preview            │
│                                                               │
│  Progress: "Generating screen 1 of 3..."                     │
│           "Generating screen 2 of 3..."                     │
│           "Generating screen 3 of 3..."                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  FINAL CANVAS STATE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Splash     │  │  Dashboard   │  │ Add Expense  │      │
│  │  [RENDERED]  │  │  [RENDERED]  │  │  [RENDERED]  │      │
│  │  <iframe/>   │  │  <iframe/>   │  │  <iframe/>   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  All screens draggable, resizable, viewable                  │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-05  
**Author:** AI Assistant  
**Status:** Ready for Implementation
