import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { switchMap, tap } from 'rxjs'
import { NoteService } from '@seed/api/notes'
import type { Note } from '@seed/api/notes/notes.types'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-notes',
  templateUrl: './notes.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    PageComponent,
  ],
})
export class NotesComponent implements OnInit {
  private _configService = inject(ConfigService)
  private _notesService = inject(NoteService)
  private _userService = inject(UserService)
  private _route = inject(ActivatedRoute)
  breadCrumbMain: string
  columnDefs: ColDef[]
  id: number
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  notes: Note[]
  orgId: number
  pageTitle: string
  rowData: Record<string, unknown>[] = []
  type: InventoryType

  ngOnInit(): void {
    this.getParams().pipe(
      switchMap(() => this._userService.currentOrganizationId$),
      switchMap((orgId) => this.getNotes(orgId)),
      tap(() => { this.setGrid() }),
    ).subscribe()
  }

  getParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.id = parseInt(params.get('id'))
        this.type = params.get('type') as InventoryType
        this.pageTitle = this.type === 'properties' ? 'Property Notes' : 'Tax Lot Notes'
        this.breadCrumbMain = this.type === 'taxlots' ? 'Tax Lots' : 'Properties'
      }),
    )
  }

  getNotes(orgId: number) {
    this.orgId = orgId
    return this._notesService.list(this.orgId, this.id, this.type).pipe(
      tap((notes) => { this.notes = notes }),
    )
  }

  setGrid() {
    this.setColumnDefs()
    this.setRowData()
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'created', headerName: 'Created', cellClass: 'text-secondary' },
      { field: 'content', headerName: 'Note', cellRenderer: this.noteTextRenderer },
      { field: 'type', headerName: 'Type', cellClass: 'text-secondary' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionRenderer },
    ]
  }

  setRowData() {
    this.rowData = []
    for (const note of this.notes) {
      const row = {
        id: note.id,
        created: this.formatDate(note.created),
        type: note.name,
        content: this.formatNoteContent(note),
      }
      this.rowData.push(row)
    }
  }

  formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  }

  formatNoteContent(note: Note) {
    if (note.text) {
      return [`<li>${note.text}</li>`]
    }

    const content: string[] = []
    if (note.log_data?.length) {
      for (const log of note.log_data) {
        const new_value = typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value
        const previous_value = typeof log.previous_value === 'object' ? JSON.stringify(log.previous_value) : log.previous_value
        content.push(`<li>${log.field} : <span class="text-secondary">${previous_value} → ${new_value}</span></li>`)
      }
    }
    return content
  }

  noteTextRenderer = (params: { value: string[] }) => {
    return `<ul>${params.value.map((log) => `<li>${log}</li>`).join('')}</ul>`
  }

  actionRenderer = () => {
    return `
      <div class="flex gap-2 mt-2 align-center">
        <span class="material-icons action-icon cursor-pointer text-secondary" data-action="download">cloud_download</span>
        <span class="material-icons action-icon cursor-pointer text-secondary" data-action="delete">clear</span>
      </div>
    `
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api
    this.gridApi.sizeColumnsToFit()
  }

  getRowHeight = (params: { data: { content: string[] } }) => {
    const contentLength = params.data.content.length ?? 1
    return Math.max(contentLength * 40, 42)
  }

  get gridHeight() {
    const divHeight = document.querySelector('#content').getBoundingClientRect().height
    return Math.min(this.rowData.length * 42 + 50, divHeight)
  }
}
