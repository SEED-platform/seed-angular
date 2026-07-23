import { CdkDrag, type CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop'
import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { Subject, takeUntil } from 'rxjs'
import type { Column, ProgressResponse } from '@seed/api'
import { ColumnService } from '@seed/api'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import { naturalSort } from '@seed/utils'
import { UpdateModalComponent } from '../modal/update-modal.component'

@Component({
  selector: 'seed-organizations-column-geocoding-properties',
  templateUrl: './geocoding.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, CdkDropList, CdkDrag, MaterialImports, ReactiveFormsModule],
})
export class GeocodingComponent implements OnDestroy {
  protected _columnService = inject(ColumnService)
  protected readonly _unsubscribeAll$ = new Subject<void>()
  private _dialog = inject(MatDialog)
  columns: Column[]
  availableColumns: Column[]
  removedColumns: Column[] = []
  type: string
  dirty = false
  addForm = new FormGroup({
    addGeocoder: new FormControl<number>(null, [Validators.required]),
  })

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
      changes[column.id] = { geocoding_order: i + 1 }
    }
    for (const c of this.removedColumns) {
      changes[c.id] = { geocoding_order: 0 }
    }
    this._columnService
      .updateMultipleColumns(this.columns[0].organization_id, this.type, changes)
      .subscribe((response: ProgressResponse) => {
        const dialogRef = this._dialog.open(UpdateModalComponent, {
          width: '40rem',
          data: { progressResponse: response },
        })
        dialogRef.afterClosed().pipe(takeUntil(this._unsubscribeAll$)).subscribe()
      })
  }
}
