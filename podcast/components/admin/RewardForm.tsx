'use client'

import { useEffect, useState } from 'react'
import type { RewardPositionRow, RewardStatus } from '@/types/rewards'

export interface RewardFormValues {
  session_id: 1 | 2 | 3
  winner_label: string
  vault_name: string
  sponsored_amount: number
  start_date: string
  end_date: string
  current_yield: number
  status: RewardStatus
}

function toFormValues(position: RewardPositionRow | null): RewardFormValues {
  if (!position) {
    return {
      session_id: 1,
      winner_label: '',
      vault_name: '',
      sponsored_amount: 50,
      start_date: '',
      end_date: '',
      current_yield: 0,
      status: 'active',
    }
  }

  return {
    session_id: position.session_id,
    winner_label: position.winner_label,
    vault_name: position.vault_name,
    sponsored_amount: position.sponsored_amount,
    start_date: position.start_date.slice(0, 10),
    end_date: position.end_date.slice(0, 10),
    current_yield: position.current_yield,
    status: position.status,
  }
}

interface RewardFormProps {
  position: RewardPositionRow | null
  isOpen: boolean
  isSaving: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: RewardFormValues) => void
}

export function RewardForm({
  position,
  isOpen,
  isSaving,
  error,
  onClose,
  onSubmit,
}: RewardFormProps) {
  const [values, setValues] = useState<RewardFormValues>(() => toFormValues(position))

  useEffect(() => {
    if (isOpen) setValues(toFormValues(position))
  }, [isOpen, position])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-brand-surface border border-brand-border rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-heading transition-colors text-xl leading-none"
        >
          ×
        </button>

        <h2 className="text-brand-heading font-bold text-lg pr-8">
          {position ? 'Edit reward position' : 'New reward position'}
        </h2>
        <div className="mt-3 mb-4 h-px bg-brand-border" />

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(values)
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-brand-body text-xs uppercase tracking-wide">Session</span>
            <select
              value={values.session_id}
              onChange={(e) =>
                setValues((v) => ({ ...v, session_id: Number(e.target.value) as 1 | 2 | 3 }))
              }
              className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading focus:border-brand-amber focus:outline-none"
            >
              <option value={1}>Session 1</option>
              <option value={2}>Session 2</option>
              <option value={3}>Session 3</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-brand-body text-xs uppercase tracking-wide">
              Winner name or wallet
            </span>
            <input
              type="text"
              required
              value={values.winner_label}
              onChange={(e) => setValues((v) => ({ ...v, winner_label: e.target.value }))}
              className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading placeholder:text-brand-muted focus:border-brand-amber focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-brand-body text-xs uppercase tracking-wide">Vault used</span>
            <input
              type="text"
              required
              value={values.vault_name}
              onChange={(e) => setValues((v) => ({ ...v, vault_name: e.target.value }))}
              className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading placeholder:text-brand-muted focus:border-brand-amber focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-brand-body text-xs uppercase tracking-wide">
                Sponsored $
              </span>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={values.sponsored_amount}
                onChange={(e) =>
                  setValues((v) => ({ ...v, sponsored_amount: Number(e.target.value) }))
                }
                className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading focus:border-brand-amber focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-brand-body text-xs uppercase tracking-wide">
                Yield generated $
              </span>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={values.current_yield}
                onChange={(e) =>
                  setValues((v) => ({ ...v, current_yield: Number(e.target.value) }))
                }
                className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading focus:border-brand-amber focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-brand-body text-xs uppercase tracking-wide">Start date</span>
              <input
                type="date"
                required
                value={values.start_date}
                onChange={(e) => setValues((v) => ({ ...v, start_date: e.target.value }))}
                className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading focus:border-brand-amber focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-brand-body text-xs uppercase tracking-wide">End date</span>
              <input
                type="date"
                required
                value={values.end_date}
                onChange={(e) => setValues((v) => ({ ...v, end_date: e.target.value }))}
                className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading focus:border-brand-amber focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-brand-body text-xs uppercase tracking-wide">Status</span>
            <select
              value={values.status}
              onChange={(e) =>
                setValues((v) => ({ ...v, status: e.target.value as RewardStatus }))
              }
              className="min-h-[44px] rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-heading focus:border-brand-amber focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
            </select>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[48px] rounded-lg bg-brand-amber text-brand-bg font-semibold text-sm hover:bg-brand-amberDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? 'Saving…' : position ? 'Save changes' : 'Create position'}
          </button>
        </form>
      </div>
    </div>
  )
}
