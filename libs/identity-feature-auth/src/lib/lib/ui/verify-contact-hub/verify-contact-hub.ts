import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Tras el registro B2C: el usuario elige verificar con el OTP del correo o del SMS.
 * El backend puede activar la cuenta con un solo canal (ver B2C_ACTIVATION_SINGLE_OTP_CHANNEL).
 */
@Component({
  selector: 'lib-verify-contact-hub',
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-contact-hub.html',
  styleUrl: './verify-contact-hub.scss',
})
export class VerifyContactHub {}
