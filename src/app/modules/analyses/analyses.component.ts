import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-analyses',
  templateUrl: './analyses.component.html',
  imports: [PageComponent],
})
export class AnalysesComponent implements OnInit {
  ngOnInit(): void {
    console.log('Analyses')
  }
}
