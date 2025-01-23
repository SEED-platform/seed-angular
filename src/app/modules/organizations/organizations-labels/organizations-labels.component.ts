import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-organizations-labels',
  templateUrl: './organizations-labels.component.html',
  imports: [
    MatIconModule,
  ],
})
export class OrganizationsLabelsComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations labels')
  }
}
