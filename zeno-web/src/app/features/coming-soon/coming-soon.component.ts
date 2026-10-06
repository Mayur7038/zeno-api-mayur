import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="coming-soon-container">
      <div class="zeno-card hero-card">
        <div class="badge-pill roadmap-badge">
          <i class="pi pi-compass"></i> PHASE 2 & 3 ROADMAP
        </div>
        
        <div class="icon-hero">
          <i [class]="moduleInfo.icon"></i>
        </div>

        <h1 class="hero-title">{{ moduleInfo.title }}</h1>
        <p class="hero-desc">{{ moduleInfo.description }}</p>

        <div class="planned-workflow">
          <h3>Planned End-to-End Workflow Architecture</h3>
          <div class="steps-flow">
            @for (step of moduleInfo.steps; track step.title; let idx = $index) {
              <div class="flow-step">
                <div class="step-num">{{ idx + 1 }}</div>
                <div class="step-text">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-sub">{{ step.desc }}</div>
                </div>
              </div>
              @if (idx < moduleInfo.steps.length - 1) {
                <div class="step-arrow">
                  <i class="pi pi-arrow-right"></i>
                </div>
              }
            }
          </div>
        </div>

        <div class="feature-highlights">
          <h3>Key Enterprise Features In Development</h3>
          <div class="highlights-grid">
            @for (h of moduleInfo.highlights; track h.title) {
              <div class="highlight-item">
                <div class="highlight-icon">
                  <i class="pi pi-check"></i>
                </div>
                <div>
                  <div class="highlight-title">{{ h.title }}</div>
                  <div class="highlight-desc">{{ h.desc }}</div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="action-bar">
          <a routerLink="/procure-to-pay/purchase-orders" class="btn-primary">
            <i class="pi pi-shopping-cart"></i> Explore Procure-to-Pay Cycle (Live)
          </a>
          <a routerLink="/dashboard" class="btn-secondary">
            <i class="pi pi-th-large"></i> Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coming-soon-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 10px 0 40px;
    }

    .hero-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 36px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }

    .roadmap-badge {
      background: #eff6ff;
      color: var(--primary-700);
      font-weight: 700;
      margin-bottom: 20px;
      padding: 6px 14px;
      border: 1px solid #bfdbfe;
    }

    .icon-hero {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 2.2rem;
      margin-bottom: 20px;
      box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25);
    }

    .hero-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--surface-900);
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    .hero-desc {
      font-size: 1rem;
      color: var(--surface-600);
      max-width: 620px;
      line-height: 1.6;
      margin-bottom: 36px;
    }

    /* Workflow Flow */
    .planned-workflow {
      width: 100%;
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-md);
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;

      h3 {
        font-size: 0.9375rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--surface-700);
        margin-bottom: 20px;
      }
    }

    .steps-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .flow-step {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface-50);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      min-width: 160px;
      flex: 1;

      .step-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary-600);
        color: #ffffff;
        font-size: 0.8125rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .step-title {
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--surface-900);
      }

      .step-sub {
        font-size: 0.75rem;
        color: var(--surface-500);
      }
    }

    .step-arrow {
      color: var(--surface-400);
      font-size: 1rem;
    }

    /* Highlights */
    .feature-highlights {
      width: 100%;
      text-align: left;
      margin-bottom: 36px;

      h3 {
        font-size: 0.9375rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--surface-700);
        margin-bottom: 16px;
      }
    }

    .highlights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .highlight-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--surface-0);
      border: 1px solid var(--surface-200);
      border-radius: var(--radius-sm);
      padding: 14px;

      .highlight-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ecfdf5;
        color: var(--success);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .highlight-title {
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--surface-900);
        margin-bottom: 2px;
      }

      .highlight-desc {
        font-size: 0.8125rem;
        color: var(--surface-500);
        line-height: 1.4;
      }
    }

    .action-bar {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  `],
})
export class ComingSoonComponent implements OnInit {
  moduleKey = 'sales';

  moduleData: Record<string, any> = {
    sales: {
      title: 'Order-to-Cash (Sales & Billing)',
      icon: 'pi pi-receipt',
      description: 'The end-to-end sales lifecycle module with integrated GST e-invoicing, delivery tracking, credit management, and accounts receivable reconciliation.',
      steps: [
        { title: 'Quotation', desc: 'Customer RFQ & Pricing' },
        { title: 'Sales Order', desc: 'Order confirmation' },
        { title: 'Delivery Challan', desc: 'Stock OUT / dispatch' },
        { title: 'Tax Invoice', desc: 'GST posting & Dr Customer' },
        { title: 'Receipt', desc: 'Payment received' },
      ],
      highlights: [
        { title: 'E-Way Bill & E-Invoice Integration', desc: 'Direct NIC portal IRN and QR code generation for compliant B2B invoices.' },
        { title: 'Multi-Godown Stock Allocation', desc: 'Real-time reserved inventory check before committing customer orders.' },
        { title: 'Credit Limit & Days Control', desc: 'Automated warnings and hold orders when customer overdue limits are exceeded.' },
      ],
    },
    manufacturing: {
      title: 'BOM & Assembly Manufacturing',
      icon: 'pi pi-cog',
      description: 'Multi-level Bill of Materials (BOM), production planning, raw material auto-consumption, and finished goods stock-in valuation.',
      steps: [
        { title: 'BOM Setup', desc: 'Components & Overhead' },
        { title: 'Work Order', desc: 'Batch production run' },
        { title: 'Issue to Production', desc: 'Raw material stock OUT' },
        { title: 'Assembly Completion', desc: 'FG Stock IN & Costing' },
      ],
      highlights: [
        { title: 'Multi-Level BOM Trees', desc: 'Define sub-assemblies, scrap percentages, and direct labour overhead costs.' },
        { title: 'Atomic Inventory Stock Ledger', desc: 'Consumes raw materials atomically and adds finished goods at exact weighted average cost.' },
        { title: 'Production Variance Reports', desc: 'Compare actual component consumption versus standard engineering BOM tolerances.' },
      ],
    },
  };

  moduleInfo: any = this.moduleData['sales'];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const key = params['module'] || 'sales';
      this.moduleKey = key;
      this.moduleInfo = this.moduleData[key] || {
        title: `${key.toUpperCase()} Module`,
        icon: 'pi pi-compass',
        description: 'This specialized enterprise module is scheduled in the subsequent development milestone.',
        steps: [
          { title: 'Planning', desc: 'Schema specification' },
          { title: 'API Engine', desc: 'TypeORM transaction service' },
          { title: 'PrimeNG UI', desc: 'Enterprise data views' },
        ],
        highlights: [
          { title: 'Full Multi-Tenancy', desc: 'Strict organizational isolation.' },
          { title: 'Audit Trail', desc: 'Pessimistic concurrency and audit logs.' },
        ],
      };
    });
  }
}
