import { CommonModule } from '@angular/common'
import type { ElementRef, OnInit } from '@angular/core'
import { Component, ViewChild } from '@angular/core'
import type { TooltipItem } from 'chart.js'
import { Chart } from 'chart.js'
import { NotFoundComponent, PageComponent, ProgressBarComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { ProgramWrapperDirective } from '../program-wrapper'

@Component({
  selector: 'seed-program-overview',
  templateUrl: './program-overview.component.html',
  imports: [
    CommonModule,
    MaterialImports,
    PageComponent,
    ProgressBarComponent,
    NotFoundComponent,
  ],
})
export class ProgramOverviewComponent extends ProgramWrapperDirective implements OnInit {
  @ViewChild('chart', { static: true }) canvas!: ElementRef<HTMLCanvasElement>
  chart: Chart

  ngOnInit(): void {
    super.ngOnInit()
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
        plugins: {
          title: { display: true, align: 'start' },
          legend: { display: false },
          tooltip: {
            callbacks: { footer: (ctx) => { this.tooltipFooter(ctx) } },
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
  }

  tooltipFooter(tooltipItems: TooltipItem<'bar'>[]) {
    const tooltipItem = tooltipItems[0]
    if (!tooltipItem) return ''

    const { dataIndex } = tooltipItem
    const barValues = this.chart.data.datasets.map((ds) => ds.data[dataIndex]) as number[]
    const barTotal = barValues.reduce((acc, cur) => acc + cur, 0)
    return `${((tooltipItem.raw as number / barTotal) * 100).toPrecision(4)}%`
  }
}
