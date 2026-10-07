import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast-item" 
          [ngClass]="['toast-' + toast.type, toast.closing ? 'toast-closing' : '']"
          role="alert"
        >
          <div class="toast-indicator"></div>

          <div class="toast-icon-wrap">
            <i [class]="toast.icon"></i>
          </div>

          <div class="toast-body">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>

          <button 
            type="button" 
            class="toast-close-btn" 
            (click)="toastService.dismiss(toast.id)" 
            aria-label="Close notification"
            title="Dismiss"
          >
            <i class="pi pi-times"></i>
          </button>

          @if (toast.duration > 0) {
            <div class="toast-progress">
              <div 
                class="toast-progress-bar"
                [style.animation-duration.ms]="toast.duration"
              ></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      width: calc(100vw - 48px);
      pointer-events: none;
    }

    .toast-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px 16px 14px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 
        0 10px 25px -5px rgba(0, 0, 0, 0.12),
        0 8px 10px -6px rgba(0, 0, 0, 0.06),
        0 0 0 1px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      pointer-events: auto;
      animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.25s ease;

      &.toast-closing {
        animation: toastSlideOut 0.25s ease forwards;
      }
    }

    /* Left Indicator Accent Stripe */
    .toast-indicator {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
    }

    .toast-icon-wrap {
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
      padding-top: 2px;
    }

    .toast-title {
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1.25;
      color: #1e293b;
      margin-bottom: 3px;
    }

    .toast-message {
      font-size: 0.8125rem;
      line-height: 1.4;
      color: #475569;
      word-break: break-word;
    }

    .toast-close-btn {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: #94a3b8;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.15s ease;
      margin-top: 1px;

      &:hover {
        background: #f1f5f9;
        color: #334155;
      }
    }

    /* Progress bar countdown timer */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .toast-progress-bar {
      height: 100%;
      width: 100%;
      transform-origin: left center;
      animation: toastProgress linear forwards;
    }

    /* VARIANT: SUCCESS */
    .toast-success {
      border-color: rgba(16, 185, 129, 0.2);
      .toast-indicator {
        background: #10b981;
      }
      .toast-icon-wrap {
        background: #ecfdf5;
        color: #059669;
      }
      .toast-progress-bar {
        background: #10b981;
      }
    }

    /* VARIANT: ERROR */
    .toast-error {
      border-color: rgba(239, 68, 68, 0.2);
      .toast-indicator {
        background: #ef4444;
      }
      .toast-icon-wrap {
        background: #fef2f2;
        color: #dc2626;
      }
      .toast-progress-bar {
        background: #ef4444;
      }
    }

    /* VARIANT: INFO */
    .toast-info {
      border-color: rgba(2, 132, 199, 0.2);
      .toast-indicator {
        background: #0284c7;
      }
      .toast-icon-wrap {
        background: #f0f9ff;
        color: #0284c7;
      }
      .toast-progress-bar {
        background: #0284c7;
      }
    }

    /* VARIANT: WARNING */
    .toast-warning {
      border-color: rgba(245, 158, 11, 0.2);
      .toast-indicator {
        background: #f59e0b;
      }
      .toast-icon-wrap {
        background: #fffbeb;
        color: #d97706;
      }
      .toast-progress-bar {
        background: #f59e0b;
      }
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateX(60px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    @keyframes toastSlideOut {
      from {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateX(80px) scale(0.92);
      }
    }

    @keyframes toastProgress {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
