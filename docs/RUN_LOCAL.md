# Ejecucion local

Esta guia explica dos formas simples de levantar la app en una computadora local.

## Opcion A - Windows sin Docker

### Requisitos

- Node.js instalado.
- PowerShell abierto en la carpeta del proyecto.

### Iniciar

```powershell
.\scripts\run-local.ps1
```

URL:

```txt
http://127.0.0.1:5173/
```

### Cerrar

Presione:

```txt
Ctrl+C
```

### Si PowerShell bloquea scripts

Use una autorizacion temporal solo para esta ventana:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\run-local.ps1
```

### Ejemplos

```powershell
.\scripts\run-local.ps1
.\scripts\run-local.ps1 -Port 5174
.\scripts\run-local.ps1 -NoBrowser
.\scripts\run-local.ps1 -UseCleanInstall
.\scripts\run-local.ps1 -Runtime Node -CheckOnly
.\scripts\run-local.ps1 -Runtime Docker -Port 5174
```

El script elige automaticamente el runtime disponible:

- `-Runtime Auto`: usa Node.js si esta disponible; si no, puede usar Docker.
- `-Runtime Node`: usa Node.js y `npm.cmd`.
- `-Runtime Docker`: usa Docker Compose.
- `-CheckOnly`: valida requisitos sin levantar el servidor.
- `-NonInteractive`: no pregunta, no instala y falla con mensaje claro si falta algo.

Si falta Node.js o Docker, el script puede ofrecer instalarlos con `winget` solo con confirmacion del usuario.

Cuando se usa Docker, `-Port` cambia el puerto disponible en la maquina host. El contenedor sigue usando internamente el puerto `5173`.

## Opcion B - Docker

### Requisitos

- Docker Desktop instalado y abierto.

### Iniciar

```powershell
docker compose up --build
```

Tambien puede usar el script:

```powershell
.\scripts\run-local.ps1 -Runtime Docker
```

URL:

```txt
http://localhost:5173/
```

### Cerrar

Presione:

```powershell
Ctrl+C
docker compose down
```

## Problemas comunes

### `npm` no se reconoce

Instale Node.js LTS y abra una nueva ventana de PowerShell. En Windows este proyecto usa `npm.cmd`.

### Node.js no esta instalado

Instale Node.js LTS desde el sitio oficial y vuelva a ejecutar:

```powershell
.\scripts\run-local.ps1
```

### El puerto 5173 esta ocupado

Use otro puerto:

```powershell
.\scripts\run-local.ps1 -Port 5174
```

Con Docker, cambie temporalmente el puerto publicado en `docker-compose.yml`.

### Docker Desktop no esta abierto

Abra Docker Desktop y espere a que indique que esta listo. Luego ejecute:

```powershell
docker compose up --build
```

El script tambien puede intentar abrir Docker Desktop si usted lo confirma:

```powershell
.\scripts\run-local.ps1 -Runtime Docker
```

### PowerShell bloquea scripts

Use una politica temporal para la ventana actual:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\run-local.ps1
```

No hace falta cambiar la politica global.

### La pantalla no carga

Revise que el servidor siga abierto en la terminal y abra la URL indicada. Si el navegador estaba abierto antes, recargue con `Ctrl+F5`.

### Los cambios no se ven

Detenga el servidor con `Ctrl+C` y vuelva a iniciar:

```powershell
.\scripts\run-local.ps1
```

Si usa Docker:

```powershell
docker compose down
docker compose up --build
```

### `node_modules` corrupto

Ejecute una reinstalacion limpia sin borrar carpetas manualmente:

```powershell
.\scripts\run-local.ps1 -UseCleanInstall
```

Si el problema persiste, pida asistencia antes de borrar archivos generados.

## Checklist de prueba rapida

- Login.
- Dashboard carga.
- Ingreso de vehiculo.
- Egreso de vehiculo.
- Abonado activo.
- Abonado vencido.
- Renovacion de abono.
- Pago mixto.
- Ticket interno.
