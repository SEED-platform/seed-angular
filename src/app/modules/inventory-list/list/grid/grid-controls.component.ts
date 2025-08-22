import { CommonModule } from '@angular/common'
import type { OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import type { GridApi } from 'ag-grid-community'
import { take, tap } from 'rxjs'
import type { CurrentUser, OrganizationUserSettings } from '@seed/api'
import { OrganizationService } from '@seed/api'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { Pagination } from '../../../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-grid-controls',
  templateUrl: './grid-controls.component.html',
  imports: [CommonModule, MaterialImports],
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
    this.resetPins()
    this.resetFilters()
    this.resetSorts()
    this.updateOrgUser()
  }

  resetFilters() {
    this.gridApi.setFilterModel(null)
    this.userSettings.filters = this.currentUser.settings.filters ?? {}
    this.userSettings.filters.properties = {}
    this.userSettings.filters.taxlots = {}
  }

  resetSorts() {
    this.userSettings.sorts = this.currentUser.settings?.sorts ?? {}
    this.userSettings.sorts.properties = []
    this.userSettings.sorts.taxlots = []
  }

  resetPins() {
    this.userSettings.pins = this.currentUser.settings?.pins ?? {}
    this.userSettings.pins.properties = { left: [], right: [] }
    this.userSettings.pins.taxlots = { left: [], right: [] }
  }

  updateOrgUser() {
    const { org_id, org_user_id } = this.currentUser
    this._organizationService.updateOrganizationUser(org_user_id, org_id, this.userSettings)
      .pipe(
        take(1),
        tap(() => {
          this.gridApi.resetColumnState()
          this.gridApi.applyColumnState({ defaultState: { pinned: null } })
          this.gridApi.refreshClientSideRowModel()
          this.gridApi.refreshCells({ force: true })
          this.gridApi.onSortChanged()
          this.gridApi.autoSizeAllColumns()
        }),
      )
      .subscribe()
  }
}
