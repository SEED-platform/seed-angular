import { CdkScrollable } from '@angular/cdk/scrolling'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router'
import { filter, Subject, takeUntil, tap } from 'rxjs'
import { VersionService } from '@seed/api'
import type { NavigationItem } from '@seed/components'
import { SEEDLoadingBarComponent, SeedNavigationService, VerticalNavigationComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { MediaWatcherService } from '@seed/services'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { OrganizationSelectorComponent } from 'app/layout/common/organization-selector/organization-selector.component'
import { UserComponent } from 'app/layout/common/user/user.component'
import { type InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'layout-main',
  templateUrl: './main.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CdkScrollable,
    MaterialImports,
    OrganizationSelectorComponent,
    RouterLink,
    RouterOutlet,
    SEEDLoadingBarComponent,
    UserComponent,
    VerticalNavigationComponent,
  ],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private _mediaWatcherService = inject(MediaWatcherService)
  private _navigationService = inject(NavigationService)
  private _seedNavigationService = inject(SeedNavigationService)
  private _versionService = inject(VersionService)
  private _router = inject(Router)
  private _route = inject(ActivatedRoute)

  isScreenSmall: boolean
  navigation: NavigationItem[]
  navigationAppearance: 'default' | 'dense' = 'dense'
  private readonly _unsubscribeAll$ = new Subject<void>()
  version: string
  sha: string
  type: InventoryType

  ngOnInit(): void {
    this.navigation = this._navigationService.navigation

    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap(() => {
          this.navigation = this._navigationService.getNavigation()
        }),
      )
      .subscribe()

    // Subscribe to media changes
    this._mediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ matchingAliases }) => {
      // Check if the screen is small
      this.isScreenSmall = !matchingAliases.includes('md')

      // Change the navigation appearance
      this.navigationAppearance = this.isScreenSmall ? 'dense' : 'default'
    })

    this._versionService.version$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ version, sha }) => {
      this.version = version
      this.sha = sha
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  /**
   * Toggle navigation
   *
   * @param name
   */
  toggleNavigation(name: string): void {
    // Get the navigation
    const navigation = this._seedNavigationService.getComponent<VerticalNavigationComponent>(name)

    if (navigation) {
      // Toggle the opened status
      navigation.toggle()
    }
  }

  /**
   * Toggle the navigation appearance
   */
  toggleNavigationAppearance(): void {
    this.navigationAppearance = this.navigationAppearance === 'default' ? 'dense' : 'default'
  }
}
