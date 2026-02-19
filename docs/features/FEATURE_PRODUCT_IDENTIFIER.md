# FEATURE: AI Product Identifier (Bild → Produkt)

> **Status:** 📋 GEPLANT  
> **Priorität:** 🔴 CRITICAL — Echter Pain-Solver + USP  
> **Geschätzter Aufwand:** ~13h  
> **Erstellt:** 2026-01-25  

---

## 🎯 Problem (ECHT, TÄGLICH, TEUER)

Während EB-Protokoll (Erstbegehung) auf der Baustelle:
- Handwerker findet unbekanntes Teil/Material
- Weiß nicht was es ist, kein Etikett lesbar
- Kann nicht in DB suchen weil Produktname unbekannt
- Muss später manuell recherchieren → **Zeit verloren, Fehler, Frust**

**Das ist kein Edge-Case. Das passiert JEDEN TAG auf jeder Baustelle.**

---

## 💡 Lösung

**3 Fotos machen → AI identifiziert → Vorschlag zur Freigabe**

```
[Mobile: 3 Fotos aufnehmen]
        ↓
[Upload → Supabase Storage]
        ↓
[Event: product_identification_requested]
        ↓
[n8n: MX_07 Product Identifier Agent]
    ├── Claude Vision: Produkterkennung
    ├── OCR: Typenschild/Artikelnummer
    ├── Web Search: Preise & Lieferanten
    └── DB Match: Existiert schon in products?
        ↓
[Event: product_suggestion_ready]
        ↓
[Dashboard: Freigabe-Center]
    "🔍 Produkt erkannt: Busch-Jaeger Wechselschalter"
    [✓ Übernehmen] [✏️ Bearbeiten] [✗ Verwerfen]
```

---

## 📸 Foto-Anforderungen

| Foto | Zweck | Beispiel |
|------|-------|----------|
| 1. Frontal | Gesamtansicht | Steckdose von vorne |
| 2. Seite/Detail | Bauform erkennen | Tiefe, Befestigung |
| 3. Typenschild | Artikelnummer, Hersteller | Etikett, Prägung, QR |

---

## 🗄️ Database Schema

```sql
-- =============================================
-- PRODUCT IDENTIFICATION REQUESTS
-- =============================================
CREATE TABLE product_identification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    project_id UUID REFERENCES projects(id),
    protocol_id UUID REFERENCES inspection_protocols(id),
    protocol_item_id UUID REFERENCES inspection_protocol_items(id),
    requested_by UUID REFERENCES auth.users(id),
    
    -- Images (3 Fotos)
    image_urls TEXT[] NOT NULL, -- Array of storage paths
    
    -- User Context (optional)
    user_hint TEXT, -- "Sieht aus wie Lichtschalter, weiß aber nicht welcher"
    location_hint TEXT, -- "Wohnzimmer, neben Tür"
    
    -- Status
    status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'ready', 'approved', 'rejected', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ
);

-- =============================================
-- AI PRODUCT SUGGESTIONS
-- =============================================
CREATE TABLE product_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES product_identification_requests(id) ON DELETE CASCADE,
    
    -- AI Suggestion
    suggested_name TEXT NOT NULL,
    suggested_manufacturer TEXT,
    suggested_sku TEXT,
    suggested_category TEXT, -- elektro, sanitär, bau, etc.
    suggested_description TEXT,
    
    -- Confidence
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    ai_reasoning TEXT, -- Warum diese Vermutung
    
    -- Price Research
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    price_sources JSONB, -- [{supplier: "BAUHAUS", price: 5.99, url: "..."}]
    
    -- Matching
    matched_product_id UUID REFERENCES products(id), -- Falls in DB gefunden
    match_confidence DECIMAL(3,2),
    
    -- After Approval
    approved_product_id UUID REFERENCES products(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_pir_status ON product_identification_requests(status);
CREATE INDEX idx_pir_project ON product_identification_requests(project_id);
CREATE INDEX idx_ps_request ON product_suggestions(request_id);
```

