import { Component, inject, type OnInit, ViewEncapsulation } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'
import { combineLatest, Subject, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { MatchingCriteriaComponent } from './matching-criteria.component'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-organizations-column-matching-criteria',
  templateUrl: './matching-criteria.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIcon, MatInputModule, SharedImports, MatSelectModule, MatTooltipModule, ReactiveFormsModule],
})
export class MatchingCriteriaPropertiesComponent extends MatchingCriteriaComponent implements OnInit {
  ngOnInit(): void {
    combineLatest([
      this._columnService.propertyColumns$,
      this._organizationService.currentOrganization$,
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([columns, organization]) => {
        this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
        this.organization = organization
        this.populateMatchingColumns()
      })
  }
}
