import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import type { Column, Cycle } from '@seed/api'
import { ColumnService, CycleService, InventoryService, OrganizationService, UserService } from '@seed/api'
import { ConfigService } from '@seed/services'
import { CrossCyclesGridComponent } from './cross-cycles-grid.component'

describe('CrossCyclesGridComponent', () => {
  let component: CrossCyclesGridComponent

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ColumnService, useValue: {} },
        { provide: CycleService, useValue: {} },
        { provide: InventoryService, useValue: {} },
        { provide: OrganizationService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: ConfigService, useValue: { gridTheme$: of(null) } },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    })
    component = TestBed.runInInjectionContext(() => new CrossCyclesGridComponent())
    component.cycles = [
      { id: 1, name: '2022', start: '2022-01-01' },
      { id: 2, name: '2023', start: '2023-01-01' },
    ] as Cycle[]
  })

  afterEach(() => {
    component.ngOnDestroy()
  })

  it('puts the latest cycle values on the collapsed group row so column filters can match it', () => {
    component.setRowData({
      2: [{ id: 7, pm_property_id_1: '6410079', site_eui_56: 95.9 }],
      1: [{ id: 7, pm_property_id_1: '6410079', site_eui_56: null }],
    })

    expect(component.rowData.length).toBe(1)
    expect(component.rowData[0]).toEqual(
      jasmine.objectContaining({ id: 7, _isGroup: true, cycle_name: '2 cycles', pm_property_id_1: '6410079', site_eui_56: 95.9 }),
    )
  })

  it('maps columns by id so same-named related columns do not take over the field', () => {
    component.columnMap = new Map([[5, { id: 5, column_name: 'custom_id_1', name: 'custom_id_1_5', data_type: 'string' } as Column]])

    expect(component.buildColumnDef(5, 'Custom ID 1', false)?.field).toBe('custom_id_1_5')
    expect(component.buildColumnDef(8, 'Custom ID 1 (Tax Lot)', false)).toBeNull()
  })
})
