# How to Reconnect Gmail When the Connection Expires

*Email Integration · Read time: 3 minutes · Article only · Last updated 22 October 2026*

Google access can lapse &mdash; a password change, a revoked token, a security review. Reconnecting takes under a minute.

---

## How you will notice

- Overview stops moving and **Last updated** goes stale.
- The mailbox no longer shows a green **Connected** badge.

## Reconnecting

Each mailbox row carries its own action. A mailbox whose access has lapsed &mdash; status **Needs Reauth**, **Error** or **Pending Connection** &mdash; shows **Authorize**. A mailbox that is still **Connected** shows **Reconnect**, which refreshes its access.

![The Authorize or Reconnect action on a mailbox row](assets/reconnect-gmail-when-connection-expires/step-01-reconnect-action.png?v=20261022)
*One action per mailbox &mdash; make sure you press the one on the right row*

1. Go to **Settings → Email Integration**.
2. Find the mailbox in **Connected Emails**.
3. Press **Authorize** on that row (or **Reconnect**, if it still reads **Connected**).
4. Sign in to that Google account. Tick **View your email messages and settings** (or **Select all**) and continue.
5. Back in Mynt, check the mailbox named in **Connect *mailbox* to *account*?** and press **Connect**.
6. Confirm the badge reads **Connected** again.

> **Tip:** Sign in as the *same* address. Connecting a different mailbox does not restore the old one &mdash; it adds a second one.

## What happens to the gap

Payout emails that arrived while access was lapsed are still sitting in the mailbox, so Mynt can read them once the connection is restored. If a period stays empty afterwards, [raise a ticket](../data-issues/06-how-to-raise-data-issue-support-ticket.md) with the exact dates and ask for it to be reprocessed.

## If reconnecting does not stick

1. Confirm you are signing in as the mailbox that receives payout mail, not the address you use for Mynt.
2. Check [Google Account → Third-party access](https://myaccount.google.com/permissions) in case Mynt was revoked there.
3. Try a browser where you are not signed in to several Google accounts at once.
4. Still failing? Raise a ticket with the mailbox address and the time you tried.

## Related guides

- [Checking sync status](04-check-email-sync-status.md)
- [What permissions Mynt asks for](02-gmail-permissions.md)
- [Connected but data still missing](07-gmail-connected-but-data-missing-troubleshooting.md)

---

## Need help?

| Contact | Details |
|---------|---------|
| **Email** | contact@pyvot.in |
| **Phone** | +91 98366 66745 |
| **Phone** | +91 82407 91854 |

Or open **Help & Support** in Mynt and raise a ticket.
