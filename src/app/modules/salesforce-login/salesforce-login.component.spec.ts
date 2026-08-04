import type { ComponentFixture } from '@angular/core/testing'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { OrganizationService, SalesforcePortfolioService } from '@seed/api'
import { SalesforceLoginComponent } from './salesforce-login.component'

describe('SalesforceLoginComponent', () => {
  let component: SalesforceLoginComponent
  let fixture: ComponentFixture<SalesforceLoginComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesforceLoginComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({ code: 'test-code' }) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)) } },
        { provide: OrganizationService, useValue: { currentOrganization$: of({ id: 1, org_id: 1 }) } },
        {
          provide: SalesforcePortfolioService,
          useValue: { getToken: jasmine.createSpy('getToken').and.returnValue(of({ status: 'success', response: '' })) },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(SalesforceLoginComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
