import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTooltipModule } from '@angular/material/tooltip'
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs'
import type { AccessLevelInstance, AccessLevelTree } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import type { DrawerMode } from '@seed/components'
import { PageComponent } from '@seed/components'
import { ImageOverlayDirective, SharedImports } from '@seed/directives'
import { MediaWatcherService } from '@seed/services'
import type {
  CreateInstanceData,
  DeleteInstanceData,
  EditAccessLevelsData,
  RenameInstanceData,
  UploadInstancesData,
} from './access-level-tree.types'
import { CreateInstanceDialogComponent } from './create-instance-dialog'
import { DeleteInstanceDialogComponent } from './delete-instance-dialog'
import { EditAccessLevelsDialogComponent } from './edit-access-levels-dialog'
import { RenameInstanceDialogComponent } from './rename-instance-dialog'
import { UploadInstancesDialogComponent } from './upload-instances-dialog'

@Component({
  selector: 'seed-organizations-access-level-tree',
  templateUrl: './access-level-tree.component.html',
  imports: [
    CommonModule,
    ImageOverlayDirective,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSidenavModule,
    MatTooltipModule,
    PageComponent,
    SharedImports,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AccessLevelTreeComponent implements OnInit, OnDestroy {
  private _matDialog = inject(MatDialog)
  private _mediaWatcherService = inject(MediaWatcherService)
  private _organizationService = inject(OrganizationService)
  private _userService = inject(UserService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  private _organizationId: number
  private _filterValue = ''
  private _filterSubject$ = new Subject<string>()
  currentUser: CurrentUser
  accessLevelNames: AccessLevelTree['accessLevelNames']
  accessLevelTree: AccessLevelTree['accessLevelTree']
  filteredAccessLevelTree?: AccessLevelTree['accessLevelTree']
  drawerMode: DrawerMode = 'side'
  drawerOpened = true
  helpOpened = false
  expanded = new Set<number>()

  ngOnInit(): void {
    this._filterSubject$.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll$)).subscribe((value) => {
      this.filterAccessLevelTree(value)
    })

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
      this.filterAccessLevelTree(this._filterValue)
    })

    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.currentUser = currentUser
    })

    this._userService.currentOrganizationId$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((organizationId) => {
      this._organizationId = organizationId
    })
  }

  toggleDrawer = (): void => {
    this.drawerOpened = !this.drawerOpened
    if (this.drawerOpened) {
      this.helpOpened = false
    }
  }

  toggleExpand = (id: number): void => {
    if (this.expanded.has(id)) {
      this.expanded.delete(id)
    } else {
      this.expanded.add(id)
    }
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  countChildren = (instance: AccessLevelInstance): number => {
    return (instance.children ?? []).reduce((count, child) => count + 1 + this.countChildren(child), 0)
  }

  editAccessLevels(): void {
    this._matDialog.open(EditAccessLevelsDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {
        accessLevelNames: this.accessLevelNames,
        organizationId: this._organizationId,
      } satisfies EditAccessLevelsData,
      panelClass: 'seed-dialog-panel',
    })
  }

  createInstance(parentInstance: AccessLevelInstance) {
    const dialog = this._matDialog.open(CreateInstanceDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {
        accessLevelNames: this.accessLevelNames,
        parentInstance: this._getUnfilteredInstance(parentInstance),
        organizationId: this._organizationId,
      } satisfies CreateInstanceData,
      panelClass: 'seed-dialog-panel',
    })

    dialog.afterClosed().subscribe((created: boolean) => {
      if (created) {
        // Expand the parent where the child was just created
        this.expanded.add(parentInstance.id)
      }
    })
  }

  renameInstance(instance: AccessLevelInstance): void {
    this._matDialog.open(RenameInstanceDialogComponent, {
      autoFocus: false,
      disableClose: true,
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
      const warnings = reasons ?? []
      const totalChildren = this.countChildren(this._getUnfilteredInstance(instance))
      if (totalChildren > 0) {
        warnings.push(`Has ${totalChildren} Access Level Instance${totalChildren === 1 ? '' : 's'} below this one`)
      }

      this._matDialog.open(DeleteInstanceDialogComponent, {
        autoFocus: false,
        disableClose: true,
        data: {
          instance,
          organizationId: this._organizationId,
          warnings,
        } satisfies DeleteInstanceData,
        panelClass: 'seed-dialog-panel',
      })
    })
  }

  onFilterChange(value: string) {
    this._filterValue = value
    this._filterSubject$.next(value)
  }

  // Handle debounced filter
  filterAccessLevelTree(filter: string) {
    const filterTree = (tree: AccessLevelInstance[]): AccessLevelInstance[] => {
      return tree
        .map((instance) => ({
          ...instance,
          ...(instance.children ? { children: filterTree(instance.children) } : {}),
        }))
        .filter((instance) => instance.name.toLowerCase().includes(filter.toLowerCase()) || instance.children?.length > 0)
    }

    this.filteredAccessLevelTree = filter ? filterTree(this.accessLevelTree) : undefined
  }

  uploadInstances() {
    this._matDialog.open(UploadInstancesDialogComponent, {
      autoFocus: false,
      disableClose: true,
      data: {
        organizationId: this._organizationId,
      } satisfies UploadInstancesData,
      panelClass: 'seed-dialog-panel',
      width: '640px',
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  // When a filter is used, lookup the unfiltered instance to accurately get the child instances
  private _getUnfilteredInstance(instance: AccessLevelInstance): AccessLevelInstance {
    const path: string[] = []
    for (const name of this.accessLevelNames) {
      if (name in instance.path) {
        path.push(instance.path[name])
      } else {
        break
      }
    }

    // Remove the root name
    path.shift()
    let unfilteredInstance = this.accessLevelTree[0]

    for (const instanceName of path) {
      unfilteredInstance = unfilteredInstance.children.find((child) => child.name === instanceName)
    }

    return unfilteredInstance
  }
}
