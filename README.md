# WASA Kasur · Revenue Data Center

Purana wahi dashboard (3 themes, sab pages), ab **asli data** par chalta hai. Aap Excel upload karte hain, baaqi sab browser mein hota hai.

## Chalane ka tareeqa (GitHub Pages)
1. GitHub par nayi repository banayen (naam jaise `wasa-dashboard`).
2. Is folder ki **saari files** (index.html, css/, js/, firebase-config.js, storage.rules, .nojekyll) repository mein upload karein.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. 1–2 minute baad link milega: `https://<username>.github.io/wasa-dashboard/`

> **Zaroori:** Excel files (consumer ka data) GitHub par upload **na** karein. Repository mein sirf app hai. Data sirf aap ke browser mein (ya aap ke private Firebase mein) rehta hai.

Local par chalana ho to folder mein `python -m http.server 8000` chala kar `http://localhost:8000` kholein.

## Data upload (Data center page)
- `.xlsx` ya `.csv` upload karein, ek saath kai files bhi.
- Har file mein `CONSUMER_NO` column hona chahiye. Files isi se jorti hain.
- **Sequence:** consumers usi tarteeb mein dikhte hain jis tarteeb mein files upload hui. Download bhi usi tarteeb mein.
- Har nayi file ke naye columns khud ba khud system columns mein add ho jate hain (Export page mein foran nazar aate hain).
- Do alag files ka data ek hi download mein aata hai (ek row = ek consumer).
- Same naam ka column (jaise CATEGORY) dobara upload ho to naye file ki non-empty value purani ko refresh karti hai.
- Data aap ke browser mein save rehta hai (refresh ke baad bhi). Doosre browser/device par kholne ke liye Cloud copy istemal karein.

## Kya badla (aap ki list ke mutabiq)
**Consumers page**
- Chips (All consumers, Not paid, Paid, Inactive, Commercial) hata diye.
- All types / All services hata kar **Zone** aur **Area** filters aa gaye (Area sirf wohi dikhte hain jo us Zone mein hain). Search bar waisa hi.
- List 77,935 consumers ki hai, page-wise (15/25/50/100), consumer par click karein to saare columns drawer mein.
- **Export** ab alag page `Export data` kholta hai.

**Export data page**
- Zone → Areas (kai areas ek saath), Commercial / Residential / Total, Status, Payment (Paid / Part paid / Not paid), minimum balance.
- **Top defaulters**: usi zone/area/type ke andar sab se bara balance, top N (0 = sab).
- **Har column par filter** (contains, equals, is empty, more than, between...). Jitne columns files mein hain utne filters.
- **Columns chunein**: sab / standard / koi nahi; order ↑↓ se badlein; sirf chune hue columns aur unka data download hota hai.
- Excel (.xlsx) ya CSV. Excel mein header, filter, frozen row aur `Report info` sheet (kya filter lagaye, totals).

**Dashboard**
- Category aur Service ke filter hata diye.
- *Collection by category* aur *by sub-category*: Collection / Billed / **Consumers**.
- *Consumers by area*: Consumers / Billed / Collection, heading badal jati hai (Billed amount by area, Collection by area).
- *Consumers by marla*: Consumers / Billed / Collection, heading badal jati hai.
- Areas ab 200 tak (baaqi "Other areas"), bari value upar.

## Zone aur Area kaise bante hain
- **Area** = ADDRESS ko saaf kar ke (jaise `BHASSAR PURA`, `Bhassar Pura Kasur` ek hi area). 200 sab se bare areas alag, baaqi "Other areas".
- **Zone** = WALK_SORT se (<=21000 Zone 1, <=35000 Zone 2, us se upar Zone 3, khali = Unassigned). Settings → Zones & areas mein koi area kisi aur zone mein bhej sakte hain; yeh browser mein yaad rehta hai.
- Agar aap ka asli zone-area mapping alag hai to mujhe bhej dein, usay seedha laga dunga.

## Firebase (Cloud copy, optional)
`firebase-config.js` mein aap ke project `wasa-dashboard-ksr` ki config pehle se hai. Chalane ke liye console mein:
1. **Authentication → Sign-in method → Email/Password** ko Enable karein.
2. **Authentication → Settings → Authorized domains** mein apna GitHub Pages domain (`<username>.github.io`) add karein.
3. **Storage** shuru karein (Get started). Naye projects par Google Blaze (pay-as-you-go) plan maang sakta hai; chhote data par free quota kaafi hota hai. Cloud copy na chahiye to yeh step chhor dein, app phir bhi chalti hai.
4. Storage → **Rules** mein `storage.rules` ki poori file paste kar ke Publish karein. Is ke baghair koi data safe nahi.
5. App ke **Data center → Cloud copy** mein email/password se *Create account*, phir *Save my files to cloud*. Doosre device par *Sign in → Load from cloud*.

Rules ki wajah se har user sirf apna folder dekh sakta hai. Firebase ki `apiKey` secret nahi hoti (har web app mein hoti hai); hifazat rules aur sign-in se hoti hai.

## Files
```
index.html            app ka dhancha
css/app.css           teen themes
js/xlsx-io.js         Excel/CSV parho aur likho (browser mein)
js/engine.js          files ko CONSUMER_NO par jorna, dashboard numbers
js/store.js           browser mein save (IndexedDB)
js/cloud.js           Firebase cloud copy
js/pages.js           Consumers, Export, Data center
js/app.js             Dashboard aur baaqi pages, settings
js/jszip.min.js       zip library (MIT)
firebase-config.js    Firebase config
storage.rules         Storage rules
```

## Abhi nahi (aglay marhale)
1-Link, Closed period, Approvals, Users/Roles wale pages abhi bhi dikhane ke liye sample hain. Login/permissions ka asli nizam, bill calculation checker aur WhatsApp/email aglay marhale mein jodein ge.
