import type { BooleanInput } from '@angular/cdk/coercion'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import type { CurrentUser } from '@seed/api/user'
import { UserService } from '@seed/api/user'
import { AuthService } from 'app/core/auth/auth.service'
import { sha256 } from '../../../../@seed/utils'

@Component({
  selector: 'seed-user',
  templateUrl: './user.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'user',
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
})
export class UserComponent implements OnInit, OnDestroy {
  private _authService = inject(AuthService)
  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _router = inject(Router)
  private _userService = inject(UserService)

  static ngAcceptInputType_showAvatar: BooleanInput

  @Input() showAvatar = true
  user: CurrentUser
  avatarUrl: string

  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Subscribe to user changes
    this._userService.currentUser$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((currentUser) => {
      this.user = currentUser
      this.avatarUrl = `https://gravatar.com/avatar/${sha256(this.user.email.toLowerCase())}?size=128&d=mp`

      // Mark for check
      this._changeDetectorRef.markForCheck()
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  signOut(): void {
    this._authService.signOut()
  }

  goToProfile() {
    console.log('hi!')
    void this._router.navigate(['/profile'])
  }
}
