import { NgClass } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { SharedImports } from '@seed/directives'
import type { OrganizationTab } from '../organizations.types'

@Component({
  selector: 'seed-organizations-data-quality',
  templateUrl: './organizations-data-quality.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, SharedImports],
})
export class OrganizationsDataQualityComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)

  readonly tabs: OrganizationTab[] = ['properties', 'taxlots', 'goal']
  type = this._route.snapshot.paramMap.get('type') as OrganizationTab
  readonly table_type = 'Data Quality'
  readonly urlSegment = 'data-quality'

  ngOnInit(): void {
    console.log('organizations data quality')
  }

  async toggleInventoryType(type: OrganizationTab) {
    if (type !== this.type) {
      const orgId = this._route.snapshot.parent.params.organizationId as string
      const newRoute = `/organizations/${orgId}/data-quality/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
    }
  }
}
