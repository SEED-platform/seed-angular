import type { NavigationItem } from '@seed/components'

const badgeClasses = 'px-2 bg-primary-900 rounded-full'

export const defaultNavigation: NavigationItem[] = [
  {
    id: 'inventory',
    title: 'Inventory',
    type: 'basic',
    icon: 'fa-solid:building',
    link: '/properties',
    regexMatch: /^\/(properties|taxlots)/,
  },
  {
    id: 'data',
    title: 'Data',
    type: 'basic',
    icon: 'fa-solid:sitemap',
    link: '/data',
    badge: {
      title: '1',
      classes: badgeClasses,
    },
  },
  {
    id: 'organizations',
    title: 'Organizations',
    type: 'basic',
    icon: 'fa-solid:users',
    link: '/organizations',
    badge: {
      title: '198',
      classes: badgeClasses,
    },
  },
  {
    id: 'insights',
    title: 'Insights',
    type: 'basic',
    icon: 'fa-solid:gauge-high',
    link: '/insights',
  },
  {
    id: 'analyses',
    title: 'Analyses',
    type: 'basic',
    icon: 'fa-solid:chart-bar',
    link: '/analyses',
  },
  {
    type: 'divider',
  },
  {
    id: 'documentation',
    title: 'Documentation',
    type: 'basic',
    icon: 'fa-solid:book',
    link: '/documentation',
  },
  {
    id: 'api',
    title: 'API Documentation',
    type: 'basic',
    icon: 'fa-solid:code',
    link: '/api',
  },
  {
    id: 'contact',
    title: 'Contact',
    type: 'basic',
    icon: 'fa-solid:circle-question',
    link: '/contact',
  },
  {
    id: 'about',
    title: 'About',
    type: 'basic',
    icon: 'fa-solid:circle-info',
    link: '/about',
  },
]
