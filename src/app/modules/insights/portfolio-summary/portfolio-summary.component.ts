import { CommonModule } from '@angular/common'
import type { ElementRef, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import type { FormControl, FormGroup } from '@angular/forms'
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import type { MatButtonToggleChange } from '@angular/material/button-toggle'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatDialog } from '@angular/material/dialog'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import type { MatSelectChange } from '@angular/material/select'
import { MatSelectModule } from '@angular/material/select'
import { RouterLink } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { Chart } from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import { Subject, takeUntil } from 'rxjs'
import type { CycleGoal, Goal, PortfolioSummary, WeightedEUI } from '@seed/api/goal'
import { GoalService } from '@seed/api/goal'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { NotFoundComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { ConfigService } from '@seed/services'
import { AddCycleDialogComponent } from './add-cycle-dialog'
import { ConfigureGoalsDialogComponent } from './configure-goals-dialog'
import type { AddCycleData, ConfigureGoalsData } from './portfolio-summary.types'

Chart.register(annotationPlugin)
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
    MatExpansionModule,
    RouterLink,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
})
export class PortfolioSummaryComponent implements OnInit {
  private _matDialog = inject(MatDialog)
  private _configService = inject(ConfigService)
  private _goalService = inject(GoalService)
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>
  private _formBuilder = inject(FormBuilder)

  goals: Goal[]
  currentGoal: Goal
  currentCycleGoal: CycleGoal
  portfolioSummary: PortfolioSummary
  organization: Organization
  chart: Chart<'bar', string[], string>

  gridTheme$ = this._configService.gridTheme$
  defaultColDef = { suppressMovable: true }
  cycleGoalSummaryData: PortfolioSummary[] = []
  cycleGoalSummaryColumnDefs: ColDef[] = [
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
  goalSummaryData: WeightedEUI[] = []
  goalSummaryColumnDefs: ColDef[] = [
    { field: 'Cycle Name' },
    { field: 'Baseline?' },
    { field: 'EUI' },
    { field: 'Goal' },
    { field: 'Annual % Imp' },
    { field: 'Cumulative % Imp' },
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
  openAddCycle(): void {
    this._matDialog.open(AddCycleDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {} satisfies ConfigureGoalsData,
    })
  }

  openConfigureGoals(): void {
    this._matDialog.open(ConfigureGoalsDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {} satisfies AddCycleData,
    })
  }

  runDataQualityChecks(): void {
    console.log('runDataQualityChecks')
  }

  // Selectors
  selectGoal(event: MatSelectChange) {
    const goalId: number = event.value as number
    this.currentGoal = this.goals.find((g) => g.id === goalId)

    this._goalService
      .getWeightedEUIs(this.currentGoal.id, this.organization.id)
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(({ results }) => {
        this.createChart(results)
        this.goalSummaryData = results
      })
  }

  selectCycleGoal(event: MatButtonToggleChange) {
    const cycleGoalId: number = event.value as number
    this.currentCycleGoal = this.currentGoal.cycle_goals.find((cycleGoal) => cycleGoal.id === cycleGoalId)

    this._goalService
      .getPortfolioSummary(this.currentGoal.id, this.currentCycleGoal.id, this.organization.id)
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((portfolioSummary) => {
        this.cycleGoalSummaryData = [portfolioSummary]
        this.portfolioSummary = portfolioSummary
      })
  }

  createChart(weightedEUIs: WeightedEUI[]) {
    // chart
    this.chart?.destroy()
    const ctx = this.canvas.nativeElement.getContext('2d')
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [
          {
            data: weightedEUIs.map((we) => we.EUI),
            backgroundColor: ['#1E428A', ...new Array<string>(weightedEUIs.length).fill('#06732cff')],
          },
        ],
        labels: weightedEUIs.map((we) => we['Cycle Name']),
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Energy Use Intensity by Reporting Period',
          },
          annotation: {
            annotations: {
              line1: {
                type: 'line',
                yMin: weightedEUIs[0].Goal,
                yMax: weightedEUIs[0].Goal,
                borderWidth: 2,
                borderDash: [4],
              },
            },
          },
        },
      },
    })
  }
}
