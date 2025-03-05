import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { combineLatest, distinctUntilChanged, type Observable, Subject, takeUntil } from 'rxjs'
import type { Column } from '@seed/api/column'
import { DataQualityService, type InventoryFormGroup, type Rule } from '@seed/api/data-quality'
import { type Label, LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { LabelComponent } from '@seed/components'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { CONDITIONS, DATATYPES_BY_CONDITION, SEVERITIES, UNITS } from '../../constants'
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
    MatFormFieldModule,
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
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  data = inject(MAT_DIALOG_DATA) as {
    rule: Rule | null;
    orgId: number;
    columns$: Observable<Column[]>;
    labels$: Observable<Label[]>;
    tableName: 'PropertyState' | 'TaxLotState' | 'Goal';
    currentRules: Rule[];
  }
  create = true
  columns: Column[]
  labels: Label[]
  labelLookup = {}

  constants = {
    conditions: CONDITIONS,
    dataTypesByCondition: DATATYPES_BY_CONDITION,
    units: UNITS,
    severities: SEVERITIES,

  }

  form: InventoryFormGroup = new FormGroup({
    condition: new FormControl<'exclude' | 'include' | 'not_null' | 'range' | 'required' | null>(null, Validators.required),
    cross_cycle: new FormControl<boolean>(false), // unused
    data_type: new FormControl<number | null>(null, Validators.required),
    enabled: new FormControl<boolean>(true),
    field: new FormControl<string | null>(null, Validators.required),
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
  }, { validators: [
    this._dataQualityValidator.hasRange(),
    this._dataQualityValidator.hasTextMatch(),
    this._dataQualityValidator.dataTypeMatch(this.data.currentRules),
    this._dataQualityValidator.hasValidLabel(),
  ] })

  ngOnInit(): void {
    this.watchForm()

    combineLatest([
      this.data.columns$,
      this._labelsService.labels$,
    ]).subscribe(([columns, labels]) => {
      this.columns = columns
      this.labels = labels
      for (const label of labels) {
        this.labelLookup[label.id] = label
      }
    })

    if (this.data.rule) {
      this.create = false
      this.form.patchValue(this.data.rule)
    }
  }
  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  watchForm() {
    this.form.get('condition')?.valueChanges.pipe(
      takeUntil(this._unsubscribeAll$),
      distinctUntilChanged(),
    ).subscribe((condition) => { this.handleConditionChange(condition) })
  }

  /*
  * if a condition changes check the following error scenarios
  * 1. if range and the data type is text, set the data type to null
  * 2. if exclude or include and the data type is not text, set the data type to null.
  */
  handleConditionChange(condition: string): void {
    const formDataType = this.form.get('data_type')
    // const formTextMatch = this.form.get('text_match')
    const isTextMatch = ['exclude', 'include'].includes(condition)

    const isRangeWithText = condition === 'range' && formDataType.value === 1
    const isTextMatchWithNumeric = isTextMatch && formDataType.value !== 1

    // reset data type
    if (isRangeWithText || isTextMatchWithNumeric) {
      formDataType.setValue(null)
      formDataType.markAsTouched()
    }
  }

  get dataTypes() {
    return DATATYPES_BY_CONDITION[this.form.get('condition')?.value ?? 'required']
  }

  get formErrors() {
    return this.form.errors ? Object.values(this.form.errors) as string[] : null
  }

  onSubmit() {
    const fn = this.create
      ? this._dataQualityService.postRule({ rule: this.form.value as Rule, orgId: this.data.orgId })
      : this._dataQualityService.putRule({ rule: this.form.value as Rule, id: this.data.rule.id, orgId: this.data.orgId })

    fn.subscribe(() => {
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
