param(
  [ValidateSet("Auto", "Node", "Docker")]
  [string]$Runtime = "Auto",

  [int]$Port = 5173,

  [string]$HostAddress = "127.0.0.1",

  [switch]$NoInstall,

  [switch]$NoBrowser,

  [switch]$UseCleanInstall,

  [switch]$CheckOnly,

  [switch]$NonInteractive
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# @TASK: Resolver runtime local disponible y levantar la demo.
# @INPUT: Parametros de ejecucion y herramientas instaladas en Windows.
# @OUTPUT: Servidor Vite en foreground o diagnostico claro para el usuario.

function Write-Info {
  param([string]$Message)
  Write-Host "[run-local] $Message"
}

function Write-Warn {
  param([string]$Message)
  Write-Warning "[run-local] $Message"
}

function Fail {
  param([string]$Message)
  Write-Error "[run-local] $Message"
  exit 1
}

function Confirm-Action {
  param([string]$Prompt)

  if ($NonInteractive) {
    return $false
  }

  $answer = Read-Host "$Prompt [s/N]"
  return $answer -match "^(s|si|y|yes)$"
}

function Test-CommandAvailable {
  param([string]$Command)
  return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-ProjectRoot {
  $root = Resolve-Path (Join-Path $PSScriptRoot "..")
  return $root.Path
}

function Invoke-CheckedCommand {
  param(
    [string]$Command,
    [string[]]$Arguments = @()
  )

  Write-Info "Ejecutando: $Command $($Arguments -join ' ')"
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    Fail "El comando fallo con codigo ${LASTEXITCODE}: $Command"
  }
}

function Test-Winget {
  return Test-CommandAvailable "winget"
}

function Refresh-ProcessPath {
  # @CONTEXT: winget puede instalar Node/Docker y dejar PATH actualizado solo para nuevas terminales.
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = @($machinePath, $userPath) -join ";"
}

function Install-NodeWithWinget {
  if (-not (Test-Winget)) {
    Fail "winget no esta disponible. Instale Node.js LTS manualmente y vuelva a abrir PowerShell."
  }

  Invoke-CheckedCommand "winget" @("install", "--id", "OpenJS.NodeJS.LTS", "--source", "winget")
  Refresh-ProcessPath
}

function Install-DockerWithWinget {
  if (-not (Test-Winget)) {
    Fail "winget no esta disponible. Instale Docker Desktop manualmente y vuelva a abrir PowerShell."
  }

  Invoke-CheckedCommand "winget" @("install", "--id", "Docker.DockerDesktop", "--source", "winget")
  Refresh-ProcessPath
}

function Test-NodeRuntime {
  return (Test-CommandAvailable "node") -and (Test-CommandAvailable "npm.cmd")
}

function Test-DockerDaemon {
  if (-not (Test-CommandAvailable "docker")) {
    return $false
  }

  cmd.exe /c "docker info >NUL 2>NUL"
  return $LASTEXITCODE -eq 0
}

function Test-DockerRuntime {
  if (-not (Test-CommandAvailable "docker")) {
    return $false
  }

  cmd.exe /c "docker compose version >NUL 2>NUL"
  if ($LASTEXITCODE -ne 0) {
    return $false
  }

  return Test-DockerDaemon
}

function Wait-DockerDaemon {
  param([int]$TimeoutSeconds = 90)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DockerDaemon) {
      return $true
    }
    Start-Sleep -Seconds 3
  }

  return $false
}

function Start-DockerDesktop {
  $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (-not (Test-Path $dockerDesktop)) {
    return $false
  }

  Start-Process $dockerDesktop | Out-Null
  return $true
}

function Ensure-NodeRuntime {
  # STEP 1: Validar Node/npm; STEP 2: instalar solo con confirmacion explicita.
  if (Test-NodeRuntime) {
    return
  }

  if ($NonInteractive) {
    Fail "Node.js o npm.cmd no estan disponibles. Instale Node.js LTS o use -Runtime Docker."
  }

  if (Confirm-Action "Node.js LTS no esta disponible. Quiere instalarlo con winget?") {
    Install-NodeWithWinget
  } else {
    Fail "Node.js LTS es requerido para -Runtime Node."
  }

  if (-not (Test-NodeRuntime)) {
    Fail "Node.js/npm.cmd siguen sin aparecer. Cierre y reabra PowerShell, luego vuelva a intentar."
  }
}

