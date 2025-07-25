import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import type { MatDialogRef } from '@angular/material/dialog'
import { MatDialog } from '@angular/material/dialog'
import type { GridApi } from 'ag-grid-community'
import { filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { GroupsService, InventoryService } from '@seed/api'
import { DeleteModalComponent, MenuItemComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ModalComponent } from 'app/modules/column-list-profile/modal/modal.component'
import { DQCStartModalComponent } from 'app/modules/data-quality'
import { AliChangeModalComponent, AnalysisRunModalComponent, GroupsModalComponent } from 'app/modules/inventory/actions'
import type { InventoryType, Profile } from '../../../inventory/inventory.types'
import { UpdateDerivedDataComponent } from '../actions'

@Component({
  selector: 'seed-inventory-grid-actions',
  templateUrl: './actions.component.html',
  imports: [MenuItemComponent, DeleteModalComponent, MaterialImports],
})
export class ActionsComponent implements OnDestroy, OnChanges, OnInit {
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
  private _groupsService = inject(GroupsService)
  private _dialog = inject(MatDialog)
  private readonly _unsubscribeAll$ = new Subject<void>()
  hasSelection: boolean

  ngOnInit(): void {
    return
  }

  baseData() {
    return {
      orgId: this.orgId,
      type: this.type,
      viewIds: this.selectedViewIds,
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedViewIds) {
      this.hasSelection = this.selectedViewIds.length > 0
    }
  }

  tempAction() {
    console.log('temp action')
  }

  selectAll() {
    this.gridApi.selectAll()
    const inventory_type = this.type === 'taxlots' ? 'taxlot' : 'property'
    const params = new URLSearchParams({
      cycle: this.cycleId?.toString(),
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

    this.afterClosed(dialogRef)
  }

  openAliChangeModal() {
    const dialogRef = this._dialog.open(AliChangeModalComponent, {
      width: '40rem',
      data: this.baseData(),
    })
    this.afterClosed(dialogRef)
  }

  openAnalysisRunModal() {
    const dialogRef = this._dialog.open(AnalysisRunModalComponent, {
      width: '40rem',
      data: this.baseData(),
    })
    this.afterClosed(dialogRef)
  }

  openDataQualityCheck() {
    const dialogRef = this._dialog.open(DQCStartModalComponent, {
      width: '40rem',
      disableClose: true,
      data: this.baseData(),
    })
    this.afterClosed(dialogRef)
  }

  openDerivedDataUpdateModal() {
    const dialogRef = this._dialog.open(UpdateDerivedDataComponent, {
      width: '40rem',
      data: this.baseData(),
    })
    this.afterClosed(dialogRef)
  }

  openGroupsModal() {
    const dialogRef = this._dialog.open(GroupsModalComponent, {
      width: '50rem',
      data: this.baseData(),
    })
    this.afterClosed(dialogRef)
  }

  openLabelsModal() {
    const dialogRef = this._dialog.open(GroupsModalComponent, {
      width: '50rem',
      data: this.baseData(),
    })
    this.afterClosed(dialogRef)
  }

  afterClosed(dialogRef: MatDialogRef<unknown>) {
    dialogRef.afterClosed().pipe(
      filter(Boolean),
      tap(() => { this.refreshInventory.emit() }),
    ).subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
