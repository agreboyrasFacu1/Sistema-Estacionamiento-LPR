# TODO — Deuda técnica y pendientes conocidos

## Estado general

El proyecto se encuentra en estado `MVP frontend persistente / demo local`, no producción.

## Pendientes críticos/altos postergados

### Git y release
- [ ] Confirmar integración contra `origin/main`.
- [ ] Subir cambios mediante commits atómicos y trazables.
- [ ] Evitar push directo sin revisión.

### Reglas de negocio/UI
- [ ] Verificar que no queden referencias a tiempo inicial sin cargo, banderas legacy de salida sin cargo, `tolerancia inicial` o conceptos equivalentes.
- [ ] Validar manualmente pricing: 60, 61, 70 y 71 minutos.
- [ ] Verificar que no queden artefactos de encoding/mojibake en pantallas operativas, administracion o tickets.
- [ ] Mantener montos ARS alineados en mock data, defaults de administracion y documentacion: Auto/Camioneta $5.000 + $500 cada 10 minutos; Moto $3.000 + $300 cada 10 minutos; abono mensual $150.000.
- [x] Corregir seeds egresados demo para que `Ingresos Hoy` refleje ARS 12.800 con tarifas canonicas.
- [x] Centralizar formateo monetario ARS en dashboard, salidas, tickets, busqueda y administracion.
- [ ] En fase backend/configuracion, reemplazar tarifas hardcodeadas de datos demo/defaults por configuracion administrable y persistente.

### Marcha blanca
- [ ] Implementar UI real para monto manual vs monto sistema.
- [ ] Registrar diferencias e incidencias consultables.
- [ ] Permitir evidencia/exportación básica de estabilización.
- [ ] No declarar marcha blanca completa hasta cerrar este punto.

### LPR
- [x] Integrar `CameraModal` con `LprProvider`.
- [x] Agregar modo webcam local demo con `getUserMedia`, preview, captura y deteccion simulada.
- [x] Agregar correccion manual visible de patente detectada y registrar `LPRCorrection`.
- [x] Documentar que P2.3 no implementa OCR productivo ni precision real >=95%.
- [ ] Exponer métrica de accuracy/correcciones.
- [ ] Preparar integración futura con cámara IP real.
- [ ] Validar objetivo de precisión >= 95% con dataset o muestra controlada.

### Tests
- [ ] Agregar tests para `plates`.
- [ ] Agregar tests para `permissions`.
- [ ] Agregar tests para `tickets`.
- [ ] Agregar tests para búsqueda por ticket.
- [x] Agregar tests para LPR demo provider y accuracy de correcciones.
- [x] Agregar tests de storage reset/versionado demo.
- [ ] Agregar tests de storage corrupto/fallback.
- [ ] Agregar prueba de flujo pago → tolerancia 3 min → egreso.
- [ ] Agregar o mantener cobertura de pricing con montos ARS canonicos.

### Seguridad
- [ ] Migrar auth demo client-side a backend local.
- [ ] No almacenar passwords plaintext.
- [ ] Implementar hash de contraseñas.
- [ ] Mantener roles protegidos server-side en fase backend.

### Persistencia
- [x] Agregar versionado de localStorage demo para evitar datos viejos incompatibles con nuevos seeds.
- [x] Implementar reset seguro de datos demo con confirmacion y alcance claro.
- [ ] Reemplazar `localStorage` por backend local + SQLite.
- [ ] Agregar migraciones versionadas.
- [ ] Definir backup/restore de base local.
- [ ] Modelar facturacion real del abono mensual; hoy el MVP solo usa el estado de abonado activo para bypass operativo de cobro.

### Arquitectura
- [ ] Reducir responsabilidades de `ParkingContext`.
- [ ] Separar servicios de pagos, tickets, logs, estadías, abonados y LPR.
- [ ] Mantener dominio puro testeable.

### Documentación
- [ ] Alinear README, manual y plan con implementación real.
- [x] Documentar procedimiento de reset demo y limitaciones de webcam LPR sin OCR real.
- [ ] Documentar claramente que es demo, que es parcial y que queda fuera de alcance.

*Nota: Estos puntos provienen de la auditoría post-implementación y del Prompt para Codex — Corrección controlada de hallazgos críticos y altos post-implementación.*
