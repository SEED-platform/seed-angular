import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import type { Cycle, CyclesResponse } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { SharedImports } from '@seed/directives'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal-component'

@Component({
  selector: 'seed-organizations-cycles',
  templateUrl: './cycles.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTableModule, CommonModule, SharedImports],
})
export class OrganizationsCyclesComponent implements OnInit {
  private _cycleService = inject(CycleService)
  private _dialog = inject(MatDialog)
  private _orgId: number
  private _existingNames: string[]

  cyclesDataSource = new MatTableDataSource<Cycle>([])
  cyclesColumns = ['id', 'name', 'start', 'end', 'actions']

  ngOnInit(): void {
    this.refreshCycles()
  }

  refreshCycles(): void {
    this._cycleService.get()

    this._cycleService.cycles$.subscribe((cycles) => {
      this.cyclesDataSource.data = cycles
      this._orgId = cycles[0]?.organization
      this._existingNames = cycles.map((cycle) => cycle.name)
    })
  }

  createCycle(): void {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { cycle: null, orgId: this._orgId, existingNames: this._existingNames },
    })

    dialogRef.afterClosed().subscribe((response: CyclesResponse) => {
      if (response && response.status === 'success') { // is this necessary?
        this.refreshCycles()
      }
    })
  }

  editCycle(cycle: Cycle): void {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { cycle, orgId: this._orgId, existingNames: this._existingNames },
    })

    dialogRef.afterClosed().subscribe(() => {
      this.refreshCycles()
    })
  }

  deleteCycle(cycle: Cycle): void {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { cycle, orgId: this._orgId },
    })

    dialogRef.afterClosed().subscribe(() => {
      this.refreshCycles()
    })
  }

  trackByFn(_index: number, { id }: Cycle) {
    return id
  }
}
