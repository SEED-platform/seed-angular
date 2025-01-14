import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatRippleModule } from '@angular/material/core'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { ActivatedRoute, Router } from '@angular/router'
import { SharedImports } from '../../../@seed'
import type { InventoryType } from './inventory.types'

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatButtonModule, MatIconModule, MatRippleModule, MatTabsModule, SharedImports],
})
export class InventoryComponent {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)

  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._route.snapshot.paramMap.get('type') as InventoryType

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      // Hack to route to reload the current component
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigate([this.type === 'properties' ? 'taxlots' : 'properties'])
    }
  }
}
