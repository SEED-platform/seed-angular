import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subject } from 'rxjs'
import { PageComponent } from '@seed/components'
import type { InventoryType } from '../inventory.types'

@Component({
  selector: 'seed-inventory-detail',
  templateUrl: './detail.component.html',
  imports: [
    PageComponent,
  ],
})
export class DetailComponent implements OnDestroy {
  private _activatedRoute = inject(ActivatedRoute)
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  readonly viewId = this._activatedRoute.snapshot.paramMap.get('id') as InventoryType
  private readonly _unsubscribeAll$ = new Subject<void>()

  pageTitle = this.type === 'taxlots' ? 'Tax Lot Detail' : 'Property Detail'

  constructor() {
    console.log('Detail')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
