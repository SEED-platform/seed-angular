import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoDirective } from '@jsverse/transloco'
import { combineLatest, Subject, switchMap, takeUntil } from 'rxjs'
import { OrganizationService, SalesforcePortfolioService } from '@seed/api'

@Component({
  selector: 'seed-salesforce-login',
  imports: [TranslocoDirective],
  templateUrl: './salesforce-login.component.html',
})
export class SalesforceLoginComponent implements OnDestroy, OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _salesforcePortfolioService = inject(SalesforcePortfolioService)
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit() {
    combineLatest([this._route.queryParams, this._organizationService.currentOrganization$])
      .pipe(
        takeUntil(this._unsubscribeAll$),
        switchMap(([params, organization]) => {
          return this._salesforcePortfolioService.getToken(params.code as string, organization.id)
        }),
      )
      .subscribe(() => {
        void this._router.navigate(['organizations/settings/salesforce-portfolio-integration'])
      })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
