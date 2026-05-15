import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { GroupServiceDetail } from '@seed/api'
import { GroupsService, OrganizationService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

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
  inventoryType: InventoryType
  service: GroupServiceDetail | null = null
  loading = true

  ngOnInit() {
    this.systemId = parseInt(this._route.snapshot.paramMap.get('systemId'))
    this.serviceId = parseInt(this._route.snapshot.paramMap.get('serviceId'))

    // Walk up to find groupId and type from parent routes using pathFromRoot
    for (const route of this._route.pathFromRoot) {
      const gid = route.snapshot.paramMap.get('groupId')
      if (gid) {
        this.groupId = parseInt(gid)
      }
      const type = route.snapshot.paramMap.get('type')
      if (type) {
        this.inventoryType = type as InventoryType
      }
    }

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
