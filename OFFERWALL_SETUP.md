# CashFlow 2.0 — Offerwall Setup Guide

## Overview

Your site is pre-wired to accept 12 offerwalls. For each one you need to:

1. **Create an account** on the offerwall platform
2. **Set your postback URL** in their dashboard
3. **Add your keys** to Vercel environment variables

Coins are credited automatically via server-to-server postback when users complete offers.

---

## Universal Postback URL Template

When setting up each offerwall, use this as your postback URL (replace `YOUR-DOMAIN` with your actual domain and `YOUR_SECRET` with the secret you set in Vercel):

```
https://YOUR-DOMAIN.com/api/postback?wall=WALL_NAME&user_id={user_id}&amount={points}&txn_id={transaction_id}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_SECRET
```

Each offerwall uses different placeholder macros — see the specific instructions below.

---

## 1. AdGate Media
- **Sign up**: https://adgatemedia.com (acquired by Prodege — contact them directly or use their main site)
- **Type**: Offers, surveys, app installs
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=adgate&user_id={s1}&amount={points}&txn_id={transaction_id}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_ADGATE_SECRET
  ```
- **Env vars**:
  - `ADGATE_SECRET` → your postback secret key
  - `NEXT_PUBLIC_ADGATE_WALL_CODE` → your wall code (from embed code, e.g. `oDQfo3`)

## 2. AdGem
- **Sign up**: https://adgem.com → click "Sign up" top-right, then "Create Account"
- **Type**: Games, app installs, high CPI
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=adgem&user_id={player_id}&amount={amount}&txn_id={transaction_id}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_ADGEM_SECRET
  ```
- **Env vars**:
  - `ADGEM_SECRET` → your postback secret
  - `NEXT_PUBLIC_ADGEM_APP_ID` → your app ID

## 3. OfferToro
- **Sign up**: https://www.offertoro.com/publishers/sign-up
- **Type**: Global offers, surveys
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=offertoro&user_id={user_id}&amount={amount}&txn_id={oid}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_OFFERTORO_SECRET
  ```
- **Env vars**:
  - `OFFERTORO_SECRET` → your secret key
  - `NEXT_PUBLIC_OFFERTORO_PUB_ID` → your publisher ID
  - `NEXT_PUBLIC_OFFERTORO_APP_ID` → your app ID

## 4. Lootably
- **Sign up**: https://dashboard.lootably.com/authentication/login (click "Register" or contact Lootably)
- **Type**: Surveys, video offers
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=lootably&user_id={sid}&amount={amount}&txn_id={tid}&offer_id={oid}&offer_name={oname}&revenue={payout}&secret=YOUR_LOOTABLY_SECRET
  ```
- **Env vars**:
  - `LOOTABLY_SECRET` → your postback secret
  - `NEXT_PUBLIC_LOOTABLY_PLACEMENT` → your placement ID

## 5. Ayet Studios
- **Sign up**: https://www.ayetstudios.com/publisher/signup
- **Type**: Mobile game offers
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=ayet&user_id={uid}&amount={amount}&txn_id={tid}&offer_id={oid}&offer_name={oname}&revenue={payout}&secret=YOUR_AYET_SECRET
  ```
- **Env vars**:
  - `AYET_SECRET` → your secret key
  - `NEXT_PUBLIC_AYET_APP_KEY` → your app key

## 6. CPX Research
- **Sign up**: https://publisher.cpx-research.com/index.php?page=register
- **Type**: Paid surveys
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=cpxresearch&user_id={ext_user_id}&amount={amount_local}&txn_id={trans_id}&offer_id={survey_id}&offer_name=Survey&revenue={amount_usd_cents}&secret=YOUR_CPX_SECRET
  ```
- **Env vars**:
  - `CPXRESEARCH_SECRET` → your secure hash key
  - `NEXT_PUBLIC_CPX_APP_ID` → your app ID

