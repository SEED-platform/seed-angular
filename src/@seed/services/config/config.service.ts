import { inject, Injectable } from '@angular/core'
import { merge } from 'lodash-es'
import type { Observable } from 'rxjs'
import { BehaviorSubject } from 'rxjs'
import { SEED_CONFIG } from './config.constants'

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private _config = new BehaviorSubject(inject(SEED_CONFIG))

  get config$(): Observable<any> {
    return this._config.asObservable()
  }

  set config(value: any) {
    // Merge the new config over to the current config
    const config = merge({}, this._config.getValue(), value)

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
