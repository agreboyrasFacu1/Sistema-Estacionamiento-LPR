Actualizar y corregir el sistema existente de control de acceso y cobro de estacionamiento con reconocimiento de patentes (LPR). Mantener el diseño actual profesional desktop-first, rápido e intuitivo, pero aplicar mejoras funcionales, validaciones operativas, simulación LPR más realista y preparación arquitectónica para futura integración backend.

IMPORTANTE:
- El proyecto actualmente se encuentra en estado MVP frontend persistente/demo local, NO producción.
- Mantener interfaz moderna, clara y operativa para uso real en cabina.
- Todo el sistema debe permanecer en español.
- Mantener coherencia visual, componentes reutilizables y diseño profesional.

CORRECCIONES Y VALIDACIONES OPERATIVAS:

ABONADOS:
- Validar que NO se puedan crear dos abonos activos para la misma patente.
- Solo permitir nuevo abono cuando el anterior esté vencido.
- Mostrar estado del abono claramente: ACTIVO o VENCIDO, nunca ambos.
- Validar correctamente el vencimiento del abono.
- Mostrar notificación visual cuando un abono esté vencido.
- Si el abono está vencido, realizar cobro normal correspondiente.
- No permitir modificar manualmente la duración del abono.
- Al pagar un abono mensual, cobrar automáticamente el valor configurado del abono.
- Gestionar suscriptores/abonados desde Admin y Cajero.

TARIFAS Y COBROS:
- Eliminar completamente la opción “valor máximo por día”.
- Mantener tarifas canónicas:
  - Auto/Camioneta: ARS $5.000 + $500 cada 10 minutos.
  - Moto: ARS $3.000 + $300 cada 10 minutos.
  - Abono mensual: ARS $150.000.
- Mantener mismo valor obligatorio de precio base por hora corriente.
- No permitir agregar una tarifa duplicada para el mismo tipo de vehículo.
- Permitir únicamente modificar tarifas existentes.
- Verificar que el fraccionamiento máximo sea 5 veces; luego debe pasar automáticamente a una nueva hora completa.
- Validar manualmente escenarios de pricing:
  - 60 minutos
  - 61 minutos
  - 70 minutos
  - 71 minutos
- Eliminar cualquier referencia legacy:
  - tiempo inicial sin cargo
  - salida sin cargo
  - tolerancia inicial
  - banderas antiguas equivalentes

CAMARAS Y LPR:
- Corregir flujo de cámara:
  - usar SOLO una cámara operativa
  - eliminar doble preview
- Agregar botón “Abrir Cámara”.
- Abrir cámara del celular usando simulación webcam/local camera.
- Simular funcionamiento real de cámara LPR.
- Integrar CameraModal con LprProvider.
- Implementar modo demo usando:
  - getUserMedia
  - preview en vivo
  - captura de imagen
  - detección simulada de patente
- Permitir corrección manual visible de la patente detectada.
- Registrar correcciones manuales como:
  - LPRCorrection
- Mostrar alertas visuales:
  - patente ilegible
  - patente duplicada
  - error de sistema
- Preparar arquitectura para futura integración con cámaras IP reales.
- Exponer métricas de:
  - accuracy
  - porcentaje de correcciones
- Documentar claramente que el MVP NO implementa OCR productivo real >=95%.
- Preparar validación futura de precisión >=95% usando dataset controlado.

PATENTES:
- Mantener validación de formatos argentinos:
  - AAA111
  - AA111AA
- No permitir duplicados dentro del estacionamiento.
- Verificar si la patente ya se encuentra ingresada antes de permitir nuevo acceso.

PERSISTENCIA:
- Agregar versionado de localStorage demo.
- Evitar incompatibilidades entre seeds viejos y nuevos.
- Implementar “Reset Seguro de Datos Demo”:
  - confirmación obligatoria
  - explicar alcance del borrado
- Preparar transición futura:
  - backend local
  - SQLite
  - migraciones versionadas
  - backup/restore local
- Modelar correctamente la facturación del abono mensual.
- Actualmente el MVP solo utiliza estado activo para bypass operativo: mejorar esto.

TICKETS Y PAGOS:
- Permitir seleccionar método de pago:
  - efectivo
  - tarjeta
- Mostrar método de pago en ticket generado.
- Mostrar ticket completo:
  - patente
  - tiempo estacionado
  - total
  - medio de pago
  - fecha y hora
- Centralizar formateo monetario ARS en:
  - dashboard
  - tickets
  - egresos
  - administración
  - búsquedas

REPORTES:
Agregar panel de reportes con:
- ingresos diarios
- historial vehicular
- errores e incidentes
- estadísticas de uso
- métricas de accuracy LPR

ESTADOS DE ERROR:
Agregar estados visuales claros para:
- cámara desconectada
- problemas de red
- fallo de pago
- error de lectura
- error de persistencia
Mostrar acciones de recuperación y mensajes claros para operador.

ARQUITECTURA:
- Reducir responsabilidades de ParkingContext.
- Separar lógica por servicios:
  - pagos
  - tickets
  - logs
  - estadías
  - abonados
  - LPR
- Mantener arquitectura limpia y dominio testeable.
- Preparar estructura escalable para backend futuro.

SEEDS Y DATOS DEMO:
- Corregir seeds de egresados demo.
- Ingresos Hoy debe reflejar ARS $12.800 usando tarifas oficiales.
- Mantener coherencia entre:
  - mock data
  - defaults administrativos
  - documentación
  - tickets
  - reportes

UX/UI:
- Mantener diseño profesional listo para producción.
- Desktop-first.
- Operación rápida en cabina.
- Botones claros.
- Acciones en máximo 2-3 pasos.
- Estados visuales de:
  - éxito
  - carga
  - error
  - advertencia
- Mantener estilo consistente en todas las pantallas.