import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { NoteService } from '@seed/api/notes'
import type { Note, NoteData } from '@seed/api/notes/notes.types'
import type { InventoryType } from 'app/modules/inventory/inventory.types'
import { Subject, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-inventory-notes-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnDestroy {
  private _noteService = inject(NoteService)
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  data = inject(MAT_DIALOG_DATA) as { orgId: number; viewId: number; type: InventoryType; note: Note }
  create = !this.data.note
  form = new FormGroup({
    text: new FormControl<string | null>(this.data.note?.text ?? '', Validators.required),
  })

  onSubmit() {
    const { orgId, viewId, type, note } = this.data
    const noteData: NoteData = {
      name: 'Manually Created',
      note_type: 'Note',
      text: this.form.value.text,
    }

    const request$ = this.create
      ? this._noteService.create(orgId, viewId, noteData, type)
      : this._noteService.update(orgId, viewId, note.id, noteData, type)

    request$.pipe(
      takeUntil(this._unsubscribeAll$),
      tap(() => { this.close(true) }),
    ).subscribe()
  }

  close(success = false) {
    this._dialogRef.close(success)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
