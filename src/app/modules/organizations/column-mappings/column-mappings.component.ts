import { NgClass } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { PageComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import type { OrganizationTab } from '../organizations.types'

@Component({
  selector: 'seed-organizations-column-mappings',
  templateUrl: './column-mappings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, PageComponent, SharedImports],
})
export class ColumnMappingsComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)

  readonly tabs: OrganizationTab[] = ['properties', 'taxlots']
  type = this._route.snapshot.paramMap.get('type') as OrganizationTab
  readonly urlSegment = 'column-mappings'
  readonly table_type = 'Column Mappings'

  ngOnInit(): void {
    console.log('organizations column mappings')
  }

  async toggleInventoryType(type: OrganizationTab) {
    if (type !== this.type) {
      const newRoute = `/organizations/column-mappings/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
    }
  }
}
