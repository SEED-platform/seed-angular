import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular, AgGridModule } from 'ag-grid-angular'
import type { CellClickedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { combineLatest, switchMap, tap } from 'rxjs'
import { ColumnService } from '@seed/api/column'
import { NoteService } from '@seed/api/notes'
import type { Note } from '@seed/api/notes/notes.types'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ConfigService } from '@seed/services'
import type { InventoryStateType, InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-detail-notes',
  templateUrl: './notes.component.html',
  imports: [
    AgGridAngular,
    AgGridModule,
    CommonModule,
    MatIconModule,
    PageComponent,
  ],
})
export class NotesComponent implements OnInit {
  private _columnService = inject(ColumnService)
  private _configService = inject(ConfigService)
  private _dialog = inject(MatDialog)
  private _notesService = inject(NoteService)
  private _userService = inject(UserService)
  private _route = inject(ActivatedRoute)
  displayName: string
  columnDefs: ColDef[]
  columnMap: Record<string, string> = {}
  viewId: number
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  notes: Note[]
  orgId: number
  pageTitle: string
  rowData: Record<string, unknown>[] = []
  tableName: InventoryStateType
  type: InventoryType

  ngOnInit(): void {
    this.getParams().pipe(
      switchMap(() => this._userService.currentOrganizationId$),
      switchMap((orgId) => this.getDependencies(orgId)),
      tap(() => { this.setGrid() }),
    ).subscribe()
  }

  getParams() {
    return this._route.parent.paramMap.pipe(
      tap((params) => {
        this.viewId = parseInt(params.get('id'))
        this.type = params.get('type') as InventoryType
        this.pageTitle = this.type === 'properties' ? 'Property Notes' : 'Tax Lot Notes'
        this.displayName = this.type === 'taxlots' ? 'Tax Lots' : 'Properties'
        this.tableName = this.type === 'taxlots' ? 'TaxLotState' : 'PropertyState'
      }),
    )
  }

  getDependencies(orgId: number) {
    this.orgId = orgId
    const columns$ = this.type === 'taxlots' ? this._columnService.taxLotColumns$ : this._columnService.propertyColumns$

    return this._notesService.list(this.orgId, this.viewId, this.type).pipe(
      switchMap(() => combineLatest([this._notesService.notes$, columns$])),
      tap(([notes, columns]) => {
        this.notes = notes
        const typeColumns = columns.filter((c) => c.table_name === this.tableName)
        this.columnMap = Object.fromEntries(typeColumns.map((c) => [c.column_name, c.display_name]))
      }),
    )
  }

  setGrid() {
    this.setColumnDefs()
    console.log(this.columnMap)
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
        const displayName = this.columnMap[log.field] ?? log.field
        console.log(displayName)
        const newValue = typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value
        const previousValue = typeof log.previous_value === 'object' ? JSON.stringify(log.previous_value) : log.previous_value
        content.push(`<li>${displayName} : <span class="text-secondary">${previousValue} → ${newValue}</span></li>`)
      }
    }
    return content
  }

  noteTextRenderer = (params: { value: string[] }) => {
    return `<ul>${params.value.map((log) => `<li>${log}</li>`).join('')}</ul>`
  }

  actionRenderer = (params: { data: { type: 'Manually Created' } }) => {
    const canEdit = params.data.type === 'Manually Created'
    return `
      <div class="flex gap-2 mt-2 align-center">
      <span class="material-icons action-icon cursor-pointer text-secondary" title="Delete" data-action="delete">clear</span>
      ${canEdit ? '<span class="material-icons-outlined action-icon cursor-pointer text-secondary" title="Edit" data-action="edit">edit</span>' : ''}
      </div>
    `
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api
    this.gridApi.sizeColumnsToFit()
    this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  onCellClicked(event: CellClickedEvent) {
    if (event.colDef.field !== 'actions') return

    const target = event.event.target as HTMLElement
    const action = target.getAttribute('data-action')
    const { id } = event.data as { id: number }

    if (action === 'edit') {
      this.editNote(id)
    } else if (action === 'delete') {
      this.deleteNote(id)
    }
  }

  getRowHeight = (params: { data: { content: string[] } }) => {
    const contentLength = params.data.content.length ?? 1
    return Math.max(contentLength * 40, 42)
  }

  get gridHeight() {
    const divHeight = document.querySelector('#content').getBoundingClientRect().height
    return Math.min(this.rowData.length * 42 + 50, divHeight)
  }

  createNote = () => {
    console.log('Add Note')
  }

  deleteNote(id: number) {
    // const dialogref = this._dialog.open(DeleteModalComponent, {
    //   width: '40rem',
    //   data: {}
    // })
    if (confirm('Are you sure you want to delete this note?')) {
      this._notesService.delete(this.orgId, this.viewId, id, this.type).subscribe()
    }
    console.log('Delete Note', id)
  }

  editNote(id: number) {
    console.log('Edit Note', id)
  }
}
