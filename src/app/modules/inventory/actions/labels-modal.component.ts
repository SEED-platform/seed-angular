import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit} from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import type { Label, LabelColor} from '@seed/api'
import { LabelService } from '@seed/api'
import { ModalHeaderComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { AgGridAngular } from 'ag-grid-angular'
import { Subject, switchMap, takeUntil, tap } from 'rxjs'
import { InventoryType } from '../inventory.types'
import { CellValueChangedEvent, ColDef } from 'ag-grid-community'
import { ConfigService } from '@seed/services'
import { SEEDValidators } from '@seed/validators'

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
  colors: LabelColor[] = ['red', 'orange', 'blue', 'light blue', 'green', 'gray']
  columnDefs: ColDef[]
  existingNames: string[] = []
  gridTheme$ = this._configService.gridTheme$
  gridHeight = 0
  labels: Label[] = []
  newLabel: Label
  rowData: (Label & { add: boolean; remove: boolean })[] = []

  data = inject(MAT_DIALOG_DATA) as { orgId: number; type: InventoryType; viewIds: number[] }

  form = new FormGroup({
    organization_id: new FormControl<number>(this.data.orgId),
    name: new FormControl<string>(null),
    color: new FormControl<LabelColor>('gray'),
    show_in_list: new FormControl<boolean>(true),
  })

  ngOnInit(): void {
    this._labelService.labels$
      .pipe(
        tap((labels) => {
          this.labels = labels
          this.setValidator()
          this.setGrid()
        }),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  setValidator() {
    this.existingNames = this.labels.map((g) => g.name)
    const nameCtrl = this.form.get('name')
    nameCtrl?.setValidators([
      SEEDValidators.uniqueValue(this.existingNames),
    ])
  }

  setGrid() {
    this.getGridHeight()
    this.setColDefs()
    this.setRowData()
  }

  setRowData() {
    this.rowData = this.labels.map((group) => ({
      ...group,
      add: group.id === this.newLabel?.id,
      remove: false,
    }))

    this.newLabel = null
  }

  setColDefs() {
    this.columnDefs = [
      {
        field: 'name',
        headerName: 'Label',
        flex: 1,
        cellRenderer: this.labelRenderer,
      },
      { field: 'add', headerName: 'Add', flex: 0.2, editable: true },
      { field: 'remove', headerName: 'Remove', flex: 0.2, editable: true },
    ]
  }

  labelRenderer({ data }: { data: Label }) {
    return `
      <div class="label ${data.color} whitespace-nowrap px-2">${data.name}</div>
    `
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

  getGridHeight() {
    this.gridHeight = Math.min(this.labels.length * 42 + 52, 500)
  }

  onSubmit() {
    const data = this.form.value as Label
    this._labelService.create(data)
      .pipe(
        tap((label) => { this.newLabel = label }),
        switchMap(() => this._labelService.getByOrgId(data.organization_id)),
        tap(() => { this.form.reset() }),
      )
      .subscribe()
  }

  done() {
    const { orgId, viewIds, type } = this.data
    const addLabelIds: number[] = this.rowData.filter((g) => g.add).map((g) => g.id)
    const removeLabelIds: number[] = this.rowData.filter((g) => g.remove).map((g) => g.id)

    if (!addLabelIds.length && !removeLabelIds.length) {
      this.close()
      return
    }

    this._labelService.updateLabelInventory(orgId, viewIds, type, addLabelIds, removeLabelIds).subscribe(() => {
      this.close(true)
    })
  }

  close(success = false) {
    this._dialogRef.close(success)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
