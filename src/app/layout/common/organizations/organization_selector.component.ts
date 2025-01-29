import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { Subject, takeUntil } from 'rxjs'
import { OrganizationService } from '@seed/api/organization/organization.service'
import type { Organization, OrganizationsResponse } from '@seed/api/organization/organization.types'
import { UserService } from 'app/core/user/user.service'
import type { User } from 'app/core/user/user.types'

@Component({
  selector: 'seed-organization-selector',
  templateUrl: './organization_selector.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'organization-selector',
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIcon],
})
export class OrganizationSelectorComponent implements OnInit, OnDestroy {
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  user: User
  organizations: Organization[]

  ngOnInit(): void {
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((user: User) => {
      this.user = user
    })
    this._organizationService.organizations$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((response: OrganizationsResponse) => {
      this.organizations = response.organizations
    })
  }

  selectOrganization(o: Organization) {
    this._userService.update_default_organization(this.user, o.id).pipe(takeUntil(this._unsubscribeAll$)).subscribe(() => {
      // success
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
