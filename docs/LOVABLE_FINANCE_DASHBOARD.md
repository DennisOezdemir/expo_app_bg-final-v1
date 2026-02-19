# Finance Dashboard - Lovable Prompt

## Neue Seite: `/finance`

Erstelle eine Finance Dashboard Seite mit folgenden Komponenten:

### 1. Summary Cards (obere Reihe)

4 Kacheln nebeneinander:

```tsx
// Daten aus: supabase.from('v_finance_summary').select('*').single()

<Card className="border-red-500">
  <CardTitle>🔴 Überfällig</CardTitle>
  <CardContent>
    <div className="text-3xl font-bold text-red-600">{overdue_amount}€</div>
    <div className="text-sm text-muted">{overdue_invoices} Rechnungen</div>
  </CardContent>
</Card>

<Card className="border-orange-500">
  <CardTitle>⏰ Diese Woche fällig</CardTitle>
  <CardContent>
    <div className="text-3xl font-bold text-orange-600">{due_this_week_amount}€</div>
    <div className="text-sm text-muted">{due_this_week_invoices} Rechnungen</div>
  </CardContent>
</Card>

<Card>
  <CardTitle>📋 Offen gesamt</CardTitle>
  <CardContent>
    <div className="text-3xl font-bold">{total_open_amount}€</div>
    <div className="text-sm text-muted">{total_open_invoices} Rechnungen</div>
  </CardContent>
</Card>

<Card className="border-green-500">
  <CardTitle>✅ Bezahlt (Monat)</CardTitle>
  <CardContent>
    <div className="text-3xl font-bold text-green-600">{paid_this_month_amount}€</div>
    <div className="text-sm text-muted">{paid_this_month_invoices} Rechnungen</div>
  </CardContent>
</Card>
```

### 2. Rechnungstabelle (Hauptbereich)

```tsx
// Daten aus: supabase.from('v_purchase_invoices_dashboard').select('*')

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Status</TableHead>
      <TableHead>Fällig</TableHead>
      <TableHead>Lieferant</TableHead>
      <TableHead>RE-Nr</TableHead>
      <TableHead className="text-right">Brutto</TableHead>
      <TableHead className="text-right">Bezahlt</TableHead>
      <TableHead>Beleg</TableHead>
      <TableHead>Aktion</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map(inv => (
      <TableRow key={inv.id} className={
        inv.payment_status === 'OVERDUE' ? 'bg-red-50' :
        inv.payment_status === 'DUE_SOON' ? 'bg-orange-50' :
        inv.payment_status === 'PAID' ? 'bg-green-50' : ''
      }>
        <TableCell>
          {inv.payment_status === 'OVERDUE' && <Badge variant="destructive">Überfällig</Badge>}
          {inv.payment_status === 'DUE_SOON' && <Badge variant="warning">Bald fällig</Badge>}
          {inv.payment_status === 'OPEN' && <Badge variant="secondary">Offen</Badge>}
          {inv.payment_status === 'PAID' && <Badge variant="success">Bezahlt</Badge>}
        </TableCell>
        <TableCell>{formatDate(inv.due_date)}</TableCell>
        <TableCell>{inv.supplier_name}</TableCell>
        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
        <TableCell className="text-right font-medium">{formatCurrency(inv.total_gross)}</TableCell>
        <TableCell className="text-right">{formatCurrency(inv.paid_amount)}</TableCell>
        <TableCell>
          {inv.pdf_url && (
            <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
            </a>
          )}
        </TableCell>
        <TableCell>
          {inv.payment_status !== 'PAID' && (
            <Button size="sm" variant="outline" onClick={() => markAsPaid(inv.id)}>
              Als bezahlt
            </Button>
          )}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 3. Filter-Leiste

```tsx
<div className="flex gap-4 mb-4">
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectItem value="all">Alle</SelectItem>
    <SelectItem value="OVERDUE">Überfällig</SelectItem>
    <SelectItem value="DUE_SOON">Bald fällig</SelectItem>
    <SelectItem value="OPEN">Offen</SelectItem>
    <SelectItem value="PAID">Bezahlt</SelectItem>
  </Select>
  
  <Input 
    placeholder="Suche Lieferant/RE-Nr..." 
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
  />
</div>
```

### 4. "Als bezahlt markieren" Dialog

```tsx
// RPC Call: supabase.rpc('mark_invoice_paid', { p_invoice_id: invoiceId, p_paid_amount: amount })

<Dialog>
  <DialogTitle>Rechnung als bezahlt markieren</DialogTitle>
  <DialogContent>
    <div className="space-y-4">
      <div>
        <Label>Lieferant</Label>
        <div>{selectedInvoice?.supplier_name}</div>
      </div>
      <div>
        <Label>Rechnungsnummer</Label>
        <div>{selectedInvoice?.invoice_number}</div>
      </div>
      <div>
        <Label>Betrag (€)</Label>
        <Input 
          type="number" 
          value={paidAmount} 
          onChange={e => setPaidAmount(e.target.value)}
          defaultValue={selectedInvoice?.total_gross}
        />
      </div>
      <div>
        <Label>Bezahlt am</Label>
        <Input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
      </div>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button onClick={handleMarkPaid}>Bestätigen</Button>
  </DialogFooter>
</Dialog>
```

### 5. Lieferanten-Übersicht

```tsx
// Daten aus: supabase.from('v_supplier_balances').select('*')

<Card>
  <CardTitle>Offene Salden nach Lieferant</CardTitle>
  <CardContent>
    {supplierBalances.map(s => (
      <div key={s.supplier_id} className="flex justify-between py-2 border-b">
        <span>{s.supplier_name}</span>
        <span className="font-medium">{formatCurrency(s.open_balance)}</span>
        <span className="text-sm text-muted">{s.open_invoices} offen</span>
      </div>
    ))}
  </CardContent>
</Card>
```

## Supabase Views

- `v_finance_summary` - Aggregierte Zahlen für Kacheln
- `v_purchase_invoices_dashboard` - Alle Rechnungen mit Status + PDF-URL
- `v_supplier_balances` - Salden pro Lieferant

## Supabase Functions

- `mark_invoice_paid(p_invoice_id, p_paid_amount, p_paid_at)` - Rechnung als bezahlt markieren

## Navigation

Sidebar Link:
```tsx
{ name: 'Finanzen', href: '/finance', icon: Euro }
```