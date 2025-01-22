import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'

@Component({
  selector: 'seed-organizations-cycles',
  templateUrl: './organizations-cycles.component.html',
})
export class OrganizationsCyclesComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations cycles')
  }
}
