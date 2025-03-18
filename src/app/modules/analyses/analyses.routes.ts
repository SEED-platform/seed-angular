import type { Routes } from '@angular/router'
import { AnalysesComponent, AnalysisComponent } from '.'

export default [
  {
    path: '',
    title: 'Analyses',
    component: AnalysesComponent,
    runGuardsAndResolvers: 'always',
  },
  {
    path: ':id',
    title: 'Analysis',
    component: AnalysisComponent,
  },
] satisfies Routes