---

## ⚡ n8n Workflow: MX_07_Product_Identifier

### Trigger
```
Event: product_identification_requested
Payload: {
  request_id: UUID,
  image_urls: ["storage/path1.jpg", "storage/path2.jpg", "storage/path3.jpg"],
  user_hint: "optional",
  project_id: UUID
}
```

### Steps

**1. Images laden**
```
- Download 3 Bilder aus Supabase Storage
- Resize auf max 1024px (Token-Optimierung)
```

**2. Claude Vision Analysis**
```
Prompt:
"Du bist ein Experte für Baumaterialien und Handwerksbedarf.

Analysiere diese 3 Bilder eines Produkts von einer Baustelle.

AUFGABE:
1. Identifiziere das Produkt so genau wie möglich
2. Lies alle sichtbaren Texte (Typenschild, Etiketten, Prägungen)
3. Bestimme Hersteller wenn erkennbar
4. Kategorisiere (Elektro/Sanitär/Heizung/Bau/Werkzeug/etc)

AUSGABE (JSON):
{
  "product_name": "Genaue Bezeichnung",
  "manufacturer": "Hersteller oder null",
  "article_number": "Wenn lesbar oder null",
  "category": "elektro|sanitär|heizung|bau|werkzeug|sonstiges",
  "description": "Kurzbeschreibung für Handwerker",
  "confidence": 0.0-1.0,
  "reasoning": "Warum ich das denke",
  "visible_text": ["Text1", "Text2"], // Alles was lesbar war
  "search_terms": ["Begriff1", "Begriff2"] // Für Web Search
}

User-Hinweis: {user_hint}
"
```

**3. Web Search (falls confidence < 0.9)**
```
Query: "{product_name} {manufacturer} kaufen preis"
→ Extrahiere Preise von Suchergebnissen
→ Verifiziere Produktname
```

**4. DB Match Check**
```sql
SELECT id, name, sku, similarity(name, $suggested_name) as sim
FROM products
WHERE similarity(name, $suggested_name) > 0.4
ORDER BY sim DESC
LIMIT 3;
```

**5. Suggestion speichern**
```sql
INSERT INTO product_suggestions (
  request_id, suggested_name, suggested_manufacturer,
  suggested_sku, suggested_category, confidence_score,
  ai_reasoning, price_range_min, price_range_max,
  price_sources, matched_product_id
) VALUES (...)
```

**6. Event erzeugen**
```
Event: product_suggestion_ready
Payload: { request_id, suggestion_id, confidence }
```

**7. Notification (optional)**
```
Telegram: "🔍 Neuer Produktvorschlag wartet auf Freigabe"
```

---

## 📱 Frontend: Kamera-Flow

### EB-Protokoll Integration
```tsx
// In PositionItemWithMaterial.tsx oder eigener Dialog

<Button onClick={() => setShowProductScanner(true)}>
  <Camera className="h-4 w-4 mr-2" />
  Unbekanntes Teil identifizieren
</Button>

<ProductScannerDialog
  open={showProductScanner}
  onClose={() => setShowProductScanner(false)}
  protocolId={protocol.id}
  protocolItemId={item.id}
  onComplete={(suggestionId) => {
    toast({ title: "Agent recherchiert...", description: "Du wirst benachrichtigt." });
  }}
/>
```

