import { inject } from '@angular/core'
import type { Routes } from '@angular/router'
import { switchMap, take } from 'rxjs'
import { AnalysisService } from '@seed/api/analysis'
import { CycleService } from '@seed/api/cycle'
import { UserService } from '@seed/api/user'
import { AnalysesComponent, AnalysisComponent, AnalysisRunComponent } from '.'

export default [
  {
    path: '',
    title: 'Analyses',
    component: AnalysesComponent,
    resolve: {
      analyses: () => {
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)
        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => {
            return analysisService.getAnalyses()
          }),
        )
      },
      messages: () => {
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)
        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => {
            return analysisService.getAnalysesMessages()
          }),
        )
      },
      cycles: () => {
        const cycleService = inject(CycleService)
        const userService = inject(UserService)
        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap((orgId) => {
            return cycleService.get(orgId)
          }),
        )
      },
    },
  },
  {
    path: ':id',
    title: 'Analysis',
    component: AnalysisComponent,
  },
  {
    path: ':id/runs/:runId',
    title: 'Analysis Run',
    component: AnalysisRunComponent,
  },
] satisfies Routes
