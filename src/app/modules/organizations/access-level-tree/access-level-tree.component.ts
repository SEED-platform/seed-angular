import { NgClass, NgTemplateOutlet } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatSidenavModule } from '@angular/material/sidenav'
import { Subject, takeUntil } from 'rxjs'
import type { AccessLevelTree } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { DrawerMode } from '@seed/components'
import { PageComponent } from '@seed/components'
import { MediaWatcherService } from '@seed/services'

@Component({
  selector: 'seed-organizations-access-level-tree',
  templateUrl: './access-level-tree.component.html',
  imports: [MatButtonModule, MatMenuModule, MatIconModule, MatSidenavModule, NgTemplateOutlet, PageComponent, MatDivider, NgClass],
  encapsulation: ViewEncapsulation.None,
})
export class AccessLevelTreeComponent implements OnInit, OnDestroy {
  private _mediaWatcherService = inject(MediaWatcherService)
  private _organizationService = inject(OrganizationService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  accessLevelNames: AccessLevelTree['accessLevelNames']
  accessLevelTree: AccessLevelTree['accessLevelTree']
  drawerMode: DrawerMode = 'side'
  drawerOpened = true

  expanded = new Set<number>()

  ngOnInit(): void {
    this._mediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ matchingAliases }) => {
      if (matchingAliases.includes('md')) {
        this.drawerMode = 'side'
        this.drawerOpened = true
      } else {
        this.drawerMode = 'over'
        this.drawerOpened = false
      }
    })

    this._organizationService.accessLevelTree$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ accessLevelNames, accessLevelTree }) => {
      this.accessLevelNames = accessLevelNames
      this.accessLevelTree = accessLevelTree
    })
  }

  toggleDrawer = (): void => {
    this.drawerOpened = !this.drawerOpened
  }

  toggleExpand = (id: number): void => {
    if (this.expanded.has(id)) {
      this.expanded.delete(id)
    } else {
      this.expanded.add(id)
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
