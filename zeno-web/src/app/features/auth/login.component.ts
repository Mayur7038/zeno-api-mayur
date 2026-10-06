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

          <form (ngSubmit)="onLogin()">
            <div class="form-group">
              <label>Work Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="name@company.com"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label>Password</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••"
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
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 24px;
    }

    .login-panel {
      width: 100%;
      max-width: 440px;
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
        letter-spacing: -0.02em;
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
      margin-top: 8px;
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
export class LoginComponent {
  email = '';
  password = '';
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
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
      },
    });
  }
}
