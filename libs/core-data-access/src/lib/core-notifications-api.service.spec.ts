import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '@pleniu/shared-http';

import { CoreNotificationsApiService } from './core-notifications-api.service';

const mockApiConfig = {
  coreBaseUrl: 'http://localhost:8000',
  corePublicApiPrefix: '/api/v1/public',
};

describe('CoreNotificationsApiService', () => {
  let service: CoreNotificationsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });
    service = TestBed.inject(CoreNotificationsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('markAsRead llama PATCH /customers/me/notifications/{id}/read', () => {
    service.markAsRead('notif-1').subscribe();
    const req = httpTesting.expectOne(
      'http://localhost:8000/api/v1/public/customers/me/notifications/notif-1/read',
    );
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  describe('getPreferences (b2c-notification-preferences)', () => {
    it('llama GET /customers/me/notification-preferences', () => {
      service.getPreferences().subscribe((response) => {
        expect(response.data.items[0].mandatory).toBe(true);
      });

      const req = httpTesting.expectOne(
        'http://localhost:8000/api/v1/public/customers/me/notification-preferences',
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        data: {
          items: [
            { event_type: 'breb_key_changed', channel: 'IN_APP', enabled: true, mandatory: true },
          ],
        },
      });
    });
  });

  describe('updatePreferences', () => {
    it('llama PUT con el cuerpo de preferencias', () => {
      service
        .updatePreferences({
          preferences: [{ event_type: 'transfer_received', channel: 'EMAIL', enabled: false }],
        })
        .subscribe();

      const req = httpTesting.expectOne(
        'http://localhost:8000/api/v1/public/customers/me/notification-preferences',
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.preferences[0].event_type).toBe('transfer_received');
      req.flush({ data: { items: [] } });
    });
  });
});
