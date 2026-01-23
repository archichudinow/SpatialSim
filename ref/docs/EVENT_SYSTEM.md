# Event System Documentation

## Overview
The event system provides a centralized, registry-based architecture for creating and managing event types that can generate heatmap visualizations. The system is designed for easy extensibility and efficient resource usage.

## Architecture

### Key Components

1. **Event Types Registry** (`src/config/eventTypes.js`)
   - Centralized definition of all event types
   - Auto-initialization of buffers and layer configs
   - Single source of truth for event metadata

2. **Insights Store** (`src/modules/insights/insightsStore.js`)
   - Manages event buffers (data storage)
   - Controls which event types are active (performance optimization)
   - Provides actions for buffer manipulation

3. **Heatmap Store** (`src/modules/heatmap/heatmapStore.js`)
   - Layer configurations auto-initialized from registry
   - Controls visualization settings per layer
   - Independent from event detection logic

4. **App.jsx**
   - Dynamically renders HeatmapModules from registry
   - Passes event data via props (unidirectional flow)
   - No manual instantiation needed for new event types

## Adding a New Event Type

### Step 1: Define Event Type in Registry

Edit `src/config/eventTypes.js` and add your event type to the `EVENT_TYPES` object:

```javascript
export const EVENT_TYPES = {
  // ... existing types ...
  
  YOUR_EVENT: {
    name: 'yourEvent',              // Unique identifier
    label: 'Your Event Label',      // Display name
    description: 'What this event detects',
    bufferType: BUFFER_TYPE.MAP,    // MAP for duration, SET for point events
    defaultConfig: {
      enabled: true,                // Auto-enabled by default
      radius: 5.0,                  // Heatmap radius in meters
      gradient: 'smooth',           // Gradient style name
      minHeat: 0.0,                 // Minimum heat value
      maxHeat: 100.0,               // Maximum heat value
      useTransparency: true         // Enable transparency
    }
  }
};
```

**That's it!** The system will automatically:
- ✅ Initialize the event buffer in InsightsStore
- ✅ Create layer configuration in HeatmapStore
- ✅ Render HeatmapModule in App.jsx
- ✅ Make it available in UI controls

### Step 2: Populate the Event Buffer (Detection Logic)

In your detection code (e.g., in `InsightsCollector.jsx` or a detector):

```javascript
// For duration events (Map-based)
const position = { x: 1, y: 0, z: 2 };
const intensity = 5.0; // Higher = more heat
insightsStore.getState().updateEventBuffer('yourEvent', agentId, position, intensity);

// For point events (Set-based)
insightsStore.getState().recordPointEvent('yourEvent', agentId);

// Remove from buffer
insightsStore.getState().removeFromEventBuffer('yourEvent', agentId);

// Clear all events for this type
insightsStore.getState().clearEventBuffer('yourEvent');
```

### Step 3: Control Event Activation (Optional)

For performance optimization, you can control which events are actively processed:

```javascript
// Activate an event type (will start processing)
insightsStore.getState().activateEventType('yourEvent');

// Deactivate an event type (stop processing, clear buffer)
insightsStore.getState().deactivateEventType('yourEvent');

// Set multiple active types at once
insightsStore.getState().setActiveEventTypes(['linger', 'pause', 'yourEvent']);

// Check if event type is active
const isActive = insightsStore.getState().activeEventTypes.has('yourEvent');
```

## Buffer Types

### MAP Buffer (Duration Events)
Use for events that have:
- Position in 3D space
- Intensity/magnitude
- Continuous duration

**Example**: Agent dwelling, pausing, scanning

**Structure**: `Map<agentId, {position: {x,y,z}, intensity: number}>`

