# Stop-Hook: Windows-Notification (Sound + Toast)
# Fires when Claude finishes responding and waits for user input.
# Tries BurntToast (modern Action Center toast) and falls back to a NotifyIcon
# balloon if the module is missing. Always plays the Asterisk system sound.
#
# Runs detached (non-blocking) so Claude is not held up by the UI call.

$ErrorActionPreference = 'SilentlyContinue'

# 1) Sound — fire-and-forget
try {
    [System.Media.SystemSounds]::Asterisk.Play()
} catch {}

# 2) Toast — prefer BurntToast, fall back to NotifyIcon balloon
$useBurntToast = $false
try {
    if (Get-Module -ListAvailable -Name BurntToast -ErrorAction Stop) {
        Import-Module BurntToast -ErrorAction Stop
        $useBurntToast = $true
    }
} catch {}

if ($useBurntToast) {
    try {
        New-BurntToastNotification `
            -Text 'Claude Code', 'Wartet auf Eingabe.' `
            -SnoozeAndDismiss
    } catch {
        # Defensive fallback if BurntToast call itself errors out
        $useBurntToast = $false
    }
}

if (-not $useBurntToast) {
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
        Add-Type -AssemblyName System.Drawing -ErrorAction Stop

        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Information
        $notify.Visible = $true
        $notify.BalloonTipTitle = 'Claude Code'
        $notify.BalloonTipText = 'Wartet auf Eingabe.'
        $notify.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
        $notify.ShowBalloonTip(4000)

        # Give the balloon a moment to surface, then dispose
        Start-Sleep -Milliseconds 200
        $notify.Dispose()
    } catch {}
}

exit 0
