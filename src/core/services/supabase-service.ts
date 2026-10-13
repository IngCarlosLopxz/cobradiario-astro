import { supabase } from '../db/supabase';
import { Borrower, Loan, Payment, DashboardStats } from '../domain/types';

export class SupabaseService {
  // ── BORROWERS ─────────────────────────────────────────────────────────────
  static async getBorrowers(): Promise<Borrower[]> {
    const { data, error } = await supabase
      .from('borrowers')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching borrowers:', error);
      return [];
    }
    return (data || []).map(b => ({
      ...b,
      latitude: b.latitude ? Number(b.latitude) : null,
      longitude: b.longitude ? Number(b.longitude) : null,
    }));
  }

  static async getBorrowerById(id: number): Promise<Borrower | null> {
    const { data, error } = await supabase
      .from('borrowers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return {
      ...data,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
    };
  }

  static async saveBorrower(payload: Partial<Borrower>): Promise<Borrower> {
    if (payload.id) {
      const { data, error } = await supabase
        .from('borrowers')
        .update({
          full_name: payload.full_name,
          document_number: payload.document_number || null,
          phone: payload.phone || null,
          address: payload.address || null,
          city: payload.city || null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          status: payload.status || 'active',
        })
        .eq('id', payload.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      const { data, error } = await supabase
        .from('borrowers')
        .insert([{
          full_name: payload.full_name,
          document_number: payload.document_number || null,
          phone: payload.phone || null,
          address: payload.address || null,
          city: payload.city || null,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          status: payload.status || 'active',
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }
  }

  // ── LOANS ─────────────────────────────────────────────────────────────────
  static async getLoans(status?: string, borrowerId?: number): Promise<Loan[]> {
    let query = supabase
      .from('loans')
      .select('*, borrowers(id, full_name, phone, address, city, latitude, longitude)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (borrowerId) {
      query = query.eq('borrower_id', borrowerId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching loans:', error);
      return [];
    }

    return (data || []).map((l: any) => {
      const amount = Number(l.amount);
      const totalWithInterest = Number(l.total_with_interest);
      const totalPaid = Number(l.total_paid || 0);
      const dailyPayment = Number(l.daily_payment);
      const b = l.borrowers;

      return {
        id: l.id,
        borrower_id: l.borrower_id,
        amount,
        interest_rate: Number(l.interest_rate),
        total_with_interest: totalWithInterest,
        daily_payment: dailyPayment,
        total_days: Number(l.total_days),
        start_date: l.start_date,
        status: l.status,
        total_paid: totalPaid,
        payments_made: Number(l.payments_made || 0),
        created_at: l.created_at,
        borrower_name: b?.full_name || 'Desconocido',
        borrower_phone: b?.phone || '',
        borrower_address: b?.address || '',
        borrower_city: b?.city || '',
        borrower_latitude: b?.latitude ? Number(b.latitude) : null,
        borrower_longitude: b?.longitude ? Number(b.longitude) : null,
        pending_amount: Math.max(0, totalWithInterest - totalPaid),
        progress_percent: totalWithInterest > 0 ? Math.min(100, Math.round((totalPaid / totalWithInterest) * 100)) : 0,
      };
    });
  }

  static async getLoanById(id: number): Promise<Loan | null> {
    const { data, error } = await supabase
      .from('loans')
      .select('*, borrowers(id, full_name, phone, address, city, latitude, longitude, document_number)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const b = (data as any).borrowers;
    const amount = Number(data.amount);
    const totalWithInterest = Number(data.total_with_interest);
    const totalPaid = Number(data.total_paid || 0);

    return {
      ...data,
      amount,
      interest_rate: Number(data.interest_rate),
      total_with_interest: totalWithInterest,
      daily_payment: Number(data.daily_payment),
      total_days: Number(data.total_days),
      total_paid: totalPaid,
      payments_made: Number(data.payments_made || 0),
      borrower_name: b?.full_name || 'Desconocido',
      borrower_phone: b?.phone || '',
      borrower_address: b?.address || '',
      borrower_city: b?.city || '',
      borrower_latitude: b?.latitude ? Number(b.latitude) : null,
      borrower_longitude: b?.longitude ? Number(b.longitude) : null,
      pending_amount: Math.max(0, totalWithInterest - totalPaid),
      progress_percent: totalWithInterest > 0 ? Math.min(100, Math.round((totalPaid / totalWithInterest) * 100)) : 0,
    };
  }

  static async createLoan(payload: {
    borrower_id: number;
    amount: number;
    interest_rate: number;
    total_days: number;
    start_date: string;
  }): Promise<Loan> {
    const total_with_interest = payload.amount + (payload.amount * payload.interest_rate / 100);
    const daily_payment = total_with_interest / payload.total_days;

    const { data, error } = await supabase
      .from('loans')
      .insert([{
        borrower_id: payload.borrower_id,
        amount: Math.round(payload.amount * 100) / 100,
        interest_rate: payload.interest_rate,
        total_with_interest: Math.round(total_with_interest * 100) / 100,
        daily_payment: Math.round(daily_payment * 100) / 100,
        total_days: payload.total_days,
        start_date: payload.start_date,
        status: 'active',
        total_paid: 0,
        payments_made: 0
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  static async getPayments(loanId?: number): Promise<Payment[]> {
    let query = supabase
      .from('payments')
      .select('*, borrowers(full_name, phone)')
      .order('payment_date', { ascending: false })
      .order('id', { ascending: false });

    if (loanId) {
      query = query.eq('loan_id', loanId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      borrower_name: p.borrowers?.full_name || 'Desconocido',
      borrower_phone: p.borrowers?.phone || '',
    }));
  }

  static async registerPayment(payload: {
    loan_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
  }): Promise<Payment> {
    // 1. Fetch loan
    const loan = await this.getLoanById(payload.loan_id);
    if (!loan) throw new Error('Préstamo no encontrado');

    const nextPaymentNumber = loan.payments_made + 1;

    // 2. Insert payment
    const { data: payData, error: payError } = await supabase
      .from('payments')
      .insert([{
        loan_id: payload.loan_id,
        borrower_id: loan.borrower_id,
        amount: payload.amount,
        payment_date: payload.payment_date,
        payment_number: nextPaymentNumber,
        notes: payload.notes || null,
      }])
      .select()
      .single();

    if (payError) throw new Error(payError.message);

    // 3. Update loan stats
    const newTotalPaid = Number(loan.total_paid) + Number(payload.amount);
    const newPaymentsMade = loan.payments_made + 1;
    const isCompleted = newTotalPaid >= loan.total_with_interest;

    const { error: loanUpdateError } = await supabase
      .from('loans')
      .update({
        total_paid: newTotalPaid,
        payments_made: newPaymentsMade,
        status: isCompleted ? 'completed' : 'active'
      })
      .eq('id', payload.loan_id);

    if (loanUpdateError) {
      console.error('Error updating loan balance:', loanUpdateError);
    }

    return payData;
  }
}