function Ensure-DockerRuntime {
  # @SECURITY: Docker Desktop se instala o abre solo si el usuario lo confirma.
  if (-not (Test-CommandAvailable "docker")) {
    if ($NonInteractive) {
      Fail "Docker no esta disponible. Instale Docker Desktop o use -Runtime Node."
    }

    if (Confirm-Action "Docker no esta disponible. Quiere instalar Docker Desktop con winget?") {
      Install-DockerWithWinget
    } else {
      Fail "Docker Desktop es requerido para -Runtime Docker."
    }
  }

  cmd.exe /c "docker compose version >NUL 2>NUL"
  if ($LASTEXITCODE -ne 0) {
    Fail "docker compose no esta disponible. Actualice Docker Desktop."
  }

  if (Test-DockerDaemon) {
    return
  }

  if ($NonInteractive) {
    Fail "Docker esta instalado pero el daemon no responde. Abra Docker Desktop e intente de nuevo."
  }

  if (Confirm-Action "Docker Desktop no parece estar abierto. Quiere abrirlo ahora?") {
    if (-not (Start-DockerDesktop)) {
      Fail "No se encontro Docker Desktop.exe. Abralo manualmente y vuelva a intentar."
    }

    Write-Info "Esperando Docker Desktop hasta 90 segundos..."
    if (Wait-DockerDaemon 90) {
      return
    }
  }

  Fail "Docker daemon no responde. Abra Docker Desktop y espere a que quede listo."
}

function Resolve-Runtime {
  # STEP 1: En Auto preferir Node; STEP 2: usar Docker si Node no esta listo.
  if ($Runtime -eq "Node") {
    return "Node"
  }

  if ($Runtime -eq "Docker") {
    return "Docker"
  }

  if (Test-NodeRuntime) {
    return "Node"
  }

  if (Test-DockerRuntime) {
    return "Docker"
  }

  return "Node"
}

function Start-NodeRuntime {
  Ensure-NodeRuntime

  if ($UseCleanInstall -and $NoInstall) {
    Fail "No use -UseCleanInstall junto con -NoInstall."
  }

  if ($UseCleanInstall) {
    Write-Info "Ejecutando npm.cmd ci por pedido de -UseCleanInstall."
    if (-not $CheckOnly) {
      Invoke-CheckedCommand "npm.cmd" @("ci")
    }
  } elseif (-not (Test-Path "node_modules")) {
    if ($NoInstall) {
      Fail "No existe node_modules y se indico -NoInstall. Ejecute sin -NoInstall o corra npm.cmd ci."
    }

    Write-Info "No existe node_modules. Instalando dependencias con npm.cmd ci."
    if (-not $CheckOnly) {
      Invoke-CheckedCommand "npm.cmd" @("ci")
    }
  } else {
    Write-Info "node_modules existe. No se reinstalan dependencias."
  }

  $url = "http://${HostAddress}:${Port}/"
  Write-Info "Runtime Node listo."

  if ($CheckOnly) {
    Write-Info "CheckOnly OK. URL prevista: $url"
    return
  }

  Write-Info "La aplicacion se abrira en: $url"
  Write-Info "Para cerrar el servidor presione Ctrl+C."

  if (-not $NoBrowser) {
    try {
      Start-Process $url | Out-Null
    } catch {
      Write-Info "No se pudo abrir el navegador automaticamente. Abra manualmente: $url"
    }
  }

  npm.cmd run dev -- --host $HostAddress --port $Port
}

function Start-DockerRuntime {
  Ensure-DockerRuntime

  Write-Info "Runtime Docker listo."

  if ($CheckOnly) {
    Write-Info "CheckOnly OK. URL prevista: http://localhost:${Port}/"
    return
  }

  Write-Info "La aplicacion quedara disponible en: http://localhost:${Port}/"
  Write-Info "Para cerrar Docker Compose presione Ctrl+C y luego ejecute docker compose down si hace falta."

  if (-not $NoBrowser) {
    try {
      Start-Process "http://localhost:${Port}/" | Out-Null
    } catch {
      Write-Info "No se pudo abrir el navegador automaticamente. Abra manualmente: http://localhost:${Port}/"
    }
  }

  docker compose up --build
}

$projectRoot = Get-ProjectRoot
Set-Location $projectRoot

# STEP 1: Validar estructura del proyecto y resolver runtime.
if (-not (Test-Path "package.json")) {
  Fail "No se encontro package.json. Ejecute este script desde el proyecto o revise la carpeta scripts."
}

$resolvedRuntime = Resolve-Runtime
Write-Info "Runtime solicitado: $Runtime. Runtime resuelto: $resolvedRuntime."

# STEP 2: Instalar o guiar instalacion solo con confirmacion explicita.
# STEP 3: Levantar Vite con Node o Docker en foreground.
if ($resolvedRuntime -eq "Docker") {
  Start-DockerRuntime
} else {
  Start-NodeRuntime
}
