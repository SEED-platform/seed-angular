import { CdkDrag, type CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop'
import { Component, inject, type OnDestroy, type OnInit, ViewEncapsulation } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIcon } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltip } from '@angular/material/tooltip'
import { Subject, takeUntil } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { type UploaderResponse } from '@seed/services/uploader/uploader.types'
import { naturalSort } from '@seed/utils'
import { UpdateModalComponent } from '../modal/update-modal.component'

@Component({
  selector: 'seed-organizations-column-geocoding-properties',
  templateUrl: './geocoding.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, CdkDropList, CdkDrag, MatButtonModule, MatIcon, MatSelectModule, MatTooltip, ReactiveFormsModule],
})
export class GeocodingComponent implements OnDestroy, OnInit {
  private _columnService = inject(ColumnService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _dialog = inject(MatDialog)
  columns: Column[]
  availableColumns: Column[]
  removedColumns: Column[] = []
  type: string
  dirty = false
  addForm = new FormGroup({
    addGeocoder: new FormControl<number>(null, [Validators.required]),
  })

  ngOnInit(): void {
    if (this.type === 'PropertyState') {
      this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
        this.columns = columns.sort((a, b) => a.geocoding_order - b.geocoding_order).filter((c) => c.geocoding_order != 0)
        this.availableColumns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => c.geocoding_order === 0)
      })
    } else if (this.type === 'TaxLotState') {
      this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
        this.columns = columns.sort((a, b) => a.geocoding_order - b.geocoding_order).filter((c) => c.geocoding_order != 0)
        this.availableColumns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => c.geocoding_order === 0)
      })
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex)
    this.dirty = true
  }

  delete(column: Column) {
    this.columns = this.columns.filter((c) => c.id !== column.id)
    this.availableColumns.push(column)
    this.availableColumns.sort((a, b) => naturalSort(a.display_name, b.display_name))
    this.removedColumns.push(column)
    this.dirty = true
  }

  add() {
    const columnToAdd = this.availableColumns.find((c) => c.id === this.addForm.get('addGeocoder').value)
    this.availableColumns = this.availableColumns.filter((c) => c.id !== columnToAdd.id)
    columnToAdd.geocoding_order = this.columns.length + 1
    this.columns.push(columnToAdd)
    this.dirty = true
  }

  save() {
    const changes = {}
    for (const [i, column] of this.columns.entries()) {
      changes[column.id] = { geocoding_order: (i + 1) }
    }
    for (const c of this.removedColumns) {
      changes[c.id] = { geocoding_order: 0 }
    }
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
