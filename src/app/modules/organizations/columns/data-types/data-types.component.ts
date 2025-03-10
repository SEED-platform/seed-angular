import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { Subject, takeUntil } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { type UploaderResponse } from '@seed/services/uploader'
import { UpdateModalComponent } from '../modal/update-modal.component'
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
  private _dialog = inject(MatDialog)
  columns: Column[]
  type: string
  dataTypesForm = new FormGroup({})
  dataTypes = DataTypes
  isLoading = true

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  save(): void {
    const changes = {}
    for (const column of this.columns) {
      const setting = this.dataTypesForm.get(`${column.id}`).value
      if (setting !== column.data_type) {
        changes[column.id] = { data_type: setting }
      }
    }
    if (Object.keys(changes).length > 0) {
      this._columnService.updateMultipleColumns(this.columns[0].organization_id, this.type, changes).subscribe((response: UploaderResponse) => {
        const dialogRef = this._dialog.open(UpdateModalComponent, {
          width: '40rem',
          data: { progressResponse: response },
        })
        dialogRef
          .afterClosed()
          .pipe(
            takeUntil(this._unsubscribeAll$),
          )
          .subscribe()
      })
    }
  }
}
