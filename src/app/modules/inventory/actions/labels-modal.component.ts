import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit} from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import type { Label} from '@seed/api'
import { LabelService } from '@seed/api'
import { ModalHeaderComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { AgGridAngular } from 'ag-grid-angular'
import { Subject, takeUntil, tap } from 'rxjs'
import { InventoryType } from '../inventory.types'
import { CellValueChangedEvent, ColDef } from 'ag-grid-community'
import { ConfigService } from '@seed/services'

@Component({
  selector: 'seed-labels-modal',
  templateUrl: './labels-modal.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    FormsModule,
    MaterialImports,
    ModalHeaderComponent,
    ReactiveFormsModule,
  ],
})
export class LabelsModalComponent implements OnInit, OnDestroy {
  private _unsubscribeAll$ = new Subject<void>()
  private _dialogRef = inject(MatDialogRef<LabelsModalComponent>)
  private _configService = inject(ConfigService)
  private _labelService = inject(LabelService)
  columnDefs: ColDef[]
  labels: Label[] = []
  gridTheme$ = this._configService.gridTheme$

  data = inject(MAT_DIALOG_DATA) as { orgId: number; type: InventoryType; viewIds: number[] }

  ngOnInit(): void {
    this._labelService.labels$
      .pipe(
        tap((labels) => {
          this.labels = labels
          this.setGrid()
        }),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  setGrid() {
    this.columnDefs = [
      { field: 'name', headerName: 'Label', flex: 1 },
      { field: 'add', headerName: 'Add', flex: 0.5, editable: true },
      { field: 'remove', headerName: 'Remove', flex: 0.5, editable: true },
    ]
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { colDef, newValue, node } = event
    const field = colDef.field
    const otherField = field === 'add' ? 'remove' : 'add'
    const data = node.data as Label & { add: boolean; remove: boolean }

    if (newValue && data[otherField]) {
      node.setDataValue(otherField, false)
    }
  }
  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}