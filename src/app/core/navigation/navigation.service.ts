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
      type: 'basic',
      icon: 'fa-solid:users',
      link: '/organizations',
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
