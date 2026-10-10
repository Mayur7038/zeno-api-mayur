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
  styleUrl: './forgot-password.component.scss',
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
