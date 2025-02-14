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
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  derivedColumnDataSource = new MatTableDataSource<DerivedColumn>([])
  derivedColumns: DerivedColumn[]
  derivedColumnColumns = ['name', 'expression', 'actions']

  ngOnInit(): void {
    this.getDerivedColumns()
  }

  getDerivedColumns() {
    // console.log('get derived columns')
    this._derivedColumnService.get(this.type)

    this._derivedColumnService.derivedColumns$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((derivedColumns) => {
          this.derivedColumns = derivedColumns
          this.derivedColumnDataSource.data = derivedColumns
          this._orgId = derivedColumns[0]?.organization
        }),
      )
      .subscribe()
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/derived-columns/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
    }
  }

  createDerivedColumn() {
    console.log('create derived column')
  }

  editDerivedColumn(dc: DerivedColumn) {
    console.log('edit derived column', dc)
  }

  deleteDerivedColumn(dc: DerivedColumn) {
    console.log('delete derived column', dc)
  }

  trackByFn(_index: number, { id }: DerivedColumn) {
    return id
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
