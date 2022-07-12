let mix = require('laravel-mix');
require('laravel-mix-svelte');
mix.js('src/main.js', 'build').setPublicPath('build').svelte();

