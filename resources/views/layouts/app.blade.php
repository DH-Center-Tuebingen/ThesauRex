<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/png" href="favicon.png" sizes="32x32">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>ThesauRex - {{ $p['prefs.project-name'] }}</title>

    <!-- Styles -->
    <link href="css/app.css" rel="stylesheet">
</head>
<body>
    <div id="app" class="d-flex flex-column">
        @yield('content')
    </div>

    <!-- Scripts -->
    <script src="js/manifest.js"></script>
    <script src="js/vendor.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
