<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name') }}</title>
    <script>
        (() => {
            const root = document.documentElement;
            let preference = 'system';

            try {
                const stored = window.localStorage.getItem('talibon.appearance');
                if (stored === 'light' || stored === 'dark' || stored === 'system') {
                    preference = stored;
                }
            } catch {
                // Storage may be blocked; use the system preference without interrupting bootstrap.
            }

            const dark = preference === 'dark'
                || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            root.classList.toggle('dark', dark);
            root.dataset.appearance = preference;
            root.style.colorScheme = dark ? 'dark' : 'light';
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="antialiased">
    @inertia
</body>
</html>
