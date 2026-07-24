import type { ComponentFixture } from '@angular/core/testing'
import { TestBed } from '@angular/core/testing'
import { SalesforceLoginComponent } from './salesforce-login.component'

describe('SalesforceLoginComponent', () => {
  let component: SalesforceLoginComponent
  let fixture: ComponentFixture<SalesforceLoginComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesforceLoginComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(SalesforceLoginComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
