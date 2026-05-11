import { Chart, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'

Chart.register(...registerables)
Chart.register(annotationPlugin)
Chart.register(zoomPlugin)

// White background plugin so exported PNGs aren't transparent/dark
Chart.register({
  id: 'customCanvasBackgroundColor',
  beforeDraw(chart) {
    const { ctx } = chart
    ctx.save()
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, chart.width, chart.height)
    ctx.restore()
  },
})
