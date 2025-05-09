import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { map, Subject, takeUntil } from 'rxjs'
import type { DerivedColumn } from '@seed/api/derived-column'
import { DerivedColumnService } from '@seed/api/derived-column'
import { InventoryTabComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import type { InventoryDisplayType, InventoryType } from '../../inventory/inventory.types'
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
    TableContainerComponent,
  ],
})
export class DerivedColumnsComponent implements OnDestroy, OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _dialog = inject(MatDialog)
  private _derivedColumnService = inject(DerivedColumnService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  inventoryTypeParam = this._route.snapshot.paramMap.get('type') as InventoryType
  inventoryType: InventoryDisplayType
  derivedColumnDataSource = new MatTableDataSource<DerivedColumn>([])
  derivedColumns: DerivedColumn[]
  derivedColumnColumns = ['name', 'expression', 'actions']

  ngOnInit(): void {
    this._derivedColumnService.derivedColumns$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        map((derivedColumns) => derivedColumns.sort((a, b) => naturalSort(a.name, b.name))),
      )

      .subscribe((derivedColumns) => {
        this.inventoryType = this.inventoryTypeParam === 'taxlots' ? 'Tax Lot' : 'Property'
        this.derivedColumns = derivedColumns.filter((dc) => dc.inventory_type === this.inventoryType)
        this.derivedColumnDataSource.data = this.derivedColumns
        this._orgId = derivedColumns[0]?.organization
      })
  }

  getDerivedColumns() {
    this._derivedColumnService.get(this._orgId).subscribe()
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.inventoryTypeParam) {
      const newRoute = `/organizations/derived-columns/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.inventoryTypeParam = type
      this.getDerivedColumns()
    }
  }

  createDerivedColumn = () => {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      maxHeight: '75vh',
      data: {
        derivedColumn: null,
        orgId: this._orgId,
        inventoryType: this.inventoryType,
        existingNames: this.derivedColumns.map((dc) => dc.name),
      },
    })

    dialogRef.afterClosed().subscribe(() => {
      this.getDerivedColumns()
    })
  }

  editDerivedColumn(derivedColumn: DerivedColumn) {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      maxHeight: '50rem',
      data: {
        derivedColumn,
        orgId: this._orgId,
        inventoryType: this.inventoryType,
        existingNames: this.derivedColumns.map((dc) => dc.name),
      },
    })

    dialogRef.afterClosed().subscribe(() => {
      this.getDerivedColumns()
    })
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
