# Sets up (or removes) the weekly "Trending now" refresh as a Windows scheduled task for the current user.
#   powershell -ExecutionPolicy Bypass -File scripts\schedule_weekly.ps1             # every Monday 10:00
#   powershell -ExecutionPolicy Bypass -File scripts\schedule_weekly.ps1 -Day Friday -Time 09:30
#   powershell -ExecutionPolicy Bypass -File scripts\schedule_weekly.ps1 -Remove     # stop the weekly run
# Runs only while you're signed in, so no password is stored. If the laptop was off or asleep at that time, it runs
# at the next chance. Each run writes research\adlib_weekly\<date>.md; console output goes to
# research\adlib_weekly\task.log. On a Mac or Linux, use cron instead: 0 10 * * 1 cd <repo> && node scripts/adlib_weekly.js
param([switch]$Remove, [string]$Day = "Monday", [string]$Time = "10:00")
$name = "Minimalist Ad Desk - Trending weekly"
if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false
  Write-Output "Removed '$name'."
  exit 0
}
$repo = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node -ErrorAction Stop).Source
New-Item -ItemType Directory -Force (Join-Path $repo "research\adlib_weekly") | Out-Null
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"`"$node`" scripts\adlib_weekly.js >> research\adlib_weekly\task.log 2>&1`"" -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 40)
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Description "Checks competitors' static ads in the Meta Ad Library and rebuilds Trending now (scripts/adlib_weekly.js)." -Force | Out-Null
$t = Get-ScheduledTask -TaskName $name
Write-Output "Scheduled '$name': every $Day at $Time (next run $((Get-ScheduledTaskInfo -TaskName $name).NextRunTime)). Remove with -Remove."
