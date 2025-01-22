import type { HttpResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { Observable } from 'rxjs'

export type VersionResponse = {
  version: string;
  sha: string;
}
@Injectable({ providedIn: 'root' })
export class VersionService {
  private _httpClient = inject(HttpClient)

  getVersion(): Observable<HttpResponse<VersionResponse>> {
    return this._httpClient.get<VersionResponse>('/api/version', { observe: 'response' })
  }
}
