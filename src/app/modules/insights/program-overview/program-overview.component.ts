import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { combineLatest, filter, switchMap, tap } from 'rxjs'
import type { Column, Cycle, Organization, Program } from '@seed/api'
import { ColumnService, CycleService, OrganizationService } from '@seed/api'
import { ProgramService } from '@seed/api/program'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { naturalSort } from '@seed/utils'
import { ProgramConfigComponent } from '../config'

@Component({
  selector: 'seed-program-overview',
  templateUrl: './program-overview.component.html',
  imports: [
    CommonModule,
    MaterialImports,
    PageComponent,
  ],
})
export class ProgramOverviewComponent implements OnInit {
  private _columnService = inject(ColumnService)
  private _cycleService = inject(CycleService)
  private _programService = inject(ProgramService)
  private _dialog = inject(MatDialog)
  private _organizationService = inject(OrganizationService)

  programs: Program[]
  cycles: Cycle[]
  selectedProgram: Program
  org: Organization
  orgId: number
  propertyColumns: Column[]
  filterGroups: unknown[]

  ngOnInit(): void {
    this.getDependencies()
  }

  getDependencies() {
    this._organizationService.currentOrganization$
      .pipe(
        tap((org) => { this.org = org }),
        switchMap(() => combineLatest({
          cycles: this._cycleService.cycles$,
          programs: this._programService.programs$,
          propertyColumns: this._columnService.propertyColumns$,
        })),
        tap(({ cycles, programs, propertyColumns }) => {
          this.orgId = this.org.id
          this.programs = programs.sort((a, b) => naturalSort(a.name, b.name))
          this.cycles = cycles
          this.propertyColumns = propertyColumns
          this.selectedProgram = programs?.[0]
        }),
      )
      .subscribe()
  }

  openProgramConfig = () => {
    const dialogRef = this._dialog.open(ProgramConfigComponent, {
      width: '50rem',
      data: {
        cycles: this.cycles,
        filterGroups: this.filterGroups,
        programs: this.programs,
        selectedProgram: this.selectedProgram,
        org: this.org,
        propertyColumns: this.propertyColumns?.sort((a, b) => naturalSort(a.display_name, b.display_name)),
      },
    })

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((program: Program) => { this.selectedProgram = program }),
      )
      .subscribe()
  }
}
