const revenueCatApiKey = 'appl_LSMObGgWoJiskSarRbWUkBbNJOw';

let configuredUserId = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAlreadyConfiguredError = (error) => {
  const message = (error?.message || '').toLowerCase();
  return message.includes('already configured') || message.includes('already been configured');
};

const withRetries = async (task, attempts = 3, waitMs = 450) => {
  let lastError = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await sleep(waitMs * (index + 1));
      }
    }
  }

  throw lastError;
};

const isNativeIos = () =>
  typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.() &&
  window.Capacitor?.getPlatform?.() === 'ios';

const getCurrentOffering = (offerings) => {
  if (offerings?.current) return offerings.current;
  const allOfferings = Object.values(offerings?.all || {});
  return allOfferings[0] || null;
};

const getPurchasesClient = async () => {
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  return Purchases;
};

export const isPremiumPlatformSupported = () => isNativeIos();

export const hasRevenueCatKey = () => Boolean(revenueCatApiKey);

export const hasActivePremiumEntitlement = (customerInfo) =>
  Object.keys(customerInfo?.entitlements?.active || {}).length > 0;

export const initializePremiumSession = async (appUserID) => {
  console.log('DEBUG: RevenueCat API Key is:', revenueCatApiKey ? 'FOUND' : 'MISSING');

  if (!isNativeIos()) {
    return {
      isAvailable: false,
      reason: 'unsupported_platform',
      packages: [],
      customerInfo: null,
    };
  }

  if (!revenueCatApiKey) {
    return {
      isAvailable: false,
      reason: 'missing_api_key',
      packages: [],
      customerInfo: null,
    };
  }

  try {
    const Purchases = await getPurchasesClient();

    // Cache temizle
    try {
      await Purchases.invalidateCustomerInfoCache();
    } catch (e) {
      console.log('Cache invalidate info:', e);
    }

    if (!configuredUserId) {
      try {
        await Purchases.configure({ apiKey: revenueCatApiKey, appUserID });
        configuredUserId = appUserID;
      } catch (error) {
        if (!isAlreadyConfiguredError(error)) {
          throw error;
        }
        configuredUserId = appUserID || configuredUserId || 'anonymous';
      }
    } else if (configuredUserId !== appUserID) {
      await Purchases.logIn({ appUserID });
      configuredUserId = appUserID;
    }

    const [customerInfoResult, offerings] = await Promise.all([
      withRetries(() => Purchases.getCustomerInfo(), 2),
      withRetries(() => Purchases.getOfferings(), 3),
    ]);

    // Debug: Offerings kontrolü
    alert('RC Check: ' + (offerings?.current ? 'Paket Geldi' : 'Paket BOS'));

    const customerInfo = customerInfoResult?.customerInfo || customerInfoResult;

    const currentOffering = getCurrentOffering(offerings);

    return {
      isAvailable: true,
      reason: null,
      packages: currentOffering?.availablePackages || [],
      customerInfo,
    };
  } catch (error) {
    alert('Hata Mesaji: ' + error.message);
    throw error;
  }
};

export const purchasePremiumPackage = async (aPackage) => {
  const Purchases = await getPurchasesClient();
  return Purchases.purchasePackage({ aPackage });
};

export const restorePremiumPurchases = async () => {
  const Purchases = await getPurchasesClient();
  return Purchases.restorePurchases();
};
