import type {
  PackageBrand,
  PackageCalculatedLine,
  PackageCalculationInput,
  PackageCalculationResult,
  PackageCatalogData,
  PackageChannel,
  PackageComponent,
  PackageMegapixel,
  PackageSelectionItem,
  PackageSystemType,
  PackageVariant,
} from '../types.ts';

/**
 * Checks whether a component is compatible with the selected systemType, channel, and megapixel.
 */
export function isComponentCompatible(
  component: PackageComponent,
  systemType: PackageSystemType,
  channel: PackageChannel,
  megapixel: PackageMegapixel,
): boolean {
  if (!component.active) return false;
  if (!component.systemTypes.includes(systemType)) return false;
  if (
    component.supportedChannels &&
    component.supportedChannels.length > 0 &&
    !component.supportedChannels.includes(channel)
  ) {
    return false;
  }
  if (
    component.supportedMegapixels &&
    component.supportedMegapixels.length > 0 &&
    !component.supportedMegapixels.includes(megapixel)
  ) {
    return false;
  }
  return true;
}

/**
 * Returns active variants for a given component, sorted by brand sortOrder.
 */
export function getCompatibleVariantsForComponent(
  componentId: string,
  catalog: PackageCatalogData,
): Array<{ variant: PackageVariant; brand: PackageBrand }> {
  const brandMap = new Map(catalog.brands.filter((b) => b.active).map((b) => [b.id, b]));
  return catalog.variants
    .filter((v) => v.active && v.componentId === componentId && brandMap.has(v.brandId))
    .map((variant) => ({ variant, brand: brandMap.get(variant.brandId)! }))
    .sort((a, b) => a.brand.sortOrder - b.brand.sortOrder);
}

/**
 * Estimates continuous H.265+ 24x7 recording days based on total storage TB, camera count, and megapixel.
 */
export function estimateRecordingDays(
  totalStorageTb: number,
  totalCameraCount: number,
  megapixel: PackageMegapixel,
): number | null {
  if (totalStorageTb <= 0 || totalCameraCount <= 0) return null;
  // Realistic H.265+ bitrate per camera (GB per day)
  const gbPerCamPerDay: Record<PackageMegapixel, number> = {
    '2MP': 14,
    '3MP': 19,
    '4MP': 25,
    '5MP': 32,
  };
  const usableGb = totalStorageTb * 910; // Formatted usable GB per TB
  const dailyGb = totalCameraCount * gbPerCamPerDay[megapixel];
  return Math.max(1, Math.round(usableGb / dailyGb));
}

/**
 * Pure, authoritative CCTV package calculation & validation engine.
 * Used identically on both client (instant live UX) and Express server (tamper-proof verification).
 */
