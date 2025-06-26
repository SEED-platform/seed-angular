import { type AfterViewInit, Component, type OnDestroy, type OnInit, ViewChild, ViewEncapsulation } from '@angular/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIcon } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatPaginator } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatTooltip } from '@angular/material/tooltip'
import { combineLatest, takeUntil } from 'rxjs'
import { TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { ListComponent } from './list.component'

@Component({
  selector: 'seed-organizations-columns-list-properties',
  templateUrl: './list.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatFormFieldModule, MatIcon, MatInputModule, MatPaginator, MatTableModule, MatTooltip, TableContainerComponent],
})
export class ListPropertiesComponent extends ListComponent implements AfterViewInit, OnDestroy, OnInit {
  type = 'properties'
  @ViewChild(MatPaginator) paginator: MatPaginator

  ngOnInit(): void {
    combineLatest([this._columnService.propertyColumns$, this._organizationService.currentOrganization$])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([columns, organization]) => {
        this.organization = organization
        this.columnTableDataSource.data = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
        this.buildColumnList()
      })
  }

  ngAfterViewInit(): void {
    this.columnTableDataSource.paginator = this.paginator
  }
}
