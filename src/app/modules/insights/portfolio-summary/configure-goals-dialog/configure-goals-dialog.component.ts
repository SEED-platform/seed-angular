import { CdkScrollable } from '@angular/cdk/scrolling'
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
import { Subject, takeUntil } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import { type Cycle, CycleService } from '@seed/api/cycle'
import type { Goal } from '@seed/api/goal'
import { GoalService } from '@seed/api/goal'
import type { AccessLevelInstancesByDepth, AccessLevelsByDepth, Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
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
    CdkScrollable,
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

  ngOnInit(): void {
    this.goals = this.data.goals
    this._cycleService.cycles$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((cycles) => {
      this.cycles = cycles
      console.log(this.cycles)
    })
    this._organizationService.accessLevelTree$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ accessLevelNames }) => {
      this.accessLevelNames = accessLevelNames
    })
    this._organizationService.accessLevelInstancesByDepth$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((accessLevelsByDepth) => {
      this.accessLevelInstancesByDepth = accessLevelsByDepth
    })
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((propertyColumns) => {
      this.areaColumns = propertyColumns.filter((c) => c.data_type == 'area')
      this.euiColumns = propertyColumns.filter((c) => c.data_type == 'eui')
    })
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
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
      this.goalForm.setValue({
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

  save(): void {
    const formValues = this.goalForm.value
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
