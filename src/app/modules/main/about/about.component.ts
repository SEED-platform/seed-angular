import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import { VersionService } from '@seed/api/version'
import { SharedImports } from '@seed/directives'
import { TermsService } from '@seed/services'

@Component({
  selector: 'seed-about',
  templateUrl: './about.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class AboutComponent implements OnInit, OnDestroy {
  private _termsService = inject(TermsService)
  private _versionService = inject(VersionService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  version: string
  sha: string

  ngOnInit(): void {
    this._versionService.version$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ version, sha }) => {
      this.version = version
      this.sha = sha
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  showTermsOfService(): void {
    this._termsService.showTermsOfService()
  }
}
