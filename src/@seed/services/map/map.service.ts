import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { map, tap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class MapService {
  private _httpClient: HttpClient = inject(HttpClient)
  disadvantaged = {}

  async checkDisadvantagedStatus(tractIds: number[]) {
    console.log('tractIds', tractIds)
    await Promise.resolve('done')
    const idsToFetch = tractIds.filter((id) => !(id in this.disadvantaged))
    if (idsToFetch.length) {
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
    console.error(`Tract ${tractId} hasn't previously been fetched, run checkDisadvantagedStatus first`)
    return false
  }
}
