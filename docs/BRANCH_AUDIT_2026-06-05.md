# Auditoria de ramas remotas - Sistema Estacionamiento LPR

## 1. Estado base

- Fecha: 2026-06-05
- Ruta local: `D:\CodeDump\Sistema-Estacionamiento-LPR`
- Remoto: `https://github.com/agreboyrasFacu1/Sistema-Estacionamiento-LPR.git`
- Rama base: `main`
- HEAD main: `34f1725fb9eb510be07ebbed16cb9fc7d6a0f41b`
- origin/main: `34f1725fb9eb510be07ebbed16cb9fc7d6a0f41b`
- Estado working tree previo: limpio, `main...origin/main` = `0 0`
- Validaciones base:
  - typecheck: OK, `npm.cmd run typecheck`
  - tests: OK, `npm.cmd test`, 9 archivos y 37 tests pasados
  - build: OK, `npm.cmd run build`, Vite 6.4.2 compilo `dist/`
  - audit: OK, `npm.cmd audit --audit-level=high`, `found 0 vulnerabilities`

## 2. Ramas remotas encontradas

| Rama | HEAD | Ultimo commit | Ahead | Behind | Estado | Riesgo | Recomendacion |
|---|---|---|---:|---:|---|---|---|
| `origin/RegistrarPatente` | `198c3fb85094b518512f414da19e6df4f4b5ddea` | `feat(lpr): registro de patente y docs` | 0 | 1 | Ya integrada | Bajo | E - no integrar |
| `origin/integration/p0-p1-from-nueva-version-snapshot` | `7b28fe40890aa9f4d05fadc033d559a359010384` | `docs: preserve user manual` | 0 | 19 | Ya absorbida/antigua | Bajo | E - no integrar |
| `origin/nueva-version` | `315b334912535473242307e5277a6c43d7af20b4` | `README actualizado` | 2 | 33 | Divergente, historia separada | Alto | E/C - solo referencia |
| `origin/cambiosNuevosAgus` | `10b1b0dde376c5cc413ed66217a39b391a622080` | `Nueva version con correcciones y mejoras` | 1 | 33 | Divergente, commit raiz | Alto | D - revision humana |
| `origin/Rama-Santi` | `4b70629011fe52108d02769356379449c066021e` | `Arreglo bugs funcionales documentados en nuestro excel...` | 2 | 33 | Divergente, encima de `cambiosNuevosAgus` | Muy alto | D - port manual selectivo |

Notas de interpretacion:

- Los valores `Ahead`/`Behind` provienen de `git rev-list --left-right --count origin/main...<branch>`.
- `Ahead` es la cantidad de commits que tiene la rama remota y no tiene `origin/main`.
- `Behind` es la cantidad de commits que tiene `origin/main` y no tiene la rama remota.
- En las ramas con historia separada, los diffs se evaluaron tambien como comparacion directa de arboles porque `git diff origin/main...<branch>` no tiene merge-base util.

## 3. Analisis por rama

### `origin/RegistrarPatente`

- HEAD: `198c3fb85094b518512f414da19e6df4f4b5ddea`
- Commits unicos: ninguno frente a `origin/main`
- Archivos tocados: sin diff pendiente frente a `origin/main`
- Funcionalidad aparente: registro de patente y documentacion LPR ya incorporados.
- Riesgo tecnico: bajo.
- Riesgo de conflicto: bajo.
- Validacion necesaria: ninguna para integracion; mantener cobertura actual de LPR.
- Recomendacion: no integrar.
- Metodo sugerido: E - no integrar / ya absorbida.
- Nota obligatoria: `origin/RegistrarPatente` ya esta integrada via merge `34f1725`.

### `origin/integration/p0-p1-from-nueva-version-snapshot`

- HEAD: `7b28fe40890aa9f4d05fadc033d559a359010384`
- Commits unicos: ninguno frente a `origin/main`
- Archivos tocados: el diff directo contra `origin/main` muestra una version antigua del arbol, sin aporte util pendiente.
- Funcionalidad aparente: snapshot historico de integracion P0/P1 y preservacion documental.
- Riesgo tecnico: bajo si se deja sin integrar; alto si se intenta reintroducir por ser estado viejo.
- Riesgo de conflicto: medio/alto por antiguedad.
- Validacion necesaria: ninguna para integracion.
- Recomendacion: no integrar.
- Metodo sugerido: E - no integrar / ya absorbida.
- Nota obligatoria: `origin/integration/p0-p1-from-nueva-version-snapshot` no aporta cambios utiles frente a `main`.

### `origin/nueva-version`

- HEAD: `315b334912535473242307e5277a6c43d7af20b4`
- Commits unicos:
  - `315b3349 README actualizado`
  - `69ab1988 Nueva version del sistema LPR`
- Archivos tocados: 48 archivos, 846 inserciones y 3815 eliminaciones, excluyendo `node_modules/` y `dist/`.
- Funcionalidad aparente: version alternativa anterior del frontend LPR, con cambios en pantallas, contexto de estacionamiento, autenticacion, dependencias y README.
- Riesgo tecnico: alto. El diff elimina tests de dominio, storage, utilidades y configuraciones actuales.
- Riesgo de conflicto: alto. Toca `package.json`, `package-lock.json`, `ParkingContext`, `AuthContext`, pricing, storage, LPR, abonados e ingreso/egreso.
- Validacion necesaria: no validar como rama integrable; usar solo como referencia historica si se necesita comparar decisiones viejas.
- Recomendacion: no mergear directamente.
- Metodo sugerido: E/C - no integrar; si alguna idea se rescata, rehacer manualmente en commits atomicos sobre `main`.

### `origin/cambiosNuevosAgus`

