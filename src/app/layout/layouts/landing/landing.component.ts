import { CdkScrollable } from '@angular/cdk/scrolling'
import { AsyncPipe } from '@angular/common'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { ConfigService } from '@seed/api'
import { SEEDLoadingBarComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'layout-landing',
  templateUrl: './landing.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [AsyncPipe, CdkScrollable, RouterOutlet, SEEDLoadingBarComponent, SharedImports],
})
export class LandingLayoutComponent {
  readonly config$ = inject(ConfigService).config$
}
