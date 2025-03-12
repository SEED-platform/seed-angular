import { NgClass, NgTemplateOutlet } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatDivider } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTooltipModule } from '@angular/material/tooltip'
import { Subject, takeUntil } from 'rxjs'
import type { AccessLevelInstance, AccessLevelTree } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { DrawerMode } from '@seed/components'
import { PageComponent } from '@seed/components'
import { ConfirmationService, MediaWatcherService } from '@seed/services'
import { UserService } from '../../../../@seed/api/user'
import { SnackBarService } from '../../../core/snack-bar/snack-bar.service'
import type { RenameInstanceData } from './access-level-tree.types'
import { RenameInstanceDialogComponent } from './rename-instance-dialog/rename-instance-dialog.component'

@Component({
  selector: 'seed-organizations-access-level-tree',
  templateUrl: './access-level-tree.component.html',
  imports: [
    MatButtonModule,
    MatDivider,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSidenavModule,
    MatTooltipModule,
    NgClass,
    NgTemplateOutlet,
    PageComponent,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AccessLevelTreeComponent implements OnInit, OnDestroy {
  private _confirmationService = inject(ConfirmationService)
  private _matDialog = inject(MatDialog)
  private _mediaWatcherService = inject(MediaWatcherService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _userService = inject(UserService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  private _organizationId: number
  accessLevelNames: AccessLevelTree['accessLevelNames']
  accessLevelTree: AccessLevelTree['accessLevelTree']
  drawerMode: DrawerMode = 'side'
  drawerOpened = true

  expanded = new Set<number>()

  ngOnInit(): void {
    this._mediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ matchingAliases }) => {
      if (matchingAliases.includes('md')) {
        this.drawerMode = 'side'
        this.drawerOpened = true
      } else {
        this.drawerMode = 'over'
        this.drawerOpened = false
      }
    })

    this._organizationService.accessLevelTree$.pipe(takeUntil(this._unsubscribeAll$)).subscribe(({ accessLevelNames, accessLevelTree }) => {
      this.accessLevelNames = accessLevelNames
      this.accessLevelTree = accessLevelTree
    })

    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this._organizationId = organizationId
    })
  }

  toggleDrawer = (): void => {
    this.drawerOpened = !this.drawerOpened
  }

  toggleExpand = (id: number): void => {
    if (this.expanded.has(id)) {
      this.expanded.delete(id)
    } else {
      this.expanded.add(id)
    }
  }

  countChildren = (instance: AccessLevelInstance): number => {
    return (instance.children ?? []).reduce((count, child) => count + 1 + this.countChildren(child), 0)
  }

  renameInstance(instance: AccessLevelInstance): void {
    this._matDialog.open(RenameInstanceDialogComponent, {
      autoFocus: false,
      data: {
        accessLevelNames: this.accessLevelNames,
        accessLevelTree: this.accessLevelTree,
        instance,
        organizationId: this._organizationId,
      } satisfies RenameInstanceData,
      panelClass: 'seed-dialog-panel',
    })
  }

  deleteInstance(instance: AccessLevelInstance): void {
    this._organizationService.canDeleteAccessLevelInstance(this._organizationId, instance.id).subscribe(({ reasons }) => {
      const totalChildren = this.countChildren(instance)
      const showStats = reasons?.length > 0 || totalChildren > 0
      const stats = `<div class="mt-4 text-warn prose">Deleting this Access Level Instance will delete everything else associated with it:
        <ul class="mt-2 mb-0">
          ${reasons?.length > 0 ? `<li>${reasons.join('</li><li>')}</li>` : ''}
          ${totalChildren > 0 ? `<li>Has ${totalChildren} Access Level Instance${totalChildren === 1 ? '' : 's'} below this one</li>` : ''}
        </ul>
      </div>`
      const confirmation = this._confirmationService.open({
        title: `Delete Access Level Instance<div class="font-semibold">${instance.name}</div>`,
        message: `Are you sure you want to delete this Access Level Instance? This action cannot be undone.${showStats ? stats : ''}`,
        actions: {
          confirm: {
            label: 'Delete',
          },
        },
      })

      confirmation.afterClosed().subscribe((result: 'confirmed' | 'canceled') => {
        if (result === 'confirmed') {
          this._organizationService.deleteAccessLevelInstance(this._organizationId, instance.id).subscribe(() => {
            this._snackBar.success('Access Level Instance deleted')
          })
        }
      })
    })
  }

  filterByQuery(_value: string) {
    // TODO
  }

  createInstance() {
    // TODO
  }

  uploadInstances() {
    // TODO
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
