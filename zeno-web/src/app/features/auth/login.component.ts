import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-panel">
        <div class="brand-header">
          <img src="/zeno-books-logo.png" alt="ZENO BOOKS" class="auth-brand-logo" />
          <p class="subtitle">Cloud ERP & Financial Accounting Platform</p>
        </div>

        <div class="card-auth">
          <h2>Sign In to Your Workspace</h2>
          <p class="helper-text">Enter your credentials to access your tenant</p>

          @if (errorMessage) {
            <div class="alert alert-error">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ errorMessage }}</span>
            </div>
          }

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px 14px; border-radius: 6px; font-size: 0.82rem; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-info-circle"></i>
            <span>Demo Credentials: <strong>admin&#64;zenobooks.com</strong> | <strong>Password123!</strong></span>
          </div>

          <form (ngSubmit)="onLogin()">
            <div class="form-group">
              <label>Work Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <div class="label-row">
                <label>Password</label>
                <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading">
              @if (loading) {
                <i class="pi pi-spin pi-spinner"></i> Authenticating...
              } @else {
                <i class="pi pi-sign-in"></i> Sign In
              }
            </button>
          </form>

          <div class="auth-footer">
            <span>New business?</span>
            <a routerLink="/auth/signup">Create an account</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = 'admin@zenobooks.com';
  password = 'Password123!';
  loading = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onLogin() {
    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to backend server (http://localhost:4000). Please check server status.';
        } else {
          const rawMsg = err.error?.message;
          if (Array.isArray(rawMsg)) {
            this.errorMessage = rawMsg.join(', ');
          } else {
            this.errorMessage = rawMsg || 'Login failed. Please check your credentials.';
          }
        }
      },
    });
  }
}
