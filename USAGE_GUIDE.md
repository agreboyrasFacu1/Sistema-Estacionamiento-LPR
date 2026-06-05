# 🎯 Guía de Uso: Tarifas de Abonos - Panel Administrativo

## Acceso Rápido

```
1. Login como ADMIN
   └─ Email: admin@parking.com
   └─ Password: (cualquiera)

2. Navegar a: Panel de Control → Administración
   └─ URL: http://localhost:5173/admin

3. Seleccionar pestaña: ⭐ "Tarifas de Abonos"
   └─ Ubicación: Barra de tabs superior
```

---

## 📊 Vista General del Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Panel de Administración                                     │
├─────────────────────────────────────────────────────────────┤
│ [$ Precios Vehículos] [⭐ Tarifas de Abonos] [...Logs...] [...Reports...]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Configuración de Tarifas de Abonos                          │
│ Solo administradores pueden modificar estas tarifas         │
│                                                             │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│ │   🚗 AUTO    │  │  🏍️ MOTO    │  │  🚙 CAMIONETA │     │
│ │──────────────│  │──────────────│  │──────────────│      │
│ │ Abono:       │  │ Abono:       │  │ Abono:       │      │
│ │ $150.000/mes │  │ $100.000/mes │  │ $150.000/mes │      │
│ │              │  │              │  │              │      │
│ │ [✏️ Editar]   │  │ [✏️ Editar]   │  │ [✏️ Editar]   │      │
│ └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Flujo de Edición Paso a Paso

### PASO 1: Abrir Modal
```
Usuario hace clic en [✏️ Editar]
            ↓
Modal se abre con formulario de edición
```

### PASO 2: Modal de Edición Trae:
```
┌─────────────────────────────────────────────┐
│ Editar Tarifa de Abono — Abono Mensual - 🚗 │
├─────────────────────────────────────────────┤
│                                             │
│ 🚗 Abono Mensual - Automóvil                │
│ Categoría: Automóvil                        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Precio Abono Mensual (ARS $)            │ │
│ │ [150000_______________________________] │ │
│ │ Precio mensual para abonados            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Precio Base Descuentos (ARS $)          │ │
│ │ [5000________________________________] │ │
│ │ Tarifa base para abonados con % desc... │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Resumen de tarifas:                         │
│ • Abono Mensual: ARS $150.000/mes          │
│ • Base Descuentos: ARS $5.000               │
│                                             │
│ [Cancelar]  [💾 Guardar Cambios]           │
└─────────────────────────────────────────────┘
```

### PASO 3: Guardar
```
Usuario modifica valores y hace clic en [💾 Guardar Cambios]
                        ↓
Validación (no vacío, números válidos)
                        ↓
Guardar en ParkingContext
                        ↓
Mostrar: ✅ "Cambios guardados exitosamente"
                        ↓
Modal se cierra
```

---

## 💰 Campos Editables Explicados

### 1. **Precio Abono Mensual** (Requerido)
- **Descripción**: Precio que pagan los abonados mensualmente
- **Unidad**: ARS $ (pesos argentinos)
- **Ejemplo**: 150000 = ARS $150.000/mes
- **Validación**: Debe ser > 0

### 2. **Precio Base Descuentos** (Opcional)
- **Descripción**: Tarifa base aplicada a abonados con descuento cuando NO tienen acceso al descuento que corresponde
- **Unidad**: ARS $ (pesos argentinos)
- **Ejemplo**: 5000 = tarifa base se aplica al 100%, con descuento se reduce
- **Nota**: Si está vacío, usará la tarifa de estacionamiento normal
- **Use Case**: 
  ```
  Abonado "discounted" con 50% descuento:
  • Sin esta tarifa: paga 100% de tarifa estacionamiento
  • Con esta tarifa: paga 50% de esta base (2500)
  ```

---

## 🔄 Cómo Afectan los Cambios

### Después de Editar Tarifas de Abonos:

#### Impacto en Abonado MENSUAL:
```
✅ Cambio: Modificas monthlyPrice
├─ Los próximos abonados pagaran el nuevo precio
└─ Los actuales: depende de renovación

❌ NO afecta: Acceso al estacionamiento (siempre gratis)
```

#### Impacto en Abonado DESCUENTO:
```
✅ Cambio: Modificas discountedBasePrice
├─ La próxima vez que salga: se aplica nueva base
└─ El descuento % se aplica sobre esta nueva base

Ejemplo:
• Antes: basePrice=$5000, descuento=50%  → cobran $2500
• Editas a: basePrice=$6000, descuento=50% → cobran $3000
```

---

## 📱 Desde el Lado del Usuario (Cajero)

Cuando el cajero registra una salida:

```
Flujo: Salida de Vehículo → Procesamiento de Pago
                    ↓
¿Es abonado mensual?
├─ SÍ (activo) → Pago $0 ✅
├─ VENCIDO   → Paga tarifa normal ✅
│
¿Es abonado con descuento?
├─ SÍ → Se aplica descuento % sobre discountedBasePrice
└─ NO  → Se aplica descuento % sobre tarifa normal
```

---

## ⚙️ Integración Técnica

### En ParkingContext:
```typescript
// Hook para acceder:
const { subscriberPricingRules, updateSubscriberPricingRule } = useParking();

// Actualizar:
updateSubscriberPricingRule({
  id: '1',
  category: 'car',
  name: 'Abono Mensual - Automóvil',
  monthlyPrice: 180000,      // ← Nuevo precio
  discountedBasePrice: 6000   // ← Nueva base
});
```

### En AdminPanel:
```typescript
// Estado local:
const [subscriberFormData, setSubscriberFormData] = 
  useState<Partial<SubscriberPricingRule>>({});

// En handleSave():
if (editingSubscriberRule && !editingRule) {
  updateSubscriberPricingRule({ 
    ...editingSubscriberRule, 
    ...subscriberFormData 
  });
}
```

---

## 🎨 Diferenciación Visual

Para diferenciar de "Tarifas de Vehículos":

| Aspecto | Vehículos | Abonos |
|---------|-----------|--------|
| **Color Tema** | 🔵 Azul | 🟠 Ámbar |
| **Ícono Tab** | 💵 DollarSign | ⭐ Star |
| **Modal Header** | "Editar Tarifa — {nombre}" | "Editar Tarifa de Abono — {nombre}" |
| **Campos** | basePrice, fractionRate | monthlyPrice, discountedBasePrice |

---

## 📋 Checklist Admin Tasks

- [ ] Revisé el precio mensual actual
- [ ] Identificé si necesito aumentar/reducir
- [ ] Edité cada categoría (auto, moto, van)
- [ ] Guardé los cambios
- [ ] Verificué la confirmación visual
- [ ] Comuniqué el nuevo precio a contabilidad

---

## ❓ Preguntas Frecuentes

**P: ¿Afecta los cambios a abonados actuales?**
R: El monthlyPrice solo aplica a renovaciones futuras. Los actuales pagan lo que contrataron.

**P: ¿Puedo tener tarifas iguales para todas las categorías?**
R: Sí, pero debes editarlas individualmente. Se recomienda mantenerlas por categoría para gestión.

**P: ¿Qué pasa si dejo vacío "Precio Base Descuentos"?**
R: El sistema usará la tarifa de estacionamiento normal y aplicará el descuento % sobre eso.

**P: ¿Puedo volver atrás si cambio de idea?**
R: Simplemente vuelve a editar y restaura los valores anteriores. No hay historial automático.

---

**Última actualización**: Junio 5, 2026 | v1.0

