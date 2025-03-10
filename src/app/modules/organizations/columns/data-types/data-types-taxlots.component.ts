import { CommonModule } from '@angular/common'
import { type AfterViewInit, Component, type OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatPaginator } from '@angular/material/paginator'
import { MatSelectModule } from '@angular/material/select'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { map, takeUntil } from 'rxjs'
import { type Column } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { DataTypesComponent } from './data-types.component'

@Component({
  selector: 'seed-organizations-column-data-types-taxlots',
  templateUrl: './data-types.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, SharedImports, MatButtonModule, MatFormFieldModule, MatPaginator, MatSelectModule, MatTableModule, ReactiveFormsModule],
})
export class DataTypesTaxLotsComponent extends DataTypesComponent implements AfterViewInit, OnInit {
  type = 'TaxLotState'
  columnTableDataSource = new MatTableDataSource<Column>([])
  columnTableColumns = [
    'display_name',
    'data_type',
  ]
  @ViewChild(MatPaginator) paginator: MatPaginator

  ngOnInit(): void {
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).pipe(
      map((columns) => {
        this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => c.is_extra_data)
        for (const c of this.columns) {
          this.dataTypesForm.addControl(`${c.id}`, new FormControl((c.data_type), [Validators.required]))
        }
        this.columnTableDataSource.data = this.columns
      }),
    ).subscribe()
  }

  ngAfterViewInit() {
    this.columnTableDataSource.paginator = this.paginator
  }
}
