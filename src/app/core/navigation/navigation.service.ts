import { inject, Injectable } from '@angular/core'
import { DatasetService } from '@seed/api/dataset'
import type { NavigationItem, VerticalNavigationComponent } from '@seed/components'
import { SeedNavigationService } from '@seed/components'

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private _datasetService = inject(DatasetService)
  private _seedNavigationService = inject(SeedNavigationService)

  private _badgeClasses = 'px-2 bg-primary-900 rounded-full'

  readonly navigation: NavigationItem[] = [
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
    },
    {
      id: 'organizations',
      title: 'Organizations',
      type: 'collapsible',
      icon: 'fa-solid:users',
      children: [
        {
          id: 'organizations/settings',
          link: '/organizations/settings',
          title: 'Settings',
          icon: 'fa-solid:gears',
          type: 'basic',
        },
        {
          id: 'organizations/access-level-tree',
          link: '/organizations/access-level-tree',
          title: 'Access Level Tree',
          icon: 'fa-solid:sitemap',
          type: 'basic',
        },
        {
          id: 'organizations/columns',
          link: '/organizations/columns/list/properties',
          title: 'Columns',
          icon: 'fa-solid:sliders',
          type: 'basic',
          regexMatch: /^\/organizations\/columns/,
        },
        {
          id: 'organizations/cycles',
          link: '/organizations/cycles',
          title: 'Cycles',
          icon: 'fa-solid:calendar-days',
          type: 'basic',
        },
        {
          id: 'organizations/data-quality',
          link: '/organizations/data-quality/properties',
          title: 'Data Quality',
          icon: 'fa-solid:flag',
          type: 'basic',
          regexMatch: /^\/organizations\/data-quality\/(properties|taxlots|goal)/,
        },
        {
          id: 'organizations/derived-columns',
          link: '/organizations/derived-columns/properties',
          title: 'Derived Columns',
          icon: 'fa-solid:calculator',
          type: 'basic',
          regexMatch: /^\/organizations\/derived-columns\/(properties|taxlots)/,
        },
        {
          id: 'organizations/email-templates',
          link: '/organizations/email-templates',
          title: 'Email Templates',
          icon: 'fa-solid:envelope',
          type: 'basic',
        },
        {
          id: 'organizations/labels',
          link: '/organizations/labels',
          title: 'Labels',
          icon: 'fa-solid:tags',
          type: 'basic',
        },
        {
          id: 'organizations/members',
          link: '/organizations/members',
          title: 'Members',
          icon: 'fa-solid:users',
          type: 'basic',
        },
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      type: 'collapsible',
      icon: 'fa-solid:gauge-high',
      children: [
        {
          id: 'insights/program-overview',
          link: '/insights/program-overview',
          title: 'Program Overview',
          icon: 'fa-solid:chart-simple',
          type: 'basic',
        },
        {
          id: 'insights/property-insights',
          link: '/insights/property-insights',
          title: 'Property Insights',
          icon: 'fa-solid:chart-line',
          type: 'basic',
        },
        {
          id: 'insights/default-reports',
          link: '/insights/default-reports',
          title: 'Default Reports',
          icon: 'fa-solid:chart-column',
          type: 'basic',
        },
        {
          id: 'insights/custom-reports',
          link: '/insights/custom-reports',
          title: 'Custom Reports',
          icon: 'fa-solid:chart-area',
          type: 'basic',
        },
        {
          id: 'insights/portfolio-summary',
          link: '/insights/portfolio-summary',
          title: 'Portfolio Summary',
          icon: 'fa-solid:square-poll-horizontal',
          type: 'basic',
        },
      ],
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
      link: '/api-documentation',
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

  constructor() {
    this._datasetService.datasetCount$.subscribe((count) => {
      // Use a timeout to avoid the race condition where mainNavigation hasn't been registered yet
      setTimeout(() => {
        this.updateBadge('data', 'mainNavigation', count)
      })
    })
  }

  updateBadge(itemId: string, navigationName: string, title: string | number) {
    const dataComponent: VerticalNavigationComponent | undefined = this._seedNavigationService.getComponent(navigationName)

    if (dataComponent) {
      // Get the navigation item, update the badge and refresh the component
      const navigation = dataComponent.navigation()
      const item = this._seedNavigationService.getItem(itemId, navigation)
      item.badge = {
        title: String(title),
        classes: this._badgeClasses,
      }
      dataComponent.refresh()
    }
  }
}
