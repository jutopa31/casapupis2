'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HeartHandshake, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { weddingConfig } from '@/config/wedding'

export default function AgradecimientoPage() {
  const { bankDetails, thankYouText, collaborationText } = weddingConfig
  const [copied, setCopied] = useState<string | null>(null)

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const showBankDetails =
    bankDetails.alias && !bankDetails.alias.startsWith('[')

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Agradecimiento
        </motion.h1>
      </header>

      <div className="mx-auto mt-6 max-w-lg px-4 space-y-6">
        {/* Thank you message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gold/10 bg-white p-6 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
            <HeartHandshake className="h-7 w-7 text-gold" />
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {thankYouText}
          </p>
        </motion.div>

        {/* Collaboration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gold/10 bg-white p-6 shadow-sm"
        >
          <h2 className="font-serif text-xl text-gold text-center">
            Colaboracion
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-text-secondary">
            {collaborationText}
          </p>

          {showBankDetails && (
            <div className="mt-6 space-y-4">
              {/* Alias */}
              <div className="flex items-center justify-between rounded-xl bg-offwhite p-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                    Alias
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-text-primary">
                    {bankDetails.alias}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankDetails.alias, 'alias')}
                  className="rounded-lg p-2 text-gold transition-colors hover:bg-gold/10"
                >
                  {copied === 'alias' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* CBU */}
              {bankDetails.cbu && (
                <div className="flex items-center justify-between rounded-xl bg-offwhite p-4">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                      CBU
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-text-primary break-all">
                      {bankDetails.cbu}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankDetails.cbu, 'cbu')}
                    className="rounded-lg p-2 text-gold transition-colors hover:bg-gold/10"
                  >
                    {copied === 'cbu' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}

              {/* Titular */}
              <p className="text-center text-xs text-text-secondary">
                Titular: {bankDetails.holderName}
              </p>

              {/* QR */}
              <div className="flex justify-center pt-2">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gold/10">
                  <QRCodeSVG
                    value={bankDetails.alias}
                    size={160}
                    bgColor="#FFFFFF"
                    fgColor="#2D2D2D"
                  />
                </div>
              </div>
            </div>
          )}

          {!showBankDetails && (
            <div className="mt-6 rounded-xl bg-offwhite p-6 text-center">
              <p className="text-sm text-stone-400">
                Datos bancarios pendientes de configurar
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
