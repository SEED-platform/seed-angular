import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { Subject, takeUntil } from 'rxjs'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { SalesforcePortfolioService } from '@seed/api/salesforce-portfolio'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-salesforce-portfolio-integration',
  imports: [
    MatButtonModule,
    PageComponent,
    SharedImports,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
  ],
  templateUrl: './salesforce-portfolio-integration.component.html',
  styleUrl: './salesforce-portfolio-integration.component.scss',
})
export class SalesforcePortfolioIntegrationComponent implements OnInit {
  salesforceForm = new FormGroup({
    enabled: new FormControl<boolean>(false),
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
          console.log(response)
        })
    })
  }

  submit(): void {
    const config = this.salesforceForm.get('config')
    console.log(config.value)
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
        console.log(response)
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
