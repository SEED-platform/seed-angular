import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService, type OrganizationUser } from '@seed/api/organization'
import { PageComponent, TableContainerComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-organizations-members',
  templateUrl: './members.component.html',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    PageComponent,
    SharedImports,
    TableContainerComponent,
  ],
})
export class MembersComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _dialog = inject(MatDialog)
  private _orgId: number
  private readonly _unsubscribeAll$ = new Subject<void>()

  membersDataSource = new MatTableDataSource<OrganizationUser>([])
  membersColumns = ['name', 'email', 'access level', 'access level instance', 'role', 'actions']

  ngOnInit(): void {
    this._organizationService.currentOrganization$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(({ org_id }) => {
          this._orgId = org_id
          this.getMembers(this._orgId)
        }),
      ).subscribe()
  }

  getMembers(orgId: number): void {
    // fetch org users
    this._organizationService.getOrganizationUsers(orgId)

    // subscribe to org users stream and set members
    this._organizationService.organizationUsers$
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((orgUsers) => { this.membersDataSource.data = orgUsers }),
      ).subscribe()
  }

  editMember(member: OrganizationUser): void {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { member, orgId: this._orgId },
    })

    dialogRef.afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.getMembers(this._orgId) }),
      ).subscribe()
  }

  deleteMember(member: OrganizationUser): void {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { member, orgId: this._orgId },
    })

    dialogRef.afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.getMembers(this._orgId) }),
      ).subscribe()
  }

  trackByFn(_index: number, { email }: OrganizationUser) {
    return email
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
