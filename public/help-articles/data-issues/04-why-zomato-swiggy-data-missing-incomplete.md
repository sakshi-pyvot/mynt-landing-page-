# Why Zomato or Swiggy Data Is Missing or Incomplete

*Data Issues · Read time: 4 minutes · Article only · Last updated 22 October 2026*

Zomato is there and Swiggy is blank, or the other way round. When only one platform is affected, the cause is nearly always that platform&rsquo;s ID or that platform&rsquo;s emails.

---

## Confirm it really is one platform

Open the filter panel, set **Platform** to one platform at a time and press **Apply**. **Zomato** and **Swiggy** are always listed; **Toing** appears only if your account has Toing outlets.

![The platform filter showing All Platforms, Zomato, Swiggy and Toing](assets/zomato-swiggy-missing/step-01-platform-filter.png?v=20261022)
*Select one platform at a time to see which is actually empty*

> **Tip:** Toing mirrors your Swiggy restaurant ID and is filled in automatically. There is nothing to map for it by hand.

## Cause 1 — that platform&rsquo;s ID is not linked

An outlet can be linked on Zomato and not on Swiggy. Mynt keeps a separate restaurant ID per platform, and it only counts orders for IDs it holds.

Go to **Settings → Outlet Mapping → Platform Mapping** and press **Edit** on the outlet.

![An outlet in edit mode with a Zomato ID filled in and Swiggy not yet added](assets/zomato-swiggy-missing/step-02-platform-ids.png?v=20261022)
*This outlet has a Zomato ID but no Swiggy ID &mdash; every Swiggy order for it is skipped*

1. Press **Edit** on the outlet&rsquo;s row.
2. Press **+ Swiggy** (or **+ Zomato**) to add the missing platform.
3. Pick the restaurant ID from the list. Mynt only lists IDs it has actually seen in your payout mail.
4. Press **Save**.

## Cause 2 — the ID is not in the list yet

If the dropdown is empty or the ID you want is not offered, Mynt has not seen that ID in your connected mailboxes yet. That usually means one of:

- No payout email from that platform has arrived yet for that outlet.
- That platform sends to a mailbox Mynt does not read &mdash; add it with **Add SOA Email**.
- The outlet is brand new on that platform. Press **Rescan mailboxes** once mail has arrived.

## Cause 3 — that platform&rsquo;s processing is delayed

Open **Help & Support** and check **System Status**. **Zomato Processing** and **Swiggy Processing** are listed separately, so one can be **Delayed** or **Down** while the other reads **Working**.

## Cause 4 — the period predates the link

Linking an ID today does not rebuild past weeks on its own. A newly linked outlet may wait under **Historic ingestion** in **Settings → Outlet Mapping** until you press **Activate**, which backfills its historic orders. If the earlier period is still empty after that, raise a ticket.

## Related guides

- [How outlet mapping affects your data](05-how-incorrect-outlet-mapping-affects-data.md)
- [How to map Zomato and Swiggy outlets](../outlet-mapping/02-how-to-map-zomato-swiggy-platform-outlets.md)
- [Raise a data issue ticket](06-how-to-raise-data-issue-support-ticket.md)

---

## Need help?

| Contact | Details |
|---------|---------|
| **Email** | contact@pyvot.in |
| **Phone** | +91 98366 66745 |
| **Phone** | +91 82407 91854 |

Or open **Help & Support** in Mynt and raise a ticket.
