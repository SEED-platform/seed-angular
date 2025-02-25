import { CommonModule } from '@angular/common'
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { Subject, takeUntil } from 'rxjs'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings-two-factor',
  templateUrl: './two-factor.component.html',
  imports: [
    CommonModule,
    SharedImports,
    MatButton,
    MatFormFieldModule,
    MatIconModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    PageComponent,
  ],
})
export class TwoFactorComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  betterVerifiedIcon = ''
  betterVerifiedIconColor = 'primary'
  organization: Organization
  twoFactorForm = new FormGroup({
    require_2fa: new FormControl(false),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.twoFactorForm.get('require_2fa').setValue(this.organization.require_2fa)
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.twoFactorForm.valid) {
      this.organization.require_2fa = this.twoFactorForm.get('require_2fa').value
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
