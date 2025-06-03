import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { type Observable, Subject } from 'rxjs'
import type { Column } from '@seed/api/column'
import { type DataQualityFormGroup, DataQualityService, type Rule } from '@seed/api/data-quality'
import { type Label, LabelService } from '@seed/api/label'
import { LabelComponent } from '@seed/components'
import { DATATYPE_LOOKUP, SEVERITIES } from '../../constants'
import { DataQualityValidator } from '../../data-quality.validator'

@Component({
  selector: 'seed-organizations-members-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatSlideToggleModule,
    LabelComponent,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _dataQualityService = inject(DataQualityService)
  private _labelsService = inject(LabelService)
  private _dataQualityValidator = inject(DataQualityValidator)
  private readonly _unsubscribeAll$ = new Subject<void>()
  data = inject(MAT_DIALOG_DATA) as {
    rule: Rule | null;
    orgId: number;
    columns$: Observable<Column[]>;
    labels$: Observable<Label[]>;
    tableName: 'PropertyState' | 'TaxLotState' | 'Goal';
    currentRules: Rule[];
  }
  labels: Label[]
  labelLookup = {}

  constants = {
    dataTypeLookup: DATATYPE_LOOKUP,
    severities: SEVERITIES,
  }

  form: DataQualityFormGroup = new FormGroup(
    {
      condition: new FormControl<'exclude' | 'include' | 'not_null' | 'range' | 'required' | null>(null, Validators.required),
      cross_cycle: new FormControl<boolean>(false), // unused
      data_type: new FormControl<number | null>(null),
      enabled: new FormControl<boolean>(true),
      field: new FormControl<string | null>(null),
      for_derived_column: new FormControl<boolean>(false), // unused
      id: new FormControl<number | null>(null), // hidden
      max: new FormControl<number | null>(null),
      min: new FormControl<number | null>(null),
      not_null: new FormControl<boolean>(false),
      required: new FormControl<boolean>(false),
      rule_type: new FormControl<number | null>(null),
      severity: new FormControl<number | null>(null, Validators.required),
      status_label: new FormControl<number | null>(null),
      table_name: new FormControl<'PropertyState' | 'TaxLotState' | 'Goal' | null>(this.data.tableName), // unused
      text_match: new FormControl<string | null>(null),
      units: new FormControl<string>(''),
    },
    { validators: [this._dataQualityValidator.hasRange(), this._dataQualityValidator.hasValidLabel()] },
  )

  ngOnInit(): void {
    this._labelsService.labels$.subscribe((labels) => {
      this.labels = labels
      for (const label of labels) {
        this.labelLookup[label.id] = label
      }
    })
    this.form.patchValue(this.data.rule)
  }
  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  get formErrors() {
    return this.form.errors ? (Object.values(this.form.errors) as string[]) : null
  }

  onSubmit() {
    this._dataQualityService.putRule({ rule: this.form.value as Rule, id: this.data.rule.id, orgId: this.data.orgId }).subscribe(() => {
      this.close()
    })
  }

  dismiss() {
    this._dialogRef.close()
  }

  close() {
    this._dialogRef.close()
  }
}
