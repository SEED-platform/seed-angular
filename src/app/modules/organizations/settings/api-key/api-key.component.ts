import { CommonModule } from '@angular/common'
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil } from 'rxjs'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { BetterApiKeyValidator } from './better_api_key_validator'

@Component({
  selector: 'seed-organizations-settings-api-key',
  templateUrl: './api-key.component.html',
  imports: [CommonModule, SharedImports, MatButton, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule, PageComponent],
})
export class APIKeyComponent implements OnDestroy, OnInit {
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
