import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { Subject, takeUntil, tap } from 'rxjs'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-organizations-cycles',
  templateUrl: './cycles.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    PageComponent,
    SharedImports,
    TableContainerComponent,
  ],
})
export class CyclesComponent implements OnDestroy, OnInit {
  private _cycleService = inject(CycleService)
  private _dialog = inject(MatDialog)
  private _orgId: number
  private _existingNames: string[]
  private readonly _unsubscribeAll$ = new Subject<void>()

  cyclesDataSource = new MatTableDataSource<Cycle>([])
  cyclesColumns = ['id', 'name', 'start', 'end', 'actions']

  ngOnInit(): void {
    this.refreshCycles()
  }

  refreshCycles(): void {
    this._cycleService
      .get()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((cycles) => {
          this.cyclesDataSource.data = cycles
          this._orgId = cycles[0]?.organization
          this._existingNames = cycles.map((cycle) => cycle.name)
        }),
      )
      .subscribe()
  }

  createCycle = () => {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { cycle: null, orgId: this._orgId, existingNames: this._existingNames },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshCycles()
        }),
      )
      .subscribe()
  }

  editCycle(cycle: Cycle): void {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { cycle, orgId: this._orgId, existingNames: this._existingNames },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshCycles()
        }),
      )
      .subscribe()
  }

  deleteCycle(cycle: Cycle): void {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { cycle, orgId: this._orgId },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshCycles()
        }),
      )
      .subscribe()
  }

  trackByFn(_index: number, { id }: Cycle) {
    return id
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
