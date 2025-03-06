import { CommonModule } from '@angular/common'
import { type AfterViewInit, Component, inject, type OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatPaginator } from '@angular/material/paginator'
import { MatSelectModule } from '@angular/material/select'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { takeUntil } from 'rxjs'
import { type Column } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { type UploaderResponse } from '@seed/services/uploader/uploader.types'
import { naturalSort } from '@seed/utils'
import { UpdateModalComponent } from '../modal/update-modal.component'
import { DataTypesComponent } from './data-types.component'

@Component({
  selector: 'seed-organizations-column-data-types-properties',
  templateUrl: './data-types.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, SharedImports, MatButtonModule, MatFormFieldModule, MatPaginator, MatSelectModule, MatTableModule, ReactiveFormsModule],
})
export class DataTypesPropertiesComponent extends DataTypesComponent implements AfterViewInit, OnInit {
  type = 'PropertyState'
  private _dialog = inject(MatDialog)
  columnTableDataSource = new MatTableDataSource<Column>([])
  columnTableColumns = [
    'display_name',
    'data_type',
  ]
  @ViewChild(MatPaginator) paginator: MatPaginator

  ngOnInit(): void {
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
      this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => c.is_extra_data)
      for (const c of this.columns) {
        this.dataTypesForm.addControl(`${c.id}`, new FormControl((c.data_type), [Validators.required]))
      }
      if (this.columns.length > 0) {
        this.isLoading = false
      }
      this.columnTableDataSource.data = this.columns
    })
  }

  ngAfterViewInit(): void {
    this.columnTableDataSource.paginator = this.paginator
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
