import { CommonModule } from '@angular/common'
import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'
import { AgGridAngular } from 'ag-grid-angular'
import { combineLatest, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
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
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    SharedImports,
    MatSelectModule,
    MatTooltipModule,
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
