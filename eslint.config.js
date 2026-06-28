import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import globals from 'globals'

// Feature-Sliced Design layers, highest → lowest. A module may import only from
// layers at or below its own — enforced by `boundaries/dependencies`. Expressed
// once here as v6 object selectors.
const FSD_LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']
const fsdDependencyRules = FSD_LAYERS.map((from) => ({
  from: { type: from },
  allow: FSD_LAYERS.slice(FSD_LAYERS.indexOf(from)).map((type) => ({ to: { type } })),
}))

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: true,
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages/*' },
        { type: 'widgets', pattern: 'src/widgets/*' },
        { type: 'features', pattern: 'src/features/*' },
        { type: 'entities', pattern: 'src/entities/*' },
        { type: 'shared', pattern: 'src/shared' },
      ],
      'boundaries/ignore': ['**/*.{test,spec}.{ts,tsx}'],
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'boundaries/dependencies': ['error', { default: 'disallow', rules: fsdDependencyRules }],
    },
  },
  {
    // The code-based router defines route objects alongside their components in one
    // file by design; Fast Refresh's component-only-export rule does not apply here.
    files: ['src/app/router.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
)
