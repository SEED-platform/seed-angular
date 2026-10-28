import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import type { GridApi } from 'ag-grid-community'
import { of, Subject, throwError } from 'rxjs'
import type { Column, CurrentUser, Cycle, Organization, OrganizationUserResponse } from '@seed/api'
import { ColumnService, CycleService, InventoryService, OrganizationService, UserService } from '@seed/api'
import { ConfigService } from '@seed/services'
import type { CrossCyclesResponse } from 'app/modules/inventory/inventory.types'
import { CrossCyclesGridComponent } from './cross-cycles-grid.component'

describe('CrossCyclesGridComponent', () => {
  let component: CrossCyclesGridComponent
  let filterPresent: boolean
  let saveSucceeds: boolean
  let filterByCycle: jasmine.Spy

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
  const org = { id: 1, cycles: [1, 2], display_decimal_places: 2 } as unknown as Organization

  beforeEach(() => {
    filterPresent = false
    saveSucceeds = true
    filterByCycle = jasmine.createSpy('filterByCycle').and.returnValue(of(dataByCycle))
    TestBed.configureTestingModule({
      providers: [
        { provide: ColumnService, useValue: { propertyColumns$: of(columns) } },
        { provide: CycleService, useValue: { cycles$: of(cycles), getCycles: () => undefined } },
        { provide: InventoryService, useValue: { getColumnListProfiles: () => of([]), filterByCycle } },
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
    component.getDependencies(org).subscribe()
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

  it('saves a new cycle selection and reloads the grid', () => {
    filterByCycle.calls.reset()
    component.selectedCycleIds = [2]
    component.onSelectCycleClosed()

    expect(component.currentUser.settings.crossCycles.properties).toEqual([2])
    expect(filterByCycle).toHaveBeenCalledOnceWith(1, undefined, [2], 'properties')
  })

  it('applies only the latest reload when cycle changes overlap', () => {
    const firstReload$ = new Subject<CrossCyclesResponse>()
    const secondReload$ = new Subject<CrossCyclesResponse>()
    filterByCycle.and.returnValues(firstReload$, secondReload$)
    component.selectedCycleIds = [2]
    component.onSelectCycleClosed()
    component.selectedCycleIds = [1]
    component.onSelectCycleClosed()

    expect(component.loading).toBeTrue()

    secondReload$.next({ 1: [{ id: 8, custom_id_1_5: 'B', site_eui_56: 50 }] })
    secondReload$.complete()
    firstReload$.next({ 2: [{ id: 7, custom_id_1_5: 'A', site_eui_56: 141.8 }] })

    expect(component.rowData.map((r) => r.id)).toEqual([8])
    expect(component.loading).toBeFalse()
  })

  it('reloads the restored profile when the newer of two overlapping saves fails', () => {
    const firstSave$ = new Subject<OrganizationUserResponse>()
    const secondSave$ = new Subject<OrganizationUserResponse>()
    spyOn(TestBed.inject(OrganizationService), 'updateOrganizationUser').and.returnValues(firstSave$, secondSave$)
    filterByCycle.calls.reset()
    component.profiles = [
      { id: 3, columns: [] },
      { id: 4, columns: [] },
    ] as unknown as typeof component.profiles
    component.selectedProfileId = 3
    component.onSelectProfile()
    component.selectedProfileId = 4
    component.onSelectProfile()

    firstSave$.next({} as OrganizationUserResponse)
    firstSave$.complete()
    secondSave$.error(new Error('save failed'))

    expect(component.selectedProfileId).toBe(3)
    expect(component.profile?.id).toBe(3)
    expect(component.currentUser.settings.profile.list.properties).toBe(3)
    expect(filterByCycle).toHaveBeenCalledOnceWith(1, 3, [1, 2], 'properties')
  })

  it('keeps the newer profile when the older of two overlapping saves fails', () => {
    const firstSave$ = new Subject<OrganizationUserResponse>()
    const secondSave$ = new Subject<OrganizationUserResponse>()
    spyOn(TestBed.inject(OrganizationService), 'updateOrganizationUser').and.returnValues(firstSave$, secondSave$)
    filterByCycle.calls.reset()
    component.profiles = [
      { id: 3, columns: [] },
      { id: 4, columns: [] },
    ] as unknown as typeof component.profiles
    component.selectedProfileId = 3
    component.onSelectProfile()
    component.selectedProfileId = 4
    component.onSelectProfile()

    firstSave$.error(new Error('save failed'))
    secondSave$.next({} as OrganizationUserResponse)
    secondSave$.complete()

    expect(component.selectedProfileId).toBe(4)
    expect(component.profile?.id).toBe(4)
    expect(component.currentUser.settings.profile.list.properties).toBe(4)
    expect(filterByCycle).toHaveBeenCalledOnceWith(1, 4, [1, 2], 'properties')
  })

  it('reloads when re-picking a cycle after deselecting them all', () => {
    component.selectedCycleIds = []
    component.onSelectCycleClosed()

    expect(component.rowData).toEqual([])

    filterByCycle.calls.reset()
    component.selectedCycleIds = [1]
    component.onSelectCycleClosed()

    expect(filterByCycle).toHaveBeenCalledOnceWith(1, undefined, [1], 'properties')
  })

  it('skips the save and reload when the cycle selection is unchanged', () => {
    const save = spyOn(TestBed.inject(OrganizationService), 'updateOrganizationUser').and.callThrough()
    filterByCycle.calls.reset()
    component.selectedCycleIds = [2, 1]
    component.onSelectCycleClosed()

    expect(save).not.toHaveBeenCalled()
    expect(filterByCycle).not.toHaveBeenCalled()
  })

  it('skips the save and reload when a first-time user closes the default cycle selection unchanged', () => {
    component.currentUser.settings.crossCycles = {}
    component.getDependencies(org).subscribe()
    const save = spyOn(TestBed.inject(OrganizationService), 'updateOrganizationUser').and.callThrough()
    filterByCycle.calls.reset()
    component.selectedCycleIds = [1]
    component.onSelectCycleClosed()

    expect(save).not.toHaveBeenCalled()
    expect(filterByCycle).not.toHaveBeenCalled()
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
