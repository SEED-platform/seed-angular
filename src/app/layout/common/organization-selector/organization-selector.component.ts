import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import type { BriefOrganization, CurrentUser } from '@seed/api'
import { OrganizationService, UserService } from '@seed/api'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-organization-selector',
  templateUrl: './organization-selector.component.html',
  encapsulation: ViewEncapsulation.None,
  exportAs: 'organization-selector',
  imports: [MaterialImports],
})
export class OrganizationSelectorComponent implements OnInit, OnDestroy {
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)

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
