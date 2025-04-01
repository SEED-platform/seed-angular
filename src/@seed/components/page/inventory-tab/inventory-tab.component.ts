import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subject } from 'rxjs'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from 'app/modules/inventory/inventory.types'
import type { Config } from './inventory-tab.types'

@Component({
  selector: 'seed-page-inventory-tab',
  templateUrl: './inventory-tab.component.html',
  imports: [CommonModule, SharedImports],
})
export class InventoryTabComponent implements OnDestroy, OnInit {
  private _route = inject(ActivatedRoute)
  @Input() config: Config
  type: InventoryType
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    this._route.paramMap.subscribe((params) => {
      this.type = params.get('type') as InventoryType
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
