import { Loan, Payment } from '../domain/types';

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-CO').format(amount || 0);
}

export interface LoanCalculation {
  capital: number;
  interestRate: number;
  interestAmount: number;
  totalWithInterest: number;
  totalDays: number;
  dailyPayment: number;
}

export function calculateLoan(capital: number, interestRate: number, totalDays: number): LoanCalculation {
  const cap = Number(capital) || 0;
  const rate = Number(interestRate) || 0;
  const days = Math.max(1, Number(totalDays) || 1);

  const interestAmount = (cap * rate) / 100;
  const totalWithInterest = cap + interestAmount;
  const dailyPayment = Math.ceil(totalWithInterest / days);

  return {
    capital: cap,
    interestRate: rate,
    interestAmount,
    totalWithInterest,
    totalDays: days,
    dailyPayment
  };
}

export interface AmortizationRow {
  installmentNumber: number;
  expectedDate: string;
  expectedAmount: number;
  isPaid: boolean;
  paidAmount?: number;
  paymentDate?: string;
  notes?: string;
}

export function generateAmortizationSchedule(loan: Loan, payments: Payment[]): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const start = new Date(loan.start_date || new Date().toISOString());

  const sortedPayments = [...payments]
    .filter(p => p.loan_id === loan.id)
    .sort((a, b) => (a.payment_number || 0) - (b.payment_number || 0));

  for (let i = 1; i <= loan.total_days; i++) {
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + (i - 1));

    const matchedPayment = sortedPayments[i - 1];

    schedule.push({
      installmentNumber: i,
      expectedDate: dueDate.toISOString().split('T')[0],
      expectedAmount: loan.daily_payment,
      isPaid: Boolean(matchedPayment),
      paidAmount: matchedPayment?.amount,
      paymentDate: matchedPayment?.payment_date,
      notes: matchedPayment?.notes || undefined
    });
  }

  return schedule;
}
