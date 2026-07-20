import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'dev-dist', '.remember', '.scratch'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      // Without this resolver, eslint-plugin-boundaries cannot resolve `@/…` imports,
      // no file gets categorised, and the boundary rule silently never fires. This is
      // exactly what the boundary probe below exists to catch.
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' },
      },
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/shared/*' },
        { type: 'shell', pattern: 'src/shell/*' },
        {
          type: 'area',
          pattern: 'src/(decks|practice|study|progress|auth|settings|notifications|import)/*',
          capture: ['area'],
        },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Underscore-prefixed args/vars are an intentional "unused" marker (mock gateways,
      // interface-shaped signatures) — the convention the ported core already uses.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // The one boundary rule (v7 syntax): shared/ must never import from a feature area.
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'shared' } },
              disallow: { to: { element: { type: 'area' } } },
              message: 'shared/ must not import from a feature area',
            },
          ],
        },
      ],
    },
  },
)
