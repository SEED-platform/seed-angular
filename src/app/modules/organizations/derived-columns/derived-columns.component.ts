import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil, tap } from 'rxjs'
import { type DerivedColumn, DerivedColumnService } from '@seed/api/derived-column'
import { InventoryTabComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from '../../inventory/inventory.types'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-organizations-derived-columns',
  templateUrl: './derived-columns.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    InventoryTabComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    PageComponent,
    SharedImports,
    TableContainerComponent],
})
export class DerivedColumnsComponent implements OnDestroy, OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _dialog = inject(MatDialog)
  private _derivedColumnService = inject(DerivedColumnService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  inventoryType = this._route.snapshot.paramMap.get('type') as InventoryType
  inventoryLabel: 'Property' | 'Tax Lot'
  derivedColumnDataSource = new MatTableDataSource<DerivedColumn>([])
  derivedColumns: DerivedColumn[]
  derivedColumnColumns = ['name', 'expression', 'actions']

  ngOnInit(): void {
    this.getDerivedColumns()
  }

  getDerivedColumns() {
    this._derivedColumnService.get()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((derivedColumns) => {
          this.inventoryLabel = this.inventoryType === 'taxlots' ? 'Tax Lot' : 'Property'
          this.derivedColumns = derivedColumns.filter((dc) => dc.inventory_type === this.inventoryLabel)
          this.derivedColumnDataSource.data = this.derivedColumns
          this._orgId = derivedColumns[0]?.organization
        }),
      )
      .subscribe()
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.inventoryType) {
      const newRoute = `/organizations/derived-columns/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.inventoryType = type
      this.getDerivedColumns()
    }
  }

  createDerivedColumn = () => {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { derivedColumn: null, orgId: this._orgId, inventoryType: { id: this.inventoryType, label: this.inventoryLabel } },
    })

    dialogRef.afterClosed().subscribe(() => {
      this.getDerivedColumns()
    })
  }

  editDerivedColumn(dc: DerivedColumn) {
    console.log('edit derived column', dc)
  }

  deleteDerivedColumn(derivedColumn: DerivedColumn) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { derivedColumn, orgId: this._orgId },
    })

    dialogRef.afterClosed().subscribe(() => {
      this.getDerivedColumns()
    })
  }

  trackByFn(_index: number, { id }: DerivedColumn) {
    return id
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
