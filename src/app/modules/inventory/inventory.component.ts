import { Component, inject, type OnInit, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { ActivatedRoute, Router } from '@angular/router'
import { AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridOptions } from 'ag-grid-community'
import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community'
import { switchMap, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
import { InventoryService } from '@seed/api/inventory'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from './inventory.types'
import { CycleService } from '@seed/api/cycle/cycle.service'

ModuleRegistry.registerModules([ClientSideRowModelModule])

@Component({
  selector: 'seed-inventory',
  templateUrl: './inventory.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [AgGridModule, MatButtonModule, MatIconModule, MatTabsModule, SharedImports, InventoryTabComponent],
})
export class InventoryComponent implements OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _router = inject(Router)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _orgId: number
  private _cycles: Cycle[]
  private _cycle: Cycle
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  readonly type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType

  columnDefs: ColDef[] = [
    { field: 'make' },
    { field: 'model' },
    { field: 'price' },
  ]

  rowData = [
    { make: 'Toyota', model: 'Camry', price: 24000 },
    { make: 'Ford', model: 'Fusion', price: 22000 },
    { make: 'Tesla', model: 'Model 3', price: 35000 },
  ]

  gridOptions: GridOptions = { rowModelType: 'clientSide' }

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(
      tap(({ org_id }) => this._orgId = org_id),
      switchMap(() => this._cycleService.cycles$),
      tap((cycles) => {
        this._cycles = cycles
        this._cycle = cycles[0]
      }),
    ).subscribe(() => {
      this.loadInventory(1)
    })
  }

  loadInventory(page: number) {
    console.log('orgid', this._orgId)
    console.log('cycle', this._cycle)
    const config = {
      page,
      chunk: 100,
      cycle: this._cycle,
      profile: 1, // need to fetch,
      include_ids: null,
      exclude_ids: null,

    }
    console.log(config)
    // show spinner

    // return fn(
    //   page,
    //   chunk,
    //   $scope.cycle.selected_cycle,
    //   _.get($scope, 'currentProfile.id'),
    //   include_ids,
    //   exclude_ids,
    //   true,
    //   $scope.organization.id,
    //   true,
    //   $scope.column_filters,
    //   $scope.column_sorts,
    //   ids_only
    // );
    console.log('load inventory', page)
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      // Hack to route to reload the current component
      await this._router.navigateByUrl('/', { skipLocationChange: true })
      await this._router.navigate([this.type === 'properties' ? 'taxlots' : 'properties'])
    }
  }
}
