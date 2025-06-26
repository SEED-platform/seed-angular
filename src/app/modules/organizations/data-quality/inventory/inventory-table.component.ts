import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import type { MatDialogRef } from '@angular/material/dialog'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatTooltipModule } from '@angular/material/tooltip'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { ColumnService } from '@seed/api/column'
import { DataQualityService, type Rule } from '@seed/api/data-quality'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { DeleteModalComponent, LabelComponent } from '@seed/components'
import type { InventoryTypeGoal } from 'app/modules/inventory/inventory.types'
import { DataQualityUtils } from '../data-quality.utils'
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
    MatPaginatorModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
  ],
})
export class DataQualityInventoryTableComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {
  @Input() currentRules: Rule[]
  @Output() getRules = new EventEmitter<void>()
  @ViewChild(MatPaginator) paginator!: MatPaginator
  private _route = inject(ActivatedRoute)
  private _organizationService = inject(OrganizationService)
  private _dataQualityService = inject(DataQualityService)
  private _columnService = inject(ColumnService)
  private _labelsService = inject(LabelService)
  private _dialog = inject(MatDialog)
  readonly tabs: InventoryTypeGoal[] = ['properties', 'taxlots', 'goal']
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  rulesDataSource = new MatTableDataSource<Rule>([])
  rulesColumns = ['enabled', 'field', 'severity', 'criteria', 'label', 'actions']
  type = this._route.snapshot.paramMap.get('type') as InventoryTypeGoal
  propertyColumnsLookup: Record<string, string> = {}
  taxlotColumnsLookup: Record<string, string> = {}
  isOverflowing = false

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

  ngAfterViewInit(): void {
    this.rulesDataSource.paginator = this.paginator
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

  getCriteria(rule: Rule) {
    return DataQualityUtils.getCriteria(rule)
  }

  getRangeText(rule: Rule) {
    return DataQualityUtils.getRangeText(rule)
  }

  formatDate(dateYMD: number) {
    return DataQualityUtils.formatDate(dateYMD)
  }

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
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.getRules.emit()
        }),
      )
      .subscribe()
  }

  deleteRule(rule: Rule) {
    const displayName = `${this.getFieldName(rule.field)} ${DataQualityUtils.getCriteria(rule)}`
    const dialogRef: MatDialogRef<DeleteModalComponent, boolean> = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Rule', instance: displayName },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        filter(Boolean),
        switchMap(() => this._dataQualityService.deleteRule({ id: rule.id, orgId: this._orgId })),
        tap(() => {
          this.getRules.emit()
        }),
      )
      .subscribe()
  }

  trackByFn(index: number) {
    return index
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
