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
