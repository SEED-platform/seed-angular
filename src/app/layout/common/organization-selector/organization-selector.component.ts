import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { OrganizationService } from '@seed/api/organization/organization.service'
import type { BriefOrganization } from '@seed/api/organization/organization.types'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'

@Component({
  selector: 'seed-organization-selector',
  templateUrl: './organization-selector.component.html',
  encapsulation: ViewEncapsulation.None,
  exportAs: 'organization-selector',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
})
export class OrganizationSelectorComponent implements OnInit, OnDestroy {
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _router = inject(Router)

  private readonly _unsubscribeAll$ = new Subject<void>()
  currentUser: CurrentUser
  organizations: BriefOrganization[]

  ngOnInit(): void {
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.currentUser = currentUser
    })
    this._organizationService.organizations$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizations) => {
      this.organizations = organizations
    })
  }

  selectOrganization(organizationId: number) {
    this._userService.setDefaultOrganization(organizationId).pipe(takeUntil(this._unsubscribeAll$)).subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
