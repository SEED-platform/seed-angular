import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { Subject, takeUntil } from 'rxjs'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-settings',
  templateUrl: './organizations-settings.component.html',
  imports: [SharedImports, MatIconModule],
})
export class OrganizationsSettingsComponent implements OnInit, OnDestroy {
  private _organizationService = inject(OrganizationService)
  organization: Organization
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((o) => {
      this.organization = o
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
