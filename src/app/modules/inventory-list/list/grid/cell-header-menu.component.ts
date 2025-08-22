import type { FlexibleConnectedPositionStrategyOrigin, OverlayRef } from '@angular/cdk/overlay'
import { Overlay } from '@angular/cdk/overlay'
import { TemplatePortal } from '@angular/cdk/portal'
import { CommonModule } from '@angular/common'
import type { AfterViewInit, TemplateRef } from '@angular/core'
import { Component, inject, ViewChild, ViewContainerRef } from '@angular/core'
import type { IHeaderAngularComp } from 'ag-grid-angular'
import type { Column, GridApi, IHeaderParams } from 'ag-grid-community'
import { take } from 'rxjs'
import type { CurrentUser, OrganizationUserSettings } from '@seed/api'
import { OrganizationService } from '@seed/api'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-grid-cell-header-menu',
  templateUrl: './cell-header-menu.component.html',
  imports: [CommonModule, MaterialImports],
})
export class CellHeaderMenuComponent implements IHeaderAngularComp, AfterViewInit {
  @ViewChild('menu') menuTemplate!: TemplateRef<unknown>
  @ViewChild('trigger') trigger!: FlexibleConnectedPositionStrategyOrigin

  private _configService = inject(ConfigService)
  private _organizationService = inject(OrganizationService)
  private _overlay = inject(Overlay)
  private _vcr = inject(ViewContainerRef)
  column: Column<unknown>
  gridApi: GridApi
  opened = false
  orgId: number
  orgUserId: number
  overlayRef: OverlayRef
  params: IHeaderParams
  pinState: unknown
  scheme: 'dark' | 'light'
  sortIcon = ''
  type: InventoryType
  userSettings: OrganizationUserSettings

  agInit(params: IHeaderParams & { currentUser: CurrentUser; type: InventoryType }): void {
    this.params = params
    this.column = params.column
    this.gridApi = params.api
    this.type = params.type
    const { org_id, org_user_id, settings } = params.currentUser
    this.orgId = org_id
    this.orgUserId = org_user_id
    this.userSettings = settings
  }

  ngAfterViewInit(): void {
    this.getScheme()
    this.setOverlay()
    this.updateSortState()
    this.pinState = this.column.isPinned()
    this.column.addEventListener('sortChanged', () => {
      this.updateSortState()
    })
    this.gridApi.addEventListener('columnPinned', () => {
      this.pinState = this.column.isPinned()
    })
  }

  getScheme() {
    this._configService.scheme$.subscribe((scheme) => {
      this.scheme = scheme
    })
  }

  updateSortState() {
    const state = this.gridApi.getColumnState().find((col) => col.colId === this.params.column.getColId())
    const sortDir = state?.sort ?? null
    const iconMap = {
      asc: 'fa-solid:arrow-up',
      desc: 'fa-solid:arrow-down',
    }
    this.sortIcon = iconMap[sortDir] ?? ''
  }

  setOverlay() {
    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(this.trigger)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
      ])

    this.overlayRef = this._overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
    })

    this.overlayRef.backdropClick().subscribe(() => {
      this.overlayRef.detach()
    })
  }

  toggleMenu(): void {
    // event.stopPropagation()
    // this.menuVisible = !this.menuVisible
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.detach()
    } else {
      const portal = new TemplatePortal(this.menuTemplate, this._vcr)
      this.overlayRef?.attach(portal)
    }
  }

  sortCol(direction: 'asc' | 'desc' | null): void {
    this.gridApi.applyColumnState({
      state: [{ colId: this.params.column.getColId(), sort: direction }],
      defaultState: { sort: null },
    })
    const dir = direction === 'desc' ? '-' : ''
    const colDef = this.column.getColDef()
    const sort = `${dir}${colDef.field}`
    this.userSettings.sorts?.[this.type].push(sort)

    this.detach()
  }

  pinCol(direction: 'left' | 'right' | null): void {
    this.gridApi.setColumnsPinned([this.column], direction)
    this.detach()
    this.updatePins(direction)
  }

  updatePins(direction: 'left' | 'right'): void {
    const field = this.column.getColDef().field
    const pins = this.userSettings.pins[this.type]
    const left = new Set(pins.left)
    const right = new Set(pins.right)

    // Clear from both sides
    left.delete(field)
    right.delete(field)

    if (direction === 'left') left.add(field)
    if (direction === 'right') right.add(field)

    // Assign back as arrays
    pins.left = Array.from(left)
    pins.right = Array.from(right)

    this.updateOrgUserSettings()
  }

  hideCol() {
    this.gridApi.setColumnsVisible([this.column], false)
    this.detach()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.orgUserId, this.orgId, this.userSettings)
      .pipe(take(1))
      .subscribe()
  }

  detach() {
    this.overlayRef.detach()
  }

  refresh() {
    return true
  }
}
