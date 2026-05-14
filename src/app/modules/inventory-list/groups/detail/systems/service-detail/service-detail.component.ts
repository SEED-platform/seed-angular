import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import { GroupsService, OrganizationService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-service-detail',
  templateUrl: './service-detail.component.html',
  imports: [MaterialImports, PageComponent, RouterLink],
})
export class ServiceDetailComponent implements OnDestroy, OnInit {
  private _groupsService = inject(GroupsService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private readonly _unsubscribeAll$ = new Subject<void>()

  groupId: number
  systemId: number
  serviceId: number
  orgId: number
  inventoryType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any = null
  loading = true

  ngOnInit() {
    this.systemId = parseInt(this._route.snapshot.paramMap.get('systemId'))
    this.serviceId = parseInt(this._route.snapshot.paramMap.get('serviceId'))

    // Walk up to find groupId from parent routes
    let route = this._route.parent
    while (route) {
      const gid = route.snapshot.paramMap.get('groupId')
      if (gid) {
        this.groupId = parseInt(gid)
        break
      }
      route = route.parent
    }

    // Get inventory type from URL
    const urlParts = this._router.url.split('/')
    this.inventoryType = urlParts.find((p) => p === 'properties' || p === 'taxlots') ?? 'properties'

    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        filter((org) => Boolean(org?.org_id)),
        take(1),
        tap(({ org_id }) => {
          this.orgId = org_id
        }),
        switchMap(() => this.loadService()),
      )
      .subscribe()
  }

  loadService() {
    this.loading = true
    return this._groupsService.getServiceDetail(this.orgId, this.groupId, this.systemId, this.serviceId).pipe(
      tap((data) => {
        this.service = data
        this.loading = false
      }),
    )
  }

  goBackToSystems() {
    // Build absolute path: /:inventoryType/groups/:groupId/systems
    void this._router.navigate(['/', this.inventoryType, 'groups', this.groupId, 'systems'])
  }

  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
