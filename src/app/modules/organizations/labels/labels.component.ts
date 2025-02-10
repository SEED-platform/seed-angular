import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-organizations-labels',
  templateUrl: './labels.component.html',
  imports: [PageComponent, MatIconModule],
})
export class LabelsComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations labels')
  }
}
