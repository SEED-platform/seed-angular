import type { Routes } from '@angular/router'
import { AnalysesComponent, AnalysisComponent } from '.'

export default [
  {
    path: '',
    title: 'Analyses',
    component: AnalysesComponent,
  },
  {
    path: ':id',
    title: 'Analysis',
    component: AnalysisComponent,
  },
] satisfies Routes
