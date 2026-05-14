import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { catchError, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import { of } from 'rxjs'
import type { GroupDashboard, GroupSankeyEntry, OrgCycle } from '@seed/api'
import { GroupsService, OrganizationService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-group-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule, MaterialImports, PageComponent],
})
export class GroupDashboardComponent implements OnDestroy, OnInit {
  private _groupsService = inject(GroupsService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private readonly _unsubscribeAll$ = new Subject<void>()

  groupId = parseInt(this._route.parent.snapshot.paramMap.get('groupId'))
  orgId: number
  cycleId: number
  cycles: OrgCycle[] = []
  dashboard: GroupDashboard | null = null
  sankeyData: GroupSankeyEntry[] = []
  meterType = ''
  meterTypes: string[] = []
  loading = true

  ngOnInit() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        take(1),
        tap(({ org_id }) => {
          this.orgId = org_id
        }),
        switchMap(() => this._organizationService.getById(this.orgId)),
        tap((org) => {
          this.cycles = org.cycles
          this.cycleId = org.cycles[0]?.cycle_id
        }),
        switchMap(() => this.loadDashboard()),
      )
      .subscribe()
  }

  loadDashboard() {
    this.loading = true
    return this._groupsService.getDashboard(this.orgId, this.groupId, this.cycleId).pipe(
      tap((data) => {
        this.dashboard = data
        this.meterTypes = [
          ...Object.keys(data?.importing_total ?? {}),
          ...Object.keys(data?.exporting_total ?? {}),
        ].filter((v, i, a) => a.indexOf(v) === i)
        if (this.meterTypes.length && !this.meterType) {
          this.meterType = this.meterTypes[0]
        }
        this.loading = false
      }),
      catchError(() => {
        this.dashboard = null
        this.loading = false
        return of(null)
      }),
    )
  }

  changeCycle(cycleId: number) {
    this.cycleId = cycleId
    this.loadDashboard().pipe(
      switchMap(() => this.loadSankey()),
    ).subscribe()
  }

  loadSankey() {
    if (!this.meterType) return this._groupsService.getSankeyData(this.orgId, this.groupId, this.cycleId, '')
    return this._groupsService.getSankeyData(this.orgId, this.groupId, this.cycleId, this.meterType).pipe(
      tap((data) => {
        this.sankeyData = data
      }),
    )
  }

  changeMeterType(meterType: string) {
    this.meterType = meterType
    this.loadSankey().subscribe()
  }

  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
