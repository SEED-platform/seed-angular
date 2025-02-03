import { NgClass } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { SharedImports } from '@seed/directives'
import type { InventoryType } from '../../inventory/inventory.types'

@Component({
  selector: 'seed-organizations-column-settings',
  templateUrl: './organizations-column-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [NgClass, SharedImports],
})
export class OrganizationsColumnSettingsComponent implements OnInit {
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)

  readonly tabs: InventoryType[] = ['properties', 'taxlots']
  type = this._route.snapshot.paramMap.get('type') as InventoryType

  ngOnInit(): void {
    console.log('organizations column settings')
  }

  async toggleInventoryType(type: InventoryType) {
    if (type !== this.type) {
      const newRoute = `/organizations/column-settings/${type}`
      await this._router.navigateByUrl(newRoute, { skipLocationChange: false })
      this.type = type
    }
  }
}
