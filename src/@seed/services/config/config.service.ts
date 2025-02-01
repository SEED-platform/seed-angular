import { inject, Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { SEED_CONFIG } from './config.constants'
import type { SEEDConfig } from './config.types'

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private _config = new BehaviorSubject(inject(SEED_CONFIG))

  get config$() {
    return this._config.asObservable()
  }

  set config(value: SEEDConfig) {
    // Merge the new config over to the current config
    const config = {
      ...this._config.getValue(),
      ...value,
    }

    // Execute the observable
    this._config.next(config)
  }

  /**
   * Resets the config to the default
   */
  reset(): void {
    // Set the config
    this._config.next(this.config)
  }
}
