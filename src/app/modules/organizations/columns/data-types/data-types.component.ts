import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { Subject } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { DataTypes } from './data-types.constants'

@Component({
  selector: 'seed-organizations-column-data-types-properties',
  template: '',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})

export class DataTypesComponent implements OnDestroy {
  protected _columnService = inject(ColumnService)
  protected readonly _unsubscribeAll$ = new Subject<void>()
  columns: Column[]
  type: string
  dataTypesForm = new FormGroup({})
  dataTypes = DataTypes
  isLoading = true

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
