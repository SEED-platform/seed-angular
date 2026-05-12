import { Chart, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'

Chart.register(...registerables)
Chart.register(annotationPlugin)
Chart.register(zoomPlugin)

// Optional background plugin for charts that need a non-transparent export background
Chart.register({
  id: 'customCanvasBackgroundColor',
  beforeDraw(chart, _args, options) {
    const color =
      typeof options === 'string'
        ? options
        : typeof options?.color === 'string'
          ? options.color
          : undefined

    if (!color) {
      return
    }

    const { ctx } = chart
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, chart.width, chart.height)
    ctx.restore()
  },
})
