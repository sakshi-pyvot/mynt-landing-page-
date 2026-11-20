# How to Disconnect or Change the Gmail Account Connected to Mynt

*Email Integration · Read time: 4 minutes · Article only · Last updated 22 October 2026*

You can disconnect, delete, add or reconnect a mailbox yourself from **Settings &rarr; Email Integration**.

---

## What the panel offers

![The Connected Emails header with the Add SOA Email action](assets/disconnect-or-change-gmail/step-01-add-soa-email.png?v=20261022)
*Add a mailbox here; each row has its own <strong>Reconnect</strong> or <strong>Authorize</strong>, and <strong>Disconnect</strong> or <strong>Delete</strong>*

| | |
|---|---|
| **Add another mailbox** | Yes &mdash; **Add SOA Email**. |
| **Reconnect an existing mailbox** | Yes &mdash; **Authorize** on a lapsed row, or **Reconnect** on a **Connected** one. |
| **Remove a mailbox** | Yes &mdash; **Disconnect** on a mailbox that has imported data, or **Delete** on one that never imported anything. Mynt asks you to confirm first. |

## To change which mailbox Mynt reads

1. Add the correct mailbox with **Add SOA Email**.
2. Confirm it shows **Connected**. If **Settings → Outlet Mapping** shows it under **Historic ingestion**, press **Activate**, then check that data starts arriving from it.
3. Press **Disconnect** on the old mailbox and confirm.

Adding first and disconnecting second means you are never without a connected mailbox.

## To cut access off immediately

Revoke Mynt from Google directly at [Google Account → Third-party access](https://myaccount.google.com/permissions). That takes effect at once &mdash; Mynt can no longer read that mailbox.

> **Tip:** After revoking at Google, also press **Disconnect** on that row in Mynt. Otherwise the mailbox stays listed and simply stops working, which looks like a fault later.

## What happens to data already collected

It stays. As the confirmation says: &ldquo;Ingestion stops. Data already imported stays. Reconnecting later imports only new statements.&rdquo; If you want the collected data removed as well, contact support &mdash; see [disconnecting and removing access](../security/04-how-to-disconnect-sign-out-remove-access.md).

## Related guides

- [Connecting a Gmail account](01-connect-gmail-account.md)
- [What permissions Mynt asks for](02-gmail-permissions.md)
- [Signing out and removing access](../security/04-how-to-disconnect-sign-out-remove-access.md)

---

## Need help?

| Contact | Details |
|---------|---------|
| **Email** | contact@pyvot.in |
| **Phone** | +91 98366 66745 |
| **Phone** | +91 82407 91854 |

Or open **Help & Support** in Mynt and raise a ticket.
