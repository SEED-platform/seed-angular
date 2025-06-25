import { inject } from '@angular/core'
import type { Routes } from '@angular/router'
import { switchMap, take, tap } from 'rxjs'
import { DatasetService } from '@seed/api/dataset'
import { UserService } from '@seed/api/user'
import { DataComponent } from './data.component'

export default [
  {
    path: '',
    title: 'Data',
    component: DataComponent,
    runGuardsAndResolvers: 'always',
    resolve: {
      datasets: () => {
        const datasetService = inject(DatasetService)
        return datasetService.datasets$
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
          // TODO retrieve a single dataset instead
          take(1),
          tap((orgId) => { datasetService.list(orgId) }),
          switchMap(() => datasetService.datasets$),
        )
      },
    },
  },
] satisfies Routes
