import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PbLogoComponent } from './logo.component';

describe('PbLogoComponent', () => {
  let component: PbLogoComponent;
  let fixture: ComponentFixture<PbLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PbLogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PbLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve color variant', () => {
    component.variant = 'color';
    // Rutas relativas a propósito (sin "/" inicial): funcionan sin importar el base-href de despliegue.
    expect(component.resolvedSrc).toContain('assets/brand/logo-pleniubank-color');
  });

  it('should resolve white variant on dark', () => {
    component.variant = 'auto';
    component.onDark = true;
    expect(component.resolvedSrc).toContain('assets/brand/logo-pleniubank-white');
  });
});
