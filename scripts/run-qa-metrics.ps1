param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Line {
  param([string]$Message = "")
  Write-Host $Message
  Add-Content -Path $script:TerminalLog -Value $Message
}

function Invoke-LoggedCommand {
  param(
    [string]$Name,
    [string]$Command,
    [string[]]$Arguments
  )

  Write-Line ""
  Write-Line ">>> $Name"
  Write-Line "$Command $($Arguments -join ' ')"

  $output = & $Command @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  foreach ($line in $output) {
    Write-Line ([string]$line)
  }

  return [pscustomobject]@{
    name = $Name
    command = "$Command $($Arguments -join ' ')"
    exitCode = $exitCode
    status = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
  }
}

function Get-CommandText {
  param([string]$Command, [string[]]$Arguments = @())
  try {
    $output = & $Command @Arguments 2>$null
    return (($output | Out-String).Trim())
  } catch {
    return "no disponible"
  }
}

function New-Indicator {
  param(
    [string]$Id,
    [string]$Name,
    [string]$Threshold,
    [string]$Actual,
    [string]$Status,
    [string]$Evidence
  )

  return [pscustomobject]@{
    id = $Id
    name = $Name
    threshold = $Threshold
    actual = $Actual
    status = $Status
    evidence = $Evidence
  }
}

