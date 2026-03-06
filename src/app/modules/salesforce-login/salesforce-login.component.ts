import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { combineLatest, Subject, switchMap, takeUntil } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { SalesforcePortfolioService } from '@seed/api/salesforce-portfolio'

@Component({
  selector: 'seed-salesforce-login',
  imports: [],
  templateUrl: './salesforce-login.component.html',
  styleUrl: './salesforce-login.component.scss',
})
export class SalesforceLoginComponent implements OnInit {
  private _route = inject(ActivatedRoute)
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
      .subscribe((r) => {
        console.log('final: ', r)
      })
  }
}
