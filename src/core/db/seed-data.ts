import { Borrower, Loan, Payment } from '../domain/types';

export const INITIAL_BORROWERS: Borrower[] = [
  {
    id: 1,
    full_name: 'Carlos Lopez',
    document_number: '1003266554',
    phone: '3105196193',
    address: 'calle 5 123',
    city: 'la jagua',
    latitude: 9.5607606,
    longitude: -73.3349955,
    status: 'active',
    created_at: '2026-04-24 17:23:56'
  },
  {
    id: 2,
    full_name: 'elias',
    document_number: '1003255648',
    phone: '321546789',
    address: 'calle 1 la jagua',
    city: 'la jagua',
    latitude: 9.5725146,
    longitude: -73.3288398,
    status: 'active',
    created_at: '2026-04-24 17:40:05'
  },
  {
    id: 3,
    full_name: 'Juan Perez',
    document_number: '10032554178',
    phone: '3001264574',
    address: 'calle 3 N9-152 toscano',
    city: 'La Jagua de Ibirico, Cesar, Colombia',
    latitude: 9.5618080,
    longitude: -73.3390993,
    status: 'active',
    created_at: '2026-04-28 15:22:26'
  },
  {
    id: 4,
    full_name: 'pablo g',
    document_number: '0012345678',
    phone: '3221564876',
    address: 'calle 5 #8-98 la jagua',
    city: 'La Jagua de Ibirico, Cesar, RAP Caribe, Colombia',
    latitude: 9.5613975,
    longitude: -73.3328147,
    status: 'active',
    created_at: '2026-04-28 19:39:34'
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: 1,
    borrower_id: 1,
    amount: 500000.0,
    interest_rate: 20.0,
    total_with_interest: 600000.0,
    daily_payment: 20000.0,
    total_days: 30,
    start_date: '2026-04-24',
    status: 'completed',
    total_paid: 619000.0,
    payments_made: 8,
    created_at: '2026-04-24 17:24:21'
  },
  {
    id: 2,
    borrower_id: 2,
    amount: 1000000.0,
    interest_rate: 20.0,
    total_with_interest: 1200000.0,
    daily_payment: 80000.0,
    total_days: 15,
    start_date: '2026-04-24',
    status: 'active',
    total_paid: 160000.0,
    payments_made: 2,
    created_at: '2026-04-24 17:41:05'
  },
  {
    id: 3,
    borrower_id: 1,
    amount: 200000.0,
    interest_rate: 15.0,
    total_with_interest: 230000.0,
    daily_payment: 15333.33,
    total_days: 15,
    start_date: '2026-04-27',
    status: 'active',
    total_paid: 15333.33,
    payments_made: 1,
    created_at: '2026-04-27 02:43:48'
  },
  {
    id: 4,
    borrower_id: 3,
    amount: 100000.0,
    interest_rate: 20.0,
    total_with_interest: 120000.0,
    daily_payment: 4000.0,
    total_days: 30,
    start_date: '2026-04-28',
    status: 'active',
    total_paid: 0.0,
    payments_made: 0,
    created_at: '2026-04-28 15:25:58'
  },
  {
    id: 5,
    borrower_id: 4,
    amount: 100000.0,
    interest_rate: 20.0,
    total_with_interest: 120000.0,
    daily_payment: 4000.0,
    total_days: 30,
    start_date: '2026-04-28',
    status: 'active',
    total_paid: 0.0,
    payments_made: 0,
    created_at: '2026-04-28 19:39:54'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 1, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 1, notes: null, created_at: '2026-04-24 17:24:54' },
  { id: 2, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 2, notes: null, created_at: '2026-04-24 17:25:17' },
  { id: 3, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 3, notes: null, created_at: '2026-04-24 17:25:23' },
  { id: 4, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 4, notes: null, created_at: '2026-04-24 17:25:35' },
  { id: 5, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 5, notes: null, created_at: '2026-04-24 17:25:40' },
  { id: 6, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 6, notes: null, created_at: '2026-04-24 17:25:44' },
  { id: 7, loan_id: 1, borrower_id: 1, amount: 479000.0, payment_date: '2026-04-24', payment_number: 7, notes: 'Liquidación anticipada', created_at: '2026-04-24 17:26:04' },
  { id: 8, loan_id: 1, borrower_id: 1, amount: 20000.0, payment_date: '2026-04-24', payment_number: 8, notes: null, created_at: '2026-04-24 17:26:08' },
  { id: 9, loan_id: 2, borrower_id: 2, amount: 80000.0, payment_date: '2026-04-24', payment_number: 1, notes: null, created_at: '2026-04-24 17:41:28' },
  { id: 10, loan_id: 2, borrower_id: 2, amount: 80000.0, payment_date: '2026-04-27', payment_number: 2, notes: null, created_at: '2026-04-27 02:46:03' },
  { id: 11, loan_id: 3, borrower_id: 1, amount: 15333.33, payment_date: '2026-04-27', payment_number: 1, notes: null, created_at: '2026-04-27 02:46:10' }
];
