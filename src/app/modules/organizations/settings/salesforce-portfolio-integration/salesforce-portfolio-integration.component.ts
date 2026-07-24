import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Subject, takeUntil } from 'rxjs'
import type { Organization } from '@seed/api'
import { OrganizationService, SalesforcePortfolioService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-salesforce-portfolio-integration',
  imports: [MaterialImports, PageComponent, ReactiveFormsModule, SharedImports],
  templateUrl: './salesforce-portfolio-integration.component.html',
})
export class SalesforcePortfolioIntegrationComponent implements OnDestroy, OnInit {
  salesforceForm = new FormGroup({
    enabled: new FormControl(false),
    config: new FormGroup({
      url: new FormControl(''),
      clientId: new FormControl(''),
      clientSecret: new FormControl(''),
    }),
  })
  passwordHidden = true
  private _organizationService = inject(OrganizationService)
  organization: Organization
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _salesforcePortfolioService = inject(SalesforcePortfolioService)
  isLoggedIntoBbSalesforce: boolean

  ngOnInit(): void {
    const config = this.salesforceForm.get('config')
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization

      this.salesforceForm.get('enabled').setValue(this.organization.bb_salesforce_enabled)

      if (this.organization.bb_salesforce_enabled) config.enable()
      else config.disable()

      this._salesforcePortfolioService
        .getConfig(this.organization.id)
        .pipe(takeUntil(this._unsubscribeAll$))
        .subscribe((_config) => {
          config.setValue({
            url: _config.salesforce_url ?? '',
            clientId: _config.client_id ?? '',
            clientSecret: _config.client_secret ?? '',
          })
        })

      this._salesforcePortfolioService
        .verifyToken(this.organization.id)
        .pipe(takeUntil(this._unsubscribeAll$))
        .subscribe((response) => {
          this.isLoggedIntoBbSalesforce = response.valid
        })
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    const config = this.salesforceForm.get('config')
    this._salesforcePortfolioService
      .updateConfig(
        {
          salesforce_url: config.value.url,
          client_id: config.value.clientId,
          client_secret: config.value.clientSecret,
        },
        this.organization.id,
      )
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((_config) => {
        config.setValue({
          url: _config.salesforce_url ?? '',
          clientId: _config.client_id ?? '',
          clientSecret: _config.client_secret ?? '',
        })
      })
  }

  togglePassword(): void {
    this.passwordHidden = !this.passwordHidden
  }

  loginToSalesforce(): void {
    this._salesforcePortfolioService
      .getLoginUrl(this.organization.id)
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe((response) => {
        window.location.href = response.url
      })
  }

  toggleForm(): void {
    const enabled = this.salesforceForm.get('enabled').value

    this.organization.bb_salesforce_enabled = enabled
    this._organizationService.updateSettings(this.organization).subscribe()

    const config = this.salesforceForm.get('config')
    if (enabled) config.enable()
    else config.disable()
  }
}
