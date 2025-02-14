import { Injectable } from '@angular/core'
import { ReplaySubject } from 'rxjs'
import type { AuditTemplateReportType } from './audit-template.types'

@Injectable({ providedIn: 'root' })
export class AuditTemplateService {
  private _reportTypes = new ReplaySubject<AuditTemplateReportType[]>(1)
  reportTypes$ = this._reportTypes.asObservable()

  constructor() {
    this._reportTypes.next([
      { name: 'ASHRAE Level 2 Report' }, // cspell:disable-line
      { name: 'Atlanta Report' },
      { name: 'Baltimore Energy Audit Report' },
      { name: 'Berkeley Report' },
      { name: 'BRICR Phase 0/1' },
      { name: 'Brisbane Energy Audit Report' },
      { name: 'DC BEPS Energy Audit Report' }, // cspell:disable-line
      { name: 'DC BEPS RCx Report' }, // cspell:disable-line
      { name: 'Demo City Report' },
      { name: 'Denver Energy Audit Report' },
      { name: 'EE-RLF Template' },
      { name: 'Energy Trust of Oregon Report' },
      { name: 'Los Angeles Report' },
      { name: 'Minneapolis Energy Evaluation Report' },
      { name: 'New York City Energy Efficiency Report' },
      { name: 'Office of Recapitalization Energy Audit Report' },
      { name: 'Open Efficiency Report' },
      { name: 'San Francisco Report' },
      { name: 'St. Louis RCx Report' },
      { name: 'St. Louis Report' },
      { name: 'WA Commerce Clean Buildings - Form D Report' },
      { name: 'WA Commerce Grants Report' },
    ])
  }
}
