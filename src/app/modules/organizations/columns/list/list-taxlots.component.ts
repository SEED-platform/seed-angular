import { type AfterViewInit, Component, type OnDestroy, type OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatTooltip } from '@angular/material/tooltip'
import { map, takeUntil } from 'rxjs'
import { TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { ListComponent } from './list.component'

@Component({
  selector: 'seed-organizations-columns-list-taxlots',
  templateUrl: './list.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatFormFieldModule, MatIcon, MatInputModule, MatPaginator, MatTableModule, MatTooltip, TableContainerComponent],
})
export class ListTaxLotComponent extends ListComponent implements AfterViewInit, OnDestroy, OnInit {
  type = 'taxlots'
  @ViewChild(MatPaginator) paginator: MatPaginator

  ngOnInit(): void {
    this._columnService.taxLotColumns$
      .pipe(takeUntil(this._unsubscribeAll$))
      .pipe(
        map((columns) => {
          this.columnTableDataSource.data = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
        }),
      )
      .subscribe()
  }

  ngAfterViewInit() {
    this.columnTableDataSource.paginator = this.paginator
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
    this.columnTableDataSource.filter = filterValue.trim().toLowerCase()
  }
}
