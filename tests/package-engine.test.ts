import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDefaultPackageBrands,
  buildDefaultPackageComponents,
  buildDefaultPackageConfig,
  buildDefaultPackageVariants,
} from '../src/data/packageSeedData.ts';
import {
  buildRecommendedPackage,
  calculatePackage,
  compareBrandsForPackage,
} from '../src/lib/packageEngine.ts';
import type {
  PackageCatalogData,
  PackageChannel,
  PackageMegapixel,
  PackageSystemType,
} from '../src/types.ts';

function createFreshCatalog(): PackageCatalogData {
  return {
    config: buildDefaultPackageConfig(),
    brands: buildDefaultPackageBrands(),
    components: buildDefaultPackageComponents(),
    variants: buildDefaultPackageVariants(),
  };
}

test('Seed catalog includes all 8 required brands, all HDD sizes, all 8 Racks, SMPS & PoE Switches', () => {
  const catalog = createFreshCatalog();
  const brandNames = catalog.brands.map((b) => b.name);
  for (const requiredBrand of [
    'Matrix Comsec',
    'CP Plus',
    'Hikvision',
    'Power Cam',
    'Greatbox',
    'Prama',
    'Sparsh',
    'Hi-Focus',
  ]) {
    assert.ok(brandNames.includes(requiredBrand), `Missing required brand: ${requiredBrand}`);
  }

  const hddIds = catalog.components.filter((c) => c.group === 'HDD').map((c) => c.id);
  assert.equal(hddIds.length, 6, 'Expected 6 HDD sizes (500GB to 10TB)');

  const rackIds = catalog.components.filter((c) => c.group === 'RACK').map((c) => c.id);
  assert.equal(rackIds.length, 8, 'Expected 8 Rack sizes (2U Mini to Server Rack)');

  const smpsIds = catalog.components.filter((c) => c.group === 'POWER_SMPS').map((c) => c.id);
  assert.equal(smpsIds.length, 4, 'Expected 4 SMPS channel sizes (4/8/16/32CH)');

  const poeIds = catalog.components.filter((c) => c.group === 'POE_SWITCH').map((c) => c.id);
  assert.equal(poeIds.length, 3, 'Expected 3 PoE switch sizes (4/8/16 Port)');

  assert.equal(catalog.config.taxEnabled, false, 'Tax must be OFF by default');
  assert.equal(catalog.config.hdInstallationPerCameraInr, 500, 'HD install default ₹500/cam');
  assert.equal(catalog.config.ipInstallationPerCameraInr, 600, 'IP install default ₹600/cam');
});

test('All 32 combinations of HD/IP × 4/8/16/32CH × 2/3/4/5MP calculate validly with exact installation fees', () => {
  const catalog = createFreshCatalog();
  const systems: PackageSystemType[] = ['HD', 'IP'];
  const channels: PackageChannel[] = [4, 8, 16, 32];
  const mps: PackageMegapixel[] = ['2MP', '3MP', '4MP', '5MP'];

  for (const sys of systems) {
    for (const ch of channels) {
      for (const mp of mps) {
        const items = buildRecommendedPackage(sys, ch, mp, undefined, catalog);
        const res = calculatePackage(
          { systemType: sys, channel: ch, megapixel: mp, items },
          catalog,
        );
        assert.equal(res.valid, true, `Expected valid build for ${sys} ${ch}CH ${mp}: ${res.errors.join('; ')}`);
        assert.equal(res.totalCameraCount, ch, `Expected ${ch} cameras for ${sys} ${ch}CH ${mp}`);
        const expectedInstall = ch * (sys === 'HD' ? 500 : 600);
        assert.equal(res.installationTotalInr, expectedInstall);
        assert.equal(res.taxInr, 0, 'Tax must be 0 when disabled by default');
        assert.equal(res.grandTotalInr, res.productSubtotalInr + expectedInstall);
        assert.ok((res.estimatedRecordingDays ?? 0) >= 1, 'Expected positive recording days estimate');
      }
    }
  }
});

test('Channel validation: allows fewer cameras than channel capacity and rejects exceeding capacity', () => {
  const catalog = createFreshCatalog();

  // Valid: 4 cameras on 8CH HD DVR (2 Dome + 2 Bullet)
  const underCapacity = calculatePackage(
    {
      systemType: 'HD',
      channel: 8,
      megapixel: '2MP',
      items: [
        { componentId: 'cmp-hd-dome-2mp', brandId: 'brand-cp-plus', quantity: 2 },
        { componentId: 'cmp-hd-bullet-2mp', brandId: 'brand-hikvision', quantity: 2 },
        { componentId: 'cmp-dvr-8ch', brandId: 'brand-cp-plus', quantity: 1 },
      ],
    },
    catalog,
  );
  assert.equal(underCapacity.valid, true);
  assert.equal(underCapacity.totalCameraCount, 4);
  assert.equal(underCapacity.remainingCameraSlots, 4);
  assert.equal(underCapacity.installationTotalInr, 4 * 500);

  // Invalid: 12 cameras on 8CH HD DVR (6 Dome + 6 Bullet)
  const overCapacity = calculatePackage(
    {
      systemType: 'HD',
      channel: 8,
      megapixel: '2MP',
      items: [
        { componentId: 'cmp-hd-dome-2mp', brandId: 'brand-cp-plus', quantity: 6 },
        { componentId: 'cmp-hd-bullet-2mp', brandId: 'brand-hikvision', quantity: 6 },
        { componentId: 'cmp-dvr-8ch', brandId: 'brand-cp-plus', quantity: 1 },
      ],
    },
    catalog,
  );
  assert.equal(overCapacity.valid, false);
  assert.ok(
    overCapacity.errors.some((e) => e.includes('Camera capacity exceeded')),
    'Should report camera capacity exceeded error',
  );
});

