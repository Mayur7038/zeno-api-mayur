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
                  placeholder="e.g. Acme Precision Tools Pvt Ltd"
                />
              </div>

              <div class="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="fullName"
                  name="fullName"
                  required
                  placeholder="e.g. Rohan Sharma"
                />
              </div>

              <div class="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                />
              </div>

              <div class="form-group">
                <label>GSTIN (Optional)</label>
                <input
                  type="text"
                  [(ngModel)]="gstin"
                  name="gstin"
                  placeholder="27AAAAA0000A1Z5"
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
                  placeholder="At least 8 characters"
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
                  placeholder="123456"
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
  styles: [`
    .signup-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 24px;
    }

    .signup-panel {
      width: 100%;
      max-width: 480px;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 24px;

      .auth-brand-logo {
        height: 68px;
        max-width: 280px;
        object-fit: contain;
        margin: 0 auto 16px;
        display: block;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--surface-900);
      }

      .subtitle {
        font-size: 0.8125rem;
        color: var(--surface-500);
        margin-top: 4px;
      }
    }

    .card-auth {
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: var(--shadow-card);

      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
      }

      .helper-text {
        font-size: 0.8125rem;
        color: var(--surface-500);
        margin-bottom: 20px;
      }
    }

    .alert-error {
      background-color: var(--danger-bg);
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      margin-bottom: 16px;
    }

    .alert-info {
      background-color: var(--info-bg);
      border: 1px solid #bae6fd;
      color: #0369a1;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      margin-bottom: 16px;
    }

    .otp-input {
      font-size: 1.5rem !important;
      letter-spacing: 0.4em;
      text-align: center;
      font-family: var(--font-mono);
      font-weight: 700;
    }

    .btn-submit {
      width: 100%;
      background: var(--primary-600);
      color: #ffffff;
      border: none;
      padding: 12px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: var(--primary-700);
      }

      &:disabled {
        opacity: 0.6;
      }
    }

    .btn-back {
      width: 100%;
      background: transparent;
      border: none;
      color: var(--surface-600);
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 8px;
      margin-top: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &:hover {
        color: var(--surface-900);
      }
    }

    .auth-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--surface-500);

      a {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 600;
        margin-left: 6px;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `],
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
        companyName: this.companyName,
        fullName: this.fullName,
        email: this.email,
        gstin: this.gstin,
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
          this.errorMessage = err.error?.message || 'Failed to initiate signup';
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
        this.errorMessage = err.error?.message || 'Verification failed';
      },
    });
  }
}
