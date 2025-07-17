import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Subject, takeUntil } from 'rxjs'
import type { Organization } from '@seed/api'
import { OrganizationService } from '@seed/api'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import { BetterApiKeyValidator } from './better-api-key.validator'

@Component({
  selector: 'seed-organizations-settings-api-keys',
  templateUrl: './api-keys.component.html',
  imports: [MaterialImports, PageComponent, ReactiveFormsModule, SharedImports],
})
export class ApiKeysComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _betterApiKeyValidator = inject(BetterApiKeyValidator)
  private readonly _unsubscribeAll$ = new Subject<void>()
  betterVerifiedIcon = ''
  betterVerifiedIconColor = 'primary'
  organization: Organization
  tokenValid: boolean
  apiKeyForm = new FormGroup({
    mapquest_api_key: new FormControl(''),
    better_analysis_api_key: new FormControl('', {
      asyncValidators: [this._betterApiKeyValidator.validate.bind(this._betterApiKeyValidator)],
    }),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.apiKeyForm.get('mapquest_api_key').setValue(this.organization.mapquest_api_key)
      this.apiKeyForm.get('better_analysis_api_key').setValue(this.organization.better_analysis_api_key)
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.apiKeyForm.valid) {
      this.organization.mapquest_api_key = this.apiKeyForm.get('mapquest_api_key').value
      this.organization.better_analysis_api_key = this.apiKeyForm.get('better_analysis_api_key').value
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
