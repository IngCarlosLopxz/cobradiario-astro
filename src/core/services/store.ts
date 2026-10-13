import { Borrower, Loan, Payment, DashboardStats, RouteMarker } from '../domain/types';
import { INITIAL_BORROWERS, INITIAL_LOANS, INITIAL_PAYMENTS } from '../db/seed-data';

const STORAGE_KEY = 'cobradiario_store_v1';

class CobraDiarioStore {
  private borrowers: Borrower[] = INITIAL_BORROWERS;
  private loans: Loan[] = INITIAL_LOANS;
  private payments: Payment[] = INITIAL_PAYMENTS;
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.borrowers)) this.borrowers = parsed.borrowers;
        if (Array.isArray(parsed.loans)) this.loans = parsed.loans;
        if (Array.isArray(parsed.payments)) this.payments = parsed.payments;
      } else {
        this.persist();
      }
    } catch {
      // ignore
    }
    this.initialized = true;
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        borrowers: this.borrowers,
        loans: this.loans,
        payments: this.payments
      }));
    } catch {
      // storage quota
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getBorrowers(): Borrower[] {
    return [...this.borrowers];
  }

  public getBorrowerById(id: number): Borrower | undefined {
    return this.borrowers.find(b => b.id === Number(id));
  }

  public saveBorrower(data: Partial<Borrower>): Borrower {
    const isEdit = Boolean(data.id);
    let borrower: Borrower;

    if (isEdit && data.id) {
      const idx = this.borrowers.findIndex(b => b.id === data.id);
      if (idx >= 0) {
        this.borrowers[idx] = {
          ...this.borrowers[idx],
          ...data,
        } as Borrower;
        borrower = this.borrowers[idx];
      } else {
        throw new Error('Prestatario no encontrado');
      }
    } else {
      const newId = Math.max(0, ...this.borrowers.map(b => b.id)) + 1;
      borrower = {
        id: newId,
        full_name: data.full_name || 'Nuevo Cliente',
        document_number: data.document_number || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || 'La Jagua de Ibirico',
        latitude: data.latitude ?? 9.5607,
        longitude: data.longitude ?? -73.3350,
        status: data.status || 'active',
        created_at: new Date().toISOString()
      };
      this.borrowers.unshift(borrower);
    }

    this.persist();
    return borrower;
  }

  public deleteBorrower(id: number): boolean {
    const prevLen = this.borrowers.length;
    this.borrowers = this.borrowers.filter(b => b.id !== id);
    if (this.borrowers.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public getLoans(): Loan[] {
    return this.loans.map(loan => {
      const borrower = this.borrowers.find(b => b.id === loan.borrower_id);
      const pending = Math.max(0, loan.total_with_interest - loan.total_paid);
      const percent = loan.total_with_interest > 0
        ? Math.min(100, Math.round((loan.total_paid / loan.total_with_interest) * 100))
        : 0;

      const today = new Date().toISOString().split('T')[0];
      const isPaidToday = this.payments.some(
        p => p.loan_id === loan.id && p.payment_date === today
      );

      return {
        ...loan,
        borrower_name: borrower?.full_name || 'Sin Asignar',
        borrower_phone: borrower?.phone || '',
        borrower_address: borrower?.address || '',
        borrower_city: borrower?.city || '',
        borrower_latitude: borrower?.latitude,
        borrower_longitude: borrower?.longitude,
        pending_amount: pending,
        progress_percent: percent,
        is_paid_today: isPaidToday
      };
    });
  }

  public getLoanById(id: number): Loan | undefined {
    return this.getLoans().find(l => l.id === Number(id));
  }

  public createLoan(data: {
    borrower_id: number;
    amount: number;
    interest_rate: number;
    total_days: number;
    start_date: string;
  }): Loan {
    const newId = Math.max(0, ...this.loans.map(l => l.id)) + 1;
    const amount = Number(data.amount) || 0;
    const rate = Number(data.interest_rate) || 20;
    const days = Number(data.total_days) || 30;
    const totalWithInterest = amount + (amount * rate) / 100;
    const dailyPayment = Math.ceil(totalWithInterest / days);

    const loan: Loan = {
      id: newId,
      borrower_id: Number(data.borrower_id),
      amount,
      interest_rate: rate,
      total_with_interest: totalWithInterest,
      daily_payment: dailyPayment,
      total_days: days,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      status: 'active',
      total_paid: 0,
      payments_made: 0,
      created_at: new Date().toISOString()
    };

    this.loans.unshift(loan);
    this.persist();
    return this.getLoanById(newId)!;
  }

  public getPayments(): Payment[] {
    return this.payments.map(p => {
      const borrower = this.borrowers.find(b => b.id === p.borrower_id);
      const loan = this.loans.find(l => l.id === p.loan_id);
      return {
        ...p,
        borrower_name: borrower?.full_name || 'Desconocido',
        borrower_phone: borrower?.phone,
        loan_amount: loan?.amount,
        daily_payment: loan?.daily_payment
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public registerPayment(data: {
    loan_id: number;
    amount: number;
    payment_date?: string;
    notes?: string;
  }): { payment: Payment; loan: Loan } {
    const loanIdx = this.loans.findIndex(l => l.id === Number(data.loan_id));
    if (loanIdx < 0) {
      throw new Error('Préstamo no encontrado');
    }

    const loan = this.loans[loanIdx];
    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const newPaymentId = Math.max(0, ...this.payments.map(p => p.id)) + 1;
    const nextPaymentNumber = (loan.payments_made || 0) + 1;
    const paymentDate = data.payment_date || new Date().toISOString().split('T')[0];

    const payment: Payment = {
      id: newPaymentId,
      loan_id: loan.id,
      borrower_id: loan.borrower_id,
      amount: amount,
      payment_date: paymentDate,
      payment_number: nextPaymentNumber,
      notes: data.notes || null,
      created_at: new Date().toISOString()
    };

    this.payments.unshift(payment);

    const newTotalPaid = Math.round(((loan.total_paid || 0) + amount) * 100) / 100;
    const newPaymentsMade = (loan.payments_made || 0) + 1;
    const isCompleted = newTotalPaid >= loan.total_with_interest || newPaymentsMade >= loan.total_days;

    this.loans[loanIdx] = {
      ...loan,
      total_paid: newTotalPaid,
      payments_made: newPaymentsMade,
      status: isCompleted ? 'completed' : 'active'
    };

    this.persist();

    return {
      payment,
      loan: this.getLoanById(loan.id)!
    };
  }

  public getRouteMarkers(filterDate?: string): RouteMarker[] {
    const targetDate = filterDate || new Date().toISOString().split('T')[0];
    const activeLoans = this.getLoans().filter(l => l.status === 'active');

    return activeLoans.map(loan => {
      const borrower = this.getBorrowerById(loan.borrower_id);
      const isPaid = this.payments.some(
        p => p.loan_id === loan.id && p.payment_date === targetDate
      );

      const startDate = new Date(loan.start_date);
      const today = new Date(targetDate);
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      const isOverdue = diffDays > loan.payments_made && !isPaid;

      return {
        id: loan.id,
        loan_id: loan.id,
        borrower_id: loan.borrower_id,
        name: borrower?.full_name || 'Cliente',
        phone: borrower?.phone || '',
        address: borrower?.address || '',
        city: borrower?.city || '',
        latitude: borrower?.latitude || 9.5607,
        longitude: borrower?.longitude || -73.3350,
        daily_payment: loan.daily_payment,
        pending_amount: loan.pending_amount || 0,
        payments_made: loan.payments_made,
        total_days: loan.total_days,
        is_paid_today: isPaid,
        status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending')
      };
    });
  }

  public getDashboardStats(targetDate?: string): DashboardStats {
    const today = targetDate || new Date().toISOString().split('T')[0];
    const loans = this.getLoans();
    const activeLoans = loans.filter(l => l.status === 'active');

    const todayPayments = this.payments.filter(p => p.payment_date === today);
    const todayCollected = todayPayments.reduce((acc, p) => acc + p.amount, 0);
    const todayTarget = activeLoans.reduce((acc, l) => acc + l.daily_payment, 0);

    const activeClientsSet = new Set(activeLoans.map(l => l.borrower_id));
    const totalLent = activeLoans.reduce((acc, l) => acc + l.amount, 0);
    const totalCollected = loans.reduce((acc, l) => acc + l.total_paid, 0);
    const totalExpected = loans.reduce((acc, l) => acc + l.total_with_interest, 0);

    const currentMonthPrefix = today.substring(0, 7);
    const monthPayments = this.payments.filter(p => p.payment_date.startsWith(currentMonthPrefix));
    const monthCollected = monthPayments.reduce((acc, p) => acc + p.amount, 0);

    const monthLoans = loans.filter(l => l.start_date.startsWith(currentMonthPrefix));
    const monthLent = monthLoans.reduce((acc, l) => acc + l.amount, 0);
    const monthExpected = monthLoans.reduce((acc, l) => acc + l.total_with_interest, 0);
    const monthProfit = Math.max(0, monthExpected - monthLent);

    return {
      todayCollected,
      todayTarget,
      todayPaymentsCount: todayPayments.length,
      activeLoansCount: activeLoans.length,
      activeClientsCount: activeClientsSet.size,
      totalLent,
      totalCollected,
      totalExpected,
      monthCollected,
      monthLent,
      monthProfit
    };
  }

  public resetToDefaultSeed() {
    this.borrowers = [...INITIAL_BORROWERS];
    this.loans = [...INITIAL_LOANS];
    this.payments = [...INITIAL_PAYMENTS];
    this.persist();
  }
}

export const store = new CobraDiarioStore();
