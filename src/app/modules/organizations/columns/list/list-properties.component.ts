import { type AfterViewInit, Component, inject, type OnDestroy, type OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatTooltip } from '@angular/material/tooltip'
import { Subject, takeUntil } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-organizations-columns-list-properties',
  templateUrl: './list.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatFormFieldModule, MatIcon, MatInputModule, MatPaginator, MatTableModule, MatTooltip],
})
export class ListPropertiesComponent implements AfterViewInit, OnDestroy, OnInit {
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
  type = 'properties'
  @ViewChild(MatPaginator) paginator: MatPaginator

  ngOnInit(): void {
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
      this.columnTableDataSource.data = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
    })
  }

  ngAfterViewInit(): void {
    this.columnTableDataSource.paginator = this.paginator
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.columnTableDataSource.filter = filterValue.trim().toLowerCase()
  }
}
