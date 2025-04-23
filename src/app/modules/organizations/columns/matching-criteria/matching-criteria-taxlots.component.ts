import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'
import { combineLatest, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { CriteriaListComponent } from './criteria-list.component'
import { MatchingCriteriaComponent } from './matching-criteria.component'

@Component({
  selector: 'seed-organizations-column-matching-criteria-taxlots',
  templateUrl: './matching-criteria.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CriteriaListComponent, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, SharedImports, ReactiveFormsModule, MatSelectModule, MatTooltipModule],
})
export class MatchingCriteriaTaxlotsComponent extends MatchingCriteriaComponent implements OnInit {
  ngOnInit(): void {
    combineLatest([
      this._columnService.taxLotColumns$,
      this._organizationService.currentOrganization$,
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([columns, organization]) => {
        this.organization = organization
        this.populateMatchingColumns(columns)
      })
  }
}
