# 知乎问答助手 Edge 插件打包脚本
param(
    [string]$Output = "zhihu-assistant.zip"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

try {
    if (Test-Path $Output) { Remove-Item $Output }

    $files = @(
        "manifest.json",
        "background.js",
        "content.js",
        "content.css",
        "popup.html",
        "popup.js",
        "options.html",
        "options.js"
    )

    $folders = @(
        "icons"
    )

    $all = $files + $folders
    Compress-Archive -Path $all -DestinationPath $Output -CompressionLevel Optimal
    Write-Host "打包完成: $Output" -ForegroundColor Green
}
catch {
    Write-Host "打包失败: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