### SET Buffer (Point Events)
Use for events that are:
- Binary (happened or didn't happen)
- Moment in time (not duration)
- No position/intensity needed

**Example**: Agent entered zone, agent noticed object

**Structure**: `Set<agentId>`

## Event Type Examples

### Duration Event (Scanning)
```javascript
SCAN: {
  name: 'scan',
  label: 'Look Around/Scan',
  description: 'Agents rapidly scanning environment',
  bufferType: BUFFER_TYPE.MAP,  // Stores position + intensity
  defaultConfig: {
    enabled: true,
    radius: 5.0,               // Larger radius for scanning area
    gradient: 'steppedMonochromeBlueOutlined',
    minHeat: 0.0,
    maxHeat: 400.0,            // Higher max for intense scanning
    useTransparency: true
  }
}
```

Detection logic:
```javascript
// Detect scanning behavior
if (isAgentScanning(agent, currentTime)) {
  const position = agent.nodes.position.position;
  const scanIntensity = calculateScanIntensity(agent);
  updateEventBuffer('scan', agent.id, position, scanIntensity);
} else {
  // Agent stopped scanning
  removeFromEventBuffer('scan', agent.id);
}
```

### Point Event (Interaction)
```javascript
INTERACT: {
  name: 'interact',
  label: 'Object Interaction',
  description: 'Agents that interacted with object',
  bufferType: BUFFER_TYPE.SET,  // Just track which agents
  defaultConfig: {
    enabled: true,
    radius: 2.0,               // Small focused radius
    gradient: 'thermal',
    minHeat: 0.0,
    maxHeat: 50.0,
    useTransparency: true
  }
}
```

Detection logic:
```javascript
// Trigger on interaction
if (agentInteractedWithObject(agent, object)) {
  recordPointEvent('interact', agent.id);
}
```

## Performance Optimization

### Active Event Types
Only event types in `activeEventTypes` should be processed during detection. This prevents computing events that aren't being visualized:

```javascript
const activeEventTypes = insightsStore.getState().activeEventTypes;

// Only process if active
if (activeEventTypes.has('scan')) {
  // Perform expensive scan detection
  detectScanningBehavior(agent);
}
```

### Conditional Rendering
HeatmapModules only render when their layer is active in the UI. The system automatically handles this - you don't need to conditionally render in App.jsx.

## Best Practices

### 1. Naming Convention
- Use camelCase for event names: `'linger'`, `'scanArea'`, `'objectInteraction'`
- Keep names short and descriptive
- Avoid special characters

### 2. Buffer Management
- Clear buffers when resetting: `clearAllEventBuffers()`
- Remove agents from buffers when events end
- For duration events, update intensity continuously
- For point events, add once and keep until clear

### 3. Intensity Values
- Use consistent scale across similar events (0-100, 0-1000, etc.)
- Higher intensity = more heat in heatmap
- Consider normalizing based on duration or frequency

### 4. Gradient Selection
Available gradients:
- `'smooth'` - Smooth color gradient
- `'thermal'` - Red-yellow-white thermal
- `'stepped'` - Discrete color steps
- `'steppedMonochromeRedOutlined'` - Red with outlines
- `'steppedMonochromeBlueOutlined'` - Blue with outlines
- `'steppedMonochromeOrangeOutlined'` - Orange with outlines

## Current Event Types

| Event Type | Buffer Type | Purpose |
|-----------|-------------|---------|
| `linger` | MAP | Agents dwelling/lingering in place |
| `pause` | MAP | Agents paused or stopped |
| `scan` | MAP | Agents rapidly looking around |
| `noticed` | SET | Agents that entered observation zone |

## Migration Guide

### From Manual to Registry-Based

**Before** (manual instantiation):
```javascript
// In insightsStore.js
eventBuffers: {
  myEvent: new Map()
}

// In heatmapStore.js
layers: {
  myEvent: { enabled: true, radius: 5.0, ... }
}

// In App.jsx
<HeatmapModule
  id="myEvent"
  eventData={eventBuffers.myEvent}
  ...
/>
```

**After** (registry-based):
```javascript
// In eventTypes.js - ONLY place you need to edit
export const EVENT_TYPES = {
  MY_EVENT: {
    name: 'myEvent',
    label: 'My Event',
    description: 'Event description',
    bufferType: BUFFER_TYPE.MAP,
    defaultConfig: { ... }
  }
};

// Everything else auto-generates!
```

## Troubleshooting

### Event not appearing in heatmap
1. Check if event type is in registry (`eventTypes.js`)
2. Verify buffer is being populated (check `insightsStore.eventBuffers`)
3. Ensure event type is active (`insightsStore.activeEventTypes`)
4. Check if layer is enabled in UI controls

### Performance issues
1. Deactivate unused event types
2. Reduce update frequency for expensive detections
3. Use point events (SET) instead of duration events (MAP) when possible
4. Consider throttling buffer updates

### Buffer not clearing
1. Call `clearEventBuffer(eventName)` when resetting
2. Remove agents from buffer when events end
3. Use `clearAllEventBuffers()` on full reset

## Future Enhancements

Potential improvements to the event system:
- Event priority/layering
- Custom buffer types beyond MAP/SET
- Event composition (combining multiple events)
- Real-time event statistics
- Event recording/playback
- Event export formats
