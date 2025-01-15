import type { BooleanInput } from '@angular/cdk/coercion'
import { AsyncPipe } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import type { Observable } from 'rxjs'
import { from, Subject, takeUntil } from 'rxjs'
import { AuthService } from 'app/core/auth/auth.service'
import { UserService } from 'app/core/user/user.service'
import type { User } from 'app/core/user/user.types'
import { sha256 } from '../../../../@seed/utils'

@Component({
  selector: 'seed-user',
  templateUrl: './user.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'user',
  imports: [AsyncPipe, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
})
export class UserComponent implements OnInit, OnDestroy {
  private _authService = inject(AuthService)
  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _userService = inject(UserService)

  static ngAcceptInputType_showAvatar: BooleanInput

  @Input() showAvatar = true
  user: User
  avatarUrl$?: Observable<string>

  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Subscribe to user changes
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((user: User) => {
      this.user = user
      this.avatarUrl$ = from(this._getAvatarUrl())

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

  private async _getAvatarUrl(): Promise<string> {
    return `https://gravatar.com/avatar/${await sha256(this.user.email)}?size=128&d=mp`
  }
}
