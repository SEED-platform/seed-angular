import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslocoDirective } from '@jsverse/transloco'
import { combineLatest, EMPTY, Subject, switchMap, takeUntil } from 'rxjs'
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
          const code: unknown = params.code
          if (typeof code !== 'string' || !code) {
            void this._router.navigate(['organizations/settings/salesforce-portfolio-integration'])
            return EMPTY
          }
          return this._salesforcePortfolioService.getToken(code, organization.id)
        }),
      )
      .subscribe({
        next: () => void this._router.navigate(['organizations/settings/salesforce-portfolio-integration']),
        error: () => void this._router.navigate(['organizations/settings/salesforce-portfolio-integration']),
      })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
