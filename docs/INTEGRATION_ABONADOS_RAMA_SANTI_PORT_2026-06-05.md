# Integracion manual de mejoras de abonados desde Rama-Santi

## Resumen

- Fecha: 2026-06-05
- Rama base: `main`
- Rama de trabajo: `integration/abonados-rama-santi-port`
- Rama usada como referencia: `origin/Rama-Santi`
- Metodo: port manual selectivo, sin merge directo y sin cherry-pick.

## Funcionalidades portadas

- Estado efectivo de abonados:
  - activo;
  - vencido;
  - inactivo.
- Cobro normal a abonados mensuales vencidos o inactivos.
- Renovacion de abonos mensuales por ARS 150.000.
- Extension de vigencia por 30 dias:
  - desde el vencimiento actual si el abono sigue vigente;
  - desde el momento de renovacion si esta vencido o inactivo.
- Ticket interno no fiscal de renovacion con prefijo `ABN`.
- Pago mixto compatible con efectivo y tarjeta.
- Persistencia del desglose de pago mixto en tickets internos.
- Mejoras visuales acotadas en abonados, egreso, ingreso y ticket interno.

## Cambios rechazados

- No se integro `origin/Rama-Santi` completa.
- No se uso `--allow-unrelated-histories`.
- No se copiaron `node_modules/`, `dist/`, `.idea/`, `_env.local` ni artefactos.
- No se copiaron `package.json` ni `package-lock.json` desde `Rama-Santi`.
- No se aceptaron downgrades de dependencias.
- No se migraron categorias a ingles.
- No se reemplazo `ParkingContext` completo.
- No se elimino persistencia local, tickets, marcha blanca, LPR, permisos ni tests.
- No se implemento salida sin cargo por estadia corta ni tolerancia inicial sin cargo.

## Reglas preservadas

- Categorias: `auto`, `camioneta`, `moto`.
- Moneda: ARS.
- Auto/Camioneta: primera hora $5.000 y fraccion posterior de $500 cada 10 minutos.
- Moto: primera hora $3.000 y fraccion posterior de $300 cada 10 minutos.
- Abono mensual operativo de referencia: $150.000.
- Ticket interno de control, no fiscal.
- Sin AFIP, sin facturacion fiscal y sin app de clientes finales.
- Tolerancia vigente: 3 minutos posteriores al pago para confirmar egreso.

## Validaciones previstas

- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `npm.cmd audit --audit-level=high`
- `git diff --check`
- `git status --short --branch --untracked-files=all`

## Riesgos pendientes

- Los tickets de renovacion son internos/demo y no representan facturacion fiscal.
- El flujo sigue usando `localStorage`; una fase futura debe migrar a backend local + SQLite.
- La UI hereda textos con mojibake existentes que deben corregirse en una tarea separada.
