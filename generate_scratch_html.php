<?php

$svg = file_get_contents(__DIR__ . '/public/resources_canvas/images/15.svg');
$html = '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 512px; height: 512px; background: #28362E; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  svg { width: 420px; height: 420px; }
</style>
</head>
<body>
' . $svg . '
</body>
</html>';

file_put_contents(__DIR__ . '/public/resources_canvas/images/scratch_logo.html', $html);
echo "HTML written successfully\n";
