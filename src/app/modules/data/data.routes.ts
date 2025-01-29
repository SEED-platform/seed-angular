import { inject } from '@angular/core'
import type { Routes } from '@angular/router'
import { DatasetService } from '@seed/api/dataset'
import { DataComponent } from './data.component'

export default [
  {
    path: '',
    title: 'Data',
    component: DataComponent,
    resolve: {
      datasets: () => {
        const datasetService = inject(DatasetService)
        return datasetService.listDatasets()
      },
    },
  },
  {
    path: ':id',
    title: 'TBD',
    component: DataComponent,
    resolve: {
      data: () => {
        const datasetService = inject(DatasetService)
        return datasetService.listDatasets()
      },
    },
  },
] satisfies Routes