- HEAD: `10b1b0dde376c5cc413ed66217a39b391a622080`
- Commits unicos:
  - `10b1b0dd Nueva version con correcciones y mejoras`
- Archivos tocados: 54 archivos, 2190 inserciones y 10285 eliminaciones, excluyendo `node_modules/` y `dist/`.
- Funcionalidad aparente: nueva version con correcciones de flujos de estacionamiento, cambios de UI y cambios en abonados/ingreso/egreso.
- Riesgo tecnico: alto. Es un commit raiz divergente, no una rama construida sobre `main`.
- Riesgo de conflicto: alto. Toca dependencias, elimina scripts `test`/`typecheck`, baja `react-router` de `7.16.0` a `7.13.0`, baja Vite, elimina tests y remueve `tesseract.js` en variantes cercanas.
- Validacion necesaria: revision humana de intencion funcional; no ejecutar merge directo.
- Recomendacion: no mergear directamente.
- Metodo sugerido: D - revision humana requerida; si hay funcionalidades utiles, rehacer manualmente sobre `main`.

### `origin/Rama-Santi`

- HEAD: `4b70629011fe52108d02769356379449c066021e`
- Commits unicos:
  - `4b706290 Arreglo bugs funcionales documentados en nuestro excel, cobro de abonos, correcciones del flag de vencido y activo...`
  - `10b1b0dd Nueva version con correcciones y mejoras`
- Archivos tocados: 65 archivos, 3767 inserciones y 10429 eliminaciones, excluyendo `node_modules/` y `dist/`.
- Funcionalidad aparente: cobro y renovacion de abonos, correcciones de abonados activos/vencidos, cobro normal a ex-abonados, salida sin cargo para estadias cortas, pago mixto y ajustes de UI de ingreso/egreso.
- Riesgo tecnico: muy alto. La rama trae cambios utiles mezclados con perdida de arquitectura actual, artefactos y cambios no integrables.
- Riesgo de conflicto: muy alto. Toca `ParkingContext`, `AuthContext`, `VehicleEntry`, `VehicleExit`, `Subscribers`, tipos, mock data, dependencias y documentos. Tambien agrega o arrastra `node_modules/`, `dist/`, `.idea/`, `_env.local`, backend/modelos JS sueltos y vistas HTML.
- Validacion necesaria: revisar manualmente los flujos funcionales de abonados y pagos, reimplementar por partes, y agregar tests antes de incorporar cada comportamiento.
- Recomendacion: no mergear directamente. Usarla como fuente principal de ideas funcionales, no como rama integrable.
- Metodo sugerido: D - revision humana requerida; port manual selectivo en commits atomicos sobre `main`.

## 4. Orden recomendado de integracion

1. No integrar `origin/RegistrarPatente`: ya esta integrada via merge `34f1725`.
2. No integrar `origin/integration/p0-p1-from-nueva-version-snapshot`: no aporta cambios utiles frente a `main`.
3. No integrar `origin/nueva-version`: conservar solo como referencia historica.
4. Revisar `origin/cambiosNuevosAgus` solo para entender el commit base compartido por `Rama-Santi`.
5. Usar `origin/Rama-Santi` como fuente de ideas funcionales, pero portarlas manualmente sobre `main` en commits atomicos y con tests.

## 5. Ramas que no deberian integrarse

- `origin/RegistrarPatente`: ya absorbida por `main`.
- `origin/integration/p0-p1-from-nueva-version-snapshot`: rama antigua/absorbida, sin cambios utiles pendientes.
- `origin/nueva-version`: historia separada y estado viejo; no mergear.
- `origin/cambiosNuevosAgus`: commit raiz divergente; no mergear directamente.
- `origin/Rama-Santi`: no mergear directamente; contiene ideas utiles mezcladas con artefactos y regresiones.

## 6. Hard stops para fase de integracion

- No usar `--allow-unrelated-histories`.
- No traer `node_modules/`, `dist/`, `.idea/`, `_env.local` ni artefactos generados.
- No aceptar downgrades de dependencias, especialmente `react-router`, `vite`, TypeScript, Vitest o remocion de `tesseract.js`.
- No eliminar scripts `test` o `typecheck`.
- No eliminar tests de dominio, storage, tickets, LPR, pricing, abonados o permisos.
- No reemplazar `ParkingContext` con una version que pierda persistencia en `localStorage`, tickets internos, marcha blanca, metricas LPR o validaciones actuales.
- No integrar cambios sobre pricing, auth, storage, abonados o cobros sin tests.

## 7. Comandos sugeridos para fase siguiente

```powershell
git fetch --all --prune
git status --short --branch
git rev-list --left-right --count main...origin/main
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd audit --audit-level=high
```

Para portar ideas de `Rama-Santi`, hacerlo en ramas nuevas basadas en `main`, por ejemplo:

```powershell
git switch main
git pull --ff-only origin main
git switch -c integration/abonados-pagos-manual-port
```

Luego implementar manualmente por commits atomicos:

1. Modelo/reglas de estado efectivo de abonados vencidos.
2. Cobro o renovacion de abonos con ticket interno/demo.
3. Pago mixto en egreso.
4. Salida sin cargo para estadias cortas, si el producto lo confirma.
5. Tests de dominio y UI minima para cada flujo.

## 8. Conclusion

- `main` esta sano y alineado con `origin/main`.
- Las validaciones base pasan: typecheck, tests, build y audit.
- No hay ramas remotas listas para merge directo.
- Las ramas ya absorbidas deben quedar sin tocar.
- Las ramas divergentes no deben mergearse directamente y no se debe usar `--allow-unrelated-histories`.
- La unica candidata con ideas funcionales aprovechables es `origin/Rama-Santi`, pero debe portarse manualmente sobre `main`, en commits atomicos y con tests, evitando artefactos, downgrades y regresiones de arquitectura.
