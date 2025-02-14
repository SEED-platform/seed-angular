import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from '../../inventory/inventory.types'

@Component({
  selector: 'seed-organizations-derived-columns',
  templateUrl: './derived-columns.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [InventoryTabComponent, PageComponent, SharedImports],
})
export class DerivedColumnsComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)

  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  ngOnInit(): void {
    console.log('organizations derived columns')
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/derived-columns/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
    }
  }
}
