import { Component, inject, type OnDestroy, type OnInit, ViewEncapsulation } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClassParams, CellDoubleClickedEvent, ColDef, ColGroupDef, GridApi, GridOptions, GridReadyEvent, IRowNode, ValueFormatterParams } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { saveAs } from 'file-saver'
import { combineLatest, Subject, takeUntil, tap } from 'rxjs'
import { type Column, MappableColumnService } from '@seed/api/column'
import { type ColumnMapping, type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column_mapping_profile/'
import { SharedImports } from '@seed/directives'
import { ActionButtonsComponent } from './action-buttons.component'
import { CreateModalComponent } from './modal/create-modal.component'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { EditModalComponent } from './modal/edit-modal.component'
import { RenameModalComponent } from './modal/rename-modal.component'

ModuleRegistry.registerModules([AllCommunityModule])

type DataType = {
  id: string;
  value: string;
  type: string;
}
type RenderMapping = ColumnMapping & {
  column: Column | null;
  unit_label: string;
}

@Component({
  selector: 'seed-organizations-column-mappings',
  templateUrl: './mappings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [AgGridAngular, SharedImports, MatButtonModule, MatIcon, MatFormFieldModule, ReactiveFormsModule, MatSelectModule, MatTooltipModule],
})
export class MappingsComponent implements OnDestroy, OnInit {
  private _dialog = inject(MatDialog)
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _mappableColumnService = inject(MappableColumnService)
  protected readonly _unsubscribeAll$ = new Subject<void>()
  private _gridApi!: GridApi<ColumnMapping>
  profiles: ColumnMappingProfile[]
  mappablePropertyColumns: Column[]
  mappableTaxlotColumns: Column[]
  selectedProfile: ColumnMappingProfile
  dataTypes: DataType[] = [
    { id: '', value: 'None', type: 'none' },
    { id: 'ft**2', value: 'square feet', type: 'area' },
    { id: 'm**2', value: 'square metres', type: 'area' },
    { id: 'kBtu/ft**2/year', value: 'kBtu/ft²/year', type: 'eui' },
    { id: 'kWh/m**2/year', value: 'kWh/m²/year', type: 'eui' },
    { id: 'GJ/m**2/year', value: 'GJ/m²/year', type: 'eui' },
    { id: 'MJ/m**2/year', value: 'MJ/m²/year', type: 'eui' },
    { id: 'kBtu/m**2/year', value: 'kBtu/m²/year', type: 'eui' },
    { id: 'MtCO2e/year', value: 'MtCO2e/year', type: 'ghg' },
    { id: 'kgCO2e/year', value: 'kgCO2e/year', type: 'ghg' },
    { id: 'kgal/ft**2/year', value: 'kgal/ft²/year', type: 'wui' },
    { id: 'gal/ft**2/year', value: 'gal/ft²/year', type: 'wui' },
    { id: 'L/m**2/year', value: 'L/m²/year', type: 'wui' },
    { id: 'MtCO2e/ft**2/year', value: 'MtCO2e/ft²/year', type: 'ghg_intensity' },
    { id: 'kgCO2e/ft**2/year', value: 'kgCO2e/ft²/year', type: 'ghg_intensity' },
    { id: 'MtCO2e/m**2/year', value: 'MtCO2e/m²/year', type: 'ghg_intensity' },
    { id: 'kgCO2e/m**2/year', value: 'kgCO2e/m²/year', type: 'ghg_intensity' },
    { id: 'kgal/year', value: 'kgal/year', type: 'water_use' },
    { id: 'gal/year', value: 'gal/year', type: 'water_use' },
    { id: 'L/year', value: 'L/year', type: 'water_use' },
  ]
  columnDefs: ColDef[] | ColGroupDef[] = [
    { headerName: 'SEED', children: [
      { headerName: 'Omit?', field: 'is_omitted', cellRenderer: 'agCheckboxCellRenderer',
        editable: false, width: 100,

      },
      { headerName: 'Inventory Type',
        field: 'to_table_name',
        editable: false,
        valueFormatter: (params: ValueFormatterParams) => { return (params.value as string).slice(0, -5) },
      },
      {
        headerName: 'SEED Header',
        field: 'to_field',
        valueFormatter: (params: ValueFormatterParams<RenderMapping>) => { return (params.data.column?.display_name || params.value) as string },
      },
      { headerName: 'Measurement Units', field: 'from_units',
        editable: false,
        valueFormatter: (params: ValueFormatterParams<RenderMapping>) => { return params.data.unit_label },
        cellClass: (params: CellClassParams<RenderMapping>) => {
          if (this.measuredColumn(params.node) && !params.data.from_units) {
            return 'bg-red-300'
          } else {
            return ''
          }
        },
      },
    ],
    },
    { headerName: 'Profile', children: [
      {
        headerName: 'Data File Header',
        field: 'from_field',
        cellClass: (params: CellClassParams<RenderMapping>) => {
          if (this.countFromFieldsInGrid(params.data.from_field) > 1) {
            return 'bg-red-300'
          } else {
            return ''
          }
        },
      },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: ActionButtonsComponent,
        cellRendererParams: {
          onDelete: (data: ColumnMapping, node: IRowNode<RenderMapping>) => { this.deleteMapping(data, node) },
          onEdit: (data: ColumnMapping, node: IRowNode<RenderMapping>) => { this.editMapping(data, node) },
        },
      },
    ],
    },
  ]
  rowData = []
  gridOptions: GridOptions = {
    columnDefs: this.columnDefs,
    pagination: false,
    suppressCellFocus: true,
  }
  gridReady = false
  changesToSave = false

  isLoaded = false
  selectedProfileForm = new FormGroup({ selectedProfile: new FormControl<number | null>(null) })

  ngOnInit(): void {
    combineLatest([
      this._mappableColumnService.taxLotColumns$,
      this._mappableColumnService.propertyColumns$,
      this._columnMappingProfileService.profiles$,
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([taxLotColumns, propertyColumns, profiles]) => {
        this.mappableTaxlotColumns = taxLotColumns
        this.mappablePropertyColumns = propertyColumns
        this.profiles = profiles
        this.selectedProfile = profiles[0]
        this.selectedProfileForm.get('selectedProfile').setValue(this.selectedProfile.id)
        this.rowData = this.buildRenderMappings(this.selectedProfile.mappings)
      })
    this.isLoaded = true
  }

  ngOnDestroy(): void {
    this._gridApi = undefined
  }

  toFieldRenderer(params: ValueFormatterParams) {
    const mapping = params.data as ColumnMapping
    const col = this.getColumn(mapping.to_table_name, params.value as string)
    if (col) {
      return col.display_name
    } else {
      return params.value as string
    }
  }

  lookupDataType(params: string): string {
    if (!params) {
      return ''
    }
    const dt = this.dataTypes.find((d) => d.id === params)
    if (dt) {
      return dt.value
    } else {
      return ''
    }
  }

  buildRenderMappings(mappings: ColumnMapping[]): RenderMapping[] {
    return mappings.map((m: ColumnMapping) => {
      const rm: RenderMapping = {
        is_omitted: m.is_omitted,
        to_field: m.to_field,
        to_table_name: m.to_table_name,
        from_units: m.from_units,
        from_field: m.from_field,
        column: this.getColumn(m.to_table_name, m.to_field),
        unit_label: this.lookupDataType(m.from_units),
      }
      return rm
    })
  }

  onGridReady(params: GridReadyEvent<ColumnMapping>) {
    this._gridApi = params.api
  }

  populateGrid(profile: ColumnMappingProfile) {
    this._gridApi.setGridOption('rowData', this.buildRenderMappings(profile.mappings))
  }

  countFromFieldsInGrid(matchValue: string): number {
    if (!this.gridReady) {
      return 0
    }
    let count = 0
    this._gridApi.forEachNode((node: IRowNode<RenderMapping>, _index) => {
      if (node.data.from_field === matchValue) {
        count += 1
      }
    })
    return count
  }

  selectProfile() {
    const profileId = this.selectedProfileForm.get('selectedProfile').value
    if (profileId !== this.selectedProfile.id) {
      this.selectedProfile = this.profiles.find((p) => p.id === profileId)
    }
    this.populateGrid(this.selectedProfile)
    this.changesToSave = false
  }

  profileReadOnly() {
    if (!this.selectedProfile) {
      return true
    }
    return this.selectedProfile.profile_type !== 'Normal'
  }

  seedHeaderName(mapping: ColumnMapping): string {
    if (!this.mappablePropertyColumns || !this.mappableTaxlotColumns) {
      return ''
    }
    const col = this.getColumn(mapping.to_table_name, mapping.to_field)
    if (col) {
      return col.display_name
    }
    return mapping.to_field
  }

  getColumn(table_name: string, to_field: string): Column | null {
    if (!this.mappablePropertyColumns || !this.mappableTaxlotColumns) {
      return null
    }
    if (table_name === 'PropertyState') {
      return this.mappablePropertyColumns.find((c) => c.column_name === to_field) || null
    }
    if (table_name === 'TaxLotState') {
      return this.mappableTaxlotColumns.find((c) => c.column_name === to_field) || null
    }
    return null
  }

  measuredColumn(node: IRowNode<RenderMapping>) {
    if (!node.data.column) {
      return false
    }
    return ['area', 'eui', 'ghg', 'wui', 'ghg_intensity', 'water_use'].includes(node.data.column.data_type)
  }

  unitSelections(mapping: ColumnMapping) {
    const col = this.getColumn(mapping.to_table_name, mapping.to_field)
    if (!col) {
      return []
    }
    switch (col.data_type) {
      case 'area':
        return [
          { id: 'ft**2', value: 'square feet' },
          { id: 'm**2', value: 'square metres' },
        ]
      case 'eui':
        return [
          { id: 'kBtu/ft**2/year', value: 'kBtu/ft²/year' },
          { id: 'kWh/m**2/year', value: 'kWh/m²/year' },
          { id: 'GJ/m**2/year', value: 'GJ/m²/year' },
          { id: 'MJ/m**2/year', value: 'MJ/m²/year' },
          { id: 'kBtu/m**2/year', value: 'kBtu/m²/year' },
        ]
      case 'ghg':
        return [
          { id: 'MtCO2e/year', value: 'MtCO2e/year' },
          { id: 'kgCO2e/year', value: 'kgCO2e/year' },
        ]
      case 'wui':
        return [
          { id: 'kgal/ft**2/year', value: 'kgal/ft²/year' },
          { id: 'gal/ft**2/year', value: 'gal/ft²/year' },
          { id: 'L/m**2/year', value: 'L/m²/year' },
        ]
      case 'ghg_intensity':
        return [
          { id: 'MtCO2e/ft**2/year', value: 'MtCO2e/ft²/year' },
          { id: 'kgCO2e/ft**2/year', value: 'kgCO2e/ft²/year' },
          { id: 'MtCO2e/m**2/year', value: 'MtCO2e/m²/year' },
          { id: 'kgCO2e/m**2/year', value: 'kgCO2e/m²/year' },
        ]
      case 'water_use':
        return [
          { id: 'kgal/year', value: 'kgal/year' },
          { id: 'gal/year', value: 'gal/year' },
          { id: 'L/year', value: 'L/year' },
        ]
      default:
        return []
    }
  }

  getMappingsFromForm(): ColumnMapping[] {
    const mappings: ColumnMapping[] = []
    /*
    for (const group of Object.keys(this.profileForm.controls)) {
      if (group === 'profile_id') {
        continue
      }
      const c: ColumnMapping = {
        from_field: this.profileForm.get(group).get('from_field').value as string,
        to_field: this.profileForm.get(group).get('to_field').value as string,
        to_table_name: this.profileForm.get(group).get('to_table_name').value as 'PropertyState' | 'TaxlotState',
        from_units: this.profileForm.get(group).get('from_units').value as string,
        is_omitted: this.profileForm.get(group).get('is_omitted').value as boolean | null,
      }
      mappings.push(c)
    }
    */
    return mappings
  }

  onCellDoubleClicked(event: CellDoubleClickedEvent) {
    this.editMapping(event.data as ColumnMapping, event.node)
  }

  deleteMapping(_mapping: ColumnMapping, node: IRowNode<RenderMapping>): void {
    this._gridApi.applyTransaction({ remove: [node.data] })
    this.changesToSave = true
  }

  editMapping(mapping: ColumnMapping, node: IRowNode): void {
    const dialogRef = this._dialog.open(EditModalComponent, {
      width: '80rem',
      data: { profile: this.selectedProfile, mapping, org_id: this.mappablePropertyColumns[0].organization_id, columns: [].concat(this.mappablePropertyColumns, this.mappableTaxlotColumns) },
    })
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((newMapping: ColumnMapping) => {
          if (newMapping) {
            node.setData(this.buildRenderMappings([newMapping])[0])
            this.changesToSave = true
          }
        }),
      )
      .subscribe()
  }

  create() {
    const dialogRef = this._dialog.open(CreateModalComponent, {
      width: '40rem',
      data: { mappings: this.getMappingsFromForm(), org_id: this.mappablePropertyColumns[0].organization_id },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((newProfileId: number) => {
          this._columnMappingProfileService.getProfiles(this.mappablePropertyColumns[0].organization_id).subscribe(
            () => {
              if (newProfileId) {
                this.selectedProfileForm.get('selectedProfile').setValue(newProfileId)
                this.selectProfile()
              }
            },
          )
        }),
      )
      .subscribe()
  }

  delete() {
    const profileToDelete = this.selectedProfile
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { profile: profileToDelete, org_id: this.mappablePropertyColumns[0].organization_id },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.selectedProfileForm.get('selectedProfile').setValue(this.profiles.find((p) => p.id !== profileToDelete.id).id)
          this.selectProfile()
          this._columnMappingProfileService.getProfiles(this.mappablePropertyColumns[0].organization_id).subscribe()
        }),
      )
      .subscribe()
  }

  rename() {
    const profileToUpdate = this.selectedProfile

    const dialogRef = this._dialog.open(RenameModalComponent, {
      width: '40rem',
      data: { profile: profileToUpdate, org_id: this.mappablePropertyColumns[0].organization_id },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this._columnMappingProfileService.getProfiles(this.mappablePropertyColumns[0].organization_id).subscribe(() => {
            this.selectedProfileForm.get('selectedProfile').setValue(profileToUpdate.id)
            this.selectProfile()
          })
        }),
      )
      .subscribe()
  }

  export() {
    this._columnMappingProfileService.export(this.mappablePropertyColumns[0].organization_id, this.selectedProfile.id)
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((blob) => {
        saveAs(blob, `column_mapping_profile_${this.selectedProfile.id}.csv`)
      })
  }

  suggest() {
    const headers = this.selectedProfile.mappings.map((m) => m.from_field)
    this._columnMappingProfileService.suggestions(this.mappablePropertyColumns[0].organization_id, headers)
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((suggestions) => {
        for (const k of Object.keys(suggestions)) {
          this.selectedProfile.mappings.find((m) => m.from_field === k).to_table_name = suggestions[k][0]
          this.selectedProfile.mappings.find((m) => m.from_field === k).to_field = suggestions[k][1]
        }
        this.populateGrid(this.selectedProfile)
      })
  }

  copy() {
    for (const m of this.selectedProfile.mappings) {
      m.to_field = m.from_field
    }
    this.populateGrid(this.selectedProfile)
    this.changesToSave = true
  }

  save() {
    const orgId = this.mappablePropertyColumns[0].organization_id
    const mappings: ColumnMapping[] = []
    this._gridApi.forEachNode((rowNode, _index) => {
      mappings.push(this.buildMappingFromRowNode(rowNode))
    })
    this._columnMappingProfileService.updateMappings(orgId, this.selectedProfile.id, mappings).subscribe((updatedProfile) => {
      const i = this.profiles.indexOf(this.selectedProfile)
      this.profiles[i] = updatedProfile
      this.populateGrid(this.profiles[i])
    })
  }

  buildMappingFromRowNode(rowNode: IRowNode<ColumnMapping>) {
    return {
      to_field: rowNode.data.to_field,
      from_field: rowNode.data.from_field,
      from_units: rowNode.data.from_units,
      to_table_name: rowNode.data.to_table_name,
      is_omitted: rowNode.data.is_omitted,
    } as ColumnMapping
  }
}