export function calculatePackage(
  input: PackageCalculationInput,
  catalog: PackageCatalogData,
  options?: { includeCost?: boolean; enforceStock?: boolean },
): PackageCalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { config } = catalog;

  if (!config.enabled) {
    errors.push('CCTV Package Builder is currently paused by the administrator.');
  }
  if (input.systemType === 'HD' && !config.hdEnabled) {
    errors.push('HD CCTV Packages are currently disabled.');
  }
  if (input.systemType === 'IP' && !config.ipEnabled) {
    errors.push('IP CCTV Packages are currently disabled.');
  }
  if (!config.availableChannels.includes(input.channel)) {
    errors.push(`${input.channel}CH packages are not enabled.`);
  }
  if (!config.availableMegapixels.includes(input.megapixel)) {
    errors.push(`${input.megapixel} camera resolution is not enabled.`);
  }

  const componentMap = new Map(catalog.components.map((c) => [c.id, c]));
  const brandMap = new Map(catalog.brands.map((b) => [b.id, b]));
  const variantByKey = new Map(
    catalog.variants.map((v) => [`${v.componentId}::${v.brandId}`, v]),
  );

  // Merge duplicate (componentId, brandId) entries cleanly so installation/subtotal can never duplicate
  const mergedItems = new Map<string, PackageSelectionItem>();
  for (const raw of input.items) {
    const qty = Math.floor(Number(raw.quantity) || 0);
    if (qty <= 0) continue;
    const key = `${raw.componentId}::${raw.brandId}`;
    const existing = mergedItems.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      mergedItems.set(key, {
        componentId: raw.componentId,
        brandId: raw.brandId,
        quantity: qty,
      });
    }
  }

  const lines: PackageCalculatedLine[] = [];
  let totalCameraCount = 0;
  let domeCameraCount = 0;
  let bulletCameraCount = 0;
  let totalStorageTb = 0;
  let productSubtotalInr = 0;
  let estimatedCostInr = 0;

  for (const item of mergedItems.values()) {
    const component = componentMap.get(item.componentId);
    if (!component) {
      errors.push(`Selected component (${item.componentId}) does not exist.`);
      continue;
    }
    if (!isComponentCompatible(component, input.systemType, input.channel, input.megapixel)) {
      errors.push(
        `"${component.name}" is not compatible with ${input.systemType} ${input.channel}CH ${input.megapixel} packages.`,
      );
      continue;
    }

    const brand = brandMap.get(item.brandId);
    if (!brand || !brand.active) {
      errors.push(`Selected brand for "${component.name}" is unavailable.`);
      continue;
    }

    const variant = variantByKey.get(`${item.componentId}::${item.brandId}`);
    if (!variant || !variant.active) {
      errors.push(`"${component.name}" is not offered by ${brand.name}. Please choose another brand.`);
      continue;
    }

    if (item.quantity > 500) {
      errors.push(`Maximum allowed quantity per line item is 500 ("${component.name}").`);
      continue;
    }

    if (options?.enforceStock && item.quantity > variant.stockQty) {
      errors.push(
        `Insufficient stock for ${brand.name} ${component.name} (requested ${item.quantity}, available ${variant.stockQty}).`,
      );
    } else if (variant.stockQty <= 0) {
      warnings.push(`${brand.name} ${component.name} is currently out of stock — confirm lead time with TRINETRA.`);
    } else if (item.quantity > variant.stockQty) {
      warnings.push(
        `Requested ${item.quantity} × ${brand.name} ${component.name} exceeds immediate stock (${variant.stockQty} ready).`,
      );
    }

    const unitPriceInr = Math.max(0, Math.round(variant.sellingPriceInr));
    const lineTotalInr = unitPriceInr * item.quantity;
    productSubtotalInr += lineTotalInr;

    if (options?.includeCost && typeof variant.purchasePriceInr === 'number') {
      estimatedCostInr += Math.max(0, Math.round(variant.purchasePriceInr)) * item.quantity;
    }

    if (component.isCamera) {
      totalCameraCount += item.quantity;
      if (component.group === 'CAMERA_DOME') domeCameraCount += item.quantity;
      if (component.group === 'CAMERA_BULLET') bulletCameraCount += item.quantity;
    }

    if (component.group === 'HDD' && typeof component.storageTb === 'number') {
      totalStorageTb += component.storageTb * item.quantity;
    }

    lines.push({
      componentId: component.id,
      componentName: component.name,
      group: component.group,
      isCamera: component.isCamera,
      unitLabel: component.unitLabel,
      brandId: brand.id,
      brandName: brand.name,
      variantId: variant.id,
      modelCode: variant.modelCode,
      specs: variant.specs,
      warranty: variant.warranty,
      quantity: item.quantity,
      unitPriceInr,
      lineTotalInr,
      ...(options?.includeCost && typeof variant.purchasePriceInr === 'number'
        ? { purchasePriceInr: variant.purchasePriceInr }
        : {}),
      stockQty: variant.stockQty,
    });
  }

  // Channel capacity validation (strictly <= selected channel; fewer cameras allowed)
  if (totalCameraCount > input.channel) {
    errors.push(
      `Camera capacity exceeded: You selected ${totalCameraCount} cameras, which exceeds the ${input.channel}CH ${input.systemType === 'HD' ? 'DVR' : 'NVR'} limit (max ${input.channel} cameras). Reduce cameras or upgrade channel size.`,
    );
  }

  if (lines.length === 0) {
    warnings.push('Add cameras or components to calculate your custom CCTV package.');
  }

  // Exact automatic installation charge:
  // HD = totalCameraCount * hdInstallationPerCameraInr (default ₹500/cam)
  // IP = totalCameraCount * ipInstallationPerCameraInr (default ₹600/cam)
  // 0 cameras => ₹0 installation, never duplicated.
  const installationRatePerCameraInr =
    input.systemType === 'HD'
      ? Math.max(0, Math.round(config.hdInstallationPerCameraInr))
      : Math.max(0, Math.round(config.ipInstallationPerCameraInr));
  const installationTotalInr =
    totalCameraCount > 0 ? totalCameraCount * installationRatePerCameraInr : 0;

  // Optional Package Discount Evaluation
  let discountCode = '';
  let discountTitle = '';
  let discountInr = 0;
  const requestedCode = (input.discountCode || '').trim().toUpperCase();
  if (requestedCode) {
    const rule = config.discountRules.find(
      (r) =>
        r.active &&
        r.code.toUpperCase() === requestedCode &&
        r.systemTypes.includes(input.systemType),
    );
    if (!rule) {
      warnings.push(`Package promo code "${requestedCode}" is not valid for ${input.systemType} packages.`);
    } else if (productSubtotalInr < rule.minSubtotalInr) {
      warnings.push(
        `Minimum hardware subtotal of ₹${rule.minSubtotalInr.toLocaleString('en-IN')} required for ${rule.code}.`,
      );
    } else {
      discountCode = rule.code;
      discountTitle = rule.title;
      discountInr =
        rule.discountType === 'percent'
          ? Math.round((productSubtotalInr * Math.min(rule.discountValue, 90)) / 100)
          : Math.min(Math.round(rule.discountValue), productSubtotalInr);
    }
  }

  const taxableBase = Math.max(0, productSubtotalInr + installationTotalInr - discountInr);
  const taxEnabled = Boolean(config.taxEnabled);
  const taxRatePercent = taxEnabled ? Math.max(0, Math.min(50, Number(config.taxRatePercent) || 0)) : 0;
  const taxInr = taxEnabled ? Math.round((taxableBase * taxRatePercent) / 100) : 0;
  const grandTotalInr = Math.max(0, taxableBase + taxInr);

  const estimatedRecordingDays = estimateRecordingDays(
    totalStorageTb,
    totalCameraCount,
    input.megapixel,
  );

  return {
    valid: errors.length === 0 && lines.length > 0,
    errors,
    warnings,
    systemType: input.systemType,
    channel: input.channel,
    megapixel: input.megapixel,
    lines,
    totalCameraCount,
    domeCameraCount,
    bulletCameraCount,
    remainingCameraSlots: Math.max(0, input.channel - totalCameraCount),
    productSubtotalInr,
    installationRatePerCameraInr,
    installationTotalInr,
    discountCode,
    discountTitle,
    discountInr,
    taxEnabled,
    taxLabel: config.taxLabel || 'GST',
    taxRatePercent,
    taxInr,
    grandTotalInr,
    estimatedRecordingDays,
    totalStorageTb,
    ...(options?.includeCost
      ? {
          estimatedCostInr,
          estimatedProfitInr: Math.max(0, productSubtotalInr - discountInr - estimatedCostInr),
        }
      : {}),
  };
}

