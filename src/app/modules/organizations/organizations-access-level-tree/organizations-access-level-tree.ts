import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'

@Component({
  selector: 'seed-organizations-access-level-tree',
  templateUrl: './organizations-access-level-tree.html',
})
export class OrganizationsAccessLevelTreeComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations access level tree')
  }
}
