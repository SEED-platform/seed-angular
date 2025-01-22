import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'

@Component({
  selector: 'seed-organizations-labels',
  templateUrl: './organizations-labels.html',
})
export class OrganizationsLabelsComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations labels')
  }
}
