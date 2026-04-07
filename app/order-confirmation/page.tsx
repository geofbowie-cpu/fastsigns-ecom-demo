"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { brand } from "@/brand.config"
import { CheckCircle, Clock, Package, Truck, ArrowRight, Download } from "lucide-react"

function OrderConfirmationContent() {
  const params = useSearchParams()
  const po = params.get("po") || `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  const approver = params.get("approver") || brand.approvers[0]
  const total = params.get("total") || "0"
  const isAutoApprove = approver.toLowerCase().includes("auto")

  const steps = [
    {
      icon: <CheckCircle size={18} />,
      label: "Order Submitted",
      desc: `PO ${po} received`,
      status: "done",
    },
    {
      icon: <Clock size={18} />,
      label: isAutoApprove ? "Auto-Approved" : "Pending Approval",
      desc: isAutoApprove ? "Under $500 threshold" : `Routed to ${approver}`,
      status: isAutoApprove ? "done" : "active",
    },
    {
      icon: <Package size={18} />,
      label: "In Production",
      desc: "Design proof + production",
      status: "upcoming",
    },
    {
      icon: <Truck size={18} />,
      label: "Shipped",
      desc: "Tracking number provided",
      status: "upcoming",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      {/* Success header */}
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `${brand.primaryColor}15` }}
        >
          <CheckCircle size={32} style={{ color: brand.primaryColor }} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Order Submitted</h1>
        <p className="text-gray-500">
          {isAutoApprove
            ? "Your order has been auto-approved and is entering production."
            : `Your order is pending approval from ${approver.split("(")[0].trim()}.`}
        </p>
      </div>

      {/* Order summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">PO Number</div>
            <div className="font-bold text-gray-900 font-mono">{po}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order Total</div>
            <div className="font-bold text-gray-900">${parseInt(total).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isAutoApprove ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isAutoApprove ? "bg-green-500" : "bg-yellow-500"}`} />
              {isAutoApprove ? "Approved" : "Pending Approval"}
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            What happens next
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[17px] top-5 bottom-5 w-0.5 bg-gray-100" />

            <div className="space-y-5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                      step.status === "done"
                        ? "border-transparent text-white"
                        : step.status === "active"
                        ? "border-2 text-white"
                        : "bg-white border-gray-200 text-gray-300"
                    }`}
                    style={
                      step.status === "done"
                        ? { backgroundColor: brand.primaryColor }
                        : step.status === "active"
                        ? { backgroundColor: brand.accentColor, borderColor: brand.accentColor, color: "#000" }
                        : {}
                    }
                  >
                    {step.icon}
                  </div>
                  <div className="pt-1">
                    <div
                      className={`text-sm font-semibold ${
                        step.status === "upcoming" ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        step.status === "upcoming" ? "text-gray-200" : "text-gray-400"
                      }`}
                    >
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Procurement note */}
      {brand.procurementSystem && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-8 flex items-start gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block mt-1.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            This order has been logged in <strong>{brand.procurementLabel}</strong> under PO{" "}
            <span className="font-mono font-bold">{po}</span>. The invoice will be
            attached automatically once the order ships. Contact{" "}
            <a href={`mailto:${brand.supportEmail}`} className="underline" style={{ color: brand.primaryColor }}>
              {brand.supportEmail}
            </a>{" "}
            for any changes.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Continue Shopping <ArrowRight size={15} />
        </Link>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => window.print()}
        >
          <Download size={15} /> Save Order Details
        </button>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-400 text-center">Loading…</div>}>
      <OrderConfirmationContent />
    </Suspense>
  )
}
