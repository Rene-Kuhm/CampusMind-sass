'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  billing,
  Plan,
  PlanType,
  Subscription,
  Usage,
  Payment,
  PaymentProvider,
} from '@/lib/api';

function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return 'Gratis';
  const value = amount / 100; // Convert from cents
  if (currency === 'ARS') {
    return `$${value.toLocaleString('es-AR')} ARS`;
  }
  return `$${value} USD`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === -1;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">
          {used} / {isUnlimited ? 'ilimitado' : limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-indigo-600'
          }`}
          style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
    TRIALING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Prueba' },
    PAST_DUE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Pago pendiente' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' },
    EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expirado' },
    PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pausado' },
  };

  const config = statusConfig[status] || statusConfig.ACTIVE;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export default function BillingSettingsPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Check for success/cancel query params
  const success = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    loadBillingData();
  }, [isAuthenticated, token]);

  const loadBillingData = async () => {
    if (!token) return;

    try {
      const [plansData, subscriptionData, usageData, paymentsData] = await Promise.all([
        billing.getPlans(),
        billing.getSubscription(token),
        billing.getUsage(token),
        billing.getPaymentHistory(token),
      ]);

      setPlans(plansData);
      setSubscription(subscriptionData);
      setUsage(usageData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: PlanType, provider: PaymentProvider) => {
    if (!token) return;

    setCheckoutLoading(plan);
    try {
      const checkout = await billing.createCheckout(token, {
        plan,
        provider,
        billingPeriod,
      });

      // Redirect to checkout
      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al crear la sesion de pago');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!token) return;

    try {
      await billing.cancelSubscription(token, true);
      await loadBillingData();
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Error al cancelar la suscripcion');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.id === subscription?.plan);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Facturacion y Plan</h1>

      {/* Success/Cancel Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">Tu suscripcion se ha activado correctamente.</p>
        </div>
      )}
      {cancelled && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">El pago fue cancelado. Puedes intentar nuevamente.</p>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plan actual</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold text-indigo-600">{currentPlan?.name || 'Gratis'}</span>
              {subscription && <StatusBadge status={subscription.status} />}
            </div>
            {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
              <p className="text-sm text-red-600 mt-2">
                Tu plan se cancelara el {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {subscription?.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-gray-600 mt-2">
                Proxima facturacion: {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
          </div>
          {subscription?.plan !== 'FREE' && !subscription?.cancelAtPeriodEnd && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Cancelar plan
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uso del mes</h2>
          <UsageBar used={usage.ragQueries.used} limit={usage.ragQueries.limit} label="Consultas al copiloto" />
          <UsageBar used={usage.flashcards.used} limit={usage.flashcards.limit} label="Flashcards" />
          <UsageBar used={usage.subjects.used} limit={usage.subjects.limit} label="Materias activas" />
          <UsageBar used={usage.storageMb.used} limit={usage.storageMb.limit} label="Almacenamiento (MB)" />
          <p className="text-sm text-gray-500 mt-4">
            Periodo: {formatDate(usage.periodStart)} - {formatDate(usage.periodEnd)}
          </p>
        </div>
      )}

      {/* Upgrade Options */}
      {subscription?.plan === 'FREE' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mejorar plan</h2>

          {/* Billing Period Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-600">Facturacion:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual (-17%)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.filter((p) => p.id !== 'FREE').map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg border-2 p-6 ${
                  plan.popular ? 'border-indigo-600' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>
                  {plan.popular && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    ${billingPeriod === 'monthly'
                      ? plan.pricing.monthly.ars.toLocaleString()
                      : plan.pricing.yearly.ars.toLocaleString()}
                  </span>
                  <span className="text-gray-600">
                    {' '}ARS/{billingPeriod === 'monthly' ? 'mes' : 'ano'}
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <p key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </p>
                  ))}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleUpgrade(plan.id, 'MERCADOPAGO')}
                    disabled={checkoutLoading === plan.id}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkoutLoading === plan.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Pagar con Mercado Pago</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleUpgrade(plan.id, 'LEMONSQUEEZY')}
                    disabled={checkoutLoading === plan.id}
                    className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Pagar con tarjeta (USD)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de pagos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Monto</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2">Metodo</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-3">{formatDate(payment.createdAt)}</td>
                    <td className="py-3">{formatPrice(payment.amount, payment.currency)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status === 'SUCCEEDED' ? 'Pagado' : payment.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {payment.provider === 'MERCADOPAGO' ? 'Mercado Pago' : 'Tarjeta'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancelar suscripcion</h3>
            <p className="text-gray-600 mb-6">
              Tu suscripcion seguira activa hasta el final del periodo de facturacion actual.
              Despues de eso, tu cuenta volvera al plan gratuito.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
              >
                Cancelar plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