## 7. BitLabs
- **Sign up**: https://dashboard.bitlabs.ai/auth/signup
- **Type**: Surveys and offers
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=bitlabs&user_id={USER_ID}&amount={REWARD}&txn_id={TX}&offer_id={SURVEY_ID}&offer_name=Survey&revenue={REVENUE}&secret=YOUR_BITLABS_SECRET
  ```
- **Env vars**:
  - `BITLABS_SECRET` → your server secret
  - `NEXT_PUBLIC_BITLABS_TOKEN` → your API token

## 8. TheoremReach
- **Sign up**: https://theoremreach.com/publisher/signup
- **Type**: Quick surveys
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=theoremreach&user_id=[USER_ID]&amount=[REVENUE]&txn_id=[TRANSACTION_ID]&offer_id=survey&offer_name=TheoremReach+Survey&secret=YOUR_THEOREMREACH_SECRET
  ```
- **Env vars**:
  - `THEOREMREACH_SECRET` → your postback secret
  - `NEXT_PUBLIC_THEOREMREACH_KEY` → your API key

## 9. Revenue Universe
- **Sign up**: https://www.revenueuniverse.com/publishers/signup
- **Type**: Diverse advertiser offers
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=revenueuniverse&user_id={uid}&amount={points}&txn_id={oid}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_RU_SECRET
  ```
- **Env vars**:
  - `REVENUEUNIVERSE_SECRET` → your secret key
  - `NEXT_PUBLIC_RU_APP_HASH` → your app hash

## 10. Pollfish
- **Sign up**: https://www.pollfish.com/publisher/signup
- **Type**: Market research surveys
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=pollfish&user_id={request_uuid}&amount={cpa}&txn_id={tx_id}&offer_id=survey&offer_name=Pollfish+Survey&secret=YOUR_POLLFISH_SECRET
  ```
- **Env vars**:
  - `POLLFISH_SECRET` → your secret key
  - `NEXT_PUBLIC_POLLFISH_KEY` → your API key

## 11. Torox
- **Sign up**: https://torox.io/publishers
- **Type**: Performance CPI offers
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=torox&user_id={sid}&amount={points}&txn_id={tid}&offer_id={oid}&offer_name={oname}&revenue={payout}&secret=YOUR_TOROX_SECRET
  ```
- **Env vars**:
  - `TOROX_SECRET` → your secret
  - `NEXT_PUBLIC_TOROX_PUB_ID` → your publisher ID

## 12. TyrAds
- **Sign up**: https://www.tyrads.com/publishers
- **Type**: Premium CPI campaigns
- **Postback URL**:
  ```
  https://YOUR-DOMAIN.com/api/postback?wall=tyrads&user_id={user_id}&amount={amount}&txn_id={transaction_id}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_TYRADS_SECRET
  ```
- **Env vars**:
  - `TYRADS_SECRET` → your secret key
  - `NEXT_PUBLIC_TYRADS_KEY` → your API key

---

## Adding Keys to Vercel

1. Go to https://vercel.com/dashboard → your project → Settings → Environment Variables
2. Add each key/value pair listed above
3. Redeploy (or push a new commit — Vercel auto-deploys)
4. The offerwall card will automatically switch from "Coming Soon" to "Browse Offers" once the key is detected

## Testing Postbacks

You can test a postback manually with curl:

```bash
curl "https://YOUR-DOMAIN.com/api/postback?wall=adgate&user_id=USER_UUID&amount=5000&txn_id=test123&offer_id=test&offer_name=Test+Offer&revenue=50&secret=YOUR_ADGATE_SECRET"
```

Should return `OK` and the user gets 5000 coins.

---

## Recommended Signup Order (by revenue potential)

1. **AdGate Media** — most diverse offers, good fill rate
2. **AdGem** — high CPI game offers, great for mobile
3. **BitLabs** — strong survey inventory
4. **CPX Research** — reliable survey partner
5. **Lootably** — good all-around
6. **OfferToro** — wide global coverage
7. **Revenue Universe** — solid US traffic monetization
8. **Ayet Studios** — mobile game focused
9. **TheoremReach** — survey specialist
10. **Pollfish** — market research niche
11. **Torox** — CPI specialist
12. **TyrAds** — premium CPI
