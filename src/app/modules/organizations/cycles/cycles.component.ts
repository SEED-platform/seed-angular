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
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-organizations-cycles',
  templateUrl: './cycles.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTableModule, PageComponent, TableContainerComponent],
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
    this._cycleService.cycles$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((cycles) => {
      this.cyclesDataSource.data = cycles
      this._orgId = cycles[0]?.organization
      this._existingNames = cycles.map((cycle) => cycle.name)
    })
  }

  createCycle = () => {
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { cycle: null, orgId: this._orgId, existingNames: this._existingNames },
    })
  }

  editCycle(cycle: Cycle): void {
    this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { cycle, orgId: this._orgId, existingNames: this._existingNames },
    })
  }

  deleteCycle(cycle: Cycle): void {
    this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { cycle, orgId: this._orgId },
    })
  }

  trackByFn(_index: number, { id }: Cycle) {
    return id
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
