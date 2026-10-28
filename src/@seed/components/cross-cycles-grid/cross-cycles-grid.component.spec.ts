import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import type { GridApi } from 'ag-grid-community'
import { of, throwError } from 'rxjs'
import type { Column, CurrentUser, Cycle, Organization } from '@seed/api'
import { ColumnService, CycleService, InventoryService, OrganizationService, UserService } from '@seed/api'
import { ConfigService } from '@seed/services'
import { CrossCyclesGridComponent } from './cross-cycles-grid.component'

describe('CrossCyclesGridComponent', () => {
  let component: CrossCyclesGridComponent
  let filterPresent: boolean
  let saveSucceeds: boolean
  let filterByCycle: jasmine.Spy
  let getAgInventory: jasmine.Spy

  // Cycle ids deliberately out of start-date order
  const cycles = [
    { id: 1, name: '2023', start: '2023-01-01' },
    { id: 2, name: '2022', start: '2022-01-01' },
  ] as Cycle[]
  const columns = [
    { id: 5, column_name: 'custom_id_1', name: 'custom_id_1_5', display_name: 'Custom ID 1', data_type: 'string', related: false },
    { id: 9, column_name: 'custom_id_1', name: 'custom_id_1_9', display_name: 'Custom ID 1', data_type: 'string', related: true },
    { id: 56, column_name: 'site_eui', name: 'site_eui_56', display_name: 'Site EUI', data_type: 'eui', related: false },
  ] as Column[]
  const dataByCycle = {
    1: [
      { id: 7, custom_id_1_5: 'A', site_eui_56: null },
      { id: 8, custom_id_1_5: 'B', site_eui_56: 50 },
    ],
    2: [{ id: 7, custom_id_1_5: 'A', site_eui_56: 141.8 }],
  }

  beforeEach(() => {
    filterPresent = false
    saveSucceeds = true
    filterByCycle = jasmine.createSpy('filterByCycle').and.returnValue(of(dataByCycle))
    // a different row per cycle (requested in selectedCycleIds order: 1, then 2)
    getAgInventory = jasmine
      .createSpy('getAgInventory')
      .and.returnValues(of({ results: [{ id: 7, site_eui_56: 10 }] }), of({ results: [{ id: 7, site_eui_56: 20 }] }))
    TestBed.configureTestingModule({
      providers: [
        { provide: ColumnService, useValue: { propertyColumns$: of(columns) } },
        { provide: CycleService, useValue: { cycles$: of(cycles), getCycles: () => undefined } },
        { provide: InventoryService, useValue: { getColumnListProfiles: () => of([]), filterByCycle, getAgInventory } },
        {
          provide: OrganizationService,
          useValue: {
            getMatchingCriteriaColumns: () => of([]),
            updateOrganizationUser: () => (saveSucceeds ? of({}) : throwError(() => new Error('save failed'))),
          },
        },
        {
          provide: UserService,
          useValue: {
            currentUser$: of({ settings: { profile: { list: {} }, crossCycles: { properties: [1, 2] } } } as unknown as CurrentUser),
          },
        },
        { provide: Router, useValue: {} },
        { provide: ConfigService, useValue: { gridTheme$: of(null) } },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    })
    component = TestBed.runInInjectionContext(() => new CrossCyclesGridComponent())
    component.type = 'properties'
    component.gridApi = { isAnyFilterPresent: () => filterPresent, refreshCells: () => undefined } as unknown as GridApi
    component.getDependencies({ id: 1, cycles: [1, 2], display_decimal_places: 2 } as unknown as Organization).subscribe()
  })

  afterEach(() => {
    component.ngOnDestroy()
  })

  it('builds data columns from this inventory type only, skipping related columns', () => {
    const fields = component.columnDefs.map((c) => c.field)

    expect(fields).toContain('custom_id_1_5')
    expect(fields).toContain('site_eui_56')
    expect(fields).not.toContain('custom_id_1_9')
  })

  it('shows collapsed group rows without field values when no filter is active', () => {
    expect(component.rowData).toEqual([
      { id: 7, _isGroup: true, _cycleCount: 2, cycle_name: '2 cycles', cycle_start: null },
      { id: 8, _isGroup: true, _cycleCount: 1, cycle_name: '1 cycle', cycle_start: null },
    ])
  })

  it('expands a group with its cycle rows in start-date order', () => {
    component.toggleGroup(7)

    expect(component.rowData.map((r) => [r.id, r._isGroup, r.cycle_name])).toEqual([
      [7, true, '2 cycles'],
      [7, false, '2022'],
      [7, false, '2023'],
      [8, true, '1 cycle'],
    ])
  })

  it('shows every cycle row ungrouped while a filter is active, and regroups when it is cleared', () => {
    component.toggleGroup(8)
    filterPresent = true
    component.onFilterChanged()

    expect(component.rowData.map((r) => [r.id, r.cycle_name, r.site_eui_56])).toEqual([
      [7, '2022', 141.8],
      [7, '2023', null],
      [8, '2023', 50],
    ])

    filterPresent = false
    component.onFilterChanged()

    expect(component.rowData.map((r) => [r.id, r._isGroup])).toEqual([
      [7, true],
      [8, true],
      [8, false],
    ])
  })

  const detailParams = (cycle: string) => ({
    organization_id: '1',
    cycle,
    inventory_type: 'property',
    include_related: 'false',
    per_page: '1',
  })
  const agInventoryCalls = () =>
    (getAgInventory.calls.allArgs() as [string, unknown][]).map(([params, data]) => [Object.fromEntries(new URLSearchParams(params)), data])

  it('in property detail mode, fetches only the linked property, one filter call per cycle', () => {
    filterByCycle.calls.reset()
    component.mode = 'detail'
    component.linkingId = 7
    component.setGrid().subscribe()

    expect(filterByCycle).not.toHaveBeenCalled()
    expect(agInventoryCalls()).toEqual([
      [detailParams('1'), { include_property_ids: [7], profile_id: undefined }],
      [detailParams('2'), { include_property_ids: [7], profile_id: undefined }],
    ])
    expect(component.rowData.map((r) => [r.id, r.cycle_name, r.site_eui_56])).toEqual([
      [7, '2022', 20],
      [7, '2023', 10],
    ])
  })

  it('in property detail mode, sends the selected profile_id', () => {
    component.mode = 'detail'
    component.linkingId = 7
    component.selectedProfileId = 3
    component.setGrid().subscribe()

    expect(agInventoryCalls().map(([, data]) => data)).toEqual([
      { include_property_ids: [7], profile_id: 3 },
      { include_property_ids: [7], profile_id: 3 },
    ])
  })

  it('in property detail mode, shows the error state when any cycle request fails', () => {
    getAgInventory.and.returnValues(
      of({ results: [{ id: 7 }] }),
      throwError(() => new Error('filter failed')),
    )
    component.mode = 'detail'
    component.linkingId = 7
    component.setGrid().subscribe()

    expect(component.error).toBeTrue()
    expect(component.rowData).toEqual([])
  })

  it('in tax lot detail mode, uses filterByCycle and keeps only the linked record', () => {
    filterByCycle.calls.reset()
    component.type = 'taxlots'
    component.mode = 'detail'
    component.linkingId = 7
    component.setGrid().subscribe()

    expect(getAgInventory).not.toHaveBeenCalled()
    expect(filterByCycle).toHaveBeenCalledOnceWith(1, undefined, [1, 2], 'taxlots')
    expect(component.rowData.map((r) => [r.id, r.cycle_name])).toEqual([
      [7, '2022'],
      [7, '2023'],
    ])
  })

  it('saves a new cycle selection and reloads the grid', () => {
    filterByCycle.calls.reset()
    component.selectedCycleIds = [2]
    component.onSelectCycleClosed()

    expect(component.currentUser.settings.crossCycles.properties).toEqual([2])
    expect(filterByCycle).toHaveBeenCalledOnceWith(1, undefined, [2], 'properties')
  })

  it('restores the previous cycle selection and skips the reload when the save fails', () => {
    filterByCycle.calls.reset()
    saveSucceeds = false
    component.selectedCycleIds = [2]
    component.onSelectCycleClosed()

    expect(component.currentUser.settings.crossCycles.properties).toEqual([1, 2])
    expect(component.selectedCycleIds).toEqual([1, 2])
    expect(filterByCycle).not.toHaveBeenCalled()
  })

  it('restores the previous profile when the save fails', () => {
    filterByCycle.calls.reset()
    saveSucceeds = false
    component.profiles = [{ id: 3 }] as typeof component.profiles
    component.selectedProfileId = 3
    component.onSelectProfile()

    expect(component.currentUser.settings.profile.list.properties).toBeUndefined()
    expect(component.selectedProfileId).toBeUndefined()
    expect(component.profile).toBeUndefined()
    expect(filterByCycle).not.toHaveBeenCalled()
  })
})
