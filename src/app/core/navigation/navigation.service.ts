import { inject, Injectable } from '@angular/core'
import type { NavigationItem, VerticalNavigationComponent } from '@seed/components'
import { SeedNavigationService } from '@seed/components'
import { DatasetService } from '../../../@seed/api/dataset'

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
      link: '/organizations',
      children: [
        {
          id: 'organizations/settings',
          link: 'organizations/settings',
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
          id: 'organizations/column-mappings',
          link: '/organizations/column-mappings/properties',
          title: 'Column mappings',
          icon: 'fa-solid:sitemap',
          type: 'basic',
          regexMatch: /^\/organizations\/column-mappings\/(properties|taxlots)/,
        },
        {
          id: 'organizations/column-settings',
          link: '/organizations/column-settings/properties',
          title: 'Column Settings',
          icon: 'fa-solid:sliders',
          type: 'basic',
          regexMatch: /^\/organizations\/column-settings\/(properties|taxlots)/,
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
          icon: 'fa-solid:user',
          type: 'basic',
        },
      ],
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
      this.updateBadge('data', 'mainNavigation', count)
    })
  }

  updateBadge(itemId: string, navigationName: string, title: string | number) {
    const dataComponent = this._seedNavigationService.getComponent<VerticalNavigationComponent>(navigationName)

    if (dataComponent) {
      // Get the navigation item, update the badge and refresh the component
      const navigation = dataComponent.navigation
      const item = this._seedNavigationService.getItem(itemId, navigation)
      item.badge = {
        title: String(title),
        classes: this._badgeClasses,
      }
      dataComponent.refresh()
    }
  }
}
