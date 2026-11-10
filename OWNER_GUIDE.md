# Jaman Enterprise — Owner & Staff Guide

This is your guide to running the showroom from the website. You will never
need to touch code, a database, or the command line for anything described
here — everything below is done by clicking around the website.

## Logging in

Open the website and log in with your email and password. If you're the
very first person to open the site, you'll be asked to create the **Owner**
account instead — do that once, then complete the short **business setup**
form (your business name, address, GSTIN, bank/UPI details, invoice
numbering). You can change any of this later from **Settings → Business
Profile**.

## Staff accounts and roles

Go to **Settings → User Management** (Owner only) to add accounts for your
team. Each person gets their own login and one of four roles:

- **Owner** — sees and can do everything, including deleting/adjusting
  records and running Settings.
- **Manager** — inventory, sales, customers, payments, expenses, suppliers,
  service, reports, P&L. Not Settings/staff accounts.
- **Sales Executive** — leads, test rides, bookings, sales, customers,
  recording payments. Not expenses, suppliers, or reports.
- **Accountant** — expenses, payments, GST, reports, P&L, customers, sales.
  Not inventory or suppliers.

If someone leaves, deactivate their account from the same screen (their
history stays intact — nothing they created gets deleted).

## The Dashboard

Your home screen after logging in. It shows today's and this month's sales,
stock on hand, revenue/profit/expenses, GST collected (not your profit —
just what you owe the government), customer dues, low-stock warnings,
overdue payments, today's test rides, and follow-ups due. Every number comes
straight from your real records — nothing here is a placeholder.

The green **Quick Action** button in the top right jumps straight to New
Sale, Add Vehicle, Add Customer, New Booking, Add Expense, Add Lead,
Schedule Test Ride, or Record Payment from anywhere in the app.

## Everyday workflows

### A customer walks in and wants to buy a scooter

1. **Customers → Add Customer** (skip if they're already in the system —
   search first).
2. If they want a test ride first: **Test Rides → Schedule Test Ride**.
3. If they want to reserve a scooter with a deposit before deciding:
   **Bookings → New Booking** — this reserves that exact unit and records
   the deposit as a payment automatically.
4. When they're ready to buy: **Sales & Invoices → New Sale** (or, from a
   booking, click **Convert to Sale** on the Bookings list — the deposit
   carries over automatically). Pick the customer and the exact scooter,
   enter any discount or an exchange vehicle's value, and the GST invoice
   total, tax breakdown, and balance due are calculated for you as you type
   — nothing to work out by hand.
5. Click **Confirm Sale & Generate Invoice**. The vehicle is marked Sold,
   the invoice number is assigned automatically, and you can immediately
   **Download / Print Invoice PDF**.
6. Collect any remaining balance later from the sale's page → **Record
   Payment**.

### Receiving new stock

**Inventory → Scooter Models** — add the brand/model once (specs, GST
rate, default prices). Then **Inventory → Vehicle Stock → Add Vehicle** for
every individual scooter you receive — picking the model auto-fills the
specs and prices, you just add the colour, chassis/motor/battery numbers,
purchase price and supplier. Each physical scooter is its own record, so you
always know exactly which unit was sold to which customer.

### A scooter needs servicing

**Service Records → Add Service Record** — pick the vehicle, log what was
done and the cost. It shows up automatically in that vehicle's history page
and in that customer's profile.

### Recording a business expense

**Expenses → Add Expense** — pick a category (Rent, Electricity, Salary,
etc.), amount, and who it was paid to. You can add or remove categories
yourself from **Settings → Expense Categories**.

### Checking how the business is doing

- **Dashboard** for a live daily snapshot.
- **Profit & Loss** for a proper statement (Daily/Monthly/Quarterly/Yearly
  or a custom date range), with revenue, cost, gross/net profit and margins
  — GST collected is always kept separate from profit, as it isn't your
  money.
- **Reports Center** to export Sales, Inventory, Customers, Expenses,
  Payments, GST, Outstanding, Service, or Lead reports as CSV files that
  open directly in Excel.

### Every change is tracked

**Settings → Audit Log** (Owner) shows who did what and when — every sale,
edit, cancellation and deletion of anything financial. Sales and vehicles
are never silently deleted; they're **cancelled** instead, so the history
and the audit trail are always there if you need to check something later.

## Trying the system before going live

**Settings → Demo Data** (Owner) loads a handful of realistic sample
scooters, customers and sales so you can click around and see how
everything works. When you're ready to start using real data, click
**Delete Demo Data** — it removes only the sample records, never anything
you've entered yourself.

## What this system does not do yet

Being upfront: a few smaller items from the original wish list aren't built
yet and would need a developer to add later — a dedicated finance/EMI
tracker (EMI details can be noted in a sale's notes for now), a dedicated
accessories catalog, a document upload/checklist system per sale, WhatsApp/
SMS/email notifications, and payment gateway integration. None of these
block day-to-day selling, invoicing, or accounting — they're natural
next additions.
