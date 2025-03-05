import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, inject, Input, Output } from '@angular/core'
import { EventEmitter } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import type { MatDialogRef } from '@angular/material/dialog'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, Subject, takeUntil, tap } from 'rxjs'
import { ColumnService } from '@seed/api/column'
import { DataQualityService, type Rule } from '@seed/api/data-quality'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { LabelComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from 'app/modules/inventory/inventory.types'
import { DataQualityUtils } from '../data-quality.utils'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-data-quality-inventory-table',
  templateUrl: './inventory-table.component.html',
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
    SharedImports,
  ],
})
export class DataQualityInventoryTableComponent implements OnChanges, OnDestroy, OnInit {
  @Input() currentRules: Rule[]
  @Output() getRules = new EventEmitter<void>()
  private _route = inject(ActivatedRoute)
  private _organizationService = inject(OrganizationService)
  private _dataQualityService = inject(DataQualityService)
  private _columnService = inject(ColumnService)
  private _labelsService = inject(LabelService)
  private _dialog = inject(MatDialog)
  readonly tabs: InventoryType[] = ['properties', 'taxlots', 'goals']
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  rulesDataSource = new MatTableDataSource<Rule>([])
  rulesColumns = ['enabled', 'field', 'criteria', 'severity', 'label', 'actions']
  type = this._route.snapshot.paramMap.get('type') as InventoryType
  propertyColumnsLookup: Record<string, string> = {}
  taxlotColumnsLookup: Record<string, string> = {}

  labelLookup = {}
  severityLookup = {
    0: { name: 'Error', class: 'bg-red-200 border rounded border-red-900 text-red-900' },
    1: { name: 'Warning', class: 'bg-amber-200 border rounded border-amber-900 text-amber-900' },
    2: { name: 'Valid', class: 'bg-green-200 border rounded border-green-900 text-green-900' },
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentRules) {
      this.rulesDataSource.data = this.currentRules
    }
  }

  ngOnInit(): void {
    combineLatest([
      this._organizationService.currentOrganization$,
      this._columnService.propertyColumns$,
      this._columnService.taxLotColumns$,
      this._labelsService.labels$,
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, propertyColumns, taxLotColumns, labels]) => {
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
      })
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
    const rule = this.currentRules[index]
    this._dataQualityService.putRule({ rule, id: rule.id, orgId: this._orgId }).subscribe()
  }

  editRule(rule: Rule) {
    const columns$ = this.type === 'properties' ? this._columnService.propertyColumns$ : this._columnService.taxLotColumns$
    const tableName = this.type === 'properties' ? 'PropertyState' : 'TaxLotState'
    const dialogRef: MatDialogRef<FormModalComponent, boolean> = this._dialog.open(FormModalComponent, {
      width: '50rem',
      data: { rule, orgId: this._orgId, columns$, tableName, currentRules: this.currentRules },
    })
    this.fetchRules(dialogRef)
  }

  deleteRule(rule: Rule) {
    const displayName = DataQualityUtils.getDisplayName(this.getFieldName(rule.field), rule)
    const dialogRef: MatDialogRef<DeleteModalComponent, boolean> = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { rule, orgId: this._orgId, displayName },
    })
    this.fetchRules(dialogRef)
  }

  fetchRules(dialogRef: MatDialogRef<unknown, boolean>) {
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.getRules.emit() }),
      ).subscribe()
  }

  trackByFn(index: number) {
    return index
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
