import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PageComponent } from '@seed/components'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-notes',
  templateUrl: './notes.component.html',
  imports: [
    PageComponent,
  ],
})
export class NotesComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  id: string
  type: InventoryType
  pageTitle: string
  breadCrumbMain: string

  ngOnInit(): void {
    this._route.parent.paramMap.subscribe((params) => {
      this.id = params.get('id')
      this.type = params.get('type') as InventoryType
      this.pageTitle = this.type === 'properties' ? 'Property Notes' : 'Tax Lot Notes'
      this.breadCrumbMain = this.type === 'taxlots' ? 'Tax Lots' : 'Properties'

      console.log('NotesComponent initialized')
      console.log('type', this.type)
    })
  }
}
