$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8081/")
$listener.Start()
Write-Host "Server started on http://127.0.0.1:8081"
Write-Host "Press Ctrl+C to stop"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.LocalPath

    if ($path -eq "/") { $path = "/index.html" }

    $basePath = $PSScriptRoot
    $filePath = Join-Path $basePath ($path.TrimStart("/").Replace("/", "\"))

    Write-Host "$($request.HttpMethod) $path"

    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)

        $mimeTypes = @{
            ".html" = "text/html; charset=utf-8"
            ".css"  = "text/css; charset=utf-8"
            ".js"   = "application/javascript; charset=utf-8"
            ".json" = "application/json; charset=utf-8"
            ".png"  = "image/png"
            ".jpg"  = "image/jpeg"
            ".svg"  = "image/svg+xml"
            ".ico"  = "image/x-icon"
        }

        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }

        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found: $path")
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }

    $response.OutputStream.Close()
}
