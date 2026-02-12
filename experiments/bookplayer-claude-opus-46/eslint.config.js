import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.output/',
      '.nitro/',
      '.tanstack/',
      'src/routeTree.gen.ts',
    ],
  },
]
