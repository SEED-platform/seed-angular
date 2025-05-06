import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatSelectModule } from '@angular/material/select'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, EMPTY, switchMap, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'
import type { Organization, OrgCycle } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import type { InventoryTypeGoal, State } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-list-map',
  templateUrl: './map.component.html',
  imports: [
    MatSelectModule,
    PageComponent,
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
  orgId: number
  progress: { current: number; total: number; percent: number }
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
    return this.fetchRecords()
  }

  fetchRecords() {
    if (!this.cycle) return EMPTY

    return this._inventoryService.getRecordCount(this.orgId, this.cycle.cycle_id, this.type).pipe(
      tap((count) => {
        console.log('count', count)
      }),
    )
    // const inventory_type = this.type === 'properties' ? 'property' : 'taxlot'
    // const include_property_ids = this.type === 'goal' ? this.group?.views_list : []
    // // TEMP
    // this.chunk = 10
    // let page = 1

    // const params = new URLSearchParams({
    //   cycle: this.cycle.cycle_id.toString(),
    //   ids_only: 'false',
    //   include_related: 'true',
    //   organization_id: this.orgId.toString(),
    //   page: page.toString(),
    //   per_page: this.chunk.toString(),
    //   inventory_type,
    // })

    // const data = {
    //   include_property_ids,
    //   profile_id: null,
    //   filters: null,
    //   sorts: null,
    // }

    // let pageNumbers = []

    // return this._inventoryService.getAgInventory(params.toString(), data).pipe(
    //   tap(({ pagination, results }: AgFilterResponse) => {
    //     this.data = results
    //     this.progress = { current: 0, total: pagination.total, percent: 0 }
    //     // generate a range of remaining pages
    //     pageNumbers = this.pageRange(2, pagination.num_pages)
    //   }),
    // )
  }

  pageRange(start: number, end: number) {
    return [...Array.from({ length: end - start + 1 }, (_, i) => i + start)]
  }

  getAllRecords() {
    console.log('getAllRecords')
  }

  selectCycle() {
    console.log('Selected cycle ID:', this.cycle.cycle_id)
  }
}
