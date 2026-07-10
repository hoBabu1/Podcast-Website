'use client'

import { useState } from 'react'
import { RewardForm, type RewardFormValues } from './RewardForm'
import { RewardStatusBadge } from '@/components/rewards/RewardStatusBadge'
import type { RewardPositionRow } from '@/types/rewards'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

export function RewardsAdminTable({ initialPositions }: { initialPositions: RewardPositionRow[] }) {
  const [positions, setPositions] = useState(initialPositions)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RewardPositionRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setError(null)
    setFormOpen(true)
  }

  function openEdit(position: RewardPositionRow) {
    setEditing(position)
    setError(null)
    setFormOpen(true)
  }

  async function handleSubmit(values: RewardFormValues) {
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(
        editing ? `/api/admin/rewards/${editing.id}` : '/api/admin/rewards',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Something went wrong')
        return
      }

      const body = await res.json()
      const saved: RewardPositionRow = body.position

      setPositions((prev) =>
        editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
      )
      setFormOpen(false)
    } catch {
      setError('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reward position? This cannot be undone.')) return
    setDeletingId(id)

    try {
      const res = await fetch(`/api/admin/rewards/${id}`, { method: 'DELETE' })
      if (res.ok) setPositions((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-brand-body text-sm">{positions.length} reward position(s)</p>
        <button
          onClick={openCreate}
          className="min-h-[44px] rounded bg-brand-amber px-4 py-2 text-sm font-semibold text-brand-bg hover:bg-brand-amberDark transition-colors cursor-pointer"
        >
          + New Position
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-bg text-brand-body">
            <tr>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Winner</th>
              <th className="px-4 py-3 font-medium">Vault</th>
              <th className="px-4 py-3 font-medium">Sponsored</th>
              <th className="px-4 py-3 font-medium">Yield</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-brand-muted">
                  No reward positions yet.
                </td>
              </tr>
            ) : (
              positions.map((position) => (
                <tr key={position.id} className="border-t border-brand-border">
                  <td className="px-4 py-3 text-brand-heading">S{position.session_id}</td>
                  <td className="px-4 py-3 text-brand-heading">{position.winner_label}</td>
                  <td className="px-4 py-3 text-brand-body">{position.vault_name}</td>
                  <td className="px-4 py-3 text-brand-body">
                    ${position.sponsored_amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-brand-green">
                    ${position.current_yield.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-brand-body whitespace-nowrap">
                    {formatDate(position.start_date)}
                  </td>
                  <td className="px-4 py-3 text-brand-body whitespace-nowrap">
                    {formatDate(position.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    <RewardStatusBadge status={position.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(position)}
                        className="text-brand-amber hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(position.id)}
                        disabled={deletingId === position.id}
                        className="text-red-400 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === position.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RewardForm
        position={editing}
        isOpen={formOpen}
        isSaving={isSaving}
        error={error}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
