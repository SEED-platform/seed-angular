import type { OnInit } from '@angular/core'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { type MatSelect, MatSelectModule } from '@angular/material/select'
import { MatTableModule } from '@angular/material/table'
import type { Label } from '@seed/api/label'
import type { AccessLevelInstance, Organization } from '@seed/api/organization'
import { LabelComponent } from '@seed/components'
import type { GenericView, GroupMapping, ViewResponse } from '../inventory.types'

@Component({
  selector: 'seed-inventory-detail-header',
  templateUrl: './header.component.html',
  imports: [
    MatButtonModule,
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
  groupMappings: GroupMapping[]
  accessLevelInstance: AccessLevelInstance
  // aliDataSource = new MatTableDataSource<unknown>([])
  aliDataSource = []
  // aliHeaders = this.org.access_level_names
  aliColumns: string[] = []

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
    this.formatAliData()
  }

  formatAliData() {
    const inventoryKey = this.type === 'properties' ? 'property' : 'taxlot'
    this.accessLevelInstance = this.view[inventoryKey].access_level_instance

    this.aliColumns = this.org.access_level_names
    this.aliDataSource = [this.view[inventoryKey].access_level_instance.path]
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
    console.log('onChangeView', viewId)
    this.changeView.emit(viewId)
  }
}
