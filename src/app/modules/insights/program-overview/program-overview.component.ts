import { CommonModule } from '@angular/common'
import type { ElementRef, OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import type { ParamMap } from '@angular/router'
import { ActivatedRoute, Router } from '@angular/router'
import type { ActiveElement, TooltipItem } from 'chart.js'
import { Chart } from 'chart.js'
import { combineLatest, filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Column, Cycle, Organization, Program, ProgramData } from '@seed/api'
import { ColumnService, CycleService, OrganizationService, ProgramService } from '@seed/api'
import { NotFoundComponent, PageComponent, ProgressBarComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ConfigService } from '@seed/services'
import { naturalSort } from '@seed/utils'
import { ProgramConfigComponent } from '../config'

@Component({
  selector: 'seed-program-overview',
  templateUrl: './program-overview.component.html',
  imports: [CommonModule, MaterialImports, PageComponent, ProgressBarComponent, NotFoundComponent],
})
export class ProgramOverviewComponent implements OnDestroy, OnInit {
  @ViewChild('programOverviewChart', { static: true }) canvas!: ElementRef<HTMLCanvasElement>
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _programService = inject(ProgramService)
  private _dialog = inject(MatDialog)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _unsubscribeAll$ = new Subject<void>()
  chart: Chart
  chartName: string
  colors: Record<string, string> = { compliant: '#77CCCB', 'non-compliant': '#A94455', unknown: '#DDDDDD' }
  cycles: Cycle[]
  data: ProgramData
  filterGroups: unknown[]
  loading = true
  org: Organization
  programId = 0
  program: Program
  programs: Program[]
  propertyColumns: Column[]
  scheme: 'dark' | 'light' = 'light'
  xAxisColumns: Column[]
  xAxisDataTypes = ['number', 'string', 'float', 'integer', 'ghg', 'ghg_intensity', 'area', 'eui', 'boolean']

  ngOnInit(): void {
    this._route.paramMap.subscribe((params: ParamMap) => {
      this.programId = parseInt(params.get('id'))
      this.initProgram()
    })
  }

  initProgram() {
    this.getDependencies()
    this.initChart()
    this.setScheme()
  }

  getDependencies() {
    combineLatest({
      org: this._organizationService.currentOrganization$,
      cycles: this._cycleService.cycles$,
      propertyColumns: this._columnService.propertyColumns$,
      programs: this._programService.programs$,
      scheme: this._configService.scheme$,
    })
      .pipe(
        tap(({ org, cycles, propertyColumns, programs, scheme }) => {
          this.org = org
          this.cycles = cycles
          this.propertyColumns = propertyColumns
          this.xAxisColumns = this.propertyColumns.filter((c) => this.validColumn(c, this.xAxisDataTypes))
          this.scheme = scheme
          this.programs = programs.filter((p) => p.organization_id === org.id).sort((a, b) => naturalSort(a.name, b.name))
          this.program = programs.find((p) => p.id === this.programId)
          if (!this.program) {
            this.loading = false
            this.programChange(this.programs[0])
          }
        }),
        filter(() => this.program?.organization_id === this.org.id),
        switchMap(() => this.evaluateProgram()),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  programChange(program: Program) {
    const segments = ['/insights/program-overview']
    if (program?.id) segments.push(program.id.toString())
    void this._router.navigate(segments)
  }

  evaluateProgram() {
    return this._programService.evaluate(this.org.id, this.program.id).pipe(
      tap((data) => {
        this.data = data
        this.setDatasets()
        this.loading = false
        this.setChartName(this.program)
      }),
    )
  }

  setDatasets() {
    if (!this.data.graph_data) return
    const { labels, datasets } = this.data.graph_data
    for (const ds of datasets) {
      ds.backgroundColor = this.colors[ds.label]
    }

    this.chart.data.labels = labels
    this.chart.data.datasets = datasets
    this.chart.update()
    console.log('ALL DATA', {
      chart: this.chart,
    })
  }

  initChart() {
    this.chart?.destroy()
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        onClick: (_, elements: ActiveElement[], chart: Chart<'bar'>) => {
          const { datasetIndex, index } = elements[0]
          const label = chart.data.datasets[datasetIndex]?.label
          const cycleName = chart.data.labels[index]
          const cycleId = this.cycles.find((c) => c.name === cycleName)?.id

          return void this._router.navigate(['/insights/property-insights', this.program.id], {
            state: { cycleId, label },
          })
        },
        plugins: {
          title: { display: true, align: 'start' },
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => this.tooltipFooter(ctx) },
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            beginAtZero: true,
            stacked: true,
            position: 'left',
            display: true,
            title: { text: 'Number of Buildings', display: true },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    })
    this.setScheme()
  }

  setScheme() {
    this._configService.scheme$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((scheme) => {
      const color = scheme === 'light' ? '#0000001a' : '#ffffff2b'
      this.chart.options.scales.x.grid = { color }
      this.chart.options.scales.y.grid = { color }
      this.chart.update()
    })
  }

  tooltipFooter(tooltipItem: TooltipItem<'bar'>): string[] {
    if (!tooltipItem) return []

    const { dataIndex, raw, dataset } = tooltipItem
    const label = `${dataset.label}: ${raw as number}`

    const barValues = this.chart.data.datasets.map((ds) => ds.data[dataIndex]) as number[]
    const barTotal = barValues.reduce((acc, cur) => acc + cur, 0)
    const percentage = `${(((raw as number) / barTotal) * 100).toPrecision(4)}%`

    return [label, percentage]
  }

  validColumn(column: Column, validTypes: string[]) {
    const isAllowedType = validTypes.includes(column.data_type)
    const notRelated = !column.related
    const notDerived = !column.derived_column
    return isAllowedType && notRelated && notDerived
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
    if (!this.program) return
    this.initChart()
    this.setDatasets()
  }

  downloadChart() {
    const a = document.createElement('a')
    a.href = this.chart.toBase64Image()
    a.download = `Program-${this.chartName}.png`
    a.click()
  }

  openProgramConfig = () => {
    const dialogRef = this._dialog.open(ProgramConfigComponent, {
      width: '50rem',
      data: {
        cycles: this.cycles,
        filterGroups: this.filterGroups,
        programs: this.programs,
        selectedProgram: this.program,
        org: this.org,
        propertyColumns: this.propertyColumns?.sort((a, b) => naturalSort(a.display_name, b.display_name)),
        xAxisColumns: this.xAxisColumns,
      },
    })

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((programId: number) => {
          this.program = this.programs.find((p) => p.id == programId)
        }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
