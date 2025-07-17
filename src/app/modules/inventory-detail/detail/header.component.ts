import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { type MatSelect } from '@angular/material/select'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import type { AccessLevelInstance, Label, Organization } from '@seed/api'
import { LabelComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { GenericView, GroupMapping, Profile, ViewResponse } from 'app/modules/inventory/inventory.types'
import { ModalComponent } from '../../column-list-profile/modal/modal.component'
import { MapComponent } from './map.component'

@Component({
  selector: 'seed-inventory-detail-header',
  templateUrl: './header.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    LabelComponent,
    MapComponent,
    MaterialImports,
    ModalComponent,
  ],
})
export class HeaderComponent implements OnInit {
  @Input() currentProfile: Profile
  @Input() labels: Label[]
  @Input() org: Organization
  @Input() profiles: Profile[]
  @Input() selectedView: GenericView
  @Input() view: ViewResponse
  @Input() views: GenericView[]
  @Input() type: 'properties' | 'taxlots'
  @Output() changeProfile = new EventEmitter<number>()
  @Output() changeView = new EventEmitter<number>()
  @Output() refreshDetail = new EventEmitter<null>()
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  groupMappings: GroupMapping[]
  accessLevelInstance: AccessLevelInstance
  aliDataSource = []
  aliColumns: string[] = []
  aliColumnDefs: ColDef[] = []
  aliRowData: Record<string, unknown>[] = []
  enableMap: boolean
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$

  actions = [
    {
      name: 'Add to/Remove from Groups',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Add/Remove Labels',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Add/Update UBID',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Export Audit Template File (XML)',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Export BuildingSync',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Export BuildingSync (Excel)',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Export to Audit Template',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Merge and Link Matches',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Only Show Populated Columns',
      action: () => {
        this.openShowPopulatedColumnsModal()
      },
      disabled: false,
    },
    {
      name: 'Run Analysis',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Update with Audit Template',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
    {
      name: 'Update with BuildingSync',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },

    {
      name: 'Update with ESPM',
      action: () => {
        this.tempAction()
      },
      disabled: true,
    },
  ]

  ngOnInit(): void {
    // taxlots will not have group mappings
    this.groupMappings = this.view.property?.group_mappings
    this.enableMap = Boolean(this.view.state.ubid && this.view.state.bounding_box && this.view.state.centroid)
    this.setAliGrid()
  }

  setAliGrid() {
    const inventoryKey = this.type === 'properties' ? 'property' : 'taxlot'

    // column defs (minus root level)
    for (const name of this.org.access_level_names.slice(1)) {
      this.aliColumnDefs.push({
        headerName: name,
        field: name,
        sortable: false,
        filter: false,
        resizable: true,
        suppressMovable: true,
        width: 100,
      })
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

  onChangeProfile(profileId: number) {
    this.changeProfile.emit(profileId)
  }

  onChangeView(viewId: number) {
    this.changeView.emit(viewId)
  }

  openShowPopulatedColumnsModal() {
    const dialogRef = this._dialog.open(ModalComponent, {
      width: '40rem',
      data: {
        columns: [],
        cycleId: this.view.cycle.id,
        inventoryType: this.type,
        location: 'Detail View Profile',
        mode: 'populate',
        orgId: this.org.id,
        profile: this.currentProfile,
        profiles: this.profiles,
        type: this.type === 'taxlots' ? 'Tax Lot' : 'Property',
      },
    })

    dialogRef.afterClosed().subscribe((message) => {
      if (message === 'refresh') this.refreshDetail.emit()
    })
  }

  trackByFn(_index: number, { id }: AccessLevelInstance) {
    return id
  }
}
