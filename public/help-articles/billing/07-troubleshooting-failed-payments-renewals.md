# Troubleshooting Failed Payments and Renewals

*Billing · Read time: 4 minutes · Article only · Last updated 22 October 2026*

A payment did not go through, or a renewal is due. Here is how to tell which, and what to do about it.

---

## Read the status first

Every row in **Invoices & Payment History** carries a status, and the status tells you whether money moved.

![A pending payment row with a Retry action](assets/troubleshooting-failed-payments-renewals/step-01-payment-status.png?v=20261022)
*A **Pending** row keeps a **Retry** link &mdash; the payment can be completed from here*

| | |
|---|---|
| **Paid** | Complete. The invoice is available under Actions. |
| **Pending** | Started but not completed. A **Retry** link reopens the payment. |
| **Failed** | The payment did not go through. There is no Retry: start the purchase again. |
| **Cancelled** | Abandoned before payment. No invoice, and **&mdash;** under Actions. |

## If a payment failed

1. Check your bank or UPI app for a debit. A **Failed** or **Cancelled** row means the payment did not complete.
2. If a **Retry** link is showing, use it &mdash; it reopens the original payment rather than creating a second one.
3. If there is no Retry link, start again: **Purchase Outlet Licenses** for licences, **Buy Now** under **Token Purchase** for tokens, or **Renew licences** for a renewal.
4. Try a different method on Razorpay&rsquo;s payment page.
5. If you were charged but the row is not **Paid**, contact support with the date, amount and your bank reference. Do not pay twice.

> **Tip:** Never start a second payment for the same licence because the first looked stuck. Use **Retry**, or check with support first. If you close a payment dialog while a payment is in progress, Mynt asks **Cancel this payment?** &mdash; **Keep paying** leaves it running, **Yes, cancel** cancels it.

## If a renewal is due

If your account has an active auto-renew mandate, your plan renews automatically. Otherwise each licence runs twelve months and then stops. When any licence is expired or due within 30 days, Billing shows a banner with **Renew now**, and the **Renew licences** button is highlighted.

![The Annual Licensing summary showing active licences and the next expiry date](assets/troubleshooting-failed-payments-renewals/step-02-days-left.png?v=20261022)
*Active licences and the date your next licence expires*

To renew, press **Renew licences** or **Renew now**, choose how many licences and which outlets, and pay via Razorpay. Each renewed licence is extended by 12 months. See [licence dates, expiry and renewals](04-understanding-licence-dates-expiry-renewals.md).

## If an outlet stopped collecting after a renewal

1. Confirm the invoice reads **Paid**.
2. Check the licence table &mdash; the outlet should show a **Days Left** figure again.
3. Check **Platforms Mapped** on that row is not **Not mapped**.
4. Ask support to reprocess any payout emails that arrived while the licence was lapsed.

## Related guides

- [Licence dates, expiry and renewals](04-understanding-licence-dates-expiry-renewals.md)
- [Viewing and downloading invoices](05-how-to-view-download-invoices.md)
- [Payments, GST and billing details](06-how-payments-gst-billing-details-work.md)

---

## Need help?

| Contact | Details |
|---------|---------|
| **Email** | contact@pyvot.in |
| **Phone** | +91 98366 66745 |
| **Phone** | +91 82407 91854 |

Or open **Help & Support** in Mynt and raise a ticket.
