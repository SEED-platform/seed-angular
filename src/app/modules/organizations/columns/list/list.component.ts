import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatTableDataSource } from '@angular/material/table'
import { Subject, takeUntil } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
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
  columnTableColumns = [
    'canonical',
    'display_name',
    'column_name',
    'column_description',
    'actions',
  ]
  type: string

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  delete(column: Column) {
    console.log('Delete called for column: ', column)
  }

  rename(column: Column) {
    console.log('Rename called for column: ', column)
  }

  edit(column: Column) {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { column },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.columnTableDataSource.filter = filterValue.trim().toLowerCase()
  }
}
