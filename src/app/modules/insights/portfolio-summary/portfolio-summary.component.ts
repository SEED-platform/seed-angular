import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import type { MatButtonToggleChange } from '@angular/material/button-toggle'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import type { MatSelectChange } from '@angular/material/select'
import { MatSelectModule } from '@angular/material/select'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { Subject, takeUntil } from 'rxjs'
import type { CycleGoal, Goal } from '@seed/api/goal'
import { GoalService } from '@seed/api/goal'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { NotFoundComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'
import { AddCycleDialogComponent } from './add-cycle-dialog'
import { ConfigureGoalsDialogComponent } from './configure-goals-dialog'
import type { AddCycleData, ConfigureGoalsData } from './portfolio-summary.types'

@Component({
  selector: 'seed-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  imports: [
    CommonModule,
    NotFoundComponent,
    PageComponent,
    MatIconModule,
    MatButtonModule,
    SharedImports,
    MatSelectModule,
    MatButtonToggleModule,
    AgGridAngular,
    AgGridModule,
  ],
})
export class PortfolioSummaryComponent implements OnInit {
  private _matDialog = inject(MatDialog)
  private _configService = inject(ConfigService)
  private _goalService = inject(GoalService)
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  currentGoal: Goal
  currentCycleGoal: CycleGoal
  goals: Goal[]
  organization: Organization

  gridTheme$ = this._configService.gridTheme$
  defaultColDef = { suppressMovable: true }
  rowData = []
  columnDefs: ColDef[] = [
    { headerName: 'Cycle', field: 'baseline_cycle_name' },
    { headerName: 'Total Area. (ft**2)', field: 'baseline_total_sqft' },
    { headerName: 'Total kBTU', field: 'baseline_total_kbtu' },
    { headerName: 'EUI (kBtu/ft**2/year)', field: 'baseline_weighted_eui' },
    { headerName: 'Cycle', field: 'current_cycle_name' },
    { headerName: 'Total Area. (ft**2)', field: 'current_total_sqft' },
    { headerName: 'Total kBTU', field: 'current_total_kbtu' },
    { headerName: 'EUI (kBtu/ft**2/year)', field: 'current_weighted_eui' },
    { headerName: 'Area % Change', field: 'sqft_change' },
    { headerName: 'EUI % Improvement', field: 'eui_change' },
  ]

  ngOnInit(): void {
    this._goalService.goals$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((goals) => {
      this.goals = goals
    })
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
    })
  }

  // Dialog openers
  openConfigureGoals(): void {
    this._matDialog.open(AddCycleDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {} satisfies AddCycleData,
    })
  }

  openAddCycle(): void {
    this._matDialog.open(ConfigureGoalsDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {} satisfies ConfigureGoalsData,
    })
  }

  // Selectors
  selectGoal(event: MatSelectChange) {
    const goalId: number = event.value as number
    this.currentGoal = this.goals.find((g) => g.id === goalId)
  }

  selectCycleGoal(event: MatButtonToggleChange) {
    const cycleGoalId: number = event.value as number
    this.currentCycleGoal = this.currentGoal.cycle_goals.find((cycleGoal) => cycleGoal.id === cycleGoalId)

    this._goalService
      .getPortfolioSummary(this.currentGoal.id, this.currentCycleGoal.id, this.organization.id)
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((portfolioSummary) => {
        this.rowData = [portfolioSummary]
      })
  }
}
