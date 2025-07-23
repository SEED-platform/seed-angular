import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { RouterModule } from '@angular/router'
import { Subject, takeUntil, tap } from 'rxjs'
import type { AnalysisCreateData, AnalysisServiceType, CurrentUser, Cycle } from '@seed/api'
import { AnalysisService, CycleService, UserService } from '@seed/api'
import { ModalHeaderComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { SEEDValidators } from '@seed/validators'
import { BetterConfigComponent } from './analysis-config/better-config.component'

@Component({
  selector: 'seed-analysis-run-modal',
  templateUrl: './analysis-run-modal.component.html',
  imports: [
    BetterConfigComponent,
    CommonModule,
    FormsModule,
    MaterialImports,
    ModalHeaderComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class AnalysisRunModalComponent implements OnInit, OnDestroy {
  @ViewChild(BetterConfigComponent) childBetter!: BetterConfigComponent

  private _analysisService = inject(AnalysisService)
  private _dialogRef = inject(MatDialogRef<AnalysisRunModalComponent>)
  private _cycleService = inject(CycleService)
  private _userService = inject(UserService)
  private _unsubscribeAll$ = new Subject<void>()
  currentUser: CurrentUser
  cycles: Cycle[] = []
  cycle: Cycle
  configInvalid = true
  runningAnalysis = false

  serviceTypes = [
    'BETTER',
    'BSyncr',
    'Building Upgrade Recommendation',
    'CO2',
    'EEEJ',
    'Element Statistics',
    'EUI',
  ]

  existingNames: string[] = []

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    viewIds: number[];
  }

  form = new FormGroup({
    access_level_instance_id: new FormControl<number | null>(null),
    name: new FormControl<string | null>(null, [Validators.required]),
    property_view_ids: new FormControl<number[]>(this.data.viewIds),
    service: new FormControl<AnalysisServiceType | null>(null, [Validators.required]),
  })

  ngOnInit(): void {
    this.getCurrentUser()
    this.getCycles()
    this.getAnalyses()
  }

  getCurrentUser() {
    this._userService.currentUser$
      .pipe(
        tap((currentUser) => {
          this.currentUser = currentUser
          this.form.patchValue({ access_level_instance_id: currentUser.ali_id })
        }),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  getCycles() {
    this._cycleService.getCycles(this.data.orgId)
    this._cycleService.cycles$
      .pipe(
        tap((cycles) => {
          this.cycles = cycles
          this.cycle = cycles[0] || null
        }),
      )
      .subscribe()
  }

  getAnalyses() {
    const { orgId } = this.data
    this._analysisService.getAnalyses(orgId)
    this._analysisService.analyses$
      .pipe(
        tap((analyses) => {
          this.existingNames = analyses.map((a) => a.name)
          this.form.get('name')?.setValidators([Validators.required, SEEDValidators.uniqueValue(this.existingNames)])
        }),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  onFormChange(form: FormGroup) {
    this.configInvalid = form.invalid
  }

  onSubmit() {
    const configMap: Record<string, unknown> = {
      BETTER: this.childBetter.form.value,
      BSyncr: null,
    }
    const data = { ...this.form.value, configuration: configMap[this.form.value.service] } as AnalysisCreateData

    this._analysisService.create(this.data.orgId, data).subscribe(() => {
      this.runningAnalysis = true
    })
  }

  close(success = false) {
    this._dialogRef.close(success)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
