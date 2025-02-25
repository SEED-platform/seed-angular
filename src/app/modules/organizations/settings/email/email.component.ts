import { CommonModule } from '@angular/common'
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil } from 'rxjs'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings-email',
  templateUrl: './email.component.html',
  imports: [
    CommonModule,
    MatButton,
    MatDivider,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PageComponent,
    ReactiveFormsModule,
    SharedImports,
  ],
})
export class EmailComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  betterVerifiedIcon = ''
  betterVerifiedIconColor = 'primary'
  organization: Organization
  emailForm = new FormGroup({
    new_user_email_from: new FormControl('', [Validators.required, Validators.email]),
    new_user_email_subject: new FormControl('', [Validators.required]),
    new_user_email_content: new FormControl('', [Validators.required]),
    new_user_email_signature: new FormControl(''),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.emailForm.get('new_user_email_from').setValue(this.organization.new_user_email_from)
      this.emailForm.get('new_user_email_subject').setValue(this.organization.new_user_email_subject)
      this.emailForm.get('new_user_email_content').setValue(this.organization.new_user_email_content)
      this.emailForm.get('new_user_email_signature').setValue(this.organization.new_user_email_signature)
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.emailForm.valid) {
      this.organization.new_user_email_from = this.emailForm.get('new_user_email_from').value
      this.organization.new_user_email_subject = this.emailForm.get('new_user_email_subject').value
      this.organization.new_user_email_content = this.emailForm.get('new_user_email_content').value
      this.organization.new_user_email_signature = this.emailForm.get('new_user_email_signature').value
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
