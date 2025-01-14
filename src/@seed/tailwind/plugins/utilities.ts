import plugin from 'tailwindcss/plugin'

export const utilities = plugin(({ addComponents }) => {
  /*
   * Add base components. These are very important for everything to look
   * correct. We are adding these to the 'components' layer because they must
   * be defined before pretty much everything else.
   */
  addComponents({
    '.mat-icon': {
      '--tw-text-opacity': '1',
      color: 'rgba(var(--seed-mat-icon-rgb), var(--tw-text-opacity))',
    },
    '.text-default': {
      '--tw-text-opacity': '1 !important',
      color: 'rgba(var(--seed-text-default-rgb), var(--tw-text-opacity)) !important',
    },
    '.text-secondary': {
      '--tw-text-opacity': '1 !important',
      color: 'rgba(var(--seed-text-secondary-rgb), var(--tw-text-opacity)) !important',
    },
    '.text-hint': {
      '--tw-text-opacity': '1 !important',
      color: 'rgba(var(--seed-text-hint-rgb), var(--tw-text-opacity)) !important',
    },
    '.text-disabled': {
      '--tw-text-opacity': '1 !important',
      color: 'rgba(var(--seed-text-disabled-rgb), var(--tw-text-opacity)) !important',
    },
    '.divider': {
      color: 'var(--seed-divider) !important',
    },
    '.bg-card': {
      '--tw-bg-opacity': '1 !important',
      backgroundColor: 'rgba(var(--seed-bg-card-rgb), var(--tw-bg-opacity)) !important',
    },
    '.bg-default': {
      '--tw-bg-opacity': '1 !important',
      backgroundColor: 'rgba(var(--seed-bg-default-rgb), var(--tw-bg-opacity)) !important',
    },
    '.bg-dialog': {
      '--tw-bg-opacity': '1 !important',
      backgroundColor: 'rgba(var(--seed-bg-dialog-rgb), var(--tw-bg-opacity)) !important',
    },
    '.ring-bg-default': {
      '--tw-ring-opacity': '1 !important',
      '--tw-ring-color': 'rgba(var(--seed-bg-default-rgb), var(--tw-ring-opacity)) !important',
    },
    '.ring-bg-card': {
      '--tw-ring-opacity': '1 !important',
      '--tw-ring-color': 'rgba(var(--seed-bg-card-rgb), var(--tw-ring-opacity)) !important',
    },
  })

  addComponents({
    '.bg-hover': {
      backgroundColor: 'var(--seed-bg-hover) !important',
    },
  })
})