### Scanner Dialog
```tsx
const ProductScannerDialog = ({ open, onClose, protocolId, protocolItemId, onComplete }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [hint, setHint] = useState("");
  const [uploading, setUploading] = useState(false);

  const capturePhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Rückkamera
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setPhotos([...photos, file]);
    };
    input.click();
  };

  const submit = async () => {
    setUploading(true);
    
    // 1. Upload images to Supabase Storage
    const imageUrls = await Promise.all(
      photos.map(async (photo, i) => {
        const path = `product-scans/${protocolId}/${Date.now()}-${i}.jpg`;
        await supabase.storage.from('uploads').upload(path, photo);
        return path;
      })
    );
    
    // 2. Create identification request
    const { data } = await supabase
      .from('product_identification_requests')
      .insert({
        protocol_id: protocolId,
        protocol_item_id: protocolItemId,
        image_urls: imageUrls,
        user_hint: hint || null,
        status: 'pending'
      })
      .select('id')
      .single();
    
    // 3. Trigger event
    await supabase.from('events').insert({
      event_type: 'product_identification_requested',
      payload: { request_id: data.id, image_urls: imageUrls }
    });
    
    onComplete(data.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔍 Produkt identifizieren</DialogTitle>
          <DialogDescription>
            Mache 3 Fotos: Frontal, Seite, Typenschild
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square border rounded-lg">
              {photos[i] ? (
                <img src={URL.createObjectURL(photos[i])} className="object-cover" />
              ) : (
                <Button variant="ghost" onClick={capturePhoto}>
                  <Camera />
                  <span>{['Frontal', 'Seite', 'Etikett'][i]}</span>
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <Input
          placeholder="Optional: Was vermutest du? (z.B. 'irgendein Schalter')"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
        />
        
        <DialogFooter>
          <Button onClick={submit} disabled={photos.length < 1 || uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : "Agent starten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎛️ Dashboard: Freigabe-UI

### Freigabe-Center Integration
```tsx
<Card>
  <CardHeader>
    <CardTitle>🔍 Produktvorschläge</CardTitle>
    <Badge>{pendingSuggestions.length} offen</Badge>
  </CardHeader>
  <CardContent>
    {pendingSuggestions.map((suggestion) => (
      <ProductSuggestionCard
        key={suggestion.id}
        suggestion={suggestion}
        onApprove={handleApprove}
        onEdit={handleEdit}
        onReject={handleReject}
      />
    ))}
  </CardContent>
</Card>
```

---

## 🚀 Implementierungs-Reihenfolge

| # | Task | Aufwand | Abhängigkeit |
|---|------|---------|--------------|
| 1 | DB Schema migrieren | 1h | - |
| 2 | Storage Bucket `product-scans` erstellen | 10min | - |
| 3 | n8n MX_07 Workflow bauen | 3h | #1 |
| 4 | Vision Prompt tunen & testen | 2h | #3 |
| 5 | Frontend: ProductScannerDialog | 2h | #1 |
| 6 | Frontend: Freigabe-UI | 2h | #3 |
| 7 | Integration in EB-Protokoll | 1h | #5 |
| 8 | Telegram Notification | 30min | #3 |
| 9 | Testing & Edge Cases | 2h | Alles |

**Total: ~13h**

---

## 📊 Success Metrics

| Metrik | Ziel |
|--------|------|
| AI Accuracy | > 80% korrekte Erkennung |
| User Adoption | > 50% nutzen Feature bei unbekannten Teilen |
| Time Saved | -5 Min pro unbekanntem Produkt |
| Product Pool Growth | +20% neue Produkte/Monat |

---

## 🔮 Spätere Erweiterungen (Phase 2+)

Nach dem Core-Feature fertig ist:

1. **Barcode/QR Scanner** — Direkt Artikelnummer scannen
2. **Hersteller-Katalog-API** — Direktabfrage bei Busch-Jaeger, Hager, etc.
3. **Foto-History** — "Dieses Teil wurde schon 3x fotografiert"
4. **Bulk-Scan** — Mehrere Teile auf einmal scannen
5. **Offline-Mode** — Fotos queuen, später hochladen

---

## ✅ Definition of Done

- [ ] Handwerker kann 3 Fotos machen
- [ ] AI erkennt Produkt mit >70% Genauigkeit
- [ ] Vorschlag erscheint im Freigabe-Center
- [ ] Nach Freigabe wird Produkt in `products` angelegt
- [ ] Learning: Erkannte Produkte werden bei Folge-Erkennung bevorzugt
