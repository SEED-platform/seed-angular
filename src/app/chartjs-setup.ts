import { Chart, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'

Chart.register(...registerables)
Chart.register(annotationPlugin)
Chart.register(zoomPlugin)
