'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { billing, Plan, PlanType } from '@/lib/api';

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function formatPrice(amount: number, currency: 'ars' | 'usd'): string {
  if (amount === 0) return 'Gratis';
  if (currency === 'ars') {
    return `$${amount.toLocaleString('es-AR')} ARS`;
  }
  return `$${amount} USD`;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'ars' | 'usd'>('ars');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billing.getPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getPrice = (plan: Plan): string => {
    const price = plan.pricing[billingPeriod][currency];
    return formatPrice(price, currency);
  };

  const getMonthlyEquivalent = (plan: Plan): string | null => {
    if (billingPeriod !== 'yearly' || plan.pricing.yearly[currency] === 0) return null;
    const monthlyEquivalent = Math.round(plan.pricing.yearly[currency] / 12);
    return formatPrice(monthlyEquivalent, currency);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            CampusMind
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Iniciar sesion
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes y precios
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan perfecto para tu nivel de estudio. Todos incluyen 7 dias de prueba gratis.
          </p>
        </div>

        {/* Toggles */}
        <div className="flex justify-center gap-8 mb-12">
          {/* Billing Period Toggle */}
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
              Anual
              <span className="ml-1 text-green-600 text-xs">-17%</span>
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrency('ars')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currency === 'ars'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ARS
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currency === 'usd'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-indigo-600 relative' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-2">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {getPrice(plan)}
                  </span>
                  {plan.pricing[billingPeriod][currency] > 0 && (
                    <span className="text-gray-600">
                      /{billingPeriod === 'monthly' ? 'mes' : 'ano'}
                    </span>
                  )}
                  {getMonthlyEquivalent(plan) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {getMonthlyEquivalent(plan)}/mes
                    </p>
                  )}
                </div>
                <Link
                  href={plan.id === 'FREE' ? '/register' : `/register?plan=${plan.id}`}
                  className={`block w-full mt-8 py-3 px-4 rounded-lg text-center font-medium transition-colors ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.id === 'FREE' ? 'Comenzar gratis' : 'Comenzar prueba gratis'}
                </Link>
              </div>
              <div className="border-t border-gray-100 px-8 py-6">
                <h4 className="font-medium text-gray-900 mb-4">Incluye:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ or Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Paga con{' '}
            <span className="font-medium">Mercado Pago</span> (Argentina) o{' '}
            <span className="font-medium">tarjeta internacional</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Cancela cuando quieras. Sin compromisos.
          </p>
        </div>
      </main>
    </div>
  );
}
