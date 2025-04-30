import { CommonModule } from '@angular/common'
import { Component, inject, Input, OnInit, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { SharedImports } from '@seed/directives'
import { DrawerService } from '../drawer'
import type { Config } from './page.types'
import { ActivatedRoute, Router } from '@angular/router'
import { InventoryType } from 'app/modules/inventory'
import { InventoryTabComponent } from './inventory-tab'

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
export class PageComponent implements OnInit {
  @Input() config: Config
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _drawerService = inject(DrawerService)
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  toggleDrawer() {
    this._drawerService.toggle()
  }

  ngOnInit() {
    console.log(this.type)
  }
  async toggleInventoryType(type: InventoryType) {
    // Hack to route to reload the current component
    if (type !== this.type) {
      const newUrl = this._router.url.replace(/^\/(properties|taxlots)/, `/${type}`)
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigateByUrl(newUrl)
    }
  }

  // ORIGINAL CODE - only worked with /properties and /taxlots (not /properties/...)
  // async toggleInventoryType(type: InventoryType) {
  //   if (type !== this.type) {
  //     // Hack to route to reload the current component
  //     await this._router.navigateByUrl('/', { skipLocationChange: true })
  //     await this._router.navigate([this.type === 'properties' ? 'taxlots' : 'properties'])
  //   }
  // }
}
