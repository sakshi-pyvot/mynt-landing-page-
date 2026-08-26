# How to Connect Your Data Sources to Mynt

*Getting Started · Read time: 3 minutes · Article only · Last updated 25 August 2026*

Mynt has one data source: the payout emails the platforms send you. Connecting the right mailbox is the step everything else waits on.

---

## Where it is

Go to **Settings → Email Integration**.

![The Email Integration panel header describing payout emails as the core data source](assets/connect-data-sources/step-01-email-integration.png)
*The panel says it plainly: payout emails are the core data source*

## Connecting a mailbox

1. Press **Add SOA Email**.
2. Choose the Google account that *receives payout emails*.
3. Approve the read-only Gmail permission on Google&rsquo;s own screen.
4. Confirm the mailbox appears with a green **Connected** badge.

Full walkthrough: [connecting your Gmail account](../email-integration/01-connect-gmail-account.md).

## More than one mailbox is fine

If Zomato mail goes to one address and Swiggy mail to another, connect both. Mynt reads all connected mailboxes.

## What Mynt can and cannot do with it

| | |
|---|---|
| **Read your payout emails** | Yes &mdash; that is the whole purpose. |
| **Send, delete or edit email** | Never. The Gmail permission is read-only, enforced by Google. |
| **Read Drive, Calendar or Contacts** | Never &mdash; those permissions are not requested. |

See [what permissions Mynt asks for](../email-integration/02-gmail-permissions.md).

## After connecting

1. Mynt reads the payout emails already in the mailbox.
2. It lists the restaurant IDs it finds.
3. You map each one to an outlet &mdash; see [mapping outlets](../outlet-mapping/02-how-to-map-zomato-swiggy-platform-outlets.md).
4. Dashboards fill in.

## Related guides

- [How often Mynt syncs](../email-integration/05-how-often-sync.md)
- [Checking sync status](../email-integration/04-check-email-sync-status.md)
- [The complete setup guide](01-getting-started-with-mynt-complete-setup-guide.md)

---

## Need help?

| Contact | Details |
|---------|---------|
| **Email** | contact@pyvot.in |
| **Phone** | +91 98366 66745 |
| **Phone** | +91 82407 91854 |

Or open **Help & Support** in Mynt and raise a ticket.
