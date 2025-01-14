import { Component, inject, ViewEncapsulation } from '@angular/core'
import { TermsOfServiceService } from '@seed/services'
import { SEED_VERSION } from '@seed/version'
import { SharedImports } from '../../../../@seed'

@Component({
  selector: 'seed-about',
  templateUrl: './about.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class AboutComponent {
  private _termsOfServiceService = inject(TermsOfServiceService)

  // TODO get SHA via API, it's currently hardcoded
  readonly SEED_VERSION = SEED_VERSION

  showTermsOfService(): void {
    this._termsOfServiceService.showTermsOfService()
  }
}
