import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslocoService } from '@jsverse/transloco'
import { Subject, takeUntil } from 'rxjs'
import { DrawerComponent } from '@seed/components'
import type { Scheme, SEEDConfig } from '@seed/services'
import { ConfigService } from '@seed/services'

@Component({
  selector: 'seed-dev-settings',
  templateUrl: './dev-settings.component.html',
  styleUrl: './dev-settings.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [DrawerComponent, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class DevSettingsComponent implements OnInit, OnDestroy {
  private _configService = inject(ConfigService)
  private _translocoService = inject(TranslocoService)

  activeLang: string
  config: SEEDConfig
  scheme: 'dark' | 'light'
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Subscribe to config changes
    this._configService.config$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((config: SEEDConfig) => {
      // Store the config
      this.config = config
    })

    // Subscribe to language changes
    this._translocoService.langChanges$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((activeLang) => {
      // Get the active lang
      this.activeLang = activeLang
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  // Set the scheme on the config
  setScheme(scheme: Scheme): void {
    this._configService.config.scheme = scheme
  }

  setActiveLang(lang: string): void {
    this._translocoService.setActiveLang(lang)
  }
}
