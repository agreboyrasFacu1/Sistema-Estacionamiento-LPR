# Manual de Usuario - Sistema Estacionamiento LPR

## Inicio de sesion

Use las credenciales demo:

- Cajero: `cajero@parking.com` / `demo`
- Administrador: `admin@parking.com` / `demo`

Las rutas internas requieren sesion. Las pantallas administrativas requieren rol administrador.

## Ingreso de vehiculo

1. Ir a Entrada.
2. Detectar patente con webcam local demo, mock LPR o cargarla manualmente.
3. Elegir categoria: Auto, Camioneta o Moto.
4. Confirmar ingreso.

El sistema valida formato de patente y evita duplicados activos.

## Salida y cobro

1. Ir a Salida.
2. Buscar por LPR, patente manual o seleccionar un vehiculo activo.
3. Revisar duracion y monto.
4. Para abonado mensual activo, registrar abonado.
5. Para vehiculo con cobro, seleccionar efectivo o tarjeta y confirmar pago.
6. Confirmar salida dentro de los 3 minutos posteriores al pago.
7. Imprimir o cerrar el ticket interno.

Si vence la tolerancia post-pago y corresponde un adicional, el sistema vuelve el estado a pago pendiente.

La moneda operativa es pesos argentinos (ARS). Para Auto y Camioneta, la primera hora es $5.000 y la fraccion posterior de 10 minutos es $500. Para Moto, la primera hora es $3.000 y la fraccion posterior de 10 minutos es $300. La tolerancia no es tiempo sin cargo desde el ingreso.

## Busqueda

La busqueda permite consultar por patente o por numero de ticket interno.

## Abonados

Desde Abonados se pueden crear, editar o eliminar clientes mensuales y bonificados. Un abono mensual activo pero vencido se trata como vencido para el cobro.

El abono mensual operativo de referencia es $150.000. En este MVP frontend el abono activo se usa para validar el egreso sin cobro, no para facturar el abono.

## Administracion

El administrador puede reiniciar los datos demo con `Reset demo`. Esta accion limpia las claves locales `parking-lpr:*`, recarga seeds ARS vigentes y no borra datos fuera de la app.

El administrador puede:

- Administrar tarifas por categoria.
- Consultar logs.
- Revisar reportes basicos.
- Administrar usuarios.

La tarifa respeta primera hora base y fraccion posterior fija de 10 minutos. El ticket emitido es interno de control, no fiscal.

## LPR demo con webcam local

La camara local del navegador se usa solo para entrenamiento y presentaciones. El sistema muestra preview de video, permite capturar un frame, simula una lectura con confianza y permite corregir la patente antes de usarla. No es OCR productivo real y no acredita precision >=95%.

## Marcha blanca

Use el modo entrenamiento/marcha blanca para operar en paralelo. Cuando se informe un monto manual diferente al sistema, se registra una incidencia de diferencia para estabilizacion.
