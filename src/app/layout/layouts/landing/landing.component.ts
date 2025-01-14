import { CdkScrollable } from '@angular/cdk/scrolling'
import { Component, ViewEncapsulation } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SharedImports } from '@seed'
import { SEEDLoadingBarComponent } from '@seed/components'

@Component({
  selector: 'layout-landing',
  templateUrl: './landing.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CdkScrollable, RouterOutlet, SEEDLoadingBarComponent, SharedImports],
})
export class LandingLayoutComponent {}
