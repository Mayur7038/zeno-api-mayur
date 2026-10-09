import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-panel">
        <div class="brand-header">
          <img src="/zeno-books-logo.png" alt="ZENO BOOKS" class="auth-brand-logo" />
          <p class="subtitle">Cloud ERP & Financial Accounting Platform</p>
        </div>

        <div class="card-auth">
          @if (step === 1) {
            <!-- Step 1: Enter Email -->
            <div class="step-header">
              <div class="step-badge">Step 1 of 2</div>
              <h2>Forgot Password?</h2>
              <p class="helper-text">Enter your registered work email and we will send you a 6-digit verification code to reset your password.</p>
            </div>

            @if (errorMessage) {
              <div class="alert alert-error">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <form (ngSubmit)="onRequestOtp()">
              <div class="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                />
              </div>

              <button type="submit" class="btn-submit" [disabled]="loading || !email.trim()">
                @if (loading) {
                  <i class="pi pi-spin pi-spinner"></i> Sending Code...
                } @else {
                  <i class="pi pi-send"></i> Send Verification Code
                }
              </button>
            </form>

            <div class="auth-footer">
              <a routerLink="/auth/login" class="back-link">
                <i class="pi pi-arrow-left"></i> Back to Sign In
              </a>
            </div>
          } @else if (step === 2 && !resetSuccess) {
            <!-- Step 2: OTP & New Password -->
            <div class="step-header">
              <div class="step-badge">Step 2 of 2</div>
              <h2>Reset Your Password</h2>
              <p class="helper-text">Enter the 6-digit verification code sent to <strong>{{ email }}</strong> along with your new password.</p>
            </div>

            @if (devOtp) {
              <div class="alert alert-info dev-otp-alert">
                <i class="pi pi-info-circle"></i>
                <div>
                  <strong>Dev Mode Code:</strong> <code>{{ devOtp }}</code>
                  <button type="button" class="btn-dev-fill" (click)="fillDevOtp()">Auto-Fill</button>
                </div>
              </div>
            }

            @if (successMessage) {
              <div class="alert alert-success">
                <i class="pi pi-check-circle"></i>
                <span>{{ successMessage }}</span>
              </div>
            }

            @if (errorMessage) {
              <div class="alert alert-error">
                <i class="pi pi-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <form (ngSubmit)="onResetPassword()">
              <div class="form-group">
                <label>6-Digit Verification Code</label>
                <input
                  type="text"
                  [(ngModel)]="otp"
                  name="otp"
                  maxlength="6"
                  required
                  autocomplete="one-time-code"
                />
              </div>

              <div class="form-group">
                <label>New Password (min. 8 characters)</label>
                <div class="password-input-wrap">
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    required
                    minlength="8"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="btn-toggle-pw"
                    (click)="showPassword = !showPassword"
                    tabindex="-1"
                  >
                    <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Confirm New Password</label>
                <div class="password-input-wrap">
                  <input
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    required
                    minlength="8"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="btn-toggle-pw"
                    (click)="showConfirmPassword = !showConfirmPassword"
                    tabindex="-1"
                  >
                    <i [class]="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                class="btn-submit"
                [disabled]="loading || !otp.trim() || newPassword.length < 8 || newPassword !== confirmPassword"
              >
                @if (loading) {
                  <i class="pi pi-spin pi-spinner"></i> Updating Password...
                } @else {
                  <i class="pi pi-check"></i> Reset Password
                }
              </button>
            </form>

            <div class="resend-row">
              <span class="resend-text">Didn't receive code?</span>
              @if (cooldownTimer > 0) {
                <span class="cooldown-tag">Resend available in {{ cooldownTimer }}s</span>
              } @else {
                <button type="button" class="btn-resend" (click)="onResendOtp()" [disabled]="loading">
                  Resend Code
                </button>
              }
            </div>

            <div class="auth-footer">
              <button type="button" class="btn-change-email" (click)="changeEmail()">
                <i class="pi pi-arrow-left"></i> Change Email
              </button>
              <a routerLink="/auth/login" class="back-link">Back to Sign In</a>
            </div>
          } @else if (resetSuccess) {
            <!-- Success State -->
            <div class="success-screen">
              <div class="success-icon-wrap">
                <i class="pi pi-check-circle"></i>
              </div>
              <h2>Password Reset Successfully!</h2>
              <p class="helper-text">Your password has been changed. You can now securely sign in to your workspace.</p>

              <button type="button" class="btn-submit" (click)="goToLogin()">
                <i class="pi pi-sign-in"></i> Sign In to Account
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 24px;
    }

    .auth-panel {
      width: 100%;
      max-width: 440px;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 24px;

      .auth-brand-logo {
        height: 82px;
        max-width: 320px;
        object-fit: contain;
        margin: 0 auto 16px;
        display: block;
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
    }

    .step-header {
      margin-bottom: 20px;

      .step-badge {
        display: inline-block;
        background: var(--primary-50);
        color: var(--primary-700);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 3px 8px;
        border-radius: var(--radius-sm);
        margin-bottom: 8px;
      }

      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
        margin-bottom: 6px;
      }

      .helper-text {
        font-size: 0.8125rem;
        color: var(--surface-500);
        line-height: 1.45;
        margin-bottom: 0;
      }
    }

    .alert {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8125rem;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .alert-error {
      background-color: var(--danger-bg);
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .alert-success {
      background-color: var(--success-bg);
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    .alert-info {
      background-color: var(--info-bg);
      border: 1px solid #bae6fd;
      color: #0369a1;
    }

    .dev-otp-alert {
      justify-content: space-between;

      div {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      code {
        background: #e0f2fe;
        color: #0284c7;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: var(--font-mono);
      }

      .btn-dev-fill {
        background: #0284c7;
        color: #ffffff;
        border: none;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;

        &:hover {
          background: #0369a1;
        }
      }
    }

    .password-input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      input {
        width: 100%;
        padding-right: 40px;
      }

      .btn-toggle-pw {
        position: absolute;
        right: 10px;
        background: none;
        border: none;
        color: var(--surface-400);
        cursor: pointer;
        font-size: 0.9375rem;
        padding: 4px;

        &:hover {
          color: var(--surface-700);
        }
      }
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
        box-shadow: 0 4px 8px rgba(37, 99, 235, 0.25);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .resend-row {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px dashed var(--surface-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8125rem;

      .resend-text {
        color: var(--surface-500);
      }

      .cooldown-tag {
        color: var(--surface-400);
        font-weight: 500;
      }

      .btn-resend {
        background: none;
        border: none;
        color: var(--primary-600);
        font-weight: 600;
        cursor: pointer;
        padding: 0;

        &:hover:not(:disabled) {
          text-decoration: underline;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .auth-footer {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--surface-500);

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }

      .btn-change-email {
        background: none;
        border: none;
        color: var(--surface-600);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        padding: 0;

        &:hover {
          color: var(--surface-900);
          text-decoration: underline;
        }
      }
    }

    .success-screen {
      text-align: center;
      padding: 16px 0;

      .success-icon-wrap {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: var(--success-bg);
        color: var(--success);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 2rem;
      }

      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--surface-900);
        margin-bottom: 8px;
      }

      .helper-text {
        font-size: 0.875rem;
        color: var(--surface-500);
        margin-bottom: 24px;
      }
    }
  `],
})
export class ForgotPasswordComponent implements OnDestroy {
  step: 1 | 2 = 1;
  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;

  loading = false;
  errorMessage = '';
  successMessage = '';
  devOtp = '';
  resetSuccess = false;

  cooldownTimer = 0;
  private intervalId: any = null;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onRequestOtp() {
    if (!this.email.trim()) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.step = 2;
        this.successMessage = res.message || 'Verification code sent to your email.';
        if (res.devOtp) {
          this.devOtp = res.devOtp;
        }
        this.startCooldown(res.cooldownSeconds || 60);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to dispatch verification code. Please try again.';
      },
    });
  }

  onResendOtp() {
    if (this.cooldownTimer > 0 || !this.email) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.successMessage = 'A new verification code has been dispatched.';
        if (res.devOtp) {
          this.devOtp = res.devOtp;
        }
        this.startCooldown(res.cooldownSeconds || 60);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to resend code. Please wait before retrying.';
      },
    });
  }

  onResetPassword() {
    if (!this.otp.trim()) {
      this.errorMessage = 'Please enter the 6-digit verification code.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth
      .resetPassword({
        email: this.email.trim(),
        otp: this.otp.trim(),
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.resetSuccess = true;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Password reset failed. Invalid or expired code.';
        },
      });
  }

  fillDevOtp() {
    if (this.devOtp) {
      this.otp = this.devOtp;
    }
  }

  changeEmail() {
    this.step = 1;
    this.otp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.devOtp = '';
    this.stopCooldown();
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  private startCooldown(seconds: number) {
    this.stopCooldown();
    this.cooldownTimer = seconds;
    this.intervalId = setInterval(() => {
      this.cooldownTimer--;
      if (this.cooldownTimer <= 0) {
        this.stopCooldown();
      }
    }, 1000);
  }

  private stopCooldown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy() {
    this.stopCooldown();
  }
}
