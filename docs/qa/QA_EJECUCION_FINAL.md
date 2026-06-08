# Ejecucion QA final

Ejecute desde la raiz del repositorio:

```powershell
.\scripts\run-qa-metrics.ps1
```

El script corre:

- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`

Tambien registra rama Git, commit HEAD, estado Git, versiones de Node/npm y un resumen visual por indicador.

## Evidencia generada

Cada corrida crea una carpeta local:

```txt
artifacts/qa-metrics/<timestamp>/
```

Archivos generados:

- `qa-report.md`: reporte listo para copiar a Excel/PPTX.
- `qa-report.json`: estructura parseable para auditoria.
- `qa-terminal.log`: salida completa de comandos y resumen.

La carpeta `artifacts/qa-metrics/` esta ignorada por Git porque contiene evidencia local timestamp.

## Estados

- `PASS`: indicador medido y cumplido.
- `FAIL`: indicador medido y no cumplido.
- `PARTIAL`: hay evidencia parcial, pero falta automatizacion completa.
- `PENDING`: falta soporte o test automatizado.

El script termina con codigo distinto de 0 si falla typecheck, tests, build o cualquier indicador medido con estado `FAIL`. Indicadores `PARTIAL` quedan visibles para la entrega, pero no bloquean la corrida.

La metrica LPR usa dataset controlado y fixtures deterministicos. Es evidencia valida del calculo automatizado de accuracy y del umbral minimo del 95%, pero no representa una medicion de camara real si el repo no contiene imagenes/OCR real para esa corrida.

## Indicadores cubiertos

- Precision LPR >= 95% en dataset controlado.
- Tarifas por tipo de vehiculo.
- Fraccionamiento cada 10 minutos.
- Tolerancia post-pago de 3 minutos.
- Abonados activos, vencidos e inactivos.
- Renovacion de abono y ticket interno `ABN-*`.
- Tickets de estadia `TKT-*` y tickets internos de abono.
- Pago mixto.
- Roles/permisos.
- Persistencia local/demo.
- Marcha blanca mediante diferencia sistema/manual e incidencia exportable.
- Flujo ingreso -> pago -> egreso integrado a nivel dominio.
