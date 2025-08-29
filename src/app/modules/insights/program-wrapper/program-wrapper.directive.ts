import type { ElementRef, OnDestroy, OnInit } from '@angular/core'
import { Directive, inject, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import type { Chart } from 'chart.js'
import { combineLatest, filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { Column, Cycle, Organization, Program, ProgramData } from '@seed/api'
import { ColumnService, CycleService, OrganizationService } from '@seed/api'
import { ProgramService } from '@seed/api/program'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { ProgramConfigComponent } from '../config'
import { ActivatedRoute, ParamMap, Router } from '@angular/router'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Directive()
export abstract class ProgramWrapperDirective implements OnDestroy, OnInit {
  @ViewChild('chart', { static: true }) canvas!: ElementRef<HTMLCanvasElement>
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _programService = inject(ProgramService)
  private _dialog = inject(MatDialog)
  private _organizationService = inject(OrganizationService)
  protected _snackBar = inject(SnackBarService)
  protected _route = inject(ActivatedRoute)
  protected _router = inject(Router)
  protected _unsubscribeAll$ = new Subject<void>()

  accessLevelInstances = ['temp instance1', 'temp instance2']
  accessLevels = ['temp level1', 'temp level2']
  chart: Chart
  chartName: string
  colors: Record<string, string> = { compliant: '#77CCCB', 'non-compliant': '#A94455', unknown: '#DDDDDD' }
  cycles: Cycle[]
  data: ProgramData
  filterGroups: unknown[]
  loading = true
  org: Organization
  orgId: number
  programs: Program[]
  programChange$ = new Subject<void>()
  programCycles: Cycle[] = []
  programXAxisColumns: Column[] = []
  propertyColumns: Column[]
  selectedProgram: Program
  scheme: 'dark' | 'light' = 'light'
  xAxisColumns: Column[]
  xAxisDataTypes = ['number', 'string', 'float', 'integer', 'ghg', 'ghg_intensity', 'area', 'eui', 'boolean']

  ngOnInit(): void {
    this.getDependencies()
  }

  getDependencies() {
    combineLatest({
      org: this._organizationService.currentOrganization$,
      cycles: this._cycleService.cycles$,
      propertyColumns: this._columnService.propertyColumns$,
      programs: this._programService.programs$,
      scheme: this._configService.scheme$,
    }).pipe(
      tap(({ org, cycles, propertyColumns, programs, scheme }) => {
        this.org = org
        this.cycles = cycles
        this.propertyColumns = propertyColumns
        this.xAxisColumns = this.propertyColumns.filter((c) => this.validColumn(c, this.xAxisDataTypes))
        this.scheme = scheme
        this.programs = programs.filter((p) => p.organization_id === org.id).sort((a, b) => naturalSort(a.name, b.name))
      }),
      switchMap(() => this._route.paramMap),
      tap((params: ParamMap) => { this.handleRoute(params) }),
      takeUntil(this._unsubscribeAll$),
    ).subscribe()
  }

  /*
  * assigns the program based on the route parameters
  * assigns the first program if the route parameter is invalid
  */
  handleRoute(params: ParamMap) {
    if (!this.programs.length) {
      this.programChange(null)
      return
    }

    const id = parseInt(params.get('id'))
    const urlProgram = this.programs.find((p) => p.id === id && p.organization_id === this.org.id)
    const program = urlProgram ?? this.programs?.[0]
    if (id !== program?.id) {
      console.log(this._route.url)
      const path = this._router.url.split('/')[2]

      void this._router.navigate([`/insights/${path}`, program.id])
    }
    this.programChange(program)
  }

  setScheme() {
    this._configService.scheme$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((scheme) => {
      const color = scheme === 'light' ? '#0000001a' : '#ffffff2b'
      this.chart.options.scales.x.grid = { color }
      this.chart.options.scales.y.grid = { color }
      this.chart.update()
    })
  }

  programChange(program: Program) {
    this.selectedProgram = program?.organization_id === this.org.id ? program : null
    if (!program) {
      this.clearChart()
      return
    }
    this.setProgramModels()

    this._programService.evaluate(this.org.id, program.id)
      .pipe(
        tap((data) => {
          this.data = data
          this.programChange$.next()
          this.loading = false
          this.setChartName(program)
        }),
        take(1),
      ).subscribe()
  }

  clearChart() {
    this.programCycles = []
    this.programXAxisColumns = []
    this.loading = false
    this.initChart()
  }

  setProgramModels() {
    const { cycles, x_axis_columns } = this.selectedProgram
    this.programCycles = this.cycles.filter((c) => cycles.includes(c.id))
    this.programXAxisColumns = this.xAxisColumns.filter((c) => x_axis_columns.includes(c.id))
  }

  setChartName(program: Program) {
    if (!program) return
    const cycles = this.cycles.filter((c) => program.cycles.includes(c.id))
    const cycleFirst = cycles.reduce((prev, curr) => (prev.start < curr.start ? prev : curr))
    const cycleLast = cycles.reduce((prev, curr) => (prev.end > curr.end ? prev : curr))
    const cycleRange = cycleFirst === cycleLast ? cycleFirst.name : `${cycleFirst.name} - ${cycleLast.name}`
    this.chartName = `${program.name}: ${cycleRange}`
  }

  refreshChart() {
    if (!this.selectedProgram) return
    this.initChart()
    this.programChange(this.selectedProgram)
  }

  downloadChart() {
    const a = document.createElement('a')
    a.href = this.chart.toBase64Image()
    a.download = `Program-${this.chartName}.png`
    a.click()
  }

  validColumn(column: Column, validTypes: string[]) {
    const isAllowedType = validTypes.includes(column.data_type)
    const notRelated = !column.related
    const notDerived = !column.derived_column
    return isAllowedType && notRelated && notDerived
  }

  openProgramConfig = () => {
    const dialogRef = this._dialog.open(ProgramConfigComponent, {
      width: '50rem',
      data: {
        cycles: this.cycles,
        filterGroups: this.filterGroups,
        programs: this.programs,
        selectedProgram: this.selectedProgram,
        org: this.org,
        propertyColumns: this.propertyColumns?.sort((a, b) => naturalSort(a.display_name, b.display_name)),
        xAxisColumns: this.xAxisColumns,
      },
    })

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((programId: number) => { this.selectedProgram = this.programs.find((p) => p.id == programId) }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  protected abstract initChart(): void
}
