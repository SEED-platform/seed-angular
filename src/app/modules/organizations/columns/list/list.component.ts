import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatTableDataSource } from '@angular/material/table'
import { Subject, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-organizations-columns-list-properties',
  template: '',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ListComponent implements OnDestroy {
  protected _columnService = inject(ColumnService)
  protected readonly _unsubscribeAll$ = new Subject<void>()
  private _dialog = inject(MatDialog)
  columnTableDataSource = new MatTableDataSource<Column>([])
  columnTableColumns = ['canonical', 'display_name', 'column_name', 'column_description', 'actions']
  type: string

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  delete(column: Column): void {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { column },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          if (column.table_name === 'PropertyState') {
            this._columnService.getPropertyColumns(column.organization_id).subscribe()
          } else if (column.table_name === 'TaxLotState') {
            this._columnService.getTaxLotColumns(column.organization_id).subscribe()
          }
        }),
      )
      .subscribe()
  }

  rename(column: Column) {
    console.log('Rename called for column: ', column)
  }

  edit(column: Column) {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { column },
    })

    dialogRef.afterClosed().pipe(takeUntil(this._unsubscribeAll$)).subscribe()
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.columnTableDataSource.filter = filterValue.trim().toLowerCase()
  }
}
