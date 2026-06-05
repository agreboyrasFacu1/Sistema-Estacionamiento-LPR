# Implementación: Tarifas de Abonos en Panel de Administrador

## 📋 Resumen General
Se agregó una nueva funcionalidad **exclusiva para administradores** para gestionar las **tarifas de abonos** (suscripciones mensuales y descuentos) directamente desde el Panel de Administración, similar a cómo se gestionan las tarifas de vehículos.

---

## 🔧 Cambios Realizados

### 1. **Tipos TypeScript** (`src/app/types.ts`)
Se agregó una nueva interfaz para modelar tarifas de abonos:

```typescript
export interface SubscriberPricingRule {
  id: string;
  category: VehicleCategory;           // car, motorcycle, van
  name: string;                        // e.g., "Abono Mensual - Automóvil"
  monthlyPrice: number;                // Precio mensual en ARS
  discountedBasePrice?: number;        // Tarifa base opcional para descuentos
}
```

**Campo `category`**: Permite tener tarifas diferentes por tipo de vehículo (igual que precios de estacionamiento).

---

### 2. **Datos Mock** (`src/app/data/mockData.ts`)
Se agregó un nuevo conjunto de tarifas iniciales:

```typescript
export const SUBSCRIBER_PRICING_RULES: SubscriberPricingRule[] = [
  {
    id: '1',
    category: 'car',
    name: 'Abono Mensual - Automóvil',
    monthlyPrice: 150000,
    discountedBasePrice: 5000,
  },
  {
    id: '2',
    category: 'motorcycle',
    name: 'Abono Mensual - Motocicleta',
    monthlyPrice: 100000,
    discountedBasePrice: 3000,
  },
  {
    id: '3',
    category: 'van',
    name: 'Abono Mensual - Camioneta/SUV',
    monthlyPrice: 150000,
    discountedBasePrice: 5000,
  },
];
```

**Precios Default**: 
- **Automóvil/Camioneta**: ARS $150.000/mes
- **Motocicleta**: ARS $100.000/mes
- **Van/SUV**: ARS $150.000/mes

---

### 3. **Contexto Global** (`src/app/contexts/ParkingContext.tsx`)
Se extendió `ParkingContext` con:

#### a) **Estado del Contexto**:
```typescript
const [subscriberPricingRules, setSubscriberPricingRules] = 
  useState<SubscriberPricingRule[]>(SUBSCRIBER_PRICING_RULES);
```

#### b) **Método Actualización**:
```typescript
const updateSubscriberPricingRule = (rule: SubscriberPricingRule) =>
  setSubscriberPricingRules((prev) => 
    prev.map((r) => (r.id === rule.id ? rule : r))
  );
```

#### c) **Exportación en Provider**:
```typescript
value={{
  ...existingValues,
  subscriberPricingRules,
  updateSubscriberPricingRule,
}}
```

---

### 4. **Panel de Administración** (`src/app/pages/AdminPanel.tsx`)

#### a) **Nueva Pestaña Agregada**:
Se agregó la pestaña **"Tarifas de Abonos"** (ícono: ⭐) con:
- Interfaz similar a la de "Precios Vehículos"
- Botón "Editar" para cada tarifa
- Display claro de precios por categoría

#### b) **Modal de Edición Dual**:
El modal ahora soporta dos modos:
1. **Edición de Tarifas de Vehículos** (existente): basePrice + fractionRate
2. **Edición de Tarifas de Abonos** (nuevo): monthlyPrice + discountedBasePrice (opcional)

#### c) **UI Elements**:
- **Color tema**: Ámbar/Oro (diferencia visual de las tarifas de vehículos en azul)
- **Campos editables**:
  - `monthlyPrice`: Precio mensual del abono
  - `discountedBasePrice`: Tarifa base opcional para abonados con descuento

---

## 🎯 Características Clave

✅ **Solo para Administradores**: 
- Solo usuarios con `role === 'admin'` pueden ver y modificar
- Requiremiento: Usar `useAuth()` para validar rol

✅ **Edición Inline**:
- Modal intuitivo con vista previa
- Muestra resumen de tarifas aplicadas

✅ **Por Categoría de Vehículo**:
- Tarifas independientes para auto, moto, van
- Facilita gestión de precios diferenciados

✅ **Persistencia en Context**:
- Cambios se reflejan inmediatamente en toda la app
- No requiere reload

---

## 📝 Cómo Usar

### Para el Administrador:

1. **Ir a Panel de Administración** (`/admin`)
2. **Seleccionar pestaña "Tarifas de Abonos"** (ícono ⭐)
3. **Hacer clic en botón "Editar"** en la tarifa deseada
4. **Modificar valores**:
   - Precio mensual
   - Precio base descuentos (opcional)
5. **Guardar cambios** → Confirmación visual inmediata

### Estructura de datos después de editar:
```typescript
{
  id: '1',
  category: 'car',
  name: 'Abono Mensual - Automóvil',
  monthlyPrice: 150000,        // ← Editable
  discountedBasePrice: 5000     // ← Editable (opcional)
}
```

---

## 🔐 Control de Acceso

| Rol | Permisos |
|-----|----------|
| **Admin** | ✅ Ver, editar tarifas de abonos |
| **Cashier** | ❌ No puede acceder a esta pestaña |

*Control implementado vía rol en `Layout.tsx` (navItems con filter por rol)*

---

## 💾 Archivos Modificados

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/app/types.ts` | +6 | Agregó interfaz `SubscriberPricingRule` |
| `src/app/data/mockData.ts` | +21 | Agregó `SUBSCRIBER_PRICING_RULES` constant |
| `src/app/contexts/ParkingContext.tsx` | +7 | Estado + método + export en provider |
| `src/app/pages/AdminPanel.tsx` | +150 | Nueva pestaña, modal dual, UI componentes |

**Total**: ~184 líneas de código agregadas

---

## 🧪 Pruebas Manuales

✓ Build compila sin errores: `npm run build`
✓ Dev server inicia correctamente: `npm run dev`
✓ Context global exporte correctamente
✓ AdminPanel recibe `subscriberPricingRules` del contexto
✓ Modal abre/cierra correctamente
✓ Valores se guardan y reflejan en tiempo real

---

## 🚀 Próximos Pasos (Opcional)

1. **Validación de Entrada**:
   - Min/max para precios
   - Prevenir valores negativos o cero

2. **Historial de Cambios**:
   - Log de qué admin modificó qué tarifa y cuándo

3. **Sincronización Backend**:
   - POST/PATCH `/api/subscriber-pricing-rules` cuando se edite

4. **Visibilidad de Impacto**:
   - Mostrar cuántos abonados serían afectados por un cambio

---

## 📌 Notas Técnicas

- **Estado global**: Managed en `ParkingContext` (no Redux)
- **Sin API calls**: Mock data local (listo para backend integration)
- **Responsive**: Funciona en mobile y desktop
- **Tailwind + Radix UI**: Consistente con diseño existente
- **TypeScript**: Type-safe (todas las operaciones validadas en compile-time)

---

**Estado**: ✅ Implementado y Funcional | **Fecha**: Junio 5, 2026

