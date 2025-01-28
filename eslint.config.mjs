// @ts-check
// import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import angular from 'angular-eslint'
import github from 'eslint-plugin-github'
import importPlugin from 'eslint-plugin-import'
// import perfectionist from 'eslint-plugin-perfectionist'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // cspellESLintPluginRecommended,
  {
    files: ['**/*.ts', '**/*.mts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      stylistic.configs.customize({
        arrowParens: true,
        braceStyle: '1tbs',
        commaDangle: 'always-multiline',
        indent: 2,
        jsx: false,
        quoteProps: 'as-needed',
        semi: false,
      }),
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      github,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': ['error', {
        type: 'element',
        prefix: ['seed', 'auth', 'layout'],
        style: 'kebab-case',
      }],
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
        multilineDetection: 'brackets',
      }],
      '@stylistic/quotes': ['error', 'single', {
        avoidEscape: true,
      }],
      '@stylistic/type-annotation-spacing': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', {
        allowNumber: true,
      }],
      'github/array-foreach': 'error',
      'import/no-deprecated': 'error',
      'import/no-empty-named-blocks': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-unused-modules': 'error',
      'import/no-useless-path-segments': ['error', {
        noUselessIndex: true,
      }],
      'import/order': ['error', {
        alphabetize: {
          order: 'asc',
          orderImportKind: 'asc',
          caseInsensitive: true,
        },
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
        ],
        'newlines-between': 'never',
      }],
      'no-sequences': ['error', {
        allowInParentheses: false,
      }],
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'semi-style': ['error', 'first'],
      'sort-imports': ['error', {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      }],
      // TODO after enable strict
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // TODO
      '@typescript-eslint/unbound-method': 'off',
      'camelcase': 'off',
      'import/no-cycle': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // TODO
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
    },
  },
)
