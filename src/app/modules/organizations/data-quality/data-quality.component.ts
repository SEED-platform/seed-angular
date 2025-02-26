import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { concatMap, from, map, Subject, takeUntil, tap } from 'rxjs'
import { ColumnService } from '@seed/api/column'
import { DataQualityService } from '@seed/api/data-quality/data-quality.service'
import type { Condition, InventoryFormGroup, Rule } from '@seed/api/data-quality/data-quality.types'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'
import type { InventoryType } from 'app/modules/inventory/inventory.types'
import { CONDITIONS, DATATYPES_BY_CONDITION, GOAL_COLUMNS, INVENTORY_COLUMNS, SEVERITY, UNITS } from './constants'
import { DataQualityValidator } from './data-quality.validator'

@Component({
  selector: 'seed-organizations-data-quality',
  templateUrl: './data-quality.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    InventoryTabComponent,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    PageComponent,
    ReactiveFormsModule,
    SharedImports,
    TableContainerComponent,
  ],
})
export class DataQualityComponent implements OnDestroy, OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _organizationService = inject(OrganizationService)
  private _dataQualityService = inject(DataQualityService)
  private _columnService = inject(ColumnService)
  private _snackBar = inject(SnackbarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  private _propertyRules: Rule[] = []
  private _taxlotRules: Rule[] = []
  private _goalRules: Rule[] = []
  private _typeLookup: Record<string, Rule[]> = {}
  private _tableLookup: Record<string, Rule[]> = {}
  readonly tabs: InventoryType[] = ['properties', 'taxlots', 'goals']
  readonly tableTypes: ['PropertyState', 'TaxLotState', 'Goal']
  private _dataQualityValidator = inject(DataQualityValidator)

  propertyColumns: { key: string; value: string }[] = []
  taxLotColumns: { key: string; value: string }[] = []
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  ruleDataSource = new MatTableDataSource<FormGroup>([])
  // ruleDataSource = new MatTableDataSource<Rule>([])

  // constants
  ruleColumns: string[] = []
  conditions = CONDITIONS
  units = UNITS
  severity = SEVERITY

  // goal and property/taxlot forms have different fields. Fill on type selection
  form = new FormArray([])

  ngOnInit(): void {
    this.ruleColumns = this.type === 'goals' ? GOAL_COLUMNS : INVENTORY_COLUMNS
    this.getOrg()
    this.getColumns()
    this.getRules()
  }

  getOrg(): void {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ org_id }) => {
          this._orgId = org_id
        }),
      ).subscribe()
  }

  getColumns() {
    this._columnService.propertyColumns$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((propertyColumns) => {
          this.propertyColumns = propertyColumns.map((c) => ({ key: c.column_name, value: c.display_name }))
        }),
      )
      .subscribe()

    this._columnService.taxLotColumns$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((taxLotColumns) => {
          this.taxLotColumns = taxLotColumns.map((c) => ({ key: c.column_name, value: c.display_name }))
        }),
      )
      .subscribe()
  }

  get fields() {
    return this.type === 'taxlots' ? this.taxLotColumns : this.propertyColumns
  }

  // RP TODO: figure out how to dynamically populate data type options based on condition
  // getDataTypes(index: number): Record<string, string>[] {
  //   console.log(index)
  //   const condition: string = (this.form.at(index) as FormGroup).controls.condition.value as string
  //   return (this.dataTypes[condition] as Record<string, string>[]) || []
  // }

  resetLookups() {
    this._propertyRules = []
    this._taxlotRules = []
    this._goalRules = []
    this._typeLookup = { properties: this._propertyRules, taxlots: this._taxlotRules, goals: this._goalRules }
    this._tableLookup = { PropertyState: this._propertyRules, TaxLotState: this._taxlotRules, Goal: this._goalRules }
  }

  getRules() {
    this.resetLookups()
    this._dataQualityService.getRules()
      .pipe(
        map((rules) => rules.sort((a, b) => naturalSort(a.field, b.field))),
        takeUntil(this._unsubscribeAll$),
        tap((rules) => {
          for (const rule of rules) {
            this._tableLookup[rule.table_name].push(rule)
          }
          this.setRules()
        }),
      ).subscribe()
  }

  setRules() {
    const setFn = this.type === 'goals' ? this.setGoalForm : this.setInventoryForm
    const rules = this._typeLookup[this.type]
    setFn(rules)
  }

  /*
  * sets the form for property or tax lot rules
  * formatted as an arrow fxn to inherit `this`
  */
  setInventoryForm = (rules: Rule[]) => {
    this.form.clear()
    for (const rule of rules) {
      const formGroup = this.inventoryFormGroup()
      formGroup.patchValue(rule)
      // this.watchFormGroup(formGroup)
      this.form.push(formGroup)
    }
    this.ruleDataSource.data = this.form.controls as FormGroup[]
  }

  // watchFormGroup(formGroup: FormGroup) {
  //   // formGroup.get('condition')?.valueChanges
  //   console.log('watchFormGroup', formGroup)
  // }

  /*
  * return form's 'row' for a property or tax lot rule
  */
  inventoryFormGroup(): InventoryFormGroup {
    return new FormGroup({
      id: new FormControl<number | null>(null),
      enabled: new FormControl<boolean>(true),
      condition: new FormControl<'exclude' | 'include' | 'required' | 'not_null' | 'range' >('required'),
      field: new FormControl<string>(''),
      data_type: new FormControl<number | null>(null, this._dataQualityValidator.dataTypeMatch()),
      min: new FormControl<number | null>(null),
      max: new FormControl<number | null>(null),
      text_match: new FormControl<string | null>(null),
      units: new FormControl<string>(''),
      severity: new FormControl<number | null>(null),
      status_label: new FormControl<string | null>(null),
    })
  }

  /*
  * sets the form for goal rules
  * formatted as an arrow fxn to inherit `this`
  */
  setGoalForm = (rules: Rule[]) => {
    console.log('setGoalForm', rules)
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/data-quality/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
      this.setRules()
    }
  }

  getFormGroup(index: number) {
    return this.form.at(index) as FormGroup
  }

  isRowTouched(index: number) {
    const formGroup = this.form.at(index) as FormGroup
    return formGroup.touched && !formGroup.invalid
  }

  // feels like this should be done in a validator
  isDataTypeMismatch(index: number) {
    if (index) {
      return ''
    }
    // const formGroup = this.form.at(index) as InventoryFormGroup
    // const groups = this.form.controls.filter((fg: InventoryFormGroup) => fg.value.field === formGroup.value.field)
    // if (groups.length === 1) {
    //   return ''
    // }
    // if (groups.every((fg: InventoryFormGroup) => fg.value.data_type === formGroup.value.data_type)) {
    //   return ''
    // }
    // return 'bg-red-200'
  }

  getRowClass(index: number) {
    const formGroup = this.form.at(index) as FormGroup
    if (formGroup.invalid) {
      return 'bg-red-50'
    } else if (formGroup.touched) {
      return 'bg-blue-50'
    }
  }

  isText(index: number) {
    return [null, 1].includes(this.form.at(index).get('data_type').value as number)
  }

  isRange(index: number) {
    return this.form.at(index).get('condition').value === 'range'
  }

  isTextMatch(index: number) {
    return ['exclude', 'include'].includes(this.form.at(index).get('condition').value as string)
  }

  getPlaceholderText(index: number) {
    const condition = this.form.at(index).get('condition').value as string
    const placeholders = {
      exclude: 'Field must not contain text',
      include: 'Field must contain text',
    }
    return condition in placeholders ? placeholders[condition as keyof typeof placeholders] : ''
  }

  getSeverityClass(index: number) {
    const severity = this.form.at(index).get('severity').value as 0 | 1 | 2
    const severityClasses = {
      0: 'bg-red-100 rounded p-2',
      1: 'bg-amber-100 rounded p-2',
      2: 'bg-emerald-200 rounded p-2',
    }
    return severityClasses[severity]
  }

  getDataTypes(index: number) {
    const condition = this.form.at(index).get('condition').value as Condition
    return DATATYPES_BY_CONDITION[condition] || []
  }

  onSubmit() {
    const rulesTouched: Rule[] = this.form.controls.filter((formGroup): formGroup is FormGroup => formGroup.touched).map((formGroup) => formGroup.value as Rule)
    from(rulesTouched).pipe(
      concatMap((rule) => {
        const fn = rule.id
          ? (rule: Rule) => this._dataQualityService.putRule({ orgId: this._orgId, id: rule.id, rule })
          : (rule: Rule) => this._dataQualityService.postRule({ orgId: this._orgId, rule })
        return fn(rule)
      }),
    ).subscribe({
      complete: () => {
        this._snackBar.success('Success!')
        console.log('subscribe')
        this.getRules()
      },
    })
  }

  resetRules = () => {
    console.log('reset rules', this.form.value)
  }

  deleteRule(rule: Rule) {
    console.log(rule)
  }

  trackByFn(index: number) {
    return index
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
