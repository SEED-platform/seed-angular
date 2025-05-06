import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatSelectModule } from '@angular/material/select'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, EMPTY, finalize, map, mergeMap, range, scan, switchMap, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import type { Organization, OrgCycle } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import type { FilterResponse, InventoryTypeGoal, State } from 'app/modules/inventory/inventory.types'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-inventory-list-map',
  templateUrl: './map.component.html',
  imports: [
    MatSelectModule,
    PageComponent,
    MatProgressBarModule,
    MatIconModule,
  ],
})
export class MapComponent implements OnInit {
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _route = inject(ActivatedRoute)

  currentUser: CurrentUser
  chunk = 250
  cycles: OrgCycle[]
  cycle: OrgCycle
  data: State[] = []
  defaultField: 'property_display_field' | 'taxlot_display_field'
  filteredRecords = 0
  geocodedData: State[] = []
  group: { views_list: number[] } // FUTURE: HANDLE GROUPS
  groupId: number // FUTURE: HANDLE GROUPS
  highlightDACs: true
  inProgress = false
  orgId: number
  progress = { current: 0, total: 0, percent: 0, chunk: 0 }
  requestParams: URLSearchParams
  requestData = {}
  type = this._route.snapshot.paramMap.get('type') as InventoryTypeGoal

  ngOnInit(): void {
    this.defaultField = this.type === 'properties' ? 'property_display_field' : 'taxlot_display_field'
    console.log('MapComponent initialized')
    this.initPage()
  }

  initPage() {
    this._organizationService.currentOrganization$.pipe(
      switchMap((org) => this.getDependencies(org)),
      switchMap(() => this.initMap()),
    ).subscribe()
  }

  getDependencies(org: Organization) {
    this.orgId = org.id
    this.cycles = org.cycles
    // if only one call, just use switchmap
    return combineLatest([
      this._userService.currentUser$,
    ]).pipe(
      tap(([currentUser]) => {
        this.currentUser = currentUser
        this.cycle = this.cycles.find((c) => c.cycle_id === this.currentUser.settings.cycleId) ?? this.cycles[0]
      }),
    )
  }

  initMap() {
    console.log('initMap')
    this.inProgress = true
    this.progress = { current: 0, total: 0, percent: 0, chunk: 0 }
    if (!this.cycle) {
      console.error('No cycle selected')
      return EMPTY
    }
    return this.getTotalRecords().pipe(
      switchMap((totalPages) => this.fetchRecords(totalPages)),
    )
  }

  getTotalRecords() {
    const inventory_type = this.type === 'properties' ? 'property' : 'taxlot'
    const include_property_ids = this.type === 'goal' ? this.group?.views_list : []

    this.chunk = 10

    this.requestParams = new URLSearchParams({
      cycle: this.cycle.cycle_id.toString(),
      ids_only: 'false',
      include_related: 'true',
      page: null,
      organization_id: this.orgId.toString(),
      per_page: this.chunk.toString(),
      inventory_type,
    })

    this.requestData = {
      include_property_ids,
      profile_id: null,
      filters: null,
      sorts: null,
    }

    return this._inventoryService.getRecordCount(this.orgId, this.cycle.cycle_id, this.type).pipe(
      map((count: number) => {
        this.progress.total = count
        const totalPages = Math.ceil(count / this.chunk)
        this.progress.chunk = 100 / totalPages
        return totalPages
      }),
    )
  }

  fetchRecords(totalPages: number) {
    return range(1, totalPages).pipe(
      mergeMap((page: number) => {
        this.requestParams.set('page', page.toString())
        return this._inventoryService.getAgInventory(this.requestParams.toString(), this.requestData).pipe(
          map(({ results }: FilterResponse) => results),
          tap(() => { this.updateProgress() }),
        )
      }),
      scan((allData: State[], pageData: State[]) => [...allData, ...pageData], []),
      tap((allData: State[]) => this.data = allData),
      finalize(() => {
        this.inProgress = false
      }),
      // accumulate results as they come in (flattening page arrays into one)
    )
  }

  updateProgress() {
    this.progress.percent += this.progress.chunk
    this.progress.current = Math.min(this.progress.current + this.chunk, this.progress.total)
  }

  getPageRange(count: number) {
    const start = 1
    const end = Math.ceil(count / this.chunk)

    return [...Array.from({ length: end - start + 1 }, (_, i) => i + start)]
  }

  getAllRecords() {
    console.log('getAllRecords')
  }

  selectCycle() {
    console.log('Selected cycle:', this.cycle)
    this.currentUser.settings.cycleId = this.cycle.cycle_id
    this.updateOrgUserSettings().pipe(
      switchMap(() => this.initMap()),
    ).subscribe()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.currentUser.id, this.orgId, this.currentUser.settings)
  }
}
