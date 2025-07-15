import type { FlexibleConnectedPositionStrategyOrigin, OverlayRef } from '@angular/cdk/overlay'
import { Overlay } from '@angular/cdk/overlay'
import { TemplatePortal } from '@angular/cdk/portal'
import { CommonModule } from '@angular/common'
import type { AfterViewInit, TemplateRef } from '@angular/core'
import { Component, inject, ViewChild, ViewContainerRef } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import type { IHeaderAngularComp } from 'ag-grid-angular'
import type { Column, GridApi, IHeaderParams } from 'ag-grid-community'
import { ConfigService } from '@seed/services'
import { MatCardModule } from '@angular/material/card'
import { MatDividerModule } from '@angular/material/divider'
import { MatButtonModule } from '@angular/material/button'
import { MatSelectModule } from '@angular/material/select'
import { trueGray } from 'tailwindcss/colors'

@Component({
  selector: 'seed-inventory-grid-cell-header-menu',
  templateUrl: './cell-header-menu.component.html',
  imports: [CommonModule, MatCardModule, MatDividerModule, MatButtonModule, MatIconModule, MatSelectModule],
})
export class CellHeaderMenuComponent implements IHeaderAngularComp, AfterViewInit {
  @ViewChild('menu') menuTemplate!: TemplateRef<unknown>
  @ViewChild('trigger') trigger!: FlexibleConnectedPositionStrategyOrigin

  private _configService = inject(ConfigService)
  params: IHeaderParams
  overlay = inject(Overlay)
  vcr = inject(ViewContainerRef)
  overlayRef: OverlayRef
  column: Column<unknown>
  scheme: 'dark' | 'light'
  sortIcon = ''
  pinState: unknown
  opened = false
  gridApi: GridApi

  agInit(params: IHeaderParams): void {
    this.params = params
    this.column = params.column
    this.gridApi = params.api
  }

  ngAfterViewInit(): void {
    this.getScheme()
    this.setOverlay()
    this.updateSortState()
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
    const positionStrategy = this.overlay
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

    this.overlayRef = this.overlay.create({
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
      const portal = new TemplatePortal(this.menuTemplate, this.vcr)
      this.overlayRef?.attach(portal)
    }
  }

  sortCol(direction: 'asc' | 'desc' | null): void {
    this.gridApi.applyColumnState({
      state: [{ colId: this.params.column.getColId(), sort: direction }],
      defaultState: { sort: null },
    })
    this.detach()
  }

  pinCol(direction: 'left' | 'right' | null): void {
    this.gridApi.setColumnsPinned([this.params.column], direction)
    this.detach()
  }

  resetCol() {
    const colId = this.column.getColId()
    this.gridApi.applyColumnState({ state: [{ colId }], defaultState: {} })
    this.gridApi.autoSizeColumns([this.column])
    this.detach()
  }

  resetAll() {
    const columns = this.gridApi.getColumns()
    this.gridApi.resetColumnState()
    this.gridApi.autoSizeColumns(columns)
    this.detach()
  }

  tempAction() {
    console.log('temp action')
  }

  detach() {
    this.overlayRef.detach()
  }

  refresh() {
    return true
  }
}
