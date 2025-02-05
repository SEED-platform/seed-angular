import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-cycles',
  templateUrl: './organizations-cycles.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTableModule, CommonModule, SharedImports],
})
export class OrganizationsCyclesComponent implements OnInit {
  private _cycleService = inject(CycleService)

  cyclesDataSource = new MatTableDataSource<Cycle>([])
  cyclesColumns = ['id', 'name', 'start', 'end', 'actions']

  ngOnInit(): void {
    this._cycleService.get()

    this._cycleService.cycles$.subscribe((cycles) => {
      this.cyclesDataSource.data = cycles
    })
  }

  createCycle(): void {
    console.log('create cycle')
  }

  trackByFn(_index: number, { id }: Cycle) {
    return id
  }
}
