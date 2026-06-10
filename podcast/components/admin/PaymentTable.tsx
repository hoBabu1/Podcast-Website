import { ADMIN_PAGE_SIZE } from '@/lib/admin/queries'
import type { AdminPayment } from '@/types/admin'
import { Pagination } from './Pagination'

const BASESCAN_TX = 'https://sepolia.basescan.org/tx/'

export function PaymentTable({
  payments,
  total,
  page,
}: {
  payments: AdminPayment[]
  total: number
  page: number
}) {
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-bg text-brand-body">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Amount (USDC)</th>
              <th className="px-4 py-3 font-medium">Tx Hash</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 text-brand-body">{payment.user_email}</td>
                  <td className="px-4 py-3 text-brand-heading">Session {payment.session_id}</td>
                  <td className="px-4 py-3 text-brand-amber font-semibold whitespace-nowrap">
                    ${payment.amount_usdc.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${BASESCAN_TX}${payment.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-brand-amber hover:text-brand-amberDark transition-colors"
                    >
                      {payment.tx_hash.slice(0, 10)}...{payment.tx_hash.slice(-8)}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-brand-body whitespace-nowrap">
                    {new Date(payment.granted_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination basePath="/admin/payments" page={page} totalPages={totalPages} />
    </div>
  )
}
