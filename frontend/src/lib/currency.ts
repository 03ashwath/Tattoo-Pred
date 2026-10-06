'use client';

import { useEffect, useState } from 'react';
import countryToCurrency from 'country-to-currency';

export type CurrencyCode = (typeof countryToCurrency)[keyof typeof countryToCurrency];

export type ExchangeRates = Record<string, number>;

export function useUsdExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchUsdExchangeRates()
      .then((latestRates) => {
        if (isMounted) setRates(latestRates);
      })
      .catch((error: unknown) => {
        console.error('Unable to load live currency exchange rates', error);
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { rates, isLoaded, hasError };
}

export async function fetchUsdExchangeRates(): Promise<ExchangeRates> {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  if (!response.ok) {
    throw new Error(`Exchange-rate service returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as { rates?: Record<string, unknown> };
  if (!data.rates || typeof data.rates.USD !== 'number') {
    throw new Error('Exchange-rate service returned an invalid rates table');
  }

  const rates = Object.fromEntries(
    Object.entries(data.rates).filter((entry): entry is [string, number] =>
      typeof entry[1] === 'number' && Number.isFinite(entry[1])
    )
  );

  return rates;
}

export function currencyForCountry(countryCode: string | undefined): CurrencyCode {
  const normalizedCode = countryCode?.toUpperCase();
  if (normalizedCode && Object.hasOwn(countryToCurrency, normalizedCode)) {
    return countryToCurrency[normalizedCode as keyof typeof countryToCurrency];
  }
  return 'USD';
}

export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(currencyCode: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).formatToParts(0).find((part) => part.type === 'currency')?.value ?? currencyCode;
}
