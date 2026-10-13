export type LoanStatus = 'active' | 'completed' | 'defaulted';
export type BorrowerStatus = 'active' | 'inactive';

export interface Borrower {
  id: number;
  full_name: string;
  document_number: string;
  phone: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  status: BorrowerStatus;
  created_at: string;
}

export interface Loan {
  id: number;
  borrower_id: number;
  amount: number;
  interest_rate: number;
  total_with_interest: number;
  daily_payment: number;
  total_days: number;
  start_date: string;
  status: LoanStatus;
  total_paid: number;
  payments_made: number;
  created_at: string;

  // Joined properties
  borrower_name?: string;
  borrower_phone?: string;
  borrower_address?: string;
  borrower_city?: string;
  borrower_latitude?: number | null;
  borrower_longitude?: number | null;
  pending_amount?: number;
  progress_percent?: number;
  is_paid_today?: boolean;
}

export interface Payment {
  id: number;
  loan_id: number;
  borrower_id: number;
  amount: number;
  payment_date: string;
  payment_number: number;
  notes?: string | null;
  created_at: string;

  borrower_name?: string;
  borrower_phone?: string;
  loan_amount?: number;
  daily_payment?: number;
}

export interface DashboardStats {
  todayCollected: number;
  todayTarget: number;
  todayPaymentsCount: number;
  activeLoansCount: number;
  activeClientsCount: number;
  totalLent: number;
  totalCollected: number;
  totalExpected: number;
  monthCollected: number;
  monthLent: number;
  monthProfit: number;
}

export interface RouteMarker {
  id: number;
  loan_id: number;
  borrower_id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  daily_payment: number;
  pending_amount: number;
  payments_made: number;
  total_days: number;
  is_paid_today: boolean;
  status: 'paid' | 'pending' | 'overdue';
}
