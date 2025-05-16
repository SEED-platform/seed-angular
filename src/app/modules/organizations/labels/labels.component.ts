import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { filter, Subject, switchMap, takeUntil, tap } from 'rxjs'
import type { Label } from '@seed/api/label'
import { LabelService } from '@seed/api/label'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import { LabelComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { DeleteModalComponent } from '@seed/components'
import { FormModalComponent } from './modal'

@Component({
  selector: 'seed-organizations-labels',
  templateUrl: './labels.component.html',
  imports: [
    LabelComponent,
    PageComponent,
    TableContainerComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
  ],
})
export class LabelsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _organizationService = inject(OrganizationService)
  private _labelService = inject(LabelService)
  private _dialog = inject(MatDialog)
  labels: Label[]
  organization: Organization
  labelsDataSource = new MatTableDataSource<Label>([])
  labelColumns = ['label', 'shown in list', 'actions']
  allVisible = true

  ngOnInit(): void {
    this._labelService.labels$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((labels) => {
      this.labelsDataSource.data = labels
      if (labels.find((l) => !l.show_in_list)) {
        this.allVisible = false
      }
    })
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
    })
  }

  toggleAllShown = (): void => {
    this._labelService.bulkUpdate(this.organization.id, this.labelsDataSource.data, !this.allVisible).subscribe(() => {
      this.refreshLabels()
      this.allVisible = !this.allVisible
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  refreshLabels(): void {
    this._labelService.getByOrgId(this.organization.id).subscribe()
  }

  edit(label: Label) {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { label, organization_id: this.organization.id },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshLabels()
        }),
      )
      .subscribe()
  }

  delete(label: Label) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { model: 'Label', instance: label.name },
    })

    dialogRef.afterClosed().pipe(
      takeUntil(this._unsubscribeAll$),
      filter(Boolean),
      switchMap(() => this._labelService.delete(label)),
      tap(() => { this.refreshLabels() }),
    ).subscribe()
  }

  create = () => {
    const newLabel: Omit<Label, 'id' | 'name' | 'color'> = {
      organization_id: this.organization.id,
      show_in_list: true,
    }
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { label: newLabel },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshLabels()
        }),
      )
      .subscribe()
  }
}