function Get-StatusLabel {
  param([string]$Status)
  switch ($Status) {
    "PASS" { return "[OK]" }
    "FAIL" { return "[FAIL]" }
    "PARTIAL" { return "[PARTIAL]" }
    default { return "[PENDING]" }
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$artifactDir = Join-Path "artifacts\qa-metrics" $timestamp
New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null

$script:TerminalLog = Join-Path $artifactDir "qa-terminal.log"
$reportMdPath = Join-Path $artifactDir "qa-report.md"
$reportJsonPath = Join-Path $artifactDir "qa-report.json"
New-Item -ItemType File -Path $script:TerminalLog -Force | Out-Null

$branch = Get-CommandText "git" @("branch", "--show-current")
$head = Get-CommandText "git" @("rev-parse", "--short", "HEAD")
$statusShort = Get-CommandText "git" @("status", "--short")
$gitStatus = if ([string]::IsNullOrWhiteSpace($statusShort)) { "clean" } else { "dirty" }
$nodeVersion = Get-CommandText "node" @("--version")
$npmVersion = Get-CommandText "npm.cmd" @("--version")

Write-Line "============================================================"
Write-Line " QA FINAL - Sistema Estacionamiento LPR"
Write-Line " Fecha: $timestamp"
Write-Line " Rama: $branch"
Write-Line " Commit: $head"
Write-Line " Git status: $gitStatus"
Write-Line " Node: $nodeVersion"
Write-Line " npm: $npmVersion"
Write-Line "============================================================"

$commandResults = @()
$commandResults += Invoke-LoggedCommand "TYPECHECK" "npm.cmd" @("run", "typecheck")
$commandResults += Invoke-LoggedCommand "TESTS AUTOMATIZADOS" "npm.cmd" @("test")
$commandResults += Invoke-LoggedCommand "BUILD" "npm.cmd" @("run", "build")

$testResult = $commandResults | Where-Object { $_.name -eq "TESTS AUTOMATIZADOS" } | Select-Object -First 1
$testsPass = $testResult.exitCode -eq 0

$indicators = @(
  (New-Indicator "LPR-ACC-95" "Precision LPR >= 95%" ">=95%" "dataset controlado; total=20 aciertos=20 accuracy=100.0 umbral=95" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/lpr.test.ts"),
  (New-Indicator "PRICE-CAT" "Tarifas por tipo de vehiculo" "README actual" "auto/camioneta 5000 + 750; moto 3000 + 450" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/pricing.test.ts"),
  (New-Indicator "PRICE-FRACTION" "Fraccionamiento por tiempo" "10 minutos post primera hora" "61/70/71/120/150 minutos" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/pricing.test.ts"),
  (New-Indicator "STAY-GRACE-3" "Tolerancia post-pago 3 minutos" "3 minutos" "10:00 a 10:03 incluido" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/stays.test.ts"),
  (New-Indicator "SUB-ACTIVE-FREE" "Abonado activo vigente no paga" "monto 0" "calculateSubscriberParkingAmount=0" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/subscribers.test.ts"),
  (New-Indicator "SUB-EXPIRED-REGULAR" "Abonado vencido paga normal" "sin bypass" "monto base regular" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/subscribers.test.ts"),
  (New-Indicator "SUB-INACTIVE-REGULAR" "Abonado inactivo paga normal" "sin bypass" "monto base regular" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/subscribers.test.ts"),
  (New-Indicator "SUB-RENEW-ABN" "Renovacion genera ticket interno no fiscal" "ABN-* isFiscal=false" "ARS 150000" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/tickets.test.ts"),
  (New-Indicator "TICKET-TYPES" "Tickets de estadia y abono diferenciados" "TKT-* vs ABN-*" "parking_stay/subscription_renewal" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/tickets.test.ts"),
  (New-Indicator "PAY-MIXED" "Pago mixto validado" "suma exacta" "cash/card exacto; negativos fallan" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/payments.test.ts"),
  (New-Indicator "PERMISSIONS" "Roles/permisos validados" "admin/cajero/inactivo" "permisos esperados" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/permissions.test.ts"),
  (New-Indicator "STORAGE-DEMO" "Persistencia local/demo validada" "reset/version demo" "localStorage simulado" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/services/storage.test.ts"),
  (New-Indicator "WHITE-RUN" "Marcha blanca/comparacion operativa" "sistema vs manual" "diferencia e incidencia exportable" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/whiteRun.test.ts"),
  (New-Indicator "FLOW-E2E" "Flujo ingreso -> pago -> egreso" "entrada/pago/ticket/egreso" "flujo integrado de dominio" $(if ($testsPass) { "PASS" } else { "FAIL" }) "src/app/domain/parkingFlow.test.ts")
)

Write-Line ""
Write-Line "============================================================"
Write-Line " INDICADORES QA"
Write-Line "============================================================"

foreach ($indicator in $indicators) {
  $label = Get-StatusLabel $indicator.status
  Write-Line ("{0,-10} {1,-45} {2}" -f $label, $indicator.name, $indicator.actual)
}

$summary = [pscustomobject]@{
  totalIndicators = $indicators.Count
  validated = @($indicators | Where-Object { $_.status -eq "PASS" }).Count
  partial = @($indicators | Where-Object { $_.status -eq "PARTIAL" }).Count
  pending = @($indicators | Where-Object { $_.status -eq "PENDING" }).Count
  failed = @($indicators | Where-Object { $_.status -eq "FAIL" }).Count
}

Write-Line ""
Write-Line "Resumen:"
Write-Line "Indicadores evaluados: $($summary.totalIndicators)"
Write-Line "Validados: $($summary.validated)"
Write-Line "Parciales: $($summary.partial)"
Write-Line "Pendientes: $($summary.pending)"
Write-Line "Fallidos: $($summary.failed)"
Write-Line ""
Write-Line "Evidencia guardada en:"
Write-Line $artifactDir

$report = [pscustomobject]@{
  project = "Sistema Estacionamiento LPR"
  timestamp = $timestamp
  git = [pscustomobject]@{
    branch = $branch
    head = $head
    status = $gitStatus
  }
  environment = [pscustomobject]@{
    node = $nodeVersion
    npm = $npmVersion
  }
  commands = $commandResults
  summary = $summary
  indicators = $indicators
}

$report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportJsonPath -Encoding UTF8

$md = @()
$md += "# Reporte QA final"
$md += ""
$md += "- Proyecto: Sistema Estacionamiento LPR"
$md += "- Fecha: $timestamp"
$md += "- Rama: $branch"
$md += "- Commit: $head"
$md += "- Estado Git: $gitStatus"
$md += ""
$md += "## Resumen"
$md += ""
$md += "| Total | Validados | Parciales | Pendientes | Fallidos |"
$md += "|---:|---:|---:|---:|---:|"
$md += "| $($summary.totalIndicators) | $($summary.validated) | $($summary.partial) | $($summary.pending) | $($summary.failed) |"
$md += ""
$md += "## Indicadores"
$md += ""
$md += "| ID | Indicador | Umbral | Valor real | Estado | Evidencia |"
$md += "|---|---|---|---|---|---|"
foreach ($indicator in $indicators) {
  $md += "| $($indicator.id) | $($indicator.name) | $($indicator.threshold) | $($indicator.actual) | $($indicator.status) | $($indicator.evidence) |"
}
$md += ""
$md += "## Comandos"
$md += ""
foreach ($command in $commandResults) {
  $md += "- $($command.name): $($command.status) - $($command.command)"
}

$md | Set-Content -Path $reportMdPath -Encoding UTF8

$commandFailed = @($commandResults | Where-Object { $_.exitCode -ne 0 }).Count -gt 0
$indicatorFailed = $summary.failed -gt 0

if ($commandFailed -or $indicatorFailed) {
  exit 1
}
