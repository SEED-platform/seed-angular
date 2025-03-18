import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ActivatedRoute, Router } from '@angular/router'
import type { ColDef } from 'ag-grid-community'
import { forkJoin, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { InventoryService } from '@seed/api/inventory'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { InventoryGridComponent, InventoryGridControlsComponent } from './grid'
import type { InventoryPagination, InventoryType, Profile } from './inventory.types'

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    PageComponent,
    SharedImports,
    InventoryTabComponent,
    InventoryGridComponent,
    InventoryGridControlsComponent,
  ],
})
export class InventoryComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _router = inject(Router)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _columnService = inject(ColumnService)
  private _labelService = inject(LabelService)
  private _orgId: number = null
  private _cycle: Cycle
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  chunk = 100
  columnDefs: ColDef[]
  cycles: Cycle[]
  cycleId: number
  labelLookup: Record<number, Label> = {}
  pagination: InventoryPagination
  profileId: number | null = null
  profiles: Profile[]
  properties: Record<string, unknown>[]
  propertyColumns: Column[]
  propertyProfiles: Profile[]
  rowData: Record<string, unknown>[]
  taxlotColumns: Column[]

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(({ org_id }) => {
        return this.getDependencies(org_id)
      }),
    ).subscribe()
  }

  /*
  * get cycles, profiles, columns, inventory
  */
  getDependencies(org_id: number) {
    this._orgId = org_id

    return forkJoin({
      cycles: this._cycleService.get(this._orgId),
      profiles: this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
      propertyColumns: this._columnService.propertyColumns$.pipe(take(1)),
      labels: this._labelService.labels$.pipe(take(1)),
    }).pipe(
      tap((results) => { this.setDependencies(results) }),
    )
  }

  /*
  * set class variables: cycles, profiles, columns, inventory
  */
  setDependencies({ cycles, profiles, propertyColumns, labels }: { cycles: Cycle[]; profiles: Profile[]; propertyColumns: Column[]; labels: Label[] }) {
    this.cycles = cycles
    this._cycle = cycles.at(2) ?? null
    this.cycleId = this._cycle?.id

    this.profiles = profiles
    this.propertyProfiles = this.profiles.filter((p) => p.inventory_type === 0)
    this.propertyColumns = propertyColumns

    for (const label of labels) {
      this.labelLookup[label.id] = label
    }

    const id = this.profiles.length ? this.profiles[0].id : null
    this.getProfile(id)
  }

  /*
  * get profile and reload inventory
  */
  getProfile(id: number) {
    const profileRequest = id ? this._inventoryService.getColumnListProfile(id) : of(null)
    profileRequest.subscribe((profile) => {
      this.profileId = profile?.id
      this.loadInventory(1)
    })
  }

  onProfileChange(id: number) {
    this.getProfile(id)
  }

  onCycleChange(id: number) {
    this.cycleId = id
    this._cycle = this.cycles.find((cycle) => cycle.id === id)
    this.loadInventory(1)
  }

  /*
  * Loads inventory for the grid
  */
  loadInventory(page: number) {
    console.log('load inventory')

    const params = {
      cycle: this._cycle.id,
      ids_only: false,
      include_related: true,
      organization_id: this._orgId,
      page,
      per_page: this.chunk,
    }
    const data = {
      include_property_ids: null,
      profile_id: this.profileId,
    }
    this._inventoryService.getAgProperties(params, data).subscribe(({ pagination, results, column_defs }) => {
      this.pagination = pagination
      this.properties = results
      this.columnDefs = column_defs
      this.rowData = results
    })
  }

  onPageChange(page: number) {
    this.loadInventory(page)
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      // Hack to route to reload the current component
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigate([this.type === 'properties' ? 'taxlots' : 'properties'])
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
