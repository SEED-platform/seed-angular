import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { BehaviorSubject, map } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import type { EmailTemplate, ListTemplatesResponse } from './postoffice.types'

@Injectable({ providedIn: 'root' })
export class PostofficeService {
  private _httpClient = inject(HttpClient)
  private _organizationService = inject(OrganizationService)
  private _templates = new BehaviorSubject<EmailTemplate[]>([])

  templates$ = this._templates.asObservable()

  get(): void {
    // fetch current organization
    this._organizationService.currentOrganization$.subscribe(({ org_id }) => {
      const url = `/api/v3/cycles/?organization_id=${org_id}`
      // fetch templates
      this._httpClient
        .get<ListTemplatesResponse>(url)
        .pipe(map((response) => response.templates))
        .subscribe({
          next: (templates) => {
            this._templates.next(templates)
          },
          error: (error) => {
            console.error('Error fetching templates:', error)
          },
        })
    })
  }
}
