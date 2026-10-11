import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  step = 1;
  companyName = '';
  fullName = '';
  email = '';
  gstin = '';
  password = '';
  otp = '';

  loading = false;
  errorMessage = '';
  devOtpNotice = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onRequestOtp() {
    this.loading = true;
    this.errorMessage = '';

    this.auth
      .signup({
        companyName: this.companyName?.trim(),
        fullName: this.fullName?.trim(),
        email: this.email?.trim(),
        gstin: this.gstin?.trim() || undefined,
        password: this.password,
        stateCode: '27',
        stateName: 'Maharashtra',
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.step = 2;
          if (res.devOtp) {
            this.devOtpNotice = res.devOtp;
            this.otp = res.devOtp;
          }
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 0) {
            this.errorMessage = 'Unable to connect to the backend service (http://localhost:4000). Please verify the server is running.';
          } else {
            const rawMsg = err.error?.message;
            if (Array.isArray(rawMsg)) {
              this.errorMessage = rawMsg.join(', ');
            } else {
              this.errorMessage = rawMsg || err.statusText || 'Failed to initiate signup';
            }
          }
        },
      });
  }

  onVerifyOtp() {
    this.loading = true;
    this.errorMessage = '';

    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to the backend service (http://localhost:4000). Please verify the server is running.';
        } else {
          const rawMsg = err.error?.message;
          if (Array.isArray(rawMsg)) {
            this.errorMessage = rawMsg.join(', ');
          } else {
            this.errorMessage = rawMsg || err.statusText || 'Verification failed';
          }
        }
      },
    });
  }
}
