import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { PageComponent } from '@seed/components'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-list-cross-cycles',
  templateUrl: './cross-cycles.component.html',
  imports: [
    PageComponent,
  ],
})
export class CrossCyclesComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  ngOnInit(): void {
    console.log('MapCCross Cycles omponent initialized')
  }
}
