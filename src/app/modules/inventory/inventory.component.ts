import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTabsModule } from '@angular/material/tabs'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridModule } from 'ag-grid-angular'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef, GridOptions } from 'ag-grid-community'
import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community'
import { combineLatest, of, Subject, switchMap, takeUntil } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { InventoryService } from '@seed/api/inventory'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent } from '@seed/components'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryPagination, InventoryType, Profile } from './inventory.types'

// ModuleRegistry.registerModules([AllCommunityModule])
ModuleRegistry.registerModules([ClientSideRowModelModule])

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    AgGridAngular,
    AgGridModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    PageComponent,
    SharedImports,
    InventoryTabComponent,
  ],
})
export class InventoryComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _router = inject(Router)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _columnService = inject(ColumnService)
  private _orgId: number
  private _cycles: Cycle[]
  private _cycle: Cycle
  private readonly _unsubscribeAll$ = new Subject<void>()
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  pagination: InventoryPagination
  properties: Record<string, unknown>[]
  profiles: Profile[]
  currentProfile: Profile = {
    id: null,
    inventory_type: null,
    name: null,
    profile_location: null,
  }
  propertyColumns: Column[]
  taxlotColumns: Column[]

  columnDefs: ColDef[]
  rowData: Record<string, unknown>[]
  gridOptions: GridOptions = { rowModelType: 'clientSide' }

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(({ org_id }) => {
        this._orgId = org_id
        return combineLatest([
          this._cycleService.get(this._orgId),
          this._inventoryService.getColumnListProfiles('List View Profile', 'properties', true),
          this._columnService.propertyColumns$,
        ])
      }),
      switchMap(([cycles, profiles, propertyColumns]) => {
        this._cycles = cycles
        this._cycle = cycles.at(0) ?? null
        this.profiles = profiles
        this.propertyColumns = propertyColumns
        if (cycles.length) this.loadInventory(1)

        return profiles.length
          ? this._inventoryService.getColumnListProfile(profiles.at(0).id)
          : of(null)
      }),
    ).subscribe((profile) => {
      this.currentProfile = profile
      console.log('current p', this.currentProfile)
    })
  }

  loadInventory(page: number) {
    const params = {
      cycle: this._cycle.id,
      ids_only: false,
      include_related: true,
      organization_id: this._orgId,
      page,
      per_page: 100,
    }
    const data = {
      include_property_ids: null,
    }
    this._inventoryService.getProperties(params, data).subscribe(({ pagination, results}) => {
      this.pagination = pagination
      this.properties = results
      this.rowData = results
      this.setColumnDefs()
      console.log('properties', results)
      // need a spinner or loading bar
    })
  }

  setColumnDefs() {
    this.columnDefs = [{ field: 'pm_property_id_1' }]
    return
    if (this.properties.length) {
      this.columnDefs = Object.keys(this.properties[0]).map((key) => ({ field: key }))
    }
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
