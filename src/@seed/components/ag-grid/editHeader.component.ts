import { Component } from '@angular/core'

@Component({
  selector: 'seed-edit-header',
  template: `
    <div class="flex items-center gap-2">
      <span>{{ name }}</span>
      <span class="material-icons text-secondary scale-75 my-auto">edit</span>
    </div>
  `,
})
export class EditHeaderComponent {
  name: string
  agInit(params: { name: string }): void {
    this.name = params.name
  }
}
