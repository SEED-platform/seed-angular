import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil, tap } from 'rxjs'
import { DataQualityService } from '@seed/api/data-quality/data-quality.service'
import type { Rule } from '@seed/api/data-quality/data-quality.types'
import { InventoryTabComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

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
    MatSelectModule,
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
  private _dataQualityService = inject(DataQualityService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  private _propertyRules: Rule[] = []
  private _taxlotRules: Rule[] = []
  private _goalRules: Rule[] = []

  readonly tabs: InventoryType[] = ['properties', 'taxlots', 'goals']
  readonly tableTypes: ['PropertyState', 'TaxLotState', 'Goal']
  // lookup for type -> rules
  private _typeLookup: Record<string, Rule[]> = {
    properties: this._propertyRules,
    taxlots: this._taxlotRules,
    goals: this._goalRules,
  }
  // lookup for table name -> rules
  private _tableLookup: Record<string, Rule[]> = {
    PropertyState: this._propertyRules,
    TaxLotState: this._taxlotRules,
    Goal: this._goalRules,
  }

  type = this._route.snapshot.paramMap.get('type') as InventoryType
  ruleColumns = [
    'enabled',
    'condition',
    'field',
    'data_type',
    'min',
    'max',
    'units',
    'severity',
    'status_label',
    'actions',
  ]
  ruleDataSource = new MatTableDataSource<FormGroup>([])
  // ruleDataSource = new MatTableDataSource<Rule>([])
  conditions = [
    { key: 'exclude', value: 'Must Not Include' },
    { key: 'include', value: 'Must Include' },
    { key: 'required', value: 'Required' },
    { key: 'not_null', value: 'Not Null' },
    { key: 'range', value: 'Range' },
  ]

  // goal and property/taxlot forms have different fields
  form = new FormArray([])

  ngOnInit(): void {
    this.getRules()
  }

  getRules() {
    this._dataQualityService.getRules()
      .pipe(
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
      this.form.push(formGroup)
    }
    this.ruleDataSource.data = this.form.controls as FormGroup[]
    console.log(this.ruleDataSource.data)
  }

  /*
  * return form's 'row' for a property or tax lot rule
  */
  inventoryFormGroup() {
    return new FormGroup({
      enabled: new FormControl<boolean>(true),
      condition: new FormControl<string>(''),
      field: new FormControl<string>(''),
      data_type: new FormControl<number | null>(null),
      min: new FormControl<number | null>(null),
      max: new FormControl<number | null>(null),
      units: new FormControl<string>(''),
      severity: new FormControl<number | null>(null),
      status_label: new FormControl<string>(''),
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

  onSubmit() {
    console.log('submit rules', this.form.value)
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
