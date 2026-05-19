import { AsyncPipe } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import type { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { filter, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import type { GroupProperty } from '@seed/api'
import { GroupsService, OrganizationService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'

ModuleRegistry.registerModules([AllCommunityModule])

@Component({
  selector: 'seed-group-properties',
  templateUrl: './properties.component.html',
  imports: [AgGridAngular, AsyncPipe, PageComponent, RouterLink],
})
export class GroupPropertiesComponent implements OnDestroy, OnInit {
  private _configService = inject(ConfigService)
  private _groupsService = inject(GroupsService)
  private _organizationService = inject(OrganizationService)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private readonly _unsubscribeAll$ = new Subject<void>()

  gridTheme$ = this._configService.gridTheme$
  groupId = parseInt(this._route.parent.snapshot.paramMap.get('groupId'))
  orgId: number
  properties: GroupProperty[] = []
  loading = true

  columnDefs: ColDef[] = [
    {
      headerName: 'Property Name',
      field: 'property_display_name',
      flex: 1,
      valueGetter: ({ data }: { data: GroupProperty }) => data?.property_display_name || `Property ${data?.property_id}`,
    },
    {
      headerName: 'Property ID',
      field: 'property_id',
      width: 150,
    },
  ]

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  }

  ngOnInit() {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        filter((org) => Boolean(org?.org_id)),
        take(1),
        tap(({ org_id }) => {
          this.orgId = org_id
        }),
        switchMap(() => this._groupsService.getProperties(this.orgId, this.groupId)),
        tap((data) => {
          this.properties = data
          this.loading = false
        }),
      )
      .subscribe()
  }

  onRowClicked(event: { data: GroupProperty & { property_view_id: number } }) {
    void this._router.navigate(['/properties', event.data.property_view_id])
  }

  ngOnDestroy() {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
