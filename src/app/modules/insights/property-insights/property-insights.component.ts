import { CommonModule } from '@angular/common'
import type { ElementRef, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import type { TooltipItem } from 'chart.js'
import { Chart } from 'chart.js'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import { takeUntil, tap } from 'rxjs'
import type { Program, PropertyInsightDataset, PropertyInsightPoint, ResultsByCycles } from '@seed/api'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { ProgramWrapperDirective } from '../program-wrapper'

@Component({
  selector: 'seed-property-insights',
  templateUrl: './property-insights.component.html',
  imports: [
    CommonModule,
    FormsModule,
    PageComponent,
    MaterialImports,
    ReactiveFormsModule,
  ],
})
export class PropertyInsightsComponent extends ProgramWrapperDirective implements OnInit {
  @ViewChild('propertyInsightsChart', { static: true }) canvas!: ElementRef<HTMLCanvasElement>
  private _snackBar = inject(SnackBarService)

  annotations: Record<string, AnnotationOptions>
  datasets: PropertyInsightDataset[] = []
  displayAnnotation = true
  metricTypes = [
    { key: 0, value: 'Energy Metric' },
    { key: 1, value: 'Emission Metric' },
  ]
  results = { y: 0, n: 0, u: 0 }
  xCategorical = false

  form = new FormGroup({
    cycleId: new FormControl<number>(null),
    metricType: new FormControl<0 | 1>(0),
    xAxisColumnId: new FormControl<number>(null),
    accessLevel: new FormControl<string>(null),
    accessLevelInstance: new FormControl<string>(null),
    program: new FormControl<Program>(this.selectedProgram),
    datasetVisibility: new FormControl<boolean[]>([true, true, true]),
    annotationVisibility: new FormControl<boolean>(true),
  })

  ngOnInit(): void {
    this.initChart()
    // ProgramWrapperDirective init
    super.ngOnInit()
    this.watchChart()

    this.programChange$.subscribe(() => {
      if (!this.selectedProgram) return
      this.patchForm()
      this.setResults()
    })
  }

  patchForm() {
    const { cycles, x_axis_columns } = this.selectedProgram
    const data: Record<string, unknown> = {
      cycleId: cycles[0],
      xAxisColumnId: x_axis_columns[0],
      metricType: 0,
      accessLevel: this.accessLevels[0],
      accessLevelInstance: this.accessLevelInstances[0],
    }
    this.form.patchValue(data)
  }

  watchChart() {
    // update chart if anything changes
    this.form.valueChanges.pipe(
      tap(() => {
        if (!this.validateProgram()) {
          this.clearChart()
          // this.initChart()
          return
        }
        this.setChartSettings()
        this.loadDatasets()
      }),
      takeUntil(this._unsubscribeAll$),
    ).subscribe()
  }

  validateProgram() {
    const { actual_emission_column, actual_energy_column } = this.selectedProgram
    const { metricType } = this.form.value
    if (metricType === 0) {
      return !!actual_energy_column
    }
    return !!actual_emission_column
  }

  setResults() {
    const cycleId = this.form.value.cycleId
    const { y, n, u } = this.data.results_by_cycles[cycleId] as { y: number[]; n: number[]; u: number[] }
    this.results = { y: y.length, n: n.length, u: u.length }
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
        onClick: () => { console.log('setup click events') },
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
                console.log('callback')
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

  /*
  * Step 2, set chart settings (axes name, background, labels...)
  */
  setChartSettings() {
    console.log('update chart')
    if (!this.selectedProgram) return
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

    for (const [idx, isVisible] of this.form.value.datasetVisibility.entries()) {
      this.chart.setDatasetVisibility(idx, isVisible)
    }
    // this.displayAnnotation = savedConfig?.annotationVisibility ?? true
    this.displayAnnotation = true

    this.chart.update()
  }

  getXYAxisName(): string[] {
    if (!this.selectedProgram) return [null, null]
    const xAxisCol = this.programXAxisColumns.find((col) => col.id === this.form.value.xAxisColumnId)
    const xAxisName = xAxisCol.display_name
    const energyCol = this.propertyColumns.find((col) => col.id === this.selectedProgram.actual_energy_column)
    const emissionCol = this.propertyColumns.find((col) => col.id === this.selectedProgram.actual_emission_column)
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
    if (!this.selectedProgram) return
    this.xCategorical = false
    this.displayAnnotation = true

    this.resetDatasets()

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
    console.log('config', this.form.value)
    console.log('data', this.data)
    console.log('datasets', this.datasets)
    console.log('chart', this.chart)
  }

  formatDataPoints() {
    console.log('formatDataPoints')
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

      console.log('addWhisker', addWhisker)
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
    console.log('resetDatasets')
    this.datasets = [
      { data: [], label: 'compliant', pointStyle: 'circle', pointRadius: 7 },
      { data: [], label: 'non-compliant', pointStyle: 'triangle', pointRadius: 7 },
      { data: [], label: 'unknown', pointStyle: 'rect' },
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
      display: () => this.displayAnnotation,
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
      for (const key of Object.keys(this.annotations)) {
        if (key.startsWith('prop')) {
          this.annotations[key].display = show
        }
      }
    } else {
      this.chart.setDatasetVisibility(idx, show)
    }
    this.chart.update()
  }
}
