import { CommonModule } from '@angular/common'
import type { OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import type { GridApi } from 'ag-grid-community'
import { take } from 'rxjs'
import type { OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { ConfigService } from '@seed/services'
import type { Pagination } from '../../../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-grid-controls',
  templateUrl: './grid-controls.component.html',
  imports: [
    CommonModule,
    MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, MatTooltipModule],
})
export class InventoryGridControlsComponent implements OnChanges, OnInit {
  @Input() currentUser!: CurrentUser
  @Input() gridApi: GridApi
  @Input() pagination!: Pagination
  @Input() selectedViewIds: number[]
  @Output() pageChange = new EventEmitter<number>()
  private _configService = inject(ConfigService)
  private _organizationService = inject(OrganizationService)
  scheme: 'dark' | 'light'
  userSettings: OrganizationUserSettings

  ngOnInit(): void {
    this._configService.scheme$.subscribe((scheme) => {
      this.scheme = scheme
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentUser?.currentValue) {
      this.userSettings = this.currentUser.settings
    }
  }

  onPageChange = (direction: 'first' | 'previous' | 'next' | 'last') => {
    const { page, num_pages } = this.pagination
    const pageLookup = { first: 1, previous: page - 1, next: page + 1, last: num_pages }

    const newPage = pageLookup[direction]
    if (newPage < 1 || newPage > num_pages) return

    this.pageChange.emit(newPage)
  }

  resetGrid() {
    this.resetColumns()
    this.resetFilters()
    this.resetSorts()
    this.gridApi.refreshClientSideRowModel()
    this.gridApi.refreshCells({ force: true })
    this.resetUserSettings()
  }

  resetColumns() {
    const columns = this.gridApi.getColumns()
    this.gridApi.resetColumnState()
    this.gridApi.autoSizeColumns(columns)
  }

  resetFilters() {
    this.gridApi.setFilterModel(null)
    this.userSettings.filters = this.currentUser.settings.filters ?? {}
    this.userSettings.filters.properties = {}
    this.userSettings.filters.taxlots = {}
    this.updateOrgUser()
  }

  resetSorts() {
    this.gridApi.applyColumnState({ state: [], applyOrder: true })
    this.userSettings.sorts = this.currentUser.settings?.sorts ?? {}
    this.userSettings.sorts.properties = []
    this.userSettings.sorts.taxlots = []
    this.updateOrgUser()
  }

  resetUserSettings() {
    this.userSettings = {}
    this.updateOrgUser()
  }

  updateOrgUser() {
    const { org_id, org_user_id } = this.currentUser
    this._organizationService.updateOrganizationUser(org_user_id, org_id, this.userSettings)
      .pipe((take(1)))
      .subscribe()
  }
}
