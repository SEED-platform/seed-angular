import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { SalesforcePortfolioService } from '@seed/api/salesforce-portfolio'
import { forkJoin, Subject, switchMap, take, takeUntil, tap, combineLatest, map} from 'rxjs'
import { OrganizationService } from '@seed/api/organization'

@Component({
  selector: 'app-salesforce-login',
  imports: [],
  templateUrl: './salesforce-login.component.html',
  styleUrl: './salesforce-login.component.scss'
})
export class SalesforceLoginComponent {
  private _route = inject(ActivatedRoute)
  private _salesforcePortfolioService = inject(SalesforcePortfolioService)
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit() {
    combineLatest([
      this._route.queryParams,
      this._organizationService.currentOrganization$,
    ]).pipe(
      takeUntil(this._unsubscribeAll$),
      switchMap(([params, organization]) => {
        console.log("params", params.code)
        console.log("organization", organization.id)
        return this._salesforcePortfolioService.getToken(params.code, organization.id)      
      })
    ).subscribe((r) => {
      console.log("final: ", r)
    })
  }
}
