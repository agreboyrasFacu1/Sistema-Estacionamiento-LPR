# Matriz de metricas QA y evidencia

Fuente de verdad funcional: `README.md` en `main`. Las fracciones default vigentes son $750 para auto/camioneta y $450 para moto, configurables desde reglas de pricing.

| Indicador | Umbral/Criterio | Test/Script | Fuente | Resultado esperado | Estado | Observacion |
|---|---|---|---|---|---|---|
| Precision LPR >= 95% | Accuracy >= 95% en dataset controlado | `npm.cmd test` + `scripts/run-qa-metrics.ps1` | `src/app/domain/lpr.test.ts` | `total=20 aciertos=20 accuracy=100.0 umbral=95` | VALIDADO | Fixtures deterministicos; evidencia valida para calculo automatizado de accuracy y umbral. No representa medicion de camara real si no hay imagenes/OCR real en el repo. |
| Calculo de tarifa por tipo de vehiculo | Auto/camioneta $5000; moto $3000 primera hora | `npm.cmd test` | `src/app/domain/pricing.test.ts` | Valores esperados por categoria | VALIDADO | Usa reglas README actual. |
| Fraccionamiento por tiempo | 10 minutos luego de primera hora | `npm.cmd test` | `src/app/domain/pricing.test.ts` | 61/70/71/120/150 minutos medidos | VALIDADO | Fraccion default 15% de primera hora. |
| Tolerancia post-pago de 3 minutos | Dentro hasta 10:03:00; fuera despues | `npm.cmd test` | `src/app/domain/stays.test.ts` | Ventana calculada y validada | VALIDADO | No es tiempo gratis desde ingreso. |
| Abonado activo vigente no paga estadia | Monto 0 | `npm.cmd test` | `src/app/domain/subscribers.test.ts` | Activo mensual exento | VALIDADO | Estado efectivo. |
| Abonado vencido paga como cliente normal | Monto base sin bypass | `npm.cmd test` | `src/app/domain/subscribers.test.ts` | Vencido paga normal | VALIDADO | Status efectivo `expired`. |
| Abonado inactivo paga como cliente normal | Monto base sin bypass | `npm.cmd test` | `src/app/domain/subscribers.test.ts` | Inactivo paga normal | VALIDADO | Status formal inactivo. |
| Renovacion/cobro de abono genera ticket interno no fiscal | `ABN-*`, `isFiscal=false`, monto $150000 | `npm.cmd test` | `src/app/domain/tickets.test.ts` | Ticket `subscription_renewal` | VALIDADO | Renovacion extiende vigencia. |
| Tickets de estadia y abono diferenciados | `TKT-*` vs `ABN-*` | `npm.cmd test` | `src/app/domain/tickets.test.ts` | Tipos y prefijos distintos | VALIDADO | Ambos son internos. |
| Pago mixto validado | Suma exacta; negativos fallan | `npm.cmd test` | `src/app/domain/payments.test.ts` | Acepta/desestima segun total | VALIDADO | Desglose cash/card. |
| Roles/permisos validados | Admin/cajero/inactivo | `npm.cmd test` | `src/app/domain/permissions.test.ts` | Permisos esperados | VALIDADO | Cobertura de dominio. |
| Persistencia local/demo validada | Reset/version demo | `npm.cmd test` | `src/app/services/storage.test.ts` | Claves demo reiniciadas | VALIDADO | LocalStorage simulado. |
| Marcha blanca/comparacion operativa | Sistema vs manual, diferencia y registro exportable | `npm.cmd test` + `scripts/run-qa-metrics.ps1` | `src/app/domain/whiteRun.test.ts` | Caso sin diferencia y caso con diferencia | VALIDADO | Valida dominio y estructura de incidencia; la exportacion UI queda fuera de esta prueba de dominio. |
| Flujo ingreso -> pago -> egreso | Entrada, tarifa, pago, ticket y egreso dentro de tolerancia | `npm.cmd test` + `scripts/run-qa-metrics.ps1` | `src/app/domain/parkingFlow.test.ts` | Vehiculo termina `exited` con ticket `TKT-*` | VALIDADO | Flujo integrado de dominio deterministico, sin montar UI. |

Nota post-QA: luego de la ejecución QA final se separó el objetivo de calidad LPR del umbral operativo demo. El objetivo de calidad documentado se mantiene en 95%; el umbral operativo interno de demo se configuró en 70% para facilitar la transcripción durante pruebas locales. Esto no modifica la evidencia histórica de QA ni representa una medición real de cámara productiva.
