import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import type { Observable } from 'rxjs'
import { combineLatest, finalize, forkJoin, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Organization, SharedField, UsedColumn, UserAuth } from '@seed/api'
import { AnalysisService, OrganizationService, UserService } from '@seed/api'
import { AlertComponent, PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import { naturalSort } from '@seed/utils'

// A used column paired with its current public-sharing selection state
type SharableField = {
  id: number;
  table_name: string;
  name: string;
  display_name: string;
  public_checked: boolean;
}

@Component({
  selector: 'seed-organizations-settings-sharing',
  templateUrl: './sharing.component.html',
  imports: [AlertComponent, FormsModule, MaterialImports, PageComponent, ReactiveFormsModule, RouterLink, SharedImports],
})
export class SharingComponent implements OnDestroy, OnInit {
  private _analysisService = inject(AnalysisService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  readonly baseUrl = window.location.origin

  organization: Organization
  auth: UserAuth
  fields: SharableField[] = []
  loading = true
  loadError = false
  saving = false
  saved = false
  searchTableName = ''
  searchDisplayName = ''

  thresholdForm = new FormGroup({
    query_threshold: new FormControl<number | null>(null, [Validators.min(0), Validators.pattern(/^\d+$/)]),
  })

  get canManage(): boolean {
    return (this.organization?.is_parent ?? false) && (this.auth?.requires_owner ?? false)
  }

  get filteredFields(): SharableField[] {
    const tableSearch = this.searchTableName.trim().toLowerCase()
    const displaySearch = this.searchDisplayName.trim().toLowerCase()
    return this.fields.filter(
      (field) =>
        this.tableLabel(field.table_name).toLowerCase().includes(tableSearch) && field.display_name.toLowerCase().includes(displaySearch),
    )
  }

  get allFilteredSelected(): boolean {
    const visible = this.filteredFields
    return visible.length > 0 && visible.every((field) => field.public_checked)
  }

  get someFilteredSelected(): boolean {
    return this.filteredFields.some((field) => field.public_checked) && !this.allFilteredSelected
  }

  ngOnInit(): void {
    combineLatest([this._organizationService.currentOrganization$, this._userService.auth$])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, auth]) => {
        const orgChanged = this.organization?.id !== organization.id
        this.organization = organization
        this.auth = auth
        if (orgChanged) {
          this._loadSharingData(organization.id)
        }
      })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  tableLabel(tableName: string): string {
    return tableName === 'TaxLotState' ? 'Tax Lot' : 'Property'
  }

  onSelectAllChange(checked: boolean): void {
    const visibleIds = new Set(this.filteredFields.map((field) => field.id))
    for (const field of this.fields) {
      if (visibleIds.has(field.id)) {
        field.public_checked = checked
      }
    }
  }

  save(): void {
    if (this.thresholdForm.invalid || this.saving || !this.canManage) {
      return
    }

    this.saving = true
    this.saved = false
    this.organization.query_threshold = this.thresholdForm.get('query_threshold').value
    this.organization.public_fields = this.fields.filter((field) => field.public_checked).map(({ id }) => ({ id }))

    this._organizationService
      .updateSettings(this.organization)
      .pipe(
        switchMap(() => this._fetchSharingData(this.organization.id)),
        takeUntil(this._unsubscribeAll$),
        finalize(() => {
          this.saving = false
        }),
      )
      .subscribe({
        next: () => {
          this.saved = true
        },
      })
  }

  private _loadSharingData(orgId: number): void {
    this.loading = true
    this.loadError = false
    this._fetchSharingData(orgId)
      .pipe(
        takeUntil(this._unsubscribeAll$),
        finalize(() => {
          this.loading = false
        }),
      )
      .subscribe({
        error: () => {
          this.loadError = true
        },
      })
  }

  private _fetchSharingData(orgId: number): Observable<{ usedColumns: UsedColumn[]; sharedFields: SharedField[]; queryThreshold: number }> {
    return forkJoin({
      usedColumns: this._analysisService.getUsedColumns(orgId),
      sharedFields: this._organizationService.getSharedFields(orgId),
      queryThreshold: this._organizationService.getQueryThreshold(orgId),
    }).pipe(
      tap(({ usedColumns, sharedFields, queryThreshold }) => {
        this._setFields(usedColumns, sharedFields)
        this.thresholdForm.get('query_threshold').setValue(queryThreshold)
      }),
    )
  }

  private _setFields(usedColumns: UsedColumn[], sharedFields: SharedField[]): void {
    const publicNames = new Set(sharedFields.map((field) => field.name))
    this.fields = usedColumns
      .map((column) => ({
        id: column.id,
        table_name: column.table_name,
        name: column.name,
        display_name: column.display_name,
        public_checked: publicNames.has(column.name),
      }))
      .sort((a, b) => naturalSort(a.display_name, b.display_name))
  }
}
