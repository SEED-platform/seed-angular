import { CommonModule } from '@angular/common'
import { Location } from '@angular/common'
import type { ElementRef, OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import type { ActiveElement, TooltipItem } from 'chart.js'
import { Chart } from 'chart.js'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import { combineLatest, EMPTY, filter, Subject, switchMap, take, takeUntil, tap, zip } from 'rxjs'
import { AccessLevelInstancesByDepth, AccessLevelsByDepth, Column, ColumnService, Cycle, CycleService, Organization, OrganizationService, ProgramData, ProgramService, type Program, type PropertyInsightDataset, type PropertyInsightPoint, type ResultsByCycles } from '@seed/api'
import { NotFoundComponent, PageComponent, ProgressBarComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ActivatedRoute, ParamMap, Router } from '@angular/router'
import { ConfigService } from '@seed/services'
import { MatDialog } from '@angular/material/dialog'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { ProgramConfigComponent } from '../config'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-property-insights',
  templateUrl: './property-insights.component.html',
  imports: [
    CommonModule,
    FormsModule,
    PageComponent,
    MaterialImports,
    NotFoundComponent,
    ProgressBarComponent,
    ReactiveFormsModule,
  ],
})
export class PropertyInsightsComponent implements OnDestroy, OnInit {
  @ViewChild('propertyInsightsChart', { static: true }) canvas!: ElementRef<HTMLCanvasElement>
  private _location = inject(Location)
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _cycleService = inject(CycleService)
  private _programService = inject(ProgramService)
  private _dialog = inject(MatDialog)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _snackBar = inject(SnackBarService)
  private _unsubscribeAll$ = new Subject<void>()

  accessLevelNames: AccessLevelInstancesByDepth['accessLevelNames'] = []
  accessLevelInstancesByDepth: AccessLevelsByDepth = {}
  accessLevelInstances: AccessLevelsByDepth[keyof AccessLevelsByDepth] = []
  annotations: Record<string, AnnotationOptions>
  chart: Chart
  chartName: string
  colors: Record<string, string> = { compliant: '#77CCCB', 'non-compliant': '#A94455', unknown: '#DDDDDD' }
  cycles: Cycle[]
  data: ProgramData
  datasets: PropertyInsightDataset[] = []
  datasetVisibility = ['compliant', 'non-compliant', 'unknown', 'whisker']
  filterGroups: unknown[] = []
  loading = true
  metricTypes = [
    { key: 0, value: 'Energy Metric' },
    { key: 1, value: 'Emission Metric' },
  ]
  org: Organization
  programId: number
  program: Program
  programs: Program[]
  propertyColumns: Column[]
  programCycles: Cycle[] = []
  programXAxisColumns: Column[] = []
  results = { y: 0, n: 0, u: 0 }
  scheme: 'dark' | 'light' = 'light'
  xCategorical = false
  xAxisColumns: Column[]
  xAxisDataTypes = ['number', 'string', 'float', 'integer', 'ghg', 'ghg_intensity', 'area', 'eui', 'boolean']

  form = new FormGroup({
    cycleId: new FormControl<number>(null),
    metricType: new FormControl<0 | 1>(0),
    xAxisColumnId: new FormControl<number>(null),
    accessLevel: new FormControl<string | null>(null),
    accessLevelInstanceId: new FormControl<number | null>(null),
    program: new FormControl<Program>(null),
    annotationVisibility: new FormControl<boolean>(true),
  })

  ngOnInit() {
    this._route.paramMap.subscribe((params: ParamMap) => {
      this.programId = parseInt(params.get('id'))
      this.initChart()
      this.initProgram()
    })
  }

  initProgram(): void {
    this.getDependencies()
      .pipe(
        tap((dependencies) => { this.setDependencies(dependencies) }),
        switchMap(() => this.evaluateProgram(this.form.value.accessLevelInstanceId)),
        tap(() => {
          this.setForm()
          this.initChart()
          this.setChart()
        }),
      )
      .subscribe()

    this.getAliTree()
  }

