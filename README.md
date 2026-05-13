# Sistema Automatizado de Control de Acceso y Cobro Interno LPR

Proyecto academico/profesional para una sede de estacionamiento con control de ingreso, egreso, cobro interno no fiscal, abonados, tickets internos y simulacion LPR.

## Estado actual

El sistema fue refactorizado desde prototipo visual hacia un MVP frontend persistente:

- React + Vite + TypeScript.
- Datos persistidos en `localStorage` mediante un adaptador reemplazable.
- Reglas de negocio extraidas a modulos de dominio.
- Rutas protegidas por sesion y rol.
- Ticket interno persistente por operacion.
- Simulador LPR con objetivo de precision documentado.
- Preparacion inicial para marcha blanca mediante incidencias y diferencias.

## Reglas de negocio vigentes

- Categorias estrictas: Auto, Camioneta y Moto.
- Moneda operativa: pesos argentinos (ARS).
- El cobro base cubre la primera hora completa.
- Auto y Camioneta: primera hora $5.000, fraccion posterior de 10 minutos $500, equivalente posterior $3.000/h.
- Moto: primera hora $3.000, fraccion posterior de 10 minutos $300, equivalente posterior $1.800/h.
- Luego de la primera hora, el cobro fracciona automaticamente cada 10 minutos.
- La tolerancia es de 3 minutos posteriores al pago para confirmar el egreso.
- La tolerancia no es tiempo sin cargo desde el ingreso.
- Los abonados mensuales activos y no vencidos tienen salida sin cobro.
- Abono mensual operativo de referencia: $150.000.
- Los abonados vencidos o inactivos no tienen bypass de cobro.
- El ticket emitido es interno de control, no fiscal.

## Credenciales demo

- Cajero: `cajero@parking.com` / `demo`
- Administrador: `admin@parking.com` / `demo`

Las contrasenas se validan en el contexto local de la app y pueden administrarse desde Usuarios.

## Scripts

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

## Arquitectura

- `src/app/domain`: reglas puras de pricing, estadias, patentes, abonados, tickets, permisos, LPR y marcha blanca.
- `src/app/services/storage.ts`: adaptador de persistencia local. Es el punto a reemplazar por API/SQLite.
- `src/app/contexts/AuthContext.tsx`: sesion, usuarios, credenciales y modo entrenamiento/marcha blanca.
- `src/app/contexts/ParkingContext.tsx`: orquestacion de operaciones, storage, logs, tickets e incidencias.
- `src/app/pages`: pantallas operativas y administrativas.

## Validacion realizada

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit --audit-level=high`

Resultado: build correcto con Vite 6.4.2 y 0 vulnerabilidades altas reportadas por `npm audit`.

## Alcance no incluido

- AFIP.
- Facturacion fiscal.
- App para clientes finales.
- Multiples sucursales.
- BI avanzado.
- Reporteria gerencial compleja.

## Siguiente evolucion recomendada

Para operacion on-premise real, reemplazar el adaptador `localStorage` por un backend local Node/Express con SQLite y migraciones versionadas.
