import { Component, inject, type OnDestroy, type OnInit } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { Subject, takeUntil, tap } from 'rxjs'
import { type Label, LabelService } from '@seed/api/label'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { LabelComponent, PageComponent, TableContainerComponent } from '@seed/components'
import { DeleteModalComponent, FormModalComponent } from './modal'

@Component({
  selector: 'seed-organizations-labels',
  templateUrl: './labels.component.html',
  imports: [LabelComponent, PageComponent, TableContainerComponent, MatButtonModule, MatIconModule, MatTableModule],
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

  ngOnInit(): void {
    this._labelService.labels$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((labels) => {
      this.labelsDataSource.data = labels
    })
    this._organizationService.currentOrganization$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organization) => {
      this.organization = organization
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

    dialogRef.afterClosed().pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => {
        this.refreshLabels()
      }),
    ).subscribe()
  }

  delete(label: Label) {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { label },
    })

    dialogRef.afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
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

    dialogRef.afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.refreshLabels() }),
      ).subscribe()
  }
}
