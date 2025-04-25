import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PageComponent } from '@seed/components'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-list-profiles',
  templateUrl: './column-list-profiles.component.html',
  imports: [
    PageComponent,
  ],
})
export class ColumnListProfilesComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  pageTitle = this.type === 'taxlots' ? 'Tax Lot Column Profiles' : 'Property Column Profiles'

  ngOnInit(): void {
    console.log('ColumnListProfilesComponent initialized')
  }
}
