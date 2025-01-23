import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-organizations-access-level-tree',
  templateUrl: './organizations-access-level-tree.component.html',
  imports: [
    MatIconModule,
  ],
})
export class OrganizationsAccessLevelTreeComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations access level tree')
  }
}