/**
 * Picks the best compatible brand for a component (preferring preferredBrandId if available).
 */
export function pickBrandForComponent(
  componentId: string,
  preferredBrandId: string | undefined,
  catalog: PackageCatalogData,
): string | null {
  const compatible = getCompatibleVariantsForComponent(componentId, catalog);
  if (compatible.length === 0) return null;
  if (preferredBrandId) {
    const match = compatible.find((c) => c.brand.id === preferredBrandId);
    if (match) return match.brand.id;
  }
  return compatible[0].brand.id;
}

/**
 * Generates a realistic, ready-to-install recommended CCTV package for any
 * HD/IP × 4CH/8CH/16CH/32CH × 2MP/3MP/4MP/5MP combination.
 */
export function buildRecommendedPackage(
  systemType: PackageSystemType,
  channel: PackageChannel,
  megapixel: PackageMegapixel,
  preferredBrandId: string | undefined,
  catalog: PackageCatalogData,
): PackageSelectionItem[] {
  const items: PackageSelectionItem[] = [];
  const push = (componentId: string, quantity: number) => {
    if (quantity <= 0) return;
    const comp = catalog.components.find((c) => c.id === componentId);
    if (!comp || !isComponentCompatible(comp, systemType, channel, megapixel)) return;
    const brandId = pickBrandForComponent(componentId, preferredBrandId, catalog);
    if (!brandId) return;
    items.push({ componentId, brandId, quantity });
  };

  const mpSlug = megapixel.toLowerCase();
  const domeCount = Math.floor(channel / 2);
  const bulletCount = channel - domeCount;

  if (systemType === 'HD') {
    push(`cmp-hd-dome-${mpSlug}`, domeCount);
    push(`cmp-hd-bullet-${mpSlug}`, bulletCount);
    push(`cmp-dvr-${channel}ch`, 1);
    push(`cmp-smps-${channel}ch`, 1);

    const hddId =
      channel === 4
        ? 'cmp-hdd-1tb'
        : channel === 8
          ? 'cmp-hdd-2tb'
          : channel === 16
            ? 'cmp-hdd-4tb'
            : 'cmp-hdd-8tb';
    push(hddId, 1);

    const rackId =
      channel === 4
        ? 'cmp-rack-2u'
        : channel === 8
          ? 'cmp-rack-4u'
          : channel === 16
            ? 'cmp-rack-6u'
            : 'cmp-rack-server-rack';
    push(rackId, 1);

    const cableRolls = channel === 4 ? 1 : channel === 8 ? 2 : channel === 16 ? 4 : 7;
    push('cmp-cable-3plus1-90m', cableRolls);
    push('cmp-acc-pvc-box', channel);
    push('cmp-acc-bnc', channel * 2);
    push('cmp-acc-dc-pin', channel);
  } else {
    push(`cmp-ip-dome-${mpSlug}`, domeCount);
    push(`cmp-ip-bullet-${mpSlug}`, bulletCount);
    push(`cmp-nvr-${channel}ch`, 1);

    if (channel === 4) {
      push('cmp-poe-4p', 1);
    } else if (channel === 8) {
      push('cmp-poe-8p', 1);
    } else if (channel === 16) {
      push('cmp-poe-16p', 1);
    } else {
      push('cmp-poe-16p', 2);
    }

    const hddId =
      channel === 4
        ? 'cmp-hdd-1tb'
        : channel === 8
          ? 'cmp-hdd-2tb'
          : channel === 16
            ? 'cmp-hdd-4tb'
            : 'cmp-hdd-8tb';
    push(hddId, 1);

    const rackId =
      channel === 4
        ? 'cmp-rack-2u'
        : channel === 8
          ? 'cmp-rack-4u'
          : channel === 16
            ? 'cmp-rack-6u'
            : 'cmp-rack-server-rack';
    push(rackId, 1);

    if (channel === 4) {
      push('cmp-cable-cat6-90m', 1);
    } else if (channel === 8) {
      push('cmp-cable-cat6-305m', 1);
    } else if (channel === 16) {
      push('cmp-cable-cat6-305m', 2);
    } else {
      push('cmp-cable-cat6-305m', 3);
    }

    push('cmp-acc-pvc-box', channel);
    push('cmp-acc-rj45', channel * 2 + 4);
  }

  return items;
}

