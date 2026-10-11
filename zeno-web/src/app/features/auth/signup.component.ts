import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="signup-wrapper">
      <div class="signup-panel">
        <div class="brand-header">
          <img src="/zeno-books-logo.png" alt="ZENO BOOKS" class="auth-brand-logo" />
          <p class="subtitle">Multi-Tenant Cloud ERP & Accounting</p>
        </div>

        <div class="card-auth">
          @if (step === 1) {
            <h2>Create Your Business Workspace</h2>
            <p class="helper-text">Enter company details to receive an email OTP</p>

            @if (errorMessage) {
              <div class="alert alert-error">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <form (ngSubmit)="onRequestOtp()">
              <div class="form-group">
                <label>Company / Legal Name</label>
                <input
                  type="text"
                  [(ngModel)]="companyName"
                  name="companyName"
                  required
                />
              </div>

              <div class="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="fullName"
                  name="fullName"
                  required
                />
              </div>

              <div class="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                />
              </div>

              <div class="form-group">
                <label>GSTIN (Optional)</label>
                <input
                  type="text"
                  [(ngModel)]="gstin"
                  name="gstin"
                />
              </div>

              <div class="form-group">
                <label>Password</label>
                <input
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  minlength="8"
                />
              </div>

              <button type="submit" class="btn-submit" [disabled]="loading">
                @if (loading) {
                  <i class="pi pi-spin pi-spinner"></i> Generating OTP...
                } @else {
                  <span>Continue & Send OTP</span> <i class="pi pi-arrow-right"></i>
                }
              </button>
            </form>
          } @else {
            <h2>Verify Your Email</h2>
            <p class="helper-text">We sent a 6-digit verification code to <strong>{{ email }}</strong></p>

            @if (devOtpNotice) {
              <div class="alert alert-info">
                <i class="pi pi-info-circle"></i>
                <span>Development OTP: <strong>{{ devOtpNotice }}</strong></span>
              </div>
            }

            @if (errorMessage) {
              <div class="alert alert-error">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <form (ngSubmit)="onVerifyOtp()">
              <div class="form-group">
                <label>Enter 6-Digit Code</label>
                <input
                  type="text"
                  [(ngModel)]="otp"
                  name="otp"
                  required
                  maxlength="6"
                  class="otp-input"
                  autocomplete="one-time-code"
                />
              </div>

              <button type="submit" class="btn-submit" [disabled]="loading">
                @if (loading) {
                  <i class="pi pi-spin pi-spinner"></i> Provisioning ERP Workspace...
                } @else {
                  <i class="pi pi-check"></i> Complete Verification
                }
              </button>

              <button type="button" class="btn-back" (click)="step = 1">
                <i class="pi pi-arrow-left"></i> Edit Details
              </button>
            </form>
          }

          <div class="auth-footer">
            <span>Already have an account?</span>
            <a routerLink="/auth/login">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './signup.component.scss',
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
