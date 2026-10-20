# BREAK FREE — Google Play: plan bez nepotrebnog troška

Status: **nije spremno za plaćenu prodaju**. Ovaj dokument nije potvrda odobrenja Google Playa.

## Besplatni koraci koje možemo napraviti sada
- [x] Funkcionalna web beta
- [x] Android debug APK i nepotpisani AAB iz GitHub Actions
- [x] Google Play Billing biblioteka uključena u kod, **BILLING_ENABLED=false**
- [ ] Test na stvarnom Android uređaju (spremanje, povrat podataka, offline, navigacija)
- [ ] Neovisna provjera sigurnosti i utjecaja virtualne cigarete na žudnju; omogućiti alternativu bez prikaza cigarete
- [ ] Stvarne VIP funkcije izrađene, testirane i točno opisane
- [ ] Pravila privatnosti: provjeriti sve podatke i mrežne pozive za konačnu verziju
- [ ] Materijali za trgovinu: opis, snimke zaslona, ikona, ocjena sadržaja i izjava o podacima
- [ ] Priprema upravljanja pretplatom, prava pristupa i obnavljanja nakon promjene uređaja

## Koraci koji zahtijevaju vlasnika i/ili novac
1. Prije otvaranja naplate provjeriti zakonit poslovni/porezni status za redovitu prodaju iz Hrvatske.
2. Otvoriti Google Play Console i platiti **25 USD jednokratno**; vlasnik potvrđuje osobne podatke i identitet.
3. Stvoriti aplikaciju i povezati profil za primanje uplata; provjeriti javno prikazane podatke i Googleove zahtjeve.
4. Napraviti **vlastiti privatni release signing key**. Ne smije se objavljivati u javnom GitHub repozitoriju.
5. Prijaviti prvi AAB u interni test; za nove osobne račune može biti potreban i obvezni zatvoreni test.
6. Stvoriti i aktivirati Google Play pretplatu i bazni plan; cijene i regionalne poreze provjeriti u Consoleu.
7. Implementirati kupnju, sigurno potvrđivanje na poslužitelju, acknowledgement i obradu povrata/otkaza. **Ne dodjeljivati VIP na temelju lokalnog callbacka.**
8. Provesti kupnju putem licencnih testera bez stvarne naplate pa tek potom razmotriti javnu prodaju.
9. Google mora odobriti aplikaciju; nijedan korak ne jamči prolazak politike o duhanu.

## Trenutačne prepreke
- Nema Google Play Console računa ni trgovinskog proizvoda.
- Debug APK nije produkcijski potpisana aplikacija; AAB je nepotpisan.
- Nema sigurnog backend sustava za pretplate niti stvarnih dovršenih VIP pogodnosti.
- Simulacija cigarete može povećati žudnju i otežati odobrenje trgovine.
- Nisu obavljeni testovi na stvarnim Android uređajima.

**Pravilo:** naplata mora ostati isključena dok svi uvjeti ne budu stvarno ispunjeni.
