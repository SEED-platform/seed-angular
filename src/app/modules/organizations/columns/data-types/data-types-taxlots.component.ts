import { CommonModule } from '@angular/common'
import { type AfterViewInit, Component, type OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatPaginator } from '@angular/material/paginator'
import { MatSelectModule } from '@angular/material/select'
import { MatTableModule } from '@angular/material/table'
import { map, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { TableContainerComponent } from '@seed/components'
import { DataTypesComponent } from './data-types.component'

@Component({
  selector: 'seed-organizations-column-data-types-taxlots',
  templateUrl: './data-types.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, SharedImports, TableContainerComponent, MatButtonModule, MatFormFieldModule, MatInputModule, MatPaginator, MatSelectModule, MatTableModule, ReactiveFormsModule],
})
export class DataTypesTaxLotsComponent extends DataTypesComponent implements AfterViewInit, OnInit {
  type = 'TaxLotState'
  @ViewChild(MatPaginator) paginator: MatPaginator

  ngOnInit(): void {
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).pipe(
      map((columns) => {
        this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
        this.initializeFormControls()
        this.columnTableDataSource.data = this.columns
      }),
    ).subscribe()
  }

  ngAfterViewInit() {
    this.columnTableDataSource.paginator = this.paginator
  }
}
