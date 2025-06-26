import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import type { ProgressBarMode } from '@angular/material/progress-bar'
import { MatProgressBarModule } from '@angular/material/progress-bar'

@Component({
  selector: 'seed-progress-bar',
  templateUrl: './progress-bar.component.html',
  imports: [CommonModule, MatProgressBarModule, MatIconModule],
})
export class ProgressBarComponent {
  @Input() total: number
  @Input() progress: number
  @Input() title: string
  @Input() outline = false

  get percent() {
    return (this.progress / this.total) * 100
  }

  get showNumericProgress() {
    if (this.progressMode === 'indeterminate') return false
    return this.progress && this.progress < this.total
  }

  get progressMode() {
    const mode = this.progress ? 'determinate' : 'indeterminate'
    return mode as ProgressBarMode
  }
}
