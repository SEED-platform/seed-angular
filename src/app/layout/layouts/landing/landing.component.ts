import { CdkScrollable } from '@angular/cdk/scrolling'
import { Component, ViewEncapsulation } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SEEDLoadingBarComponent } from '@seed/components'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'layout-landing',
  templateUrl: './landing.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CdkScrollable, RouterOutlet, SEEDLoadingBarComponent, SharedImports],
})
export class LandingLayoutComponent {}
