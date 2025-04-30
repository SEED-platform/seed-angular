import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute, Router } from '@angular/router'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import { InventoryService } from '@seed/api/inventory'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import type { Organization, OrganizationUserSettings } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { GenericView, InventoryType, Profile, ViewResponse } from 'app/modules/inventory/inventory.types'
import type { Observable } from 'rxjs'
import { forkJoin, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import {
  BuildingFilesGridComponent,
  DocumentsGridComponent,
  HeaderComponent,
  HistoryGridComponent,
  PairedGridComponent,
  ScenariosGridComponent,
} from '.'

@Component({
  selector: 'seed-inventory-detail',
  templateUrl: './detail.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    BuildingFilesGridComponent,
    CommonModule,
    DocumentsGridComponent,
    HeaderComponent,
    HistoryGridComponent,
    MatDividerModule,
    MatIconModule,
    PageComponent,
    PairedGridComponent,
    ScenariosGridComponent,
  ],
})
export class DetailComponent implements OnDestroy, OnInit {
  private _activatedRoute = inject(ActivatedRoute)
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _inventoryService = inject(InventoryService)
  private _labelService = inject(LabelService)
  private _organizationService = inject(OrganizationService)
  private _router = inject(Router)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columns: Column[]
  currentUser: CurrentUser
  currentProfile: Profile
  gridTheme$ = this._configService.gridTheme$
  labels: Label[]
  matchingColumns: string[]
  org: Organization
  orgId: number
  orgUserId: number
  profiles: Profile[]
  selectedView: GenericView
  type = this._activatedRoute.snapshot.paramMap.get('type') as InventoryType
  userSettings: OrganizationUserSettings
  view: ViewResponse
  viewId: number
  views: GenericView[]

  pageTitle = this.type === 'taxlots' ? 'Tax Lot Detail' : 'Property Detail'

  ngOnInit(): void {
    console.log('init')
    this.initDetail()
  }

  initDetail() {
    return this._activatedRoute.paramMap.pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => { this.viewId = parseInt(this._activatedRoute.snapshot.paramMap.get('id')) }),
      switchMap(() => this.getDependencies()),
      switchMap(() => this.updateOrgUserSettings()),
      switchMap(() => this.loadView()),
    ).subscribe()
  }

  getDependencies() {
    return this._organizationService.currentOrganization$.pipe(
      tap((organization) => {
        this.orgId = organization.org_id
        this.org = organization
      }),
      switchMap(() => {
        const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$
        return forkJoin({
          columns: columns$.pipe(take(1)),
          currentUser: this._userService.currentUser$.pipe(take(1)),
          matchingColumns: this._organizationService.getMatchingCriteriaColumns(this.orgId, this.type),
          profiles: this._inventoryService.getColumnListProfiles('Detail View Profile', this.type),
        })
      }),
      tap(({ columns, currentUser, matchingColumns, profiles }) => {
        this.columns = columns
        this.matchingColumns = matchingColumns as string[]
        this.currentUser = currentUser
        this.profiles = profiles
        this.setProfile()
      }),
    )
  }

  loadView(): Observable<Label[]> {
    return this._inventoryService.getView(this.orgId, this.viewId, this.type).pipe(
      switchMap((view) => {
        this.view = view
        const id = this.type === 'taxlots'
          ? view.taxlot?.id
          : view.property?.id
        return this._inventoryService.getViews(this.orgId, id, this.type)
      }),
      switchMap((views) => {
        this.views = views
        this.selectedView = views.find((v) => v.id === this.viewId)
        return this._labelService.getInventoryLabels(this.orgId, [this.viewId], this.view.cycle.id, this.type)
      }),
      tap((labels: Label[]) => {
        this.labels = labels.filter((label) => label.is_applied.includes(this.selectedView.id))
      }),
    )
  }

  get paired() {
    if (!this.view) return []
    return this.type === 'taxlots' ? this.view.properties : this.view.taxlots
  }

  setProfile() {
    const { org_user_id, settings } = this.currentUser
    this.orgUserId = org_user_id
    this.userSettings = settings
    const userProfileId = settings.profile.detail[this.type]

    this.currentProfile = this.profiles.find((p) => p.id === userProfileId) ?? this.profiles[0]
    this.userSettings.profile.detail[this.type] = this.currentProfile?.id
  }

  updateOrgUserSettings() {
    const { org_user_id, settings } = this.currentUser
    return this._organizationService.updateOrganizationUser(org_user_id, this.orgId, settings)
  }

  onChangeView(viewId: number) {
    void this._router.navigate([`/${this.type}/${viewId}`])
  }

  onChangeProfile(id: number) {
    this.currentUser.settings.profile.detail[this.type] = id
    this.updateOrgUserSettings().subscribe(() => {
      this.setProfile()
    })
  }

  onRefreshView() {
    this.loadView().subscribe()
  }

  onRefreshDetail() {
    this.initDetail()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