export interface BrandComparisonRow {
  brand: PackageBrand;
  matchedItemCount: number;
  totalItemCount: number;
  productSubtotalInr: number;
  installationTotalInr: number;
  grandTotalInr: number;
  switchedItems: PackageSelectionItem[];
}

/**
 * Compares total package pricing across active brands by applying each brand to every
 * compatible item in the customer's current selection (retaining current brand for non-carried items).
 */
export function compareBrandsForPackage(
  input: PackageCalculationInput,
  catalog: PackageCatalogData,
): BrandComparisonRow[] {
  const activeItems = input.items.filter((i) => i.quantity > 0);
  if (activeItems.length === 0) return [];

  const rows: BrandComparisonRow[] = [];
  for (const brand of catalog.brands.filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder)) {
    let matchedItemCount = 0;
    const switchedItems: PackageSelectionItem[] = activeItems.map((item) => {
      const hasBrandVariant = catalog.variants.some(
        (v) => v.active && v.componentId === item.componentId && v.brandId === brand.id,
      );
      if (hasBrandVariant) {
        matchedItemCount += 1;
        return { ...item, brandId: brand.id };
      }
      return item;
    });

    if (matchedItemCount === 0) continue;

    const calc = calculatePackage(
      { ...input, items: switchedItems },
      catalog,
    );
    rows.push({
      brand,
      matchedItemCount,
      totalItemCount: activeItems.length,
      productSubtotalInr: calc.productSubtotalInr,
      installationTotalInr: calc.installationTotalInr,
      grandTotalInr: calc.grandTotalInr,
      switchedItems,
    });
  }

  return rows.sort((a, b) => a.grandTotalInr - b.grandTotalInr);
}
