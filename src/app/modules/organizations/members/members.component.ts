import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-organizations-members',
  templateUrl: './members.component.html',
  imports: [PageComponent],
})
export class MembersComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations members')
  }
}
