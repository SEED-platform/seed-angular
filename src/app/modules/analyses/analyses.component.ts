import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-analyses',
  templateUrl: './analyses.component.html',
  imports: [MatIconModule, PageComponent],
})
export class AnalysesComponent implements OnInit {
  ngOnInit(): void {
    console.log('Analyses')
  }
}
