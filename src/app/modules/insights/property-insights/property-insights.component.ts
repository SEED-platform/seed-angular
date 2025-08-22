import { CommonModule } from '@angular/common'
import type { ElementRef, OnInit } from '@angular/core'
import { Component, ViewChild } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Chart, TooltipItem } from 'chart.js'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
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

  results = { y: 0, n: 0, u: 0 }
  metricTypes = [
    { key: 'energy', value: 'Energy Metric' },
    { key: 'emission', value: 'Emission Metric' },
  ]

  form = new FormGroup({
    cycleId: new FormControl<number>(null),
    metricType: new FormControl<'Emission Metric' | 'Energy Metric'>(null),
    xAxisColumnId: new FormControl<number>(null),
    accessLevel: new FormControl<string>(null),
    accessLevelInstance: new FormControl<string>(null),
  })

  ngOnInit(): void {
    // ProgramWrapperDirective init
    super.ngOnInit()

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
      metricType: 'energy',
      accessLevel: this.accessLevels[0],
      accessLevelInstance: this.accessLevelInstances[0],
    }
    this.form.patchValue(data)
  }

  setResults() {
    console.log('data', !!this.data)
    const cycleId = this.form.value.cycleId
    const { y, n, u } = this.data.results_by_cycles[cycleId] as { y: number[]; n: number[]; u: number[] }
    this.results = { y: y.length, n: n.length, u: u.length }
  }

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
            // callbacks: {
            //   label: (context: TooltipItem<'scatter'>) => {
            //     const text = [];
            //     if (context.raw.name) {
            //       text.push(`Property: ${context.raw.name}`)
            //     } else {
            //       text.push(`Property ID: ${context.raw.id}`)
            //     }
            //     return text
            //   }
            // }
          },
        },

        scales: {
          x: {},
          y: {},
        },
      },
    })
  }
}
