import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-organizations-cycles',
  templateUrl: './organizations-cycles.component.html',
  imports: [
    MatIconModule,
  ],
})
export class OrganizationsCyclesComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations cycles')
  }
}