  getDependencies() {
    // SHOULD THIS BE A ZIP?
    return combineLatest({
      org: this._organizationService.currentOrganization$,
      cycles: this._cycleService.cycles$,
      propertyColumns: this._columnService.propertyColumns$,
      programs: this._programService.programs$,
      scheme: this._configService.scheme$,
    })
  }

  setDependencies(
    { org, cycles, propertyColumns, programs, scheme }:
    { org: Organization; cycles: Cycle[]; propertyColumns: Column[]; programs: Program[]; scheme: 'dark' | 'light' }
  ) {
    this.org = org
    this.cycles = cycles
    this.propertyColumns = propertyColumns
    this.scheme = scheme
    this.xAxisColumns = this.propertyColumns.filter((c) => this.isValidColumn(c, this.xAxisDataTypes))
    this.programs = programs.filter((p) => p.organization_id === org.id).sort((a, b) => naturalSort(a.name, b.name))
    this.program = programs.find((p) => p.id === this.programId) ?? this.programs[0]
  }

  setForm() {
    this.setFormOptions()
    const cycleId = this.getStateCycle()
    const data: Record<string, unknown> = {
      cycleId,
      xAxisColumnId: this.program.x_axis_columns[0],
      metricType: 0,
      accessLevel: this.accessLevelNames.at(-1),
      accessLevelInstance: this.accessLevelInstances[0],
    }
    this.form.patchValue(data)
    this.watchForm()
  }

  watchForm() {
    combineLatest({
      cycleId: this.form.get('cycleId')?.valueChanges,
      xAxisColumnId: this.form.get('xAxisColumnId')?.valueChanges,
      metricType: this.form.get('metricType')?.valueChanges,
    }).pipe(
      tap(() => { this.setChart() }),
      takeUntil(this._unsubscribeAll$),
    ).subscribe()

    this.form.get('accessLevel')?.valueChanges.pipe(
      tap((accessLevel) => { this.getPossibleAccessLevelInstances(accessLevel) }),
    ).subscribe()

    this.form.get('accessLevelInstanceId')?.valueChanges.pipe(
      filter(Boolean),
      switchMap((aliId) => this.evaluateProgram(aliId)),
      tap(() => { this.setChart() }),
      takeUntil(this._unsubscribeAll$),
    ).subscribe()
  }

  setChart() {
    this.setChartSettings()
    this.loadDatasets()
  }

  getAliTree() {
    zip(
      this._organizationService.accessLevelTree$,
      this._organizationService.accessLevelInstancesByDepth$,
    ).pipe(
      tap(([accessLevelTree, accessLevelsByDepth]) => {
        this.accessLevelNames = accessLevelTree.accessLevelNames
        this.accessLevelInstancesByDepth = accessLevelsByDepth
        this.getPossibleAccessLevelInstances(this.accessLevelNames?.at(-1))

        // suggest access level instance if null
        this.form.get('accessLevelInstanceId')?.setValue(this.accessLevelInstances[0]?.id)
      }),
    ).subscribe()
  }

  getPossibleAccessLevelInstances(accessLevelName: string): void {
    const depth = this.accessLevelNames.findIndex((name) => name === accessLevelName)
    this.accessLevelInstances = this.accessLevelInstancesByDepth[depth]
  }

  programChange(program: Program) {
    const segments = ['/insights/property-insights']
    if (program?.id) segments.push(program.id.toString())
    void this._router.navigate(segments)
  }

  evaluateProgram(aliId: number = null) {
    if (this.program?.organization_id !== this.org.id) {
      this.loading = false
      this.clearChart()
      return EMPTY
    }

    return this._programService.evaluate(this.org.id, this.program.id, aliId).pipe(
      tap((data) => {
        this.data = data
        this.loading = false
      }),
      take(1),
    )
  }