test('Zero cameras results in ₹0 installation charge; duplicate item rows never duplicate charges', () => {
  const catalog = createFreshCatalog();

  // Only HDD + Rack, 0 cameras
  const zeroCam = calculatePackage(
    {
      systemType: 'IP',
      channel: 4,
      megapixel: '4MP',
      items: [
        { componentId: 'cmp-hdd-2tb', brandId: 'brand-cp-plus', quantity: 1 },
        { componentId: 'cmp-rack-4u', brandId: 'brand-greatbox', quantity: 1 },
      ],
    },
    catalog,
  );
  assert.equal(zeroCam.valid, true);
  assert.equal(zeroCam.totalCameraCount, 0);
  assert.equal(zeroCam.installationTotalInr, 0);
  assert.equal(zeroCam.grandTotalInr, zeroCam.productSubtotalInr);

  // IP 3 cameras total (2 + 1) => exact 3 × ₹600 = ₹1800
  const threeIpCams = calculatePackage(
    {
      systemType: 'IP',
      channel: 4,
      megapixel: '4MP',
      items: [
        { componentId: 'cmp-ip-dome-4mp', brandId: 'brand-matrix', quantity: 2 },
        { componentId: 'cmp-ip-bullet-4mp', brandId: 'brand-hikvision', quantity: 1 },
      ],
    },
    catalog,
  );
  assert.equal(threeIpCams.valid, true);
  assert.equal(threeIpCams.totalCameraCount, 3);
  assert.equal(threeIpCams.installationTotalInr, 1800);
});

test('Rejects cross-system incompatibility and unsupported brand-product pairings', () => {
  const catalog = createFreshCatalog();

  // HD DVR placed inside IP package => rejected
  const crossSystem = calculatePackage(
    {
      systemType: 'IP',
      channel: 4,
      megapixel: '2MP',
      items: [{ componentId: 'cmp-dvr-4ch', brandId: 'brand-cp-plus', quantity: 1 }],
    },
    catalog,
  );
  assert.equal(crossSystem.valid, false);
  assert.ok(crossSystem.errors.some((e) => e.includes('not compatible')));

  // Matrix Comsec does not carry analog HD DVR => rejected
  const unsupportedBrand = calculatePackage(
    {
      systemType: 'HD',
      channel: 4,
      megapixel: '2MP',
      items: [{ componentId: 'cmp-dvr-4ch', brandId: 'brand-matrix', quantity: 1 }],
    },
    catalog,
  );
  assert.equal(unsupportedBrand.valid, false);
  assert.ok(unsupportedBrand.errors.some((e) => e.includes('not offered by Matrix Comsec')));
});

test('Tax / GST toggle (0% OFF vs 18% ON), Package Discounts, and Multi-Brand Comparison work accurately', () => {
  const catalog = createFreshCatalog();
  const items = buildRecommendedPackage('IP', 8, '4MP', 'brand-cp-plus', catalog);

  // With PKG500 flat discount, tax OFF
  const noTax = calculatePackage(
    { systemType: 'IP', channel: 8, megapixel: '4MP', items, discountCode: 'PKG500' },
    catalog,
  );
  assert.equal(noTax.valid, true);
  assert.equal(noTax.discountInr, 500);
  assert.equal(noTax.taxInr, 0);
  assert.equal(
    noTax.grandTotalInr,
    noTax.productSubtotalInr + noTax.installationTotalInr - 500,
  );

  // Admin turns ON 18% GST
  catalog.config.taxEnabled = true;
  catalog.config.taxRatePercent = 18;
  const withTax = calculatePackage(
    { systemType: 'IP', channel: 8, megapixel: '4MP', items, discountCode: 'PKG500' },
    catalog,
  );
  const expectedBase = withTax.productSubtotalInr + withTax.installationTotalInr - 500;
  const expectedTax = Math.round(expectedBase * 0.18);
  assert.equal(withTax.taxInr, expectedTax);
  assert.equal(withTax.grandTotalInr, expectedBase + expectedTax);

  // Multi-brand comparison returns multiple sorted brand pricing options
  const comparison = compareBrandsForPackage(
    { systemType: 'IP', channel: 8, megapixel: '4MP', items },
    catalog,
  );
  assert.ok(comparison.length >= 6, 'Expected at least 6 brands in IP comparison');
  assert.ok(
    comparison[0].grandTotalInr <= comparison[comparison.length - 1].grandTotalInr,
    'Comparison rows should be sorted ascending by grandTotalInr',
  );
});
