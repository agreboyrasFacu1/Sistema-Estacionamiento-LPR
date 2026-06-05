# AGENTS.md: Sistema de Estacionamiento LPR

**AI Agent Guide for Parking License Plate Recognition System**

## Project Overview

A React TypeScript SPA for managing parking access, vehicle entry/exit, subscriber billing, and payment processing. Powered by **Vite + React Router + Tailwind CSS + Radix UI component library**.

**Core Domain**: Parking lot cashier & admin workflows with vehicle tracking, pricing, and subscriber management.

---

## Architecture & Data Flow

### State Management: React Context (No Redux)

Two provider contexts wrap the entire app in `src/app/App.tsx`:

1. **AuthContext** (`src/app/contexts/AuthContext.tsx`)
   - Single user object with role (`cashier` | `admin`)
   - `login()`: validates against `MOCK_USERS` with 500ms delay
   - `logout()`: clears user state
   - **Pattern**: Throw error if `useAuth()` called outside provider

2. **ParkingContext** (`src/app/contexts/ParkingContext.tsx`) — **THE CENTRAL HUB**
   - manages: vehicles, logs, pricing rules, subscribers, LPR detections
   - **Key methods** (study these):
     - `addVehicleEntry(plate, category)`: checks for duplicates, checks subscribers, creates entry record
     - `processExit(vehicleId, paymentMethod, paymentSplit?)`: calculates fees considering:
       - **Free exits**: ≤5 min duration
       - **Active monthly subscribers**: 100% free pass (even if expired = normal charge)
       - **Discounted subscribers**: apply discount % to calculated fee
     - `hasActiveSubscription(plate)`: checks if plate has non-expired monthly subscription
     - `getSubscriberByPlate(plate)`: searches primary + additionalPlates
   - All state changes trigger recalculated dashboard stats (vehicles inside, today entries, revenue, avg duration)

### Type System: Single Source of Truth

**`src/app/types.ts`** defines all domain models:
- `User`, `VehicleEntry`, `VehicleCategory` (car|motorcycle|van)
- `Subscriber` (monthly|discounted types, expiryDate for monthly)
- `PricingRule` (basePrice + fractionRate per 10-min block, maxFractions=5)
- `SystemLog` (entry|exit|payment|error|manual|system types)
- `LPRDetection` (plate, confidence, isValid)

---

## Critical Business Rules

### Pricing Calculation (`mockData.ts:calculateParkingFee`)
- First full hour: `basePrice`
- After 1st hour: charged in `fraction` blocks (10 min = 1 unit)
- Charged at `fractionRate` per block
- Max `maxFractions` blocks before full hour charged (e.g., 5 blocks = 50 min, next minute = new hour)
- **Never charge if**: <5 min duration OR active monthly subscriber

### Subscriber Status Logic (`mockData.ts:getEffectiveSubscriberStatus`)
- Monthly subscribers: `expiryDate` determines `active` vs `expired`
- Discounted subscribers: always `active` if `status === 'active'`
- **At exit**: expired monthly subscribers charged normal rate, NOT free pass

### Vehicle Entry Validation
- Check duplicate plate in active vehicles (no duplicate same-day entries allowed)
- Auto-detect subscriber by plate match (primary or additionalPlates)
- Validate plate format: `ABC123` (old) or `AB123CD` (new)

---

## File Organization & Patterns

### Pages (`src/app/pages/`)
Each page is a full workflow screen with local state for form control:
- **VehicleEntry.tsx** (430 lines): camera + manual plate input, category selection, validation
- **VehicleExit.tsx**: find vehicle by plate, select payment method, process charge, receipt
- **AdminPanel.tsx**: pricing rules editor, subscriber dashboard
- **Subscribers.tsx**: create/edit/delete subscriber (CRUD)
- **Dashboard.tsx**: real-time stats, active vehicles list, recent logs, quick-access LPR detection

### Components (`src/app/components/`)
- **CameraModal.tsx** (594 lines): full camera workflow—request access → live feed → OCR (Tesseract.js) → plate extraction → confirmation
- **Layout.tsx**: navigation shell with role-based menu filtering (`cashier` vs `admin`)
- **LPRSimulator.tsx**: dev helper for testing LPR detection without camera
- **TicketModal.tsx**: receipt display after exit

### Data & Utilities (`src/app/data/mockData.ts`)
All mock data centralized:
- `MOCK_USERS`, `MOCK_VEHICLES`, `MOCK_SUBSCRIBERS`, `SIMULATED_PLATES`
- `PRICING_RULES` (ARS currency)
- Helper functions: `validatePlate()`, `translateCategory()`, `formatCurrency()`, `calculateParkingFee()`

### Styling
- **Tailwind CSS 4.1.12** with `@tailwindcss/vite` plugin
- No inline CSS; all utility classes
- Theme: light mode, gray scale + blue/red accents
- Icons: **Lucide React** (1.2rem base size)
- UI Components: **Radix UI** (full suite pre-installed)

---

## Development Workflow

### Setup & Running
```bash
npm install  # Or pnpm install (pnpm-workspace.yaml)
npm run dev  # Vite dev server on localhost:5173
npm run build # Production build
```

Vite config alias: `@` → `src/` (use for imports in components)

