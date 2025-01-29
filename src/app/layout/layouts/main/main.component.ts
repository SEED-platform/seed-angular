import { CdkScrollable } from '@angular/cdk/scrolling'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { RouterLink, RouterOutlet } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { type VersionResponse, VersionService } from '@seed/api/version'
import { type NavigationItem, SEEDLoadingBarComponent, SeedNavigationService, VerticalNavigationComponent } from '@seed/components'
import { MediaWatcherService } from '@seed/services'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { OrganizationSelectorComponent } from 'app/layout/common/organizations/organization_selector.component'
import { UserComponent } from 'app/layout/common/user/user.component'
import { DatasetService } from '../../../../@seed/api/dataset'

@Component({
  selector: 'layout-main',
  templateUrl: './main.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CdkScrollable,
    MatButtonModule,
    MatIconModule,
    OrganizationSelectorComponent,
    RouterLink,
    RouterOutlet,
    SEEDLoadingBarComponent,
    UserComponent,
    VerticalNavigationComponent,
  ],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private _datasetService = inject(DatasetService)
  private _mediaWatcherService = inject(MediaWatcherService)
  private _navigationService = inject(NavigationService)
  private _seedNavigationService = inject(SeedNavigationService)
  private _versionService = inject(VersionService)

  isScreenSmall: boolean
  navigation: NavigationItem[]
  navigationAppearance: 'default' | 'dense' = 'dense'
  private readonly _unsubscribeAll$ = new Subject<void>()
  version: string
  sha: string

  ngOnInit(): void {
    // Lazily get initial datasets count
    this._datasetService.countDatasets().subscribe()

    this.navigation = this._navigationService.navigation

    // Subscribe to media changes
    this._mediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ matchingAliases }: { matchingAliases: string[] }) => {
      // Check if the screen is small
      this.isScreenSmall = !matchingAliases.includes('md')

      // Change the navigation appearance
      this.navigationAppearance = this.isScreenSmall ? 'default' : 'dense'
    })

    this._versionService.version$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((vr: VersionResponse) => {
      this.version = vr.version
      this.sha = vr.sha
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
