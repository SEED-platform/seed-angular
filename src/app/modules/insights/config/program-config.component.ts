import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { RouterModule } from '@angular/router'
import type { Program, ProgramResponse } from '@seed/api'
import { ProgramService } from '@seed/api'
import type { Column } from '@seed/api/column/column.types'
import type { Cycle } from '@seed/api/cycle/cycle.types'
import { AlertComponent, ModalHeaderComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { Organization } from 'app/modules/organizations/organizations.types'
import type { Observable } from 'rxjs'
import { finalize, Subject, take, tap } from 'rxjs'

@Component({
  selector: 'seed-program-config',
  templateUrl: './program-config.component.html',
  imports: [
    AlertComponent,
    CommonModule,
    MaterialImports,
    ModalHeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class ProgramConfigComponent implements OnInit, OnDestroy {
  private _dialogRef = inject(MatDialogRef<ProgramConfigComponent>)
  private _programService = inject(ProgramService)
  private _snackBar = inject(SnackBarService)
  private _unsubscribeAll$ = new Subject<void>()

  metricTypes = [
    { key: 'Target Greater Than Actual', value: 'Target > Actual for Compliance' },
    { key: 'Target Less Than Actual', value: 'Target < Actual for Compliance' },
  ]
  metricColumns: Column[]
  metricDataTypes = ['number', 'float', 'integer', 'ghg', 'ghg_intensity', 'area', 'eui', 'boolean']
  xAxisColumns: Column[]
  xAxisDataTypes = ['number', 'string', 'float', 'integer', 'ghg', 'ghg_intensity', 'area', 'eui', 'boolean']
  maxHeight = window.innerHeight - 200
  selectedProgram: Program | null = null

  data = inject(MAT_DIALOG_DATA) as {
    programs: Program[];
    cycles: Cycle[];
    filterGroups: unknown[];
    selectedProgram: Program;
    org: Organization;
    propertyColumns: Column[];
  }

  form = new FormGroup({
    actual_emission_column: new FormControl<number>(null),
    actual_energy_column: new FormControl<number>(null),
    cycles: new FormControl<number[]>([], Validators.required),
    emission_metric_type: new FormControl<string>(''),
    energy_metric_type: new FormControl<string>(''),
    filter_group: new FormControl<unknown>(null),
    name: new FormControl<string>('', Validators.required),
    organization_id: new FormControl<number>(this.data.org?.id),
    target_emission_column: new FormControl<number>(null),
    target_energy_column: new FormControl<number>(null),
    x_axis_columns: new FormControl<number[]>([], Validators.required),
  })

  ngOnInit(): void {
    this.metricColumns = this.data.propertyColumns.filter((c) => this.validColumn(c, this.metricDataTypes))
    this.xAxisColumns = this.data.propertyColumns.filter((c) => this.validColumn(c, this.xAxisDataTypes))
  }

  validColumn(column: Column, validTypes: string[]) {
    const isAllowedType = validTypes.includes(column.data_type)
    const notRelated = !column.related
    const notDerived = !column.derived_column
    return isAllowedType && notRelated && notDerived
  }

  selectProgram(program: Program) {
    this.selectedProgram = program
    this.form.patchValue(program)
  }

  newProgram() {
    this.selectedProgram = null
    this.form.reset()
  }

  removeProgram() {
    this._programService.delete(this.data.org.id, this.selectedProgram.id)
      .pipe(
        take(1),
        finalize(() => { this.close() }),
      ).subscribe()
  }

  removeItem(item: number, key: 'cycles' | 'x_axis_columns') {
    const items = this.form.value[key].filter((i) => i !== item)
    this.form.patchValue({ [key]: items })
  }

  getCycle(id: number) {
    return this.data.cycles.find((cycle) => cycle.id === id).name
  }

  getColumn(id: number) {
    return this.xAxisColumns.find((column) => column.id === id).display_name
  }

  hasMetric() {
    const values = this.form.value
    const energy = values.actual_energy_column && values.target_energy_column && values.energy_metric_type
    const emission = values.actual_emission_column && values.target_emission_column && values.emission_metric_type
    return !!(energy || emission)
  }

  onSubmit() {
    if (!this.hasMetric()) {
      this._snackBar.alert('At least one Metric is required')
    }
    const data = this.form.value as Program

    const request$: Observable<ProgramResponse> = this.selectedProgram
      ? this._programService.update(this.data.org.id, this.selectedProgram.id, data)
      : this._programService.create(this.data.org.id, data)

    request$.pipe(
      take(1),
      tap(({ compliance_metric }) => {
        const programId = compliance_metric.id
        this.close(programId)
      }),
    ).subscribe()
  }

  close(programId = null) {
    this._dialogRef.close(programId)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
