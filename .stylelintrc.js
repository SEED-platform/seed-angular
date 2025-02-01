module.exports = {
  extends: 'stylelint-config-standard-scss',
  rules: {
    // Fix later
    'no-descending-specificity': null,
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['screen', 'tailwind']
      }
    ],
    'scss/dollar-variable-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*|([a-z][a-z0-9]*)(_[a-z0-9]+)*$',
      {
        message: 'Expected variable to be kebab-case or snake_case'
      }
    ],
    'scss/no-global-function-names': null,
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*|([a-z][a-z0-9]*)(_[a-z0-9]+)*$',
      {
        message: 'Expected class selector to be kebab-case or snake_case'
      }
    ],
    'selector-id-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*|([a-z][a-z0-9]*)(_[a-z0-9]+)*$',
      {
        message: 'Expected id selector to be kebab-case or snake_case'
      }
    ],
    'value-keyword-case': [
      'lower',
      {
        camelCaseSvgKeywords: true
      }]
  }
};