  getStateCycle() {
    // use incoming state cycle, but clear state after initial load
    const { cycles } = this.program
    const state = this._location.getState() as { cycleId?: number; label?: string }
    const stateCycleId = state.cycleId
    const stateLabel = state.label
    this.handleLabel(stateLabel)
    history.replaceState({}, document.title)
    return cycles.find((c) => c === stateCycleId) ?? cycles[0]
  }

  handleLabel(label: string) {
    if (!label) this.datasetVisibility = ['compliant', 'non-compliant', 'unknown', 'whisker']
    if (label) this.datasetVisibility = [label]
    if (label === 'non-compliant') this.datasetVisibility.push('whisker')
  }

  setFormOptions() {
    const { cycles, x_axis_columns } = this.program
    this.programCycles = this.cycles.filter((c) => cycles.includes(c.id))
    this.programXAxisColumns = this.xAxisColumns.filter((c) => x_axis_columns.includes(c.id))
  }

  validateProgram() {
    const { actual_emission_column, actual_energy_column } = this.program
    const { metricType } = this.form.value
    if (!this.data) {
      this.clearChart()
      return false
    }
    const validEnergy = metricType === 0 && !!actual_energy_column
    const validEmission = metricType === 1 && !!actual_emission_column
    return validEnergy || validEmission
  }

  isValidColumn(column: Column, validTypes: string[]) {
    const isAllowedType = validTypes.includes(column.data_type)
    const notRelated = !column.related
    const notDerived = !column.derived_column
    return isAllowedType && notRelated && notDerived
  }

  setResults() {
    const cycleId = this.form.value.cycleId
    const { y, n, u } = this.data.results_by_cycles[cycleId] as { y: number[]; n: number[]; u: number[] }
    this.results = { y: y.length, n: n.length, u: u.length }
    this.datasetVisibility = ['compliant', 'non-compliant', 'unknown', 'whisker']
  }

