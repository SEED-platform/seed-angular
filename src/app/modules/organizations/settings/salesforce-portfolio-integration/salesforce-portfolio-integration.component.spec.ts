import type { ComponentFixture } from '@angular/core/testing'
import { TestBed } from '@angular/core/testing'
import { SalesforcePortfolioIntegrationComponent } from './salesforce-portfolio-integration.component'

describe('SalesforcePortfolioIntegrationComponent', () => {
  let component: SalesforcePortfolioIntegrationComponent
  let fixture: ComponentFixture<SalesforcePortfolioIntegrationComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesforcePortfolioIntegrationComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(SalesforcePortfolioIntegrationComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
