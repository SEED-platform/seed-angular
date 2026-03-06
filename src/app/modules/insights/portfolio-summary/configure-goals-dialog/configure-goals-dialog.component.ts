import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatSelectModule } from '@angular/material/select'
import { combineLatest, Subject, switchMap, takeUntil } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import { type Cycle, CycleService } from '@seed/api/cycle'
import type { Goal } from '@seed/api/goal'
import { GoalService } from '@seed/api/goal'
import type { AccessLevelInstancesByDepth, AccessLevelsByDepth, Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { SalesforcePortfolioService } from '@seed/api/salesforce-portfolio'
import type { SalesforceGoal, SalesforcePartner } from '@seed/api/salesforce-portfolio/salesforce-portfolio.types'
import { SharedImports } from '@seed/directives'
import type { ConfigureGoalsData } from '../portfolio-summary.types'

@Component({
  selector: 'seed-configure-goals-dialog',
  templateUrl: './configure-goals-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SharedImports,
    MatSelectModule,
    MatButtonToggleModule,
  ],
})
export class ConfigureGoalsDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribeAll$ = new Subject<void>()
  data = inject(MAT_DIALOG_DATA) as ConfigureGoalsData
  goalForm = new FormGroup({
    name: new FormControl<string | null>('', Validators.required),
    type: new FormControl<'standard' | 'transaction' | null>(null, Validators.required),
    baselineCycle: new FormControl<number | null>(null, Validators.required),
    accessLevel: new FormControl<string | null>(null, Validators.required),
    accessLevelInstanceId: new FormControl<number | null>(null, Validators.required),
    areaColumn: new FormControl<number | null>(null, Validators.required),
    euiColumn1: new FormControl<number | null>(null, Validators.required),
    euiColumn2: new FormControl<number | null>(null),
    euiColumn3: new FormControl<number | null>(null),
    targetPercentage: new FormControl<number | null>(null, Validators.required),
    commitmentSqft: new FormControl<number | null>(null, Validators.required),
    salesforcePartnerID: new FormControl<string | null>(null, Validators.required),
    salesforceGoalID: new FormControl<string | null>(null, Validators.required),
  })
  private _cycleService = inject(CycleService)
  cycles: Cycle[]
  accessLevelNames: AccessLevelInstancesByDepth['accessLevelNames']
  accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  accessLevelInstances: AccessLevelsByDepth[keyof AccessLevelsByDepth] = []
  private _organizationService = inject(OrganizationService)
  private _columnService = inject(ColumnService)
  areaColumns: Column[] = []
  euiColumns: Column[] = []
  goals: Goal[]
  currentGoal?: Goal
  private _goalService = inject(GoalService)
  organization: Organization
  isLoggedIntoBbSalesforce: boolean
  bb_salesforce_enabled: boolean
  private _salesforcePortfolioService = inject(SalesforcePortfolioService)
  salesforcePartners: SalesforcePartner[]
  salesforceGoals: SalesforceGoal[]

  ngOnInit(): void {
    this.isLoggedIntoBbSalesforce = this.data.isLoggedIntoBbSalesforce
    this.bb_salesforce_enabled = this.data.bb_salesforce_enabled
    this.goals = this.data.goals

    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap((organization) => {
          this.organization = organization
          return this._salesforcePortfolioService.getPartners(this.organization.id)
        }),
      )
      .subscribe((r) => {
        this.salesforcePartners = r.results
      })

    combineLatest([
      this._cycleService.cycles$,
      this._organizationService.accessLevelTree$,
      this._organizationService.accessLevelInstancesByDepth$,
      this._columnService.propertyColumns$,
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([cycles, { accessLevelNames }, accessLevelsByDepth, propertyColumns]) => {
        this.cycles = cycles
        this.accessLevelNames = accessLevelNames
        this.accessLevelInstancesByDepth = accessLevelsByDepth
        this.areaColumns = propertyColumns.filter((c) => c.data_type == 'area')
        this.euiColumns = propertyColumns.filter((c) => c.data_type == 'eui')
      })

    if (this.goals.length > 0) {
      this.currentGoal = this.goals[0]
      this.selectGoal(this.goals[0].id)
    }
  }

  selectGoal(goalId?: number) {
    if (goalId == null) {
      // new goal
      this.goalForm.reset()
      this.currentGoal = null
    } else {
      // old goal
      this.currentGoal = this.goals.find((g) => g.id === goalId)
      this.onAccessLevelChange(this.currentGoal.level_name)
      this.onPartnerChange(this.currentGoal.salesforce_partner_id)
      this.goalForm.setValue({
        salesforcePartnerID: this.currentGoal.salesforce_partner_id,
        salesforceGoalID: this.currentGoal.salesforce_goal_id,
        name: this.currentGoal.name,
        type: this.currentGoal.type,
        baselineCycle: this.currentGoal.baseline_cycle,
        accessLevel: this.currentGoal.level_name,
        accessLevelInstanceId: this.currentGoal.access_level_instance,
        areaColumn: this.currentGoal.area_column,
        euiColumn1: this.currentGoal.eui_column1,
        euiColumn2: this.currentGoal.eui_column2,
        euiColumn3: this.currentGoal.eui_column3,
        targetPercentage: this.currentGoal.target_percentage,
        commitmentSqft: this.currentGoal.commitment_sqft,
      })
    }
  }

  onAccessLevelChange(accessLevelName: string) {
    const depth = this.accessLevelNames.findIndex((name) => name === accessLevelName)
    this.accessLevelInstances = this.accessLevelInstancesByDepth[depth]
  }

  onPartnerChange(partnerId: string) {
    const partner = this.salesforcePartners.find((p) => p.id == partnerId)
    this.salesforceGoals = partner.goals
  }

  save(): void {
    const formValues = this.goalForm.value
    const partner = this.salesforcePartners.find((p) => p.id == formValues.salesforcePartnerID)
    const goal = partner.goals.find((g) => g.id == formValues.salesforceGoalID)

    const request_data = {
      name: formValues.name,
      type: formValues.type,
      baseline_cycle: formValues.baselineCycle,
      access_level_instance: formValues.accessLevelInstanceId,
      area_column: formValues.areaColumn,
      eui_column1: formValues.euiColumn1,
      eui_column2: formValues.euiColumn2,
      eui_column3: formValues.euiColumn3,
      target_percentage: formValues.targetPercentage,
      commitment_sqft: formValues.commitmentSqft,
      salesforce_partner_id: partner.id,
      salesforce_partner_name: partner.name,
      salesforce_goal_id: goal.id,
      salesforce_goal_name: goal.name,
    }

    if (this.currentGoal == null) {
      // create new goal
      this._goalService
        .createGoal(request_data, this.organization.id)
        .pipe(takeUntil(this._unsubscribeAll$))
        .subscribe((goal) => {
          this.currentGoal = goal
          this.goals.push(goal)
        })
    } else {
      // edit old goal
      this._goalService
        .editGoal(this.currentGoal.id, request_data, this.organization.id)
        .pipe(takeUntil(this._unsubscribeAll$))
        .subscribe((goal) => {
          this.currentGoal = goal
          const currentGoalIndex = this.goals.findIndex((g) => g.id === this.currentGoal.id)
          this.goals[currentGoalIndex] = goal
        })
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
