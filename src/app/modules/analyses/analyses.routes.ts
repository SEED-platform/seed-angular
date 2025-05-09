import { inject } from '@angular/core'
import type { Routes } from '@angular/router'
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router'
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
            return analysisService.getMessages()
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
    resolve: {
      analysis: (route: ActivatedRouteSnapshot) => {
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)

        // Retrieve the ID from the snapshot
        const id = route.paramMap.get('id')
        if (!id) {
          throw new Error('Analysis ID is missing from the route parameters.')
        }

        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => analysisService.getAnalysis(id)),
        )
      },
      viewsPayload: (route: ActivatedRouteSnapshot) => {
        // returns status, views, and original_views
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)

        const id = route.paramMap.get('id')
        if (!id) {
          throw new Error('Analysis ID is missing from the route parameters.')
        }

        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => analysisService.getAnalysisViews(id)),
        )
      },
      messages: (route: ActivatedRouteSnapshot) => {
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)

        const id = route.paramMap.get('id')
        if (!id) {
          throw new Error('Analysis ID is missing from the route parameters.')
        }

        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => analysisService.getMessages(id)),
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
    path: ':id/runs/:runId',
    title: 'Analysis Run',
    component: AnalysisRunComponent,
    resolve: {
      analysis: (route: ActivatedRouteSnapshot) => {
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)

        // Retrieve the ID from the snapshot
        const id = route.paramMap.get('id')
        if (!id) {
          throw new Error('Analysis ID is missing from the route parameters.')
        }

        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => analysisService.getAnalysis(id)),
        )
      },
      viewPayload: (route: ActivatedRouteSnapshot) => {
        // returns status, views, and original_views
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)

        const id = route.paramMap.get('id')
        const runId = route.paramMap.get('runId')
        if (!id) {
          throw new Error('Analysis ID is missing from the route parameters.')
        }
        if (!runId) {
          throw new Error('Analysis View ID is missing from the route parameters')
        }

        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => analysisService.getRun(id, runId)),
        )
      },
      messages: (route: ActivatedRouteSnapshot) => {
        const analysisService = inject(AnalysisService)
        const userService = inject(UserService)

        const id = route.paramMap.get('id')
        if (!id) {
          throw new Error('Analysis ID is missing from the route parameters.')
        }

        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => analysisService.getMessages(id)),
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
] satisfies Routes
