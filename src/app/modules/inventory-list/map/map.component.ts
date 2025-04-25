import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PageComponent } from '@seed/components'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-list-map',
  templateUrl: './map.component.html',
  imports: [
    PageComponent,
  ],
})
export class MapComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  pageTitle = this.type === 'taxlots' ? 'Tax Lots Map' : 'Properties Map'

  ngOnInit(): void {
    console.log('MapComponent initialized')
  }
}
