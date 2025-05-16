import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { Component, EventEmitter, inject, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import type { MatDialogRef } from '@angular/material/dialog'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { DataQualityService, type Rule } from '@seed/api/data-quality'
import { LabelService } from '@seed/api/label'
import { OrganizationService } from '@seed/api/organization'
import { LabelComponent } from '@seed/components'
import { DataQualityUtils } from '../data-quality.utils'
import { DeleteModalComponent } from '@seed/components'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-data-quality-goal-table',
  templateUrl: './goal-table.component.html',
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
  ],
})
export class DataQualityGoalTableComponent implements OnChanges, OnDestroy, OnInit {
  @Input() currentRules: Rule[]
  @Output() getRules = new EventEmitter<void>()
  private _organizationService = inject(OrganizationService)
  private _dataQualityService = inject(DataQualityService)
  private _labelsService = inject(LabelService)
  private _dialog = inject(MatDialog)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  rulesDataSource = new MatTableDataSource<Rule>([])
  rulesColumns = ['enabled', 'dataType', 'severity', 'criteria', 'label', 'actions']
  labelLookup = {}
  severityLookup = {
    0: { name: 'Error', class: 'bg-red-200 border rounded border-red-900 text-red-900' },
    1: { name: 'Warning', class: 'bg-amber-200 border rounded border-amber-900 text-amber-900' },
    2: { name: 'Valid', class: 'bg-green-200 border rounded border-green-900 text-green-900' },
  }
  dataTypeLookup = { 0: 'Number', 1: 'Text', 2: 'Date', 3: 'Year', 4: 'Area', 5: 'EUI' }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentRules) {
      this.rulesDataSource.data = this.currentRules
    }
  }
  ngOnInit() {
    combineLatest([this._organizationService.currentOrganization$, this._labelsService.labels$])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, labels]) => {
        this._orgId = organization.id
        for (const label of labels) {
          this.labelLookup[label.id] = label
        }
      })
  }
  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  getCriteria(rule: Rule) {
    return DataQualityUtils.getCriteria(rule)
  }

  editRule(rule: Rule) {
    const tableName = 'Goal'
    const dialogRef: MatDialogRef<FormModalComponent, boolean> = this._dialog.open(FormModalComponent, {
      width: '50rem',
      data: { rule, orgId: this._orgId, tableName, currentRules: this.currentRules },
    })
    dialogRef.afterClosed().pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => { this.getRules.emit() }),
    ).subscribe()
  }

  deleteRule(rule: Rule) {
    const displayName = `${this.dataTypeLookup[rule.data_type]} ${DataQualityUtils.getCriteria(rule)}`
    const dialogRef: MatDialogRef<DeleteModalComponent, boolean> = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Rule', instance: displayName },
    })

    dialogRef.afterClosed().pipe(
      takeUntil(this._unsubscribeAll$),
      filter(Boolean),
      switchMap(() => this._dataQualityService.deleteRule({ id: rule.id, orgId: this._orgId })),
      tap(() => { this.getRules.emit() }),
    ).subscribe()
  }

  toggleEnable(index: number) {
    const rule = this.currentRules[index]
    this._dataQualityService.putRule({ rule, id: rule.id, orgId: this._orgId }).subscribe()
  }

  trackByFn(index: number) {
    return index
  }
}
