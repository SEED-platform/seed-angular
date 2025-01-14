import { DOCUMENT } from '@angular/common'
import { inject, Injectable } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter, take } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class SplashScreenService {
  private _document = inject(DOCUMENT)
  private _router = inject(Router)

  constructor() {
    // Hide it on the first NavigationEnd event
    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        this.hide()
      })
  }

  /**
   * Show the splash screen
   */
  show(): void {
    this._document.body.classList.remove('seed-splash-screen-hidden')
  }

  /**
   * Hide the splash screen
   */
  hide(): void {
    this._document.body.classList.add('seed-splash-screen-hidden')
  }
}
