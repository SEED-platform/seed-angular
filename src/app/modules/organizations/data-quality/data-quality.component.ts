import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-organizations-data-quality',
  templateUrl: './data-quality.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [InventoryTabComponent, PageComponent, SharedImports],
})
export class DataQualityComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)

  readonly tabs: InventoryType[] = ['properties', 'taxlots', 'goal']
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  readonly table_type = 'Data Quality'
  readonly urlSegment = 'data-quality'

  ngOnInit(): void {
    console.log('organizations data quality')
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/data-quality/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
    }
  }
}
