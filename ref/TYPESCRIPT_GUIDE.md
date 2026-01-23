# TypeScript Migration Quick Reference

## ✅ Completed

### Core Files Migrated
- ✅ `src/types.js` → `src/types.ts`
- ✅ `src/AppState.js` → `src/AppState.ts`
- ✅ `src/services/bufferService.js` → `src/services/bufferService.ts`
- ✅ `src/services/agentProcessor.js` → `src/services/agentProcessor.ts`

### Configuration
- ✅ `tsconfig.json` created
- ✅ `tsconfig.node.json` created
- ✅ `vite.config.mjs` updated for TypeScript
- ✅ `jsconfig.json` removed (replaced)

### Build & Verification
- ✅ TypeScript compilation: Clean (0 errors)
- ✅ Production build: Working (10.35s)
- ✅ Development server: Working (200ms startup)
- ✅ All imports updated

## 📋 Next Steps (Optional - Incremental Migration)

### Priority 1: Remaining Services
These have minimal dependencies and will be easy to convert:

```bash
# To convert a service file:
1. Rename file.js → file.ts
2. Add type imports from '../types'
3. Add parameter and return types
4. Update imports to use .ts extension
```

Files to convert:
- `src/services/glbLoaderService.js`
- `src/services/animationService.js`

### Priority 2: Module Stores
These Zustand stores will benefit from TypeScript:

- `src/modules/insights/insightsStore.js`
- `src/modules/heatmap/heatmapStore.js`
- `src/modules/drawing/visualizationStore.js`

### Priority 3: Components
Convert `.jsx` → `.tsx` files:

```typescript
// Example component migration

// Before (UserInterface.jsx)
export default function UserInterface() {
  const togglePlay = useAppState((s) => s.actions.playback.togglePlay);
  // ...
}

// After (UserInterface.tsx)
import type { FC } from 'react';

const UserInterface: FC = () => {
  const togglePlay = useAppState((s) => s.actions.playback.togglePlay);
  // ...
}

export default UserInterface;
```

### Priority 4: Add Prop Types
For components, add interface definitions:

```typescript
interface ObserverVisualizationProps {
  observers: Observer[];
  visible: boolean;
  onSelect?: (id: string) => void;
}

const ObserverVisualization: FC<ObserverVisualizationProps> = ({
  observers,
  visible,
  onSelect
}) => {
  // ...
}
```

## 🛠 Common Patterns

### Zustand Store with TypeScript
```typescript
interface MyState {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));
```

### React Three Fiber Components
```typescript
import { useFrame, useThree } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useRef } from 'react';

const MyMesh: FC = () => {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });
  
  return <mesh ref={meshRef} />;
}
```

### Custom Hooks
```typescript
function useMyHook(initialValue: number): [number, () => void] {
  const [value, setValue] = useState(initialValue);
  const increment = () => setValue(v => v + 1);
  return [value, increment];
}
```

## 🔧 Troubleshooting

### Import Errors
If you see "Cannot find module" errors:
- Make sure to add `.ts` extension to imports
- Check if file has been migrated to TypeScript
- Verify `tsconfig.json` includes the file

### Type Errors in Three.js
Use the installed type definitions:
```typescript
import * as THREE from 'three';
import type { Mesh, Material, BufferGeometry } from 'three';
```

### Zustand Type Issues
Always provide the state interface:
```typescript
create<StateInterface>((set) => ({ ... }))
```

## 📊 Migration Progress

**Core System:** ✅ 100% Complete  
**Services:** 🟡 50% (2/4 files)  
**Stores:** 🟡 33% (1/3 files)  
**Components:** 🔴 0% (0/72 files)  

**Overall:** 🟢 Phase 1 Complete - System is TypeScript-ready!

## 🚀 Commands

```bash
# Type check without building
npm run type-check  # (add to package.json if needed)
npx tsc --noEmit

# Build production
npm run build

# Start dev server
npm run dev

# Run tests
npm run test
```

## 💡 Tips

1. **Incremental is OK**: No rush to convert everything
2. **JS and TS coexist**: Mixed files work fine
3. **Type any temporarily**: Use `any` for complex types, refine later
4. **Let IDE help**: VS Code will show type errors as you work
5. **Test often**: Build after each file conversion

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Zustand TypeScript Guide](https://github.com/pmndrs/zustand#typescript)
- [React Three Fiber TypeScript](https://docs.pmnd.rs/react-three-fiber/tutorials/typescript)
