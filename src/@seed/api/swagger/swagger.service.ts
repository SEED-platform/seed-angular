import { HttpClient } from '@angular/common/http'
import { DOCUMENT, inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'
import { map } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class SwaggerService {
  private _document = inject(DOCUMENT)
  private _httpClient = inject(HttpClient)

  getSchema(): Observable<Record<string, unknown>> {
    return this._httpClient.get<Record<string, unknown>>('/api/swagger/?format=openapi').pipe(
      map((schema) => {
        schema.host = this._document.location.host
        return schema
      }),
    )
  }
}
