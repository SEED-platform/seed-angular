import { Location } from '@angular/common'
import { inject, Injectable } from '@angular/core'
import { Router, type ActivatedRouteSnapshot, type Resolve } from '@angular/router'
import { InventoryService } from '@seed/api/inventory'
import { UserService } from '@seed/api/user'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType, ViewResponse } from 'app/modules/inventory'
import type { Observable } from 'rxjs'
import { catchError, EMPTY, switchMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class InventoryResolver implements Resolve<ViewResponse> {
  private _inventoryService = inject(InventoryService)
  private _userService = inject(UserService)
  private _location = inject(Location)
  private _snackBar = inject(SnackBarService)
  private _router = inject(Router)

  resolve(route: ActivatedRouteSnapshot): Observable<ViewResponse> {
    const viewId = route.paramMap.get('id')
    const type = route.paramMap.get('type') as InventoryType
    if (!viewId || !type) {
      console.log({ viewId, type })
      void this._router.navigate(['/'])
      return EMPTY
    }

    return this._userService.currentOrganizationId$.pipe(
      switchMap((orgId) => this._inventoryService.getView(orgId, parseInt(viewId, 10), type)),
      catchError(() => {
        void this._router.navigate(['dashboard'])
        return EMPTY
      }),
    )
  }
}
