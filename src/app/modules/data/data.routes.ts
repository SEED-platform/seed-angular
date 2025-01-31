import { inject } from '@angular/core'
import type { Routes } from '@angular/router'
import { switchMap, take } from 'rxjs'
import { DatasetService } from '@seed/api/dataset'
import { UserService } from '@seed/api/user'
import { DataComponent } from './data.component'

export default [
  {
    path: '',
    title: 'Data',
    component: DataComponent,
    resolve: {
      datasets: () => {
        const datasetService = inject(DatasetService)
        const userService = inject(UserService)
        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap((organizationId) => {
            return datasetService.listDatasets(organizationId)
          }),
        )
      },
    },
  },
  {
    path: ':id',
    title: 'TODO',
    component: DataComponent,
    resolve: {
      data: () => {
        const datasetService = inject(DatasetService)
        const userService = inject(UserService)
        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap((organizationId) => {
            // TODO retrieve a single dataset instead
            return datasetService.listDatasets(organizationId)
          }),
        )
      },
    },
  },
] satisfies Routes
