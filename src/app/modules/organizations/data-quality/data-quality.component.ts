import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { combineLatest, map, Subject, takeUntil, tap } from 'rxjs'
import { ColumnService } from '@seed/api/column'
import type { Rule } from '@seed/api/data-quality'
import { DataQualityService } from '@seed/api/data-quality'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { LabelComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { InventoryTabComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import type { InventoryType } from '../../inventory/inventory.types'
import { DataQualityUtils } from './data-quality.utils'
import { DeleteModalComponent } from './modal/delete-modal.component'

@Component({
  selector: 'seed-organizations-data-quality',
  templateUrl: './data-quality.component.html',
  imports: [
    CommonModule,
    DeleteModalComponent,
    InventoryTabComponent,
    FormsModule,
    LabelComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
    PageComponent,
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
  private _labelsService = inject(LabelService)
  private _dialog = inject(MatDialog)
  readonly tabs: InventoryType[] = ['properties', 'taxlots', 'goals']
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  // private _labels: Label[]
  private _rules: Rule[]
  private _propertyRules: Rule[]
  private _taxlotRules: Rule[]
  private _goalRules: Rule[]
  currentRules: Rule[]
  rulesDataSource = new MatTableDataSource<Rule>([])
  rulesColumns = ['enabled', 'field', 'criteria', 'severity', 'label', 'actions']
  // inventoryColumns = ['enabled', 'field', 'criteria', 'severity', 'status_label', 'actions']
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  propertyColumnsLookup: Record<string, string> = {}
  taxlotColumnsLookup: Record<string, string> = {}

  labelLookup = {}
  severityLookup = {
    0: { name: 'Error', class: 'bg-red-200' },
    1: { name: 'Warning', class: 'bg-amber-200' },
    2: { name: 'Valid', class: 'bg-green-200' },
  }

  ngOnInit(): void {
    // subscribe to org, rules, columns
    combineLatest([
      this._organizationService.currentOrganization$,
      this._columnService.propertyColumns$,
      this._columnService.taxLotColumns$,
      this._labelsService.labels$,
      this._dataQualityService.rules$.pipe(map((rules) => rules.sort((a, b) => naturalSort(a.field, b.field)))),
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, propertyColumns, taxLotColumns, labels, rules]) => {
        this._orgId = organization.id
        for (const col of propertyColumns) {
          this.propertyColumnsLookup[col.column_name] = col.display_name
        }
        for (const col of taxLotColumns) {
          this.taxlotColumnsLookup[col.column_name] = col.display_name
        }
        for (const label of labels) {
          this.labelLookup[label.id] = label
        }
        this._rules = rules
        this.setRules()
      })
  }

  getRules() { this._dataQualityService.getRules(this._orgId).subscribe() }

  setRules() {
    this._propertyRules = this._rules.filter((rule) => rule.table_name === 'PropertyState')
    this._taxlotRules = this._rules.filter((rule) => rule.table_name === 'TaxLotState')
    this._goalRules = this._rules.filter((rule) => rule.table_name === 'Goal')
    const typeLookup = { properties: this._propertyRules, taxlots: this._taxlotRules, goals: this._goalRules }
    this.currentRules = this.rulesDataSource.data = typeLookup[this.type]
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/data-quality/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
      this.setRules()
    }
  }

  getFieldName(field: string): string {
    if (this.type === 'properties') {
      return this.propertyColumnsLookup[field] || field
    } else {
      return this.taxlotColumnsLookup[field] || field
    }
  }

  getCriteria(rule: Rule) { return DataQualityUtils.getCriteria(rule) }

  getRangeText(rule: Rule) { return DataQualityUtils.getRangeText(rule) }

  formatDate(dateYMD: number) { return DataQualityUtils.formatDate(dateYMD) }

  toggleEnable(index: number) {
    console.log('toggle enable', index)
  }

  resetRules() {
    console.log('reset rules')
  }

  editRule(rule: Rule) {
    console.log('edit rule', rule)
  }

  deleteRule(rule: Rule) {
    const displayName = DataQualityUtils.getDisplayName(this.getFieldName(rule.field), rule)
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { rule, orgId: this._orgId, displayName },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.getRules() }),
      ).subscribe()
    console.log('delete rule', rule)
  }

  trackByFn(index: number) {
    return index
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
