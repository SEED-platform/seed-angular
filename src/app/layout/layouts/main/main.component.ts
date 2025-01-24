import { CdkScrollable } from '@angular/cdk/scrolling'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { RouterLink, RouterOutlet } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { VersionService } from '@seed/api/version'
import { SEEDLoadingBarComponent, SeedNavigationService, VerticalNavigationComponent } from '@seed/components'
import { MediaWatcherService } from '@seed/services'
import { NavigationService } from 'app/core/navigation/navigation.service'
import type { Navigation } from 'app/core/navigation/navigation.types'
import { UserComponent } from 'app/layout/common/user/user.component'

@Component({
  selector: 'layout-main',
  templateUrl: './main.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CdkScrollable,
    MatButtonModule,
    MatIconModule,
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

  isScreenSmall: boolean
  navigation: Navigation
  navigationAppearance: 'default' | 'dense' = 'dense'
  private readonly _unsubscribeAll$ = new Subject<void>()
  version: string
  sha: string

  ngOnInit(): void {
    // Subscribe to navigation data
    this._navigationService.navigation$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((navigation: Navigation) => {
      this.navigation = navigation
    })

    // Subscribe to media changes
    this._mediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ matchingAliases }) => {
      // Check if the screen is small
      this.isScreenSmall = !matchingAliases.includes('md')

      // Change the navigation appearance
      this.navigationAppearance = this.isScreenSmall ? 'default' : 'dense'
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
