import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { map, tap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class MapService {
  private _httpClient: HttpClient = inject(HttpClient)
  disadvantaged = {}

  checkDisadvantagedStatus(tractIds: number[]) {
    const idsToFetch = tractIds.filter((id) => !(id in this.disadvantaged))
    if (idsToFetch.length) {
      // eslint-disable-next-line @cspell/spellchecker
      const url = '/api/v3/eeej/filter_disadvantaged_tracts/'
      this._httpClient.post<{ status: string; disadvantaged: number[] }>(url, { tract_ids: tractIds }).pipe(
        map(({ disadvantaged }) => disadvantaged),
        tap((disadvantagedTracts) => {
          for (const id of idsToFetch) {
            this.disadvantaged[id] = disadvantagedTracts.includes(id)
          }
        }),
      ).subscribe()
    }
  }

  isDisadvantaged(tractId: number): boolean {
    if (tractId in this.disadvantaged) {
      return !!this.disadvantaged[tractId]
    }
    // TODO: address this comment
    // console.error(`Tract ${tractId} hasn't previously been fetched, run checkDisadvantagedStatus first`)
    return false
  }
}
