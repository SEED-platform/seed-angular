import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { Subject, takeUntil } from 'rxjs'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings-options',
  templateUrl: './options.component.html',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    PageComponent,
    ReactiveFormsModule,
    SharedImports,
  ],
})
export class OptionsComponent implements OnInit, OnDestroy {
  private _organizationService = inject(OrganizationService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  organization: Organization
  fields: string[] = ['name', 'geocoding_enabled', 'comstock_enabled', 'public_feed_enabled']
  optionsForm = new FormGroup({
    name: new FormControl('', Validators.required),
    geocoding_enabled: new FormControl(false),
    comstock_enabled: new FormControl(false),
    public_feed_enabled: new FormControl(false),
  })

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization

      for (const field of this.fields) {
        this.optionsForm.get(field).setValue(this.organization[field])
      }
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  submit(): void {
    if (this.optionsForm.valid) {
      this.organization.name = this.optionsForm.get('name').value
      this.organization.geocoding_enabled = this.optionsForm.get('geocoding_enabled').value
      this.organization.comstock_enabled = this.optionsForm.get('comstock_enabled').value
      this.organization.public_feed_enabled = this.optionsForm.get('public_feed_enabled').value
      this._organizationService.updateSettings(this.organization).subscribe()
    }
  }
}
