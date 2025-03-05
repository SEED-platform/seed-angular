import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil } from 'rxjs'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings-ubid',
  templateUrl: './ubid.component.html',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, PageComponent, ReactiveFormsModule, SharedImports],
})
export class UBIDComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  betterVerifiedIcon = ''
  betterVerifiedIconColor = 'primary'
  organization: Organization
  ubidForm = new FormGroup({
    ubid_threshold: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(1)]),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
      this.ubidForm.get('ubid_threshold').setValue(this.organization.ubid_threshold)
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.ubidForm.valid) {
      this.organization.ubid_threshold = this.ubidForm.get('ubid_threshold').value
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
