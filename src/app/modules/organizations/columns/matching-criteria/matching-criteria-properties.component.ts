import { CommonModule } from '@angular/common'
import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { AgGridAngular } from 'ag-grid-angular'
import { combineLatest, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'
import { CriteriaListComponent } from './criteria-list.component'
import { MatchingCriteriaComponent } from './matching-criteria.component'

@Component({
  selector: 'seed-organizations-column-matching-criteria',
  templateUrl: './matching-criteria.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    AgGridAngular,
    CommonModule,
    CriteriaListComponent,
    FormsModule,
    MaterialImports,
    SharedImports,
    ReactiveFormsModule,
  ],
})
export class MatchingCriteriaPropertiesComponent extends MatchingCriteriaComponent implements OnInit {
  ngOnInit(): void {
    combineLatest([this._columnService.propertyColumns$, this._organizationService.currentOrganization$])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([columns, organization]) => {
        this.organization = organization
        this.populateMatchingColumns(columns)
      })
  }
}
