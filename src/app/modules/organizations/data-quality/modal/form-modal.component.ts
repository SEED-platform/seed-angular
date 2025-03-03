import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatOptionModule } from '@angular/material/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { combineLatest, type Observable, Subject } from 'rxjs'
import type { Column } from '@seed/api/column'
import { DataQualityService, type Rule } from '@seed/api/data-quality'
import { LabelService, type Label } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
import { LabelComponent } from '@seed/components'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import { CONDITIONS, DATATYPES_BY_CONDITION, SEVERITIES, UNITS } from '../constants'

@Component({
  selector: 'seed-organizations-members-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatInputModule,
    LabelComponent,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _dataQualityService = inject(DataQualityService)
  private _labelsService = inject(LabelService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  data = inject(MAT_DIALOG_DATA) as {
    rule: Rule | null;
    orgId: number;
    displayName: string;
    columns$: Observable<Column[]>;
    labels$: Observable<Label[]>;
  }
  create = true
  columns: Column[]
  labels: Label[]
  labelLookup = {}

  constants = {
    conditions: CONDITIONS,
    // dataTypesByCondition: DATATYPES_BY_CONDITION,
    units: UNITS,
    severities: SEVERITIES,

  }

  form = new FormGroup({
    condition: new FormControl<'exclude' | 'include' | 'not_null' | 'range' | 'required' | null>(null),
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
    severity: new FormControl<number | null>(null),
    status_label: new FormControl<number | null>(null),
    table_name: new FormControl<'PropertyState' | 'TaxLotState' | 'Goal' | null>(null), // unused
    text_match: new FormControl<string | null>(null),
    units: new FormControl<string | null>(null),
  })

  ngOnInit(): void {
    combineLatest([
      this.data.columns$,
      this._labelsService.labels$,
    ]).subscribe(([columns, labels]) => {
      this.columns = columns
      this.labels = labels
      for (const label of labels) {
        this.labelLookup[label.id] = label
      }
      console.log(this.labelLookup)
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

  get dataTypes() {
    return DATATYPES_BY_CONDITION[this.form.get('condition')?.value ?? 'required']
  }

  onSubmit() {
    console.log('submit')
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
