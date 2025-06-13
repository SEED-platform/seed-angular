import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject, Input, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { LoadingService } from '@seed/services'
import type { InventoryType } from 'app/modules/inventory'
import { DrawerService } from '../drawer'
import { InventoryTabComponent } from './inventory-tab'
import type { Config } from './page.types'

@Component({
  selector: 'seed-page',
  templateUrl: './page.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    InventoryTabComponent,
    SharedImports,
  ],
  encapsulation: ViewEncapsulation.None,
  styles: ':host { @apply flex; @apply flex-auto }',
})
export class PageComponent implements OnDestroy {
  @Input() config: Config
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _drawerService = inject(DrawerService)
  private _loadingService = inject(LoadingService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  loading: boolean

  constructor() {
    this._loadingService.show$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((loading) => this.loading = loading)
  }

  toggleDrawer() {
    this._drawerService.toggle()
  }

  async toggleInventoryType(type: InventoryType) {
    // Hack to route to reload the current component
    if (type !== this.type) {
      const newUrl = this._router.url.replace(/^\/(properties|taxlots)/, `/${type}`)
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigateByUrl(newUrl)
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