  /*
  * Step 1: Builds an empty chart
  */
  initChart() {
    this.chart?.destroy()
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'scatter',
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        onClick: (_, elements: ActiveElement[], chart: Chart<'scatter'>) => {
          if (!elements.length) return
          const { datasetIndex, index } = elements[0]
          const raw = chart.data.datasets[datasetIndex].data[index] as PropertyInsightPoint
          const viewId = raw.id
          return void this._router.navigate(['/properties', viewId])
        },
        elements: {
          point: {
            radius: 5,
          },
        },
        plugins: {
          title: {
            display: true,
            align: 'start',
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'scatter'> & { raw: { name: string; id: number } }) => {
                const text: string[] = []
                // property ID / default display field
                if (context.raw.name) {
                  text.push(`Property: ${context.raw.name}`)
                } else {
                  text.push(`Property ID: ${context.raw.id}`)
                }

                // x and y axis names and values
                const [xAxisName, yAxisName] = this.getXYAxisName()
                text.push(`${xAxisName}: ${context.parsed.x}`)
                text.push(`${yAxisName}: ${context.parsed.y}`)
                return text
              },
            },
          },
          zoom: {
            limits: {
              x: { min: 'original', max: 'original', minRange: 50 },
              y: { min: 'original', max: 'original', minRange: 50 },
            },
            pan: {
              enabled: true,
              mode: 'xy',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              mode: 'xy',
            },
          },
        },
        scales: {
          x: {
            title: {
              text: 'X',
              display: true,
            },
            ticks: {
              callback(value) {
                return this.getLabelForValue(value as number)
              },
            },
            type: 'linear',
          },
          y: {
            type: 'linear',
            beginAtZero: true,
            position: 'left',
            display: true,
            title: {
              text: 'Y',
              display: true,
            },
          },
        },
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

  /*
  * Step 2, set chart settings (axes name, background, labels...)
  */
  setChartSettings() {
    if (!this.program) return
    const [xAxisName, yAxisName] = this.getXYAxisName()
    const xScale = this.chart.options.scales.x
    if (xScale?.type === 'linear' || xScale?.type === 'category') {
      xScale.title = { display: true, text: xAxisName }
    }
    const yScale = this.chart.options.scales.y
    if (yScale?.type === 'linear' || yScale?.type === 'category') {
      yScale.title = { display: true, text: yAxisName }
    }
    this.chart.options.scales.x.type = this.xCategorical ? 'category' : 'linear'
    this.chart.options.plugins.annotation.annotations = this.annotations
    this.chart.options.scales.x.ticks = {
      callback(value) {
        const label = this.getLabelForValue(value as number)
        if (xAxisName?.toLowerCase().includes('year')) {
          return label.replace(',', '')
        }
        return label
      },
    }
    // labels for categorical
    // RP - ADDRESS LABELS
    // this.chart.data.labels = []
    // if (this.xCategorical) {
    //   let labels = []
    //   for (const ds of this.datasets) {
    //     labels = ...
    //   }
    // }

    this.chart.update()
  }

  getXYAxisName(): string[] {
    if (!this.program) return [null, null]
    const xAxisCol = this.programXAxisColumns.find((col) => col.id === this.form.value.xAxisColumnId)
    const xAxisName = xAxisCol.display_name
    const energyCol = this.propertyColumns.find((col) => col.id === this.program.actual_energy_column)
    const emissionCol = this.propertyColumns.find((col) => col.id === this.program.actual_emission_column)
    const yAxisName = this.form.value.metricType === 0
      ? energyCol?.display_name
      : emissionCol?.display_name

    return [xAxisName, yAxisName]
  }

  setDatasetColor() {
    for (const ds of this.chart.data.datasets) {
      ds.backgroundColor = this.colors[ds.label]
    }
  }

  /*
  * Step 3: Loads datasets into the chart.
  */
  loadDatasets() {
    if (!this.program) return
    this.resetDatasets()
    this.xCategorical = false

    const numProperties = Object.values(this.data.properties_by_cycles).reduce((acc, curr) => acc + curr.length, 0)
    if (numProperties > 3000) {
      this._snackBar.alert('Too many properties to chart. Update program and try again.')
      this.initChart()
      return
    }

    this.formatDataPoints()
    this.formatNonCompliantPoints()
    this.chart.data.datasets = this.datasets
    this.setDatasetColor()
    this.chart.options.plugins.annotation.annotations = this.annotations
    this.chart.update()
    // console.log('ALL DATA', {
    //   form: this.form.value,
    //   data: this.data,
    //   datasets: this.datasets,
    //   chart: this.chart,
    // })
  }

  formatDataPoints() {
    const { metric, results_by_cycles } = this.data
    const { cycleId, metricType, xAxisColumnId } = this.form.value
    for (const prop of this.data.properties_by_cycles[this.form.value.cycleId]) {
      const id = prop.id as number
      const name = this.getValue(prop, 'startsWith', this.org.property_display_field) as string
      const x = this.getValue(prop, 'endsWith', `_${xAxisColumnId}`) as number
      let target: number

      if (this.xCategorical && Number.isNaN(Number(x))) {
        this.xCategorical = true
      }

      const actualCol = metricType === 0 ? metric.actual_energy_column : metric.actual_emission_column
      const targetCol = metricType === 0 ? metric.target_energy_column : metric.target_emission_column
      const hasTarget = metricType === 0 ? !metric.energy_bool : !metric.emission_bool

      const y = this.getValue(prop, 'endsWith', `_${actualCol}`) as number
      if (hasTarget) {
        target = this.getValue(prop, 'endsWith', `_${targetCol}`) as number
      }

      const item: PropertyInsightPoint = { id, name, x, y, target }

      // place in appropriate dataset
      const cycleResult = results_by_cycles[cycleId] as ResultsByCycles
      if (cycleResult.y.includes(id)) {
        this.datasets[0].data.push(item)
      } else if (cycleResult.n.includes(id)) {
        this.datasets[1].data.push(item)
      } else {
        this.datasets[2].data.push(item)
      }
    }
  }

  formatNonCompliantPoints() {
    this.annotations = {}
    const configs = this.form.value
    const program = this.data.metric
    const nonCompliant = this.datasets.find((ds) => ds.label === 'non-compliant')
    const targetType = configs.metricType === 0 ? program.energy_metric_type : program.emission_metric_type

    // RP - need to figure out
    // rank
    // if (this.form.value.xAxisColumnId === 'Ranked') {}
    // ...

    for (const item of nonCompliant.data) {
      const annotation = this.blankAnnotation()

      item.distance = null
      // if (!(item.x && item.y && item.target)) return
      const belowTarget = targetType === 1 && item?.target < item?.y
      const aboveTarget = targetType === 0 && item?.target > item?.y
      const addWhisker = belowTarget || aboveTarget

      if (!addWhisker) return

      item.distance = Math.abs(item.target - item.y)
      annotation.xMin = item.x
      annotation.xMax = item.x
      annotation.yMin = item.y
      annotation.yMax = item.target
      this.annotations[`prop${item.id}`] = annotation
    }
  }

  getValue(property: Record<string, unknown>, fn: 'startsWith' | 'endsWith', key: string) {
    const entry = Object.entries(property).find(([k]) => k[fn](key))
    return entry?.[1]
  }

  resetDatasets() {
    const isHidden = (label: string) => !this.datasetVisibility.includes(label)
    this.datasets = [
      { data: [], label: 'compliant', pointStyle: 'circle', pointRadius: 7, hidden: isHidden('compliant') },
      { data: [], label: 'non-compliant', pointStyle: 'triangle', pointRadius: 7, hidden: isHidden('non-compliant') },
      { data: [], label: 'unknown', pointStyle: 'rect', hidden: isHidden('unknown') },
    ]
  }

  blankAnnotation(): AnnotationOptions {
    return {
      type: 'line',
      xMin: 0,
      xMax: 0,
      yMin: 0,
      yMax: 0,
      borderColor: () => this.scheme === 'dark' ? '#ffffffff' : '#333333',
      borderWidth: 1,
      display: this.datasetVisibility.includes('whisker'),
      arrowHeads: {
        end: {
          display: true,
          width: 9,
          length: 0,
        },
      },
    }
  }

  toggleVisibility(idx: number, show: boolean) {
    if (idx === 3) {
      this.toggleWhiskers(show)
    } else {
      this.chart.setDatasetVisibility(idx, show)
    }
    this.chart.update()
  }

  toggleWhiskers(show: boolean) {
    for (const key of Object.keys(this.annotations)) {
      if (key.startsWith('prop')) {
        this.annotations[key].display = show
      }
    }
  }

  downloadChart() {
    const a = document.createElement('a')
    a.href = this.chart.toBase64Image()
    a.download = `Program-${this.chartName}.png`
    a.click()
  }

  refreshChart() {
    if (!this.program) return
    this.initChart()
    this.programChange(this.program)
  }

  clearChart() {
    this.programCycles = []
    this.programXAxisColumns = []
    this.loading = false
    this.initChart()
  }

  openProgramConfig = () => {
    const dialogRef = this._dialog.open(ProgramConfigComponent, {
      width: '50rem',
      data: {
        filterGroups: this.filterGroups,
        cycles: this.cycles,
        programs: this.programs,
        program: this.program,
        org: this.org,
        propertyColumns: this.propertyColumns?.sort((a, b) => naturalSort(a.display_name, b.display_name)),
        xAxisColumns: this.xAxisColumns,
      },
    })

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((programId: number) => { this.program = this.programs.find((p) => p.id == programId) }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
