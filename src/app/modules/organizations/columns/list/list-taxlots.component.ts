import { Component, inject, type OnDestroy, type OnInit, ViewEncapsulation } from '@angular/core'
import { MatIcon } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatTooltip } from '@angular/material/tooltip'
import { Subject, takeUntil } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-organizations-columns-list-taxlots',
  templateUrl: './list.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatIcon, MatTableModule, MatTooltip],
})
export class ListTaxLotComponent implements OnDestroy, OnInit {
  private _columnService = inject(ColumnService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columnTableDataSource = new MatTableDataSource<Column>([])
  columnTableColumns = [
    'canonical',
    'display_name',
    'column_name',
    'column_description',
    'actions',
  ]
  type = 'taxlots'

  ngOnInit(): void {
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
      this.columnTableDataSource.data = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
    })
  }

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
}
