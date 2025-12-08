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
import {
  CreditCard,
  Zap,
  Check,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  ChevronRight,
  Star,
  Shield,
  Clock,
  Database,
  Brain,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return 'Gratis';
  const value = amount / 100;
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

function UsageBar({ used, limit, label, icon: Icon }: { used: number; limit: number; label: string; icon: any }) {
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isWarning = percentage > 70 && percentage <= 90;
  const isDanger = percentage > 90;

  return (
    <div className="p-4 rounded-xl bg-white border border-secondary-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isDanger ? 'bg-red-100 text-red-600' :
            isWarning ? 'bg-amber-100 text-amber-600' :
            'bg-primary-100 text-primary-600'
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-medium text-secondary-900">{label}</span>
        </div>
        <span className={cn(
          'text-sm font-semibold',
          isDanger ? 'text-red-600' :
          isWarning ? 'text-amber-600' :
          'text-secondary-600'
        )}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="w-full bg-secondary-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            'h-2.5 rounded-full transition-all duration-500',
            isDanger ? 'bg-gradient-to-r from-red-500 to-rose-500' :
            isWarning ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
            'bg-gradient-to-r from-primary-500 to-violet-500'
          )}
          style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    ACTIVE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Activo', icon: CheckCircle },
    TRIALING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Prueba', icon: Clock },
    PAST_DUE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Pago pendiente', icon: AlertCircle },
    CANCELLED: { bg: 'bg-secondary-100', text: 'text-secondary-700', label: 'Cancelado', icon: X },
    EXPIRED: { bg: 'bg-secondary-100', text: 'text-secondary-700', label: 'Expirado', icon: Clock },
    PAUSED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pausado', icon: Clock },
  };

  const config = statusConfig[status] || statusConfig.ACTIVE;
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
      config.bg,
      config.text
    )}>
      <Icon className="h-3.5 w-3.5" />
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
      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al crear la sesión de pago');
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
      alert('Error al cancelar la suscripción');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="mt-6 text-secondary-500 font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.id === subscription?.plan);

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                <Crown className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                Facturación y <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Plan</span>
              </h1>
              <p className="text-secondary-500 mt-0.5">
                Gestiona tu suscripción y método de pago
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Success/Cancel Messages */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-700 font-medium">Tu suscripción se ha activado correctamente.</p>
          </div>
        )}
        {cancelled && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 font-medium">El pago fue cancelado. Puedes intentar nuevamente.</p>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm overflow-hidden mb-8">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  {currentPlan?.id === 'FREE' ? (
                    <Zap className="h-7 w-7 text-white" />
                  ) : (
                    <Crown className="h-7 w-7 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-500">Plan actual</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {currentPlan?.name || 'Gratis'}
                    </span>
                    {subscription && <StatusBadge status={subscription.status} />}
                  </div>
                  {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Tu plan se cancelará el {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  )}
                  {subscription?.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
                    <p className="text-sm text-secondary-500 mt-2 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Próxima facturación: {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              </div>
              {subscription?.plan !== 'FREE' && !subscription?.cancelAtPeriodEnd && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancelar plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Usage */}
        {usage && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-secondary-400" />
              <h2 className="text-lg font-semibold text-secondary-900">Uso del mes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UsageBar
                used={usage.ragQueries.used}
                limit={usage.ragQueries.limit}
                label="Consultas al copiloto"
                icon={Brain}
              />
              <UsageBar
                used={usage.flashcards.used}
                limit={usage.flashcards.limit}
                label="Flashcards"
                icon={FileText}
              />
              <UsageBar
                used={usage.subjects.used}
                limit={usage.subjects.limit}
                label="Materias activas"
                icon={Star}
              />
              <UsageBar
                used={usage.storageMb.used}
                limit={usage.storageMb.limit}
                label="Almacenamiento (MB)"
                icon={Database}
              />
            </div>
            <p className="text-sm text-secondary-400 mt-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período: {formatDate(usage.periodStart)} - {formatDate(usage.periodEnd)}
            </p>
          </div>
        )}

        {/* Upgrade Options */}
        {subscription?.plan === 'FREE' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-secondary-900">Mejorar plan</h2>
              </div>

              {/* Billing Period Toggle */}
              <div className="flex items-center gap-2 p-1 bg-secondary-100 rounded-xl">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    billingPeriod === 'monthly'
                      ? 'bg-white text-secondary-900 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  )}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1',
                    billingPeriod === 'yearly'
                      ? 'bg-white text-secondary-900 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  )}
                >
                  Anual
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                    -17%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {plans.filter((p) => p.id !== 'FREE').map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl',
                    plan.popular
                      ? 'border-2 border-primary-500 shadow-lg shadow-primary-500/10'
                      : 'border border-secondary-200'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-500 to-violet-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                      Más popular
                    </div>
                  )}

                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          plan.popular
                            ? 'bg-gradient-to-br from-primary-500 to-violet-500'
                            : 'bg-gradient-to-br from-amber-500 to-orange-500'
                        )}>
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-secondary-900">{plan.name}</h3>
                          <p className="text-sm text-secondary-500">{plan.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-secondary-900">
                          ${billingPeriod === 'monthly'
                            ? plan.pricing.monthly.ars.toLocaleString()
                            : plan.pricing.yearly.ars.toLocaleString()}
                        </span>
                        <span className="text-secondary-500">
                          ARS/{billingPeriod === 'monthly' ? 'mes' : 'año'}
                        </span>
                      </div>
                      {billingPeriod === 'yearly' && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">
                          Ahorras ${((plan.pricing.monthly.ars * 12) - plan.pricing.yearly.ars).toLocaleString()} ARS al año
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="text-sm text-secondary-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleUpgrade(plan.id, 'MERCADOPAGO')}
                        disabled={checkoutLoading === plan.id}
                        className={cn(
                          'w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200',
                          plan.popular
                            ? 'bg-gradient-to-r from-primary-500 to-violet-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30'
                        )}
                      >
                        {checkoutLoading === plan.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            Pagar con Mercado Pago
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleUpgrade(plan.id, 'LEMONSQUEEZY')}
                        disabled={checkoutLoading === plan.id}
                        className="w-full py-3 px-4 rounded-xl font-medium bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Pagar con tarjeta (USD)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-secondary-100">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-secondary-400" />
                Historial de pagos
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-secondary-500 bg-secondary-50">
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium">Monto</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                    <th className="px-6 py-3 font-medium">Método</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 text-secondary-900">{formatDate(payment.createdAt)}</td>
                      <td className="px-6 py-4 font-medium text-secondary-900">
                        {formatPrice(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                          payment.status === 'SUCCEEDED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-secondary-100 text-secondary-700'
                        )}>
                          {payment.status === 'SUCCEEDED' && <CheckCircle className="h-3 w-3" />}
                          {payment.status === 'SUCCEEDED' ? 'Pagado' : payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-secondary-600">
                        {payment.provider === 'MERCADOPAGO' ? 'Mercado Pago' : 'Tarjeta'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 text-center mb-2">
              Cancelar suscripción
            </h3>
            <p className="text-secondary-600 text-center mb-6">
              Tu suscripción seguirá activa hasta el final del período de facturación actual.
              Después de eso, tu cuenta volverá al plan gratuito.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors"
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
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
