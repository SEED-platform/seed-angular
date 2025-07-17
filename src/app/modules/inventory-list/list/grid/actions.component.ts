import type { OnDestroy } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { type MatSelect } from '@angular/material/select'
import type { GridApi } from 'ag-grid-community'
import { filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { InventoryService } from '@seed/api'
import { DeleteModalComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ModalComponent } from 'app/modules/column-list-profile/modal/modal.component'
import type { InventoryType, Profile } from '../../../inventory/inventory.types'
import { MoreActionsModalComponent } from '../modal'

@Component({
  selector: 'seed-inventory-grid-actions',
  templateUrl: './actions.component.html',
  imports: [DeleteModalComponent, MaterialImports],
})
export class ActionsComponent implements OnDestroy {
  @Input() cycleId: number
  @Input() gridApi: GridApi
  @Input() inventory: Record<string, unknown>[]
  @Input() orgId: number
  @Input() profile: Profile
  @Input() profiles: Profile[]
  @Input() selectedViewIds: number[]
  @Input() type: InventoryType
  @Output() refreshInventory = new EventEmitter<null>()
  @Output() selectedAll = new EventEmitter<number[]>()
  private _inventoryService = inject(InventoryService)
  private _dialog = inject(MatDialog)
  private readonly _unsubscribeAll$ = new Subject<void>()

  get actions() {
    return [
      {
        name: 'Select All',
        action: () => {
          this.selectAll()
        },
        disabled: false,
      },
      {
        name: 'Select None',
        action: () => {
          this.deselectAll()
        },
        disabled: false,
      },
      {
        name: 'Only Show Populated Columns',
        action: () => {
          this.openShowPopulatedColumnsModal()
        },
        disabled: !this.inventory,
      },
      { name: 'Delete', action: this.deleteStates, disabled: !this.selectedViewIds.length },
      { name: 'Merge', action: this.tempAction, disabled: !this.selectedViewIds.length },
      {
        name: 'More...',
        action: () => {
          this.openMoreActionsModal()
        },
        disabled: !this.selectedViewIds.length,
      },
    ]
  }

  tempAction() {
    console.log('temp action')
  }

  openMoreActionsModal() {
    const dialogRef = this._dialog.open(MoreActionsModalComponent, {
      width: '40rem',
      autoFocus: false,
      data: { viewIds: this.selectedViewIds, orgId: this.orgId, type: this.type },
    })

    dialogRef.afterClosed()
      .pipe(
        filter(Boolean),
        tap(() => { this.refreshInventory.emit() }),
      ).subscribe()
  }

  onAction(action: () => void, select: MatSelect) {
    action()
    select.value = null
  }

  selectAll() {
    this.gridApi.selectAll()
    const inventory_type = this.type === 'taxlots' ? 'taxlot' : 'property'
    const params = new URLSearchParams({
      cycle: this.cycleId.toString(),
      ids_only: 'true',
      include_related: 'true',
      organization_id: this.orgId.toString(),
      inventory_type,
    })
    const paramString = params.toString()
    this._inventoryService.getAgInventory(paramString, {}).subscribe(({ results }: { results: number[] }) => {
      this.selectedViewIds = results
      this.selectedAll.emit(this.selectedViewIds)
    })
  }

  deselectAll() {
    this.gridApi.deselectAll()
  }

  deleteStates = () => {
    const displayType = this.type === 'taxlots' ? 'Tax Lot' : 'Property'
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: `${this.selectedViewIds.length} ${displayType} States`, instance: '' },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        filter(Boolean),
        switchMap(() => {
          return this.type === 'taxlots'
            ? this._inventoryService.deleteTaxlotStates({ orgId: this.orgId, viewIds: this.selectedViewIds })
            : this._inventoryService.deletePropertyStates({ orgId: this.orgId, viewIds: this.selectedViewIds })
        }),
        tap(() => {
          this.refreshInventory.emit()
        }),
      )
      .subscribe()
  }

  openShowPopulatedColumnsModal() {
    const dialogRef = this._dialog.open(ModalComponent, {
      width: '40rem',
      data: {
        columns: [],
        cycleId: this.cycleId,
        inventoryType: this.type,
        location: 'List View Profile',
        mode: 'populate',
        orgId: this.orgId,
        profile: this.profile,
        profiles: this.profiles,
        type: this.type === 'taxlots' ? 'Tax Lot' : 'Property',
      },
    })

    dialogRef.afterClosed().subscribe((id) => {
      if (id) {
        this.refreshInventory.emit()
      }
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
