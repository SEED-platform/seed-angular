import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-organizations-access-level-tree',
  templateUrl: './access-level-tree.component.html',
  imports: [MatIconModule, PageComponent],
})
export class AccessLevelTreeComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations access level tree')
  }
}