### Testing Strategy
- **No unit tests yet** (Vitest is in package.json but unused)
- Heavy reliance on mock data and manual QA
- Camera/OCR depends on browser API (requestAnimationFrame, Canvas, MediaDevices)

### Debugging Tips
- All vehicle/log/subscriber mutations go through ParkingContext
- React DevTools: trace context updates for state changes
- Network: mock data only, no API calls yet
- Terminal: Vite logs all HMR updates

---

## Common AI Agent Tasks

### Adding a New Page
1. Create file in `src/app/pages/YourPage.tsx`
2. Import `useParking()` and `useAuth()` contexts as needed
3. Call `useNavigate()` from react-router for navigation
4. Use Radix UI buttons/inputs + Lucide icons + Tailwind classes
5. Add route to `src/app/routes.tsx` (wrap in `<ProtectedRoute>` if admin-only)
6. Add nav item to `Layout.tsx` navItems array with role filter

### Adding Subscriber Field
1. Extend `Subscriber` interface in `types.ts`
2. Update `MOCK_SUBSCRIBERS` in `mockData.ts`
3. Update form in `Subscribers.tsx` and `AdminPanel.tsx`
4. Pass new field to `addSubscriber()` / `updateSubscriber()` in ParkingContext

### Integrating Real Backend
1. Replace ParkingContext mock methods with API calls (fetch/axios)
2. Keep mock data for fallback/demo
3. AuthContext `login()` → POST `/api/auth/login`
4. ParkingContext methods → REST endpoints: `/api/vehicles`, `/api/subscribers`, `/api/pricing`
5. Add error handling via toast notifications (`sonner` library)

### Modifying Pricing
**Scenario**: Change "first 30 min free" rule:
1. Edit `calculateParkingFee()` in `mockData.ts`
2. Update `PRICING_RULES` constants if structure changes
3. Test in `AdminPanel.tsx` pricing editor UI
4. All exits automatically recalculate via `processExit()`

### Adding Form Validation
- Use **react-hook-form** (installed but no examples yet)
- Form errors stored in page component local state (see `VehicleEntry.tsx: plateError`)
- Display errors via `sonner` toast or inline UI alerts (red backgrounds)
- Always validate before calling ParkingContext methods

---

## Conventions & Code Style

### Naming & Language
- **Spanish UI text**: placeholders, labels, error messages (e.g., "Patente", "Abonado")
- **English code**: function names, types, comments
- Routes: kebab-case (`/admin/users`, `/vehicle-entry`)
- Components: PascalCase exports

### Component Structure
```tsx
// Always at top
import React from 'react';
import { useParking } from '../contexts/ParkingContext'; // Contexts first
import { SomeIcon } from 'lucide-react'; // Then icons
import { SomeType } from '../types'; // Then types

export const ComponentName: React.FC = () => {
  // Hooks at top
  const { parking, methods } = useParking();
  const [localState, setLocalState] = useState(null);
  
  // Event handlers
  const handleClick = () => { ... };
  
  // Render
  return (
    <div className="...">
      {/* Tailwind utility classes, no inline styles */}
    </div>
  );
};
```

### Keyboard Events
- Use numpad/keypress for quick plate entry (see CameraModal line 400+ for example)
- Tab key: standard form navigation
- Enter key: confirm/submit actions

### Error Handling
- **Catch blocks**: log to console, show `toast.error()` to user
- **Validation**: return early with error state, don't throw
- **Network errors** (future): retry logic + fallback to mock data

### Commit Message Convention
- Prefix with feature area: `[LPR]`, `[Pricing]`, `[Subscribers]`, `[Auth]`
- Example: `[LPR] improve plate detection confidence threshold`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/App.tsx` | Entry point, context wrapping |
| `src/app/routes.tsx` | Route definitions, ProtectedRoute wrapper |
| `src/app/contexts/ParkingContext.tsx` | Central state & business logic |
| `src/app/contexts/AuthContext.tsx` | User authentication state |
| `src/app/types.ts` | TypeScript interfaces (single source of truth) |
| `src/app/data/mockData.ts` | All mock data + utility functions |
| `src/app/pages/*.tsx` | Workflow screens (VehicleEntry, Exit, etc.) |
| `src/app/components/Layout.tsx` | Navigation shell + header |
| `src/app/components/CameraModal.tsx` | Camera + OCR workflow |
| `vite.config.ts` | Vite plugins + @ alias |
| `package.json` | Dependencies + build scripts |

---

## Integration Points (Future Backend)

- **Auth**: Replace `MOCK_USERS` with JWT login flow
- **Vehicles API**: GET (search, list) + POST (entry) + PATCH (exit)
- **Subscribers API**: Full CRUD at `/api/subscribers`
- **Pricing**: Admin can update rules via API (currently local mock)
- **Logs**: Stream real-time updates via WebSocket or polling
- **Payment Gateway**: Integrate stripe/mercado-pago for card payments

---

## Performance & Browser Compatibility

- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Camera access**: Requires HTTPS in production (http://localhost works in dev)
- **OCR**: Tesseract.js runs in worker thread (avoid blocking main thread)
- **Large vehicle lists**: Filter/paginate in Dashboard if >1000 vehicles
- **Locale**: Spanish date/currency formatting via `toLocaleString('es-AR')` or `es-CL`

---

**Last Updated**: June 2026 | **Stack**: React 18 + TypeScript + Vite 6 + Tailwind 4

