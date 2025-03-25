import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { combineLatest, map, Subject, takeUntil, tap } from 'rxjs'
import { ColumnService } from '@seed/api/column'
import type { Rule } from '@seed/api/data-quality'
import { DataQualityService } from '@seed/api/data-quality'
import { OrganizationService } from '@seed/api/organization'
import { InventoryTabComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import type { InventoryType } from '../../inventory/inventory.types'
import { DataQualityGoalTableComponent } from './goal/goal-table.component'
import { DataQualityInventoryTableComponent } from './inventory/inventory-table.component'
import { FormModalComponent } from './inventory/modal/form-modal.component'

@Component({
  selector: 'seed-organizations-data-quality',
  templateUrl: './data-quality.component.html',
  imports: [
    CommonModule,
    DataQualityGoalTableComponent,
    DataQualityInventoryTableComponent,
    InventoryTabComponent,
    FormsModule,
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
  private _dialog = inject(MatDialog)
  readonly tabs: InventoryType[] = ['properties', 'taxlots', 'goal']
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _orgId: number
  private _propertyRules: Rule[]
  private _taxlotRules: Rule[]
  private _goalRules: Rule[]
  rules: Rule[]
  currentRules: Rule[]
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  ngOnInit(): void {
    combineLatest([
      this._organizationService.currentOrganization$,
      this._dataQualityService.rules$.pipe(map((rules) => rules.sort((a, b) => naturalSort(a.field, b.field)))),
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, rules]) => {
        this._orgId = organization.id
        this.rules = rules
        this.setRules()
      })
  }

  get config() {
    // remove create rule button if on the goal tab
    return {
      title: 'Data Quality',
      titleIcon: 'fa-solid:flag',
      action: this.resetRules,
      actionIcon: 'fa-solid:rotate-left',
      actionText: 'Reset All Rules',
      ...(this.type !== 'goal' && {
        action2: this.createRule,
        action2Icon: 'fa-solid:plus',
        action2Text: 'Create Rule',
      }),
    }
  }

  getRules() {
    this._dataQualityService.getRules(this._orgId).subscribe()
  }

  setRules() {
    this._propertyRules = this.rules.filter((rule) => rule.table_name === 'PropertyState')
    this._taxlotRules = this.rules.filter((rule) => rule.table_name === 'TaxLotState')
    this._goalRules = this.rules.filter((rule) => rule.table_name === 'Goal')
    const typeLookup = { properties: this._propertyRules, taxlots: this._taxlotRules, goal: this._goalRules }
    this.currentRules = typeLookup[this.type]
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/data-quality/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
      this.setRules()
    }
  }

  resetRules = () => {
    this._dataQualityService.resetRules(this._orgId).subscribe(() => {
      this.getRules()
    })
  }

  createRule = () => {
    const columns$ = this.type === 'properties' ? this._columnService.propertyColumns$ : this._columnService.taxLotColumns$
    const tableName = this.type === 'properties' ? 'PropertyState' : 'TaxLotState'
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '50rem',
      data: { rule: null, orgId: this._orgId, columns$, tableName, currentRules: this.currentRules },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.getRules()
        }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
