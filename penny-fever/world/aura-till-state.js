export function tillStateFromStatus(data, opts = {}) {
  const mint = data?.mint && typeof data.mint === 'object' ? data.mint : {};
  const mintStatus = String(mint.status || '');
  const status = String(data?.status || '');
  const ownedRaw = Number(opts.owned);
  const owned = Number.isFinite(ownedRaw) && ownedRaw > 0 ? Math.floor(ownedRaw) : 0;
  const price = String(opts.price || '').trim();
  const canBuyAnother = !!opts.canBuyAnother;
  const priceLabel = price ? (/\bXRP\b/i.test(price) ? price : `${price} XRP`) : 'XRP';

  if (mintStatus === 'accepted') {
    const n = owned || 1;
    return {
      phase: 'accepted',
      showOpen: false,
      message: `Minted ✓ · You own ${n.toLocaleString('en-AU')}`,
      showBuyAnother: canBuyAnother,
      buyAnotherLabel: canBuyAnother ? `Buy another · ${priceLabel}` : '',
      showClose: true,
    };
  }
  if (mintStatus === 'offer' && (mint.accept_deep_link || mint.accept_qr)) {
    return {
      phase: 'accept',
      showOpen: true,
      deepLink: String(mint.accept_deep_link || '').trim(),
      qr: String(mint.accept_qr || '').trim(),
      message: mint.message || data.message || 'Signed. Open Xaman again to receive the card. We never hold guest keys.',
      showBuyAnother: false,
      buyAnotherLabel: '',
      showClose: false,
    };
  }
  if (status === 'signed' || ['queued', 'minting', 'reconciling', 'needs_minter', 'needs_regular_key', 'needs_minter_funding'].includes(mintStatus)) {
    return {
      phase: 'minting',
      showOpen: false,
      deepLink: '',
      qr: '',
      message: mint.message || data.message || 'Signed. Minting your card…',
      showBuyAnother: false,
      buyAnotherLabel: '',
      showClose: false,
    };
  }
  if (status === 'cancelled' || status === 'rejected') {
    return {
      phase: 'cancelled',
      showOpen: false,
      message: 'Cancelled · nothing charged',
      showBuyAnother: false,
      buyAnotherLabel: '',
      showClose: true,
      allowRetry: true,
    };
  }
  if (status === 'expired') {
    return {
      phase: 'expired',
      showOpen: false,
      message: data.message || 'This sign request closed.',
      showBuyAnother: false,
      buyAnotherLabel: '',
      showClose: true,
      allowRetry: true,
    };
  }
  // Paid status replies omit the original link while still waiting to sign.
  // Reuse only this open till's link, never after signing or a terminal state.
  const deepLink = String(data?.deep_link || (status === 'open' && (!mintStatus || mintStatus === 'waiting_sign') ? opts.openDeepLink : '') || '').trim();
  const qr = String(data?.qr || '').trim();
  return {
    phase: 'open',
    showOpen: !!(deepLink || qr),
    deepLink,
    qr,
    message: data?.message || 'Tap Open in Xaman on this phone, or scan the QR. We never hold guest keys.',
    showBuyAnother: false,
    buyAnotherLabel: '',
    showClose: false,
  };
}
