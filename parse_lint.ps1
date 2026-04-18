$root = (Get-Location).Path + '\'
$lines = Get-Content lint_latest.txt
$currentFile = ''
$issues = @()
foreach ($line in $lines) {
  if ($line -match '^[A-Za-z]:\\.*\.(js|jsx|ts|tsx)$') { $currentFile = $line.Trim(); continue }
  if ($line -match '^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s{2,}([^\s]+)\s*$') {
    $f = $currentFile
    if ($f.StartsWith($root)) { $f = $f.Substring($root.Length) }
    $issues += [pscustomobject]@{
      File = $f; Line = [int]$matches[1]; Col = [int]$matches[2];
      Severity = $matches[3]; Message = $matches[4].Trim(); Rule = $matches[5]
    }
  }
}
$errors = ($issues | Where-Object Severity -eq 'error').Count
$warnings = ($issues | Where-Object Severity -eq 'warning').Count
$total = $issues.Count
$top = $issues | Group-Object Rule | Sort-Object Count -Descending | Select-Object -First 15 | ForEach-Object { "{0}|{1}" -f $_.Name,$_.Count }
$first = $issues | Select-Object -First 25 | ForEach-Object { "{0}:{1}:{2}|{3}|{4}" -f $_.File,$_.Line,$_.Col,$_.Severity,$_.Rule }
@(
  "TOTAL_ERRORS=$errors"
  "TOTAL_WARNINGS=$warnings"
  "TOTAL_ISSUES=$total"
  "DELTA_ERRORS=$($errors-75)"
  "DELTA_WARNINGS=$($warnings-28)"
  "DELTA_TOTAL=$($total-103)"
  'TOP_RULES:'
) + $top + @('FIRST_25:') + $first | Set-Content lint_parsed.txt
Get-Content lint_parsed.txt
