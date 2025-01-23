/* eslint-disable @typescript-eslint/dot-notation */
import type { ComponentFixture } from '@angular/core/testing'
import { TestBed } from '@angular/core/testing'
import { MatIconModule } from '@angular/material/icon'
import { MatTabsModule } from '@angular/material/tabs'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { OrganizationsNavComponent } from './organizations-nav.component'

describe('OrganizationsNavComponent', () => {
  let component: OrganizationsNavComponent
  let fixture: ComponentFixture<OrganizationsNavComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [OrganizationsNavComponent, MatTabsModule, MatIconModule],
      providers: [
        provideRouter([], withComponentInputBinding()),
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(OrganizationsNavComponent)
    component = fixture.componentInstance
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should set the active link to the default link', () => {
    component.ngOnInit()
    expect(component.activeLink).toEqual(component['_defaultLink'])
  })

  it('should set the active link from the current path', () => {
    Object.defineProperty(component['_router'], 'url', {
      get: () => '/organizations/cycles',
    })
    component.ngOnInit()
    const expected = component.links.find((link) => link.path === 'cycles')
    expect(component.activeLink).toEqual(expected)
  })

  it ('should be true', () => {
    expect(true).toBeTruthy()
  })
})
