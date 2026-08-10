import { CommonModule } from '@angular/common'
import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { Router } from '@angular/router'
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco'
import { AgGridAngular } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import type { Observable } from 'rxjs'
import { catchError, combineLatest, EMPTY, finalize, of, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Column, CurrentUser, Cycle, Organization } from '@seed/api'
import { ColumnService, CycleService, InventoryService, OrganizationService, UserService } from '@seed/api'
import { NotFoundComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import type { CrossCyclesResponse, InventoryDisplayType, InventoryType, Profile } from 'app/modules/inventory/inventory.types'

ModuleRegistry.registerModules([AllCommunityModule])

const NUMERIC_DATA_TYPES = new Set<Column['data_type']>([
  'number',
  'float',
  'integer',
  'area',
  'eui',
  'ghg',
  'ghg_intensity',
  'wui',
  'water_use',
])
const DECIMAL_DATA_TYPES = new Set<Column['data_type']>(['number', 'float', 'area', 'eui'])

@Component({
  selector: 'seed-cross-cycles-grid',
  templateUrl: './cross-cycles-grid.component.html',
  imports: [AgGridAngular, CommonModule, MaterialImports, NotFoundComponent, TranslocoDirective],
})
export class CrossCyclesGridComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) type!: InventoryType
  @Input() mode: 'list' | 'detail' = 'list'
  @Input() linkingId?: number
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _inventoryService = inject(InventoryService)
  private _organizationService = inject(OrganizationService)
  private _router = inject(Router)
  private _transloco = inject(TranslocoService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _detailRowsByLinkingId = new Map<number, Record<string, unknown>[]>()
  private _expandedLinkingIds = new Set<number>()
  columnDefs: ColDef[] = []
  columnMap = new Map<string, string>()
  columns: Column[] = []
  currentUser: CurrentUser
  cycles: Cycle[] = []
  displayType: InventoryDisplayType
  error = false
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  loading = false
  matchingColumns = new Set<string>()
  org: Organization
  orgId: number
  profile?: Profile
  profiles: Profile[] = []
  rowData: Record<string, unknown>[] = []
  selectedCycleIds: number[] = []
  selectedProfileId?: number

  gridOptions: GridOptions<Record<string, unknown>> = {
    getRowStyle: (params) => {
      if (params.data?._isGroup) {
        return { fontWeight: '600', borderTop: '2px solid var(--ag-row-border-color)' }
      }
      return undefined
    },
  }

  defaultColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    minWidth: 75,
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.type || changes.mode || changes.linkingId) {
      this.displayType = this.type === 'taxlots' ? 'Tax Lot' : 'Property'
      this.initPage()
    }
  }

  initPage(): void {
    // Cancel any prior initPage() subscriptions (e.g. when inputs change)
    this._unsubscribeAll$.next()

    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap((org) => this.getDependencies(org)),
      )
      .subscribe()
  }

  getDependencies(org: Organization): Observable<unknown> {
    this.org = org
    this.orgId = org.id
    this._cycleService.getCycles(this.orgId)

    if (!org.cycles.length) {
      this.cycles = []
      this.rowData = []
      return EMPTY
    }

    const columns$ = this.type === 'properties' ? this._columnService.propertyColumns$ : this._columnService.taxLotColumns$

    return combineLatest([
      this._userService.currentUser$,
      this._cycleService.cycles$,
      this._inventoryService.getColumnListProfiles('List View Profile', this.type),
      this._organizationService.getMatchingCriteriaColumns(this.orgId, this.type),
      columns$,
    ]).pipe(
      takeUntil(this._unsubscribeAll$),
      tap(([currentUser, cycles, profiles, matchingColumns, columns]: [CurrentUser, Cycle[], Profile[], string[], Column[]]) => {
        this.currentUser = currentUser
        this.cycles = cycles
        this.columns = columns
        this.columnMap = new Map(columns.map((c) => [c.column_name, c.name]))
        this.matchingColumns = new Set(matchingColumns)
        this.profiles = profiles
          .filter((p) => p.inventory_type === this.displayType && p.profile_location === 'List View Profile')
          .sort((a, b) => naturalSort(a.name, b.name))

        this.ensureUserSettingsDefaults()
        this.selectedProfileId = this.currentUser.settings.profile.list[this.type]
        this.profile = this.profiles.find((p) => p.id === this.selectedProfileId)
        this.selectedCycleIds = this.getSelectedCycleIds()
      }),
      switchMap(() => this.setGrid()),
    )
  }

  /*
   * Guard against org users who have never saved cross-cycles/profile settings before -
   * `settings` is a bare JSON blob on the backend with no guaranteed default shape.
   */
  ensureUserSettingsDefaults(): void {
    this.currentUser.settings.profile ??= {}
    this.currentUser.settings.profile.list ??= {}
    this.currentUser.settings.crossCycles ??= {}
  }

  getSelectedCycleIds(): number[] {
    if (this.mode === 'detail') {
      return this.cycles.map((c) => c.id)
    }
    return this.currentUser.settings.crossCycles[this.type]?.length ? this.currentUser.settings.crossCycles[this.type] : [this.cycles[0].id]
  }

  setGrid(): Observable<unknown> {
    if (!this.selectedCycleIds.length) {
      this.rowData = []
      this.columnDefs = []
      return EMPTY
    }

    this.loading = true
    this.error = false
    return this._inventoryService.filterByCycle(this.orgId, this.selectedProfileId, this.selectedCycleIds, this.type).pipe(
      tap((dataByCycle) => {
        this.setColumnDefs()
        this.setRowData(dataByCycle)
      }),
      catchError(() => {
        this.error = true
        this.rowData = []
        return of(null)
      }),
      finalize(() => {
        this.loading = false
      }),
    )
  }

  setColumnDefs(): void {
    const dataColumns = this.profile
      ? [...this.profile.columns]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((c) => this.buildColumnDef(c.column_name, c.display_name, c.pinned))
      : this.columns.filter((c) => !c.is_extra_data).map((c) => this.buildColumnDef(c.column_name, c.display_name, false))

    this.columnDefs = [
      ...(this.mode === 'list' ? [this.buildExpandColumnDef()] : []),
      this.buildLinkingIdColumnDef(),
      this.buildDetailLinkColumnDef(),
      this.buildCycleColumnDef(),
      this.buildCycleStartColumnDef(),
      ...dataColumns.filter((c): c is ColDef => Boolean(c)),
    ]
  }

  buildColumnDef(columnName: string, displayName: string, pinned: boolean): ColDef | null {
    const field = this.columnMap.get(columnName)
    if (!field) return null

    const isMatching = this.matchingColumns.has(columnName)
    const colDef: ColDef = {
      field,
      headerName: isMatching ? `${displayName}*` : displayName,
      headerTooltip: isMatching ? this._transloco.translate('Matching criteria columns are given sort priority') : displayName,
      pinned: isMatching || pinned ? 'left' : null,
      width: 150,
    }

    const column = this.columns.find((c) => c.column_name === columnName)
    this.applyDataTypeFormatting(colDef, column?.data_type)
    return colDef
  }

  buildLinkingIdColumnDef(): ColDef {
    return {
      field: 'id',
      headerName: this._transloco.translate('Linking ID'),
      pinned: 'left',
      hide: this.mode === 'detail',
      ...(this.mode === 'detail' ? { sort: 'asc' as const, sortIndex: 0 } : {}),
      width: 110,
    }
  }

  buildDetailLinkColumnDef(): ColDef {
    const field = this.type === 'taxlots' ? 'taxlot_view_id' : 'property_view_id'
    const detailLabel = this._transloco.translate('View detail')

    return {
      field,
      headerName: '',
      pinned: 'left',
      width: 44,
      maxWidth: 44,
      sortable: false,
      filter: false,
      floatingFilter: false,
      suppressMovable: true,
      cellRenderer: ({ data, value }: { data: Record<string, unknown>; value: number }) =>
        !data._isGroup && value
          ? `<button type="button" class="mt-2 flex w-full cursor-pointer justify-center" data-action="detail" title="${detailLabel}" aria-label="${detailLabel}"><span class="material-icons-outlined">info</span></button>`
          : '',
    }
  }

  buildCycleColumnDef(): ColDef {
    return {
      field: 'cycle_name',
      headerName: this._transloco.translate('Cycle'),
      pinned: 'left',
      width: 130,
    }
  }

  buildCycleStartColumnDef(): ColDef {
    return {
      field: 'cycle_start',
      headerName: this._transloco.translate('Cycle Start'),
      pinned: 'left',
      filter: 'agDateColumnFilter',
      filterParams: { comparator: this.dateComparator },
      ...(this.mode === 'detail' ? { sort: 'asc' as const, sortIndex: 0 } : {}),
      valueFormatter: ({ value }: { value: string }) => (value ? new Date(value).toLocaleDateString() : ''),
      width: 130,
    }
  }

  buildExpandColumnDef(): ColDef {
    const toggleLabel = this._transloco.translate('Toggle cycles')
    return {
      colId: 'expand_col',
      headerName: '',
      pinned: 'left',
      width: 36,
      maxWidth: 36,
      sortable: false,
      filter: false,
      floatingFilter: false,
      suppressMovable: true,
      cellRenderer: ({ data }: { data: Record<string, unknown> }) => {
        if (!data?._isGroup) return ''
        const icon = this._expandedLinkingIds.has(data.id as number) ? 'expand_more' : 'chevron_right'
        return `<button type="button" class="mt-2 flex w-full cursor-pointer justify-center" data-action="toggle" aria-label="${toggleLabel}"><span class="material-icons-outlined">${icon}</span></button>`
      },
    }
  }

  applyDataTypeFormatting(colDef: ColDef, dataType?: Column['data_type']): void {
    if (dataType === 'datetime' || dataType === 'date') {
      colDef.filter = 'agDateColumnFilter'
      colDef.filterParams = { comparator: this.dateComparator }
      colDef.valueFormatter = ({ value }: { value: string }) => (value ? new Date(value).toLocaleString() : '')
      return
    }
    if (dataType === 'boolean') {
      colDef.valueFormatter = ({ value }: { value: boolean }) => (value === true ? 'true' : value === false ? 'false' : '')
      return
    }
    if (dataType && NUMERIC_DATA_TYPES.has(dataType)) {
      colDef.filter = 'agNumberColumnFilter'
      if (DECIMAL_DATA_TYPES.has(dataType)) {
        colDef.valueFormatter = ({ value }: { value: number }) =>
          typeof value === 'number' ? value.toFixed(this.org.display_decimal_places) : ''
      }
    }
  }

  dateComparator = (filterDate: Date, cellValue: string): number => {
    if (!cellValue) return -1
    const cellDate = new Date(cellValue)
    if (cellDate < filterDate) return -1
    if (cellDate > filterDate) return 1
    return 0
  }

  setRowData(dataByCycle: CrossCyclesResponse): void {
    const cycleById = new Map(this.cycles.map((c) => [c.id, c]))
    const allDetailRows: Record<string, unknown>[] = Object.entries(dataByCycle ?? {}).flatMap(([cycleId, records]) =>
      records.map((record) => ({
        ...record,
        _isGroup: false,
        cycle_name: cycleById.get(Number(cycleId))?.name ?? '',
        cycle_start: cycleById.get(Number(cycleId))?.start ?? null,
      })),
    )

    if (this.mode === 'detail' && this.linkingId) {
      this.rowData = allDetailRows.filter((row) => row.id === this.linkingId)
      return
    }

    // Group by linking ID; start all collapsed
    this._detailRowsByLinkingId = new Map<number, Record<string, unknown>[]>()
    this._expandedLinkingIds = new Set<number>()

    for (const row of allDetailRows) {
      const id = row.id as number
      const existing = this._detailRowsByLinkingId.get(id) ?? []
      existing.push(row)
      this._detailRowsByLinkingId.set(id, existing)
    }

    const sortedIds = [...this._detailRowsByLinkingId.keys()].sort((a, b) => a - b)
    this.rowData = sortedIds.map((id) => {
      const detailRows = this._detailRowsByLinkingId.get(id) ?? []
      const count = detailRows.length
      return {
        id,
        _isGroup: true,
        _cycleCount: count,
        cycle_name: `${count} ${count === 1 ? this._transloco.translate('cycle') : this._transloco.translate('cycles')}`,
        cycle_start: null,
      }
    })
  }

  toggleGroup(linkingId: number): void {
    if (this._expandedLinkingIds.has(linkingId)) {
      this._expandedLinkingIds.delete(linkingId)
      this.rowData = this.rowData.filter((row) => row._isGroup === true || row.id !== linkingId)
    } else {
      this._expandedLinkingIds.add(linkingId)
      const detailRows = this._detailRowsByLinkingId.get(linkingId) ?? []
      const groupIdx = this.rowData.findIndex((row) => row._isGroup === true && row.id === linkingId)
      if (groupIdx === -1) return
      const newRowData = [...this.rowData]
      newRowData.splice(groupIdx + 1, 0, ...detailRows)
      this.rowData = newRowData
    }
    this.gridApi?.refreshCells({ columns: ['expand_col'], force: true })
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent): void {
    const action = (event.event?.target as HTMLElement | null)?.closest?.('[data-action]')?.getAttribute('data-action')

    if (action === 'toggle') {
      this.toggleGroup((event.data as Record<string, unknown>).id as number)
      return
    }

    const field = this.type === 'taxlots' ? 'taxlot_view_id' : 'property_view_id'
    if (event.colDef.field !== field) return
    if (action !== 'detail') return

    const { property_view_id, taxlot_view_id } = event.data as { property_view_id?: number; taxlot_view_id?: number }
    const viewId = this.type === 'taxlots' ? taxlot_view_id : property_view_id
    if (viewId) void this._router.navigate([`/${this.type}`, viewId])
  }

  onClearFilters(): void {
    this.gridApi?.setFilterModel(null)
  }

  onSelectCycleClosed(): void {
    this.currentUser.settings.crossCycles[this.type] = this.selectedCycleIds
    this.updateOrgUserSettings()
      .pipe(switchMap(() => this.setGrid()))
      .subscribe()
  }

  onSelectProfile(): void {
    this.currentUser.settings.profile.list[this.type] = this.selectedProfileId
    this.profile = this.profiles.find((p) => p.id === this.selectedProfileId)
    this.updateOrgUserSettings()
      .pipe(switchMap(() => this.setGrid()))
      .subscribe()
  }

  updateOrgUserSettings() {
    return this._organizationService.updateOrganizationUser(this.currentUser.org_user_id, this.orgId, this.currentUser.settings)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
