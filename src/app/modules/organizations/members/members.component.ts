import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import type { MatDialogRef } from '@angular/material/dialog'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { combineLatest, Subject, takeUntil, tap } from 'rxjs'
import type { BriefOrganization, OrganizationUser } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { UserAuth } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { PageComponent, TableContainerComponent } from '@seed/components'
import type { Config } from '@seed/components/page/page.types'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'
import { ResetPasswordsModalComponent } from './modal/reset-passwords-modal.component'

@Component({
  selector: 'seed-organizations-members',
  templateUrl: './members.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTableModule, PageComponent, SharedImports, TableContainerComponent],
})
export class MembersComponent implements OnDestroy, OnInit {
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)
  private _dialog = inject(MatDialog)
  private _organization: BriefOrganization
  private readonly _unsubscribeAll$ = new Subject<void>()
  auth: UserAuth

  membersDataSource = new MatTableDataSource<OrganizationUser>([])
  membersColumns = ['name', 'email', 'access level', 'access level instance', 'role', 'actions']

  ngOnInit(): void {
    // get org id and org users
    combineLatest([
      this._organizationService.currentOrganization$,
      this._organizationService.organizationUsers$,
      this._userService.auth$,
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, orgUsers, auth]) => {
        this._organization = organization
        this.membersDataSource.data = orgUsers.sort((a, b) => naturalSort(a.email, b.email))
        this.auth = auth
      })
  }

  get config() {
    const config: Config = { title: 'Members', titleIcon: 'fa-solid:users' }

    if (this.auth?.can_remove_member) {
      Object.assign(config, {
        action: this.resetPasswords,
        actionIcon: 'fa-solid:rotate-left',
        actionText: 'Reset All Passwords',
      })

      if (this.auth.can_invite_member) {
        Object.assign(config, {
          action2: this.inviteMember,
          action2Icon: 'fa-solid:plus',
          action2Text: 'Invite Member',
        })
      }
    }
    return config
  }

  getMembers(orgId: number): void {
    this._organizationService.getOrganizationUsers(orgId).subscribe()
  }

  editMember(member: OrganizationUser): void {
    const dialogRef: MatDialogRef<FormModalComponent, boolean> = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { member, orgId: this._organization.org_id },
    })

    this.fetchMembers(dialogRef)
  }

  deleteMember(member: OrganizationUser): void {
    const dialogRef: MatDialogRef<DeleteModalComponent, boolean> = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { member, orgId: this._organization.org_id },
    })

    this.fetchMembers(dialogRef)
  }

  resetPasswords = (): void => {
    const dialogRef: MatDialogRef<ResetPasswordsModalComponent, boolean> = this._dialog.open(ResetPasswordsModalComponent, {
      width: '40rem',
      data: { orgId: this._organization.org_id },
    })
    this.fetchMembers(dialogRef)
  }

  inviteMember = (): void => {
    const dialogRef: MatDialogRef<FormModalComponent, boolean> = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { member: null, orgId: this._organization.org_id },
    })

    this.fetchMembers(dialogRef)
  }

  fetchMembers(dialogRef: MatDialogRef<unknown, boolean>): void {
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.getMembers(this._organization.org_id)
        }),
      )
      .subscribe()
  }

  trackByFn(_index: number, { email }: OrganizationUser) {
    return email
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
