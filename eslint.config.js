const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', '*.min.js', 'dist/**', 'build/**', 'coverage/**'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                Buffer: 'readonly',
                console: 'readonly',
                exports: 'writable',
                global: 'readonly',
                module: 'readonly',
                process: 'readonly',
                require: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                clearImmediate: 'readonly',
                document: 'readonly',
                window: 'readonly',
                fetch: 'readonly',
                bootstrap: 'readonly',
                Event: 'readonly',
                confirm: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['error', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^(logout|apiRequest|updateTable|openModal|closeModal|resetForm|validateForm|setupFileUpload|exportData|setupTableSearch)$'
            }],
            'no-console': 'off',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'indent': ['error', 4],
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'eol-last': 'error',
            'no-multiple-empty-lines': ['error', { 'max': 2 }],
            'no-empty': 'warn'
        }
    }
];
