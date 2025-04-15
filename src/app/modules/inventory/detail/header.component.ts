import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { type MatSelect, MatSelectModule } from '@angular/material/select'
import { MatTableModule } from '@angular/material/table'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { Label } from '@seed/api/label'
import type { AccessLevelInstance, Organization } from '@seed/api/organization'
import { LabelComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { GenericView, GroupMapping, ViewResponse } from '../inventory.types'
import { MapComponent } from './map.component'

@Component({
  selector: 'seed-inventory-detail-header',
  templateUrl: './header.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MapComponent,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    LabelComponent,
  ],
})
export class HeaderComponent implements OnInit {
  @Input() labels: Label[]
  @Input() org: Organization
  @Input() selectedView: GenericView
  @Input() view: ViewResponse
  @Input() views: GenericView[]
  @Input() type: 'properties' | 'taxlots'
  @Output() changeView = new EventEmitter<number>()
  private _configService = inject(ConfigService)
  groupMappings: GroupMapping[]
  accessLevelInstance: AccessLevelInstance
  aliDataSource = []
  aliColumns: string[] = []
  aliColumnDefs: ColDef[] = []
  aliRowData: Record<string, unknown>[] = []
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$

  actions = [
    { name: 'Add to/Remove from Groups', action: () => { this.tempAction() }, disabled: false },
    { name: 'Add/Remove Labels', action: () => { this.tempAction() }, disabled: false },
    { name: 'Add/Update UBID', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export Audit Template File (XML)', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export BuildingSync', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export BuildingSync (Excel)', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export to Audit Template', action: () => { this.tempAction() }, disabled: false },
    { name: 'Merge and Link Matches', action: () => { this.tempAction() }, disabled: false },
    { name: 'Only Show Populated Columns', action: () => { this.tempAction() }, disabled: false },
    { name: 'Run Analysis', action: () => { this.tempAction() }, disabled: false },
    { name: 'Update with Audit Template', action: () => { this.tempAction() }, disabled: false },
    { name: 'Update with BuildingSync', action: () => { this.tempAction() }, disabled: false },
    { name: 'Update with ESPM', action: () => { this.tempAction() }, disabled: false },
  ]

  ngOnInit(): void {
    // taxlots will not have group mappings
    this.groupMappings = this.view.property?.group_mappings
    this.setAliGrid()
  }

  setAliGrid() {
    const inventoryKey = this.type === 'properties' ? 'property' : 'taxlot'

    // column defs
    for (const name of this.org.access_level_names.slice(1)) {
      this.aliColumnDefs.push(
        {
          headerName: name,
          field: name,
          sortable: false,
          filter: false,
          resizable: true,
          suppressMovable: true,
          width: 100,
        },
      )
    }
    // row data
    this.aliRowData.push(this.view[inventoryKey].access_level_instance.path)
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
  }

  tempAction() {
    console.log('temp action')
  }

  onAction(action: () => void, select: MatSelect) {
    action()
    select.value = null
  }

  trackByFn(_index: number, { id }: AccessLevelInstance) {
    return id
  }

  onChangeView(viewId: number) {
    this.changeView.emit(viewId)
  }
}
