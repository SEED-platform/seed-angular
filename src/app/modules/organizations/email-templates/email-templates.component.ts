import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-organizations-email-templates',
  templateUrl: './email-templates.component.html',
  imports: [PageComponent],
})
export class EmailTemplatesComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations email templates')
  }
}
