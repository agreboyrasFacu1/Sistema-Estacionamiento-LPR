# Sistema Automatizado de Control de Acceso y Cobro Interno LPR

Proyecto academico/profesional para una sede de estacionamiento con control de ingreso, egreso, cobro interno no fiscal, abonados, tickets internos y simulacion LPR.

## Estado actual

El sistema fue refactorizado desde prototipo visual hacia un MVP frontend persistente:

- React + Vite + TypeScript.
- Datos persistidos en `localStorage` mediante un adaptador reemplazable.
- Reglas de negocio extraidas a modulos de dominio.
- Rutas protegidas por sesion y rol.
- Ticket interno persistente por operacion.
- Formateo monetario centralizado para pesos argentinos (ARS).
- Reset seguro de datos demo desde Administracion para limpiar localStorage del prefijo `parking-lpr`.
- Camara LPR con proveedor ALPR configurable y OCR local de respaldo.
- Preparacion inicial para marcha blanca mediante incidencias y diferencias.

## Reglas de negocio vigentes

- Categorias estrictas: Auto, Camioneta y Moto.
- Moneda operativa: pesos argentinos (ARS).
- El cobro base cubre la primera hora completa.
- Auto y Camioneta: primera hora $5.000, fraccion posterior default de 10 minutos $750 (15% de la hora inicial, modificable).
- Moto: primera hora $3.000, fraccion posterior default de 10 minutos $450 (15% de la hora inicial, modificable).
- Luego de la primera hora, el cobro fracciona automaticamente cada 10 minutos.
- La tolerancia es de 3 minutos posteriores al pago para confirmar el egreso.
- No hay regla de salida sin cargo por estadia corta: desde el primer minuto se cobra la hora inicial.
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

## Ejecución local rápida

Windows:

```powershell
.\scripts\run-local.ps1
```

Docker:

```powershell
docker compose up --build
```

Guía completa: `docs/RUN_LOCAL.md`

## Configuracion LPR

La camara intenta leer patentes con Plate Recognizer Snapshot si existe un token configurado. Cree un archivo `.env.local` a partir de `.env.example` y complete:

```bash
VITE_PLATE_RECOGNIZER_TOKEN=su_token
VITE_PLATE_RECOGNIZER_ENDPOINT=https://api.platerecognizer.com/v1/plate-reader/
VITE_PLATE_RECOGNIZER_REGIONS=ar
```

Si no hay token o el servicio no responde, el sistema mantiene OCR local como respaldo para no interrumpir el flujo operativo.

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

## Modo demo y webcam local

La camara LPR puede usar Plate Recognizer Snapshot para reconocimiento especifico de patentes desde imagen. Cuando no hay token configurado, o ante fallos puntuales del servicio, se usa OCR local como respaldo y el cajero conserva la posibilidad de correccion manual.

Si los datos locales quedan contaminados por pruebas anteriores, el administrador puede usar `Reset demo` desde Administracion. El reset solo borra claves del prefijo `parking-lpr` y recarga los seeds vigentes.

## Siguiente evolucion recomendada

Para operacion on-premise real, reemplazar el adaptador `localStorage` por un backend local Node/Express con SQLite y migraciones versionadas.
