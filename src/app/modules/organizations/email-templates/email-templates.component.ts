import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'
import { NgxWigModule } from 'ngx-wig'
import { combineLatest, map, Subject, takeUntil, tap } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { type EmailTemplate, PostOfficeService } from '@seed/api/postoffice'
import { PageComponent } from '@seed/components'
import { naturalSort } from '@seed/utils'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import { DeleteModalComponent } from './modal/delete-modal.component'
import { FormModalComponent } from './modal/form-modal.component'

@Component({
  selector: 'seed-organizations-email-templates',
  templateUrl: './email-templates.component.html',
  imports: [NgxWigModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, PageComponent, ReactiveFormsModule, MatTooltipModule],
})
export class EmailTemplatesComponent implements OnDestroy, OnInit {
  private _dialog = inject(MatDialog)
  private _orgId: number
  private _organizationService = inject(OrganizationService)
  private _postOfficeService = inject(PostOfficeService)
  private _snackBarService = inject(SnackBarService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  helpOpened = false
  templates: EmailTemplate[]
  selectedTemplate: EmailTemplate
  selectedTemplateForm = new FormGroup({
    selectedTemplate: new FormControl<number | null>(null),
  })
  templateForm = new FormGroup({
    subject: new FormControl<string>('', [Validators.required]),
    html_content: new FormControl<string>('', [Validators.required]),
  })

  ngOnInit(): void {
    combineLatest([
      this._organizationService.currentOrganization$,
      this._postOfficeService.emailTemplates$.pipe(map((templates) => templates.sort((a, b) => naturalSort(a.name, b.name)))),
    ])
      .pipe(takeUntil(this._unsubscribeAll$))
      .subscribe(([organization, templates]) => {
        this._orgId = organization.id
        this.templates = templates
        this.selectedTemplate = this.templates[0]
        this.selectedTemplateForm.get('selectedTemplate').setValue(this.selectedTemplate.id)
        this.selectTemplate()
      })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  selectTemplate() {
    this.selectedTemplate = this.templates.find((t) => t.id === this.selectedTemplateForm.get('selectedTemplate').value)
    this.templateForm.get('subject').patchValue(this.selectedTemplate.subject)
    this.templateForm.get('html_content').patchValue(this.selectedTemplate.html_content)
  }

  refreshTemplates(selectedId: number | null): void {
    this._postOfficeService.getEmailTemplates(this._orgId).subscribe(() => {
      if (selectedId) {
        this.selectedTemplateForm.get('selectedTemplate').setValue(selectedId)
        this.selectTemplate()
      } else {
        this.selectedTemplateForm.get('selectedTemplate').setValue(this.templates[0].id)
        this.selectTemplate()
      }
    })
  }

  rename() {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { template: this.selectedTemplate, organization_id: this._orgId },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshTemplates(this.selectedTemplate.id)
        }),
      )
      .subscribe()
  }

  create() {
    const dialogRef = this._dialog.open(FormModalComponent, {
      width: '40rem',
      data: { organization_id: this._orgId },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap((newId: number) => {
          this.refreshTemplates(newId)
        }),
      )
      .subscribe()
  }

  delete() {
    const dialogRef = this._dialog.open(DeleteModalComponent, {
      width: '40rem',
      data: { template: this.selectedTemplate, organization_id: this._orgId },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.refreshTemplates(null)
        }),
      )
      .subscribe()
  }

  save() {
    console.log('saving')
    const html = this.templateForm.get('html_content').value
    const div = document.createElement('div')
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    this.selectedTemplate.subject = this.templateForm.get('subject').value
    this.selectedTemplate.html_content = html
    this.selectedTemplate.content = text
    this._postOfficeService.update(this._orgId, this.selectedTemplate).subscribe(() => {
      this.refreshTemplates(this.selectedTemplate.id)
      this._snackBarService.success('Template Updated')
    })
  }
}
