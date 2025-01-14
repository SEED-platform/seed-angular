import type { BreakpointState } from '@angular/cdk/layout'
import { BreakpointObserver } from '@angular/cdk/layout'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { map, ReplaySubject, switchMap } from 'rxjs'
import { ConfigService } from '../config'

@Injectable({ providedIn: 'root' })
export class MediaWatcherService {
  private _breakpointObserver = inject(BreakpointObserver)
  private _configService = inject(ConfigService)

  private _onMediaChange: ReplaySubject<{
    matchingAliases: string[];
    matchingQueries: any;
  }> = new ReplaySubject<{ matchingAliases: string[]; matchingQueries: any }>(1)

  constructor() {
    this._configService.config$
      .pipe(
        map((config) => Object.fromEntries(Object.entries(config.screens).map(([alias, screen]) => [alias, `(min-width: ${screen})`]))),
        switchMap((screens) =>
          this._breakpointObserver.observe(Object.values(screens)).pipe(
            map((state) => {
              // Prepare the observable values and set their defaults
              const matchingAliases: string[] = []
              const matchingQueries: any = {}

              // Get the matching breakpoints and use them to fill the subject
              const matchingBreakpoints = Object.entries(state.breakpoints).filter(([/* query */, matches]) => matches) ?? []
              for (const [query] of matchingBreakpoints) {
                // Find the alias of the matching query
                const matchingAlias = Object.entries(screens).find(([/* alias */, q]) => q === query)[0]

                // Add the matching query to the observable values
                if (matchingAlias) {
                  matchingAliases.push(matchingAlias)
                  matchingQueries[matchingAlias] = query
                }
              }

              // Execute the observable
              this._onMediaChange.next({
                matchingAliases,
                matchingQueries,
              })
            }),
          ),
        ),
      )
      .subscribe()
  }

  get onMediaChange$(): Observable<{
    matchingAliases: string[];
    matchingQueries: any;
  }> {
    return this._onMediaChange.asObservable()
  }

  onMediaQueryChange$(query: string | string[]): Observable<BreakpointState> {
    return this._breakpointObserver.observe(query)
  }
}
