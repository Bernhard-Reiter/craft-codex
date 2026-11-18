// VI4-Hülle 0.4.0 · Baustein der Plattform (VI4 Craft CAD). Werkfläche: VI4Huelle.baue, Menüleiste: VI4Huelle.menue (unten). Ein Modul ruft VI4Huelle.baue({...}) mit:
//   wurzel, buehne, karteLinks, karteRechts   CSS-Wähler der vorhandenen Elemente des Moduls
//   links, rechts, unten                      Listen von Knöpfen: { id, verb, wort, kurz(), warn(), karte, tun(), an() }
//      verb  -> Symbol aus symbole.json (Web: Phosphor light); nie ein Symbol direkt
//      karte -> 'links' | 'rechts': der Knopf öffnet die Karte (zweiter Klick schließt), tun() wählt vorher den Inhalt
//      an()  -> bool: Knopf zeigt gedrückt (für Schalter wie Fronten an / aus), ohne karte
//      kommt -> true: Platz für etwas noch nicht Gebautes (z. B. »Erfassen« mit LiDAR); Knopf steht da, tut nichts
//   beobachte                                  Wähler, bei deren Änderung der Kurzstand neu gelesen wird
//   start: { links: bool, rechts: bool }
// Die Hülle rechnet nichts und kennt kein Modul. Esc schließt die oberste Karte, »/« ruft den Knopf mit verb 'suchen'.
// Der RAHMEN (Kopf, Reiter, Unterzeile, Fläche) ist reines CSS (huelle.css Teil 1); seine Logik bleibt bei der Plattform.
(function () {
  const $ = (s, w) => (w || document).querySelector(s);
  // Im Rahmen der Plattform (iframe)? Dann blendet .vi4-nur-allein aus, was die Plattform schon zeigt.
  try { if (window.self !== window.top) document.documentElement.classList.add('vi4-im-rahmen'); }
  catch (e) { document.documentElement.classList.add('vi4-im-rahmen'); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let SYMBOLE = null;

  function symbol(verb) {
    const s = SYMBOLE && SYMBOLE.verben[verb];
    if (!s) { console.warn('[vi4-huelle] Verb ohne Symbol:', verb); return 'ph-question'; }
    return 'ph-' + s.web;
  }

  function baue(c) {
    const b = document.body, wurzel = $(c.wurzel);
    b.classList.add('vi4-huelle');
    wurzel.classList.add('vi4-werk');
    $(c.buehne).classList.add('vi4-buehne');
    const karte = { links: $(c.karteLinks), rechts: $(c.karteRechts) };
    for (const [seite, el] of Object.entries(karte)) {
      if (!el) continue;
      el.classList.add('vi4-karte-' + seite);
      el.insertAdjacentHTML('afterbegin', `<button class="vi4-karte-zu" data-vi4-zu="${seite}" aria-label="Karte schließen" title="Schließen (Esc)"><i class="ph-light ${symbol('schliessen')}" aria-hidden="true"></i></button>`);
    }
    const alle = [];
    const knopf = k => {
      alle.push(k);
      const kommt = k.kommt ? ' data-kommt aria-disabled="true"' : '';
      return `<button class="vi4-knopf" data-vi4="${esc(k.id)}" aria-pressed="false" title="${esc(k.wort)}${k.kommt ? ' (kommt)' : ''}"${kommt}>
      <span class="vi4-sym"><i class="ph-light ${symbol(k.verb)}" aria-hidden="true"></i></span>
      <span class="vi4-wort">${esc(k.wort)}<small></small></span></button>`; };
    const gruppen = (liste, unten) => (liste || []).map((g, i) => `<div class="vi4-gruppe ${unten && i === 0 ? 'unten' : ''} ${g.klasse || ''}">${g.knoepfe.map(knopf).join('')}</div>`).join('');
    // Norm 0.4.0, Standard-Werkzeuge an festen Plätzen: »Suchen« = eigene Gruppe unter der Eingabe (links), »Messen« = erster
    // Knopf der Gruppe links unten. Die Hülle holt beide aus den Listen des Moduls, egal wo es sie nennt.
    const raus = (liste, verb) => { let k = null; for (const g of liste || []) { const i = g.knoepfe.findIndex(x => x.verb === verb); if (i >= 0) { k = g.knoepfe.splice(i, 1)[0]; } } return k; };
    const leer = liste => (liste || []).filter(g => g.knoepfe.length);
    const lListe = [...(c.links || [])], uListe = [...(c.unten || [])].map(g => ({ ...g, knoepfe: [...g.knoepfe] }));
    lListe.forEach((g, i) => { lListe[i] = { ...g, knoepfe: [...g.knoepfe] }; });
    const kSuchen = raus(lListe, 'suchen') || raus(uListe, 'suchen'), kMessen = raus(lListe, 'messen') || raus(uListe, 'messen');
    const linksFertig = leer(lListe).concat(kSuchen ? [{ knoepfe: [kSuchen], klasse: 'vi4-std-suchen' }] : []);
    const untenFertig = leer(uListe);
    if (kMessen) { if (untenFertig.length) untenFertig[0].knoepfe.unshift(kMessen); else untenFertig.push({ knoepfe: [kMessen] }); }
    wurzel.insertAdjacentHTML('beforeend',
      `<nav class="vi4-schiene links" aria-label="Werkzeuge">${gruppen(linksFertig)}${gruppen(untenFertig, true)}</nav>
       <nav class="vi4-schiene rechts" aria-label="Infos">${gruppen(c.rechts)}</nav>`);

    const offen = s => b.classList.contains('vi4-' + s + '-auf');
    let aktiv = { links: null, rechts: null };
    const setze = (s, auf, id) => { b.classList.toggle('vi4-' + s + '-auf', auf); if (id !== undefined) aktiv[s] = id; stand(); };

    function stand() {
      for (const k of alle) {
        const el = wurzel.querySelector(`[data-vi4="${k.id}"]`); if (!el) continue;
        const an = k.karte ? offen(k.karte) && (k.istAktiv ? k.istAktiv() : aktiv[k.karte] === k.id) : !!(k.an && k.an());
        el.setAttribute('aria-pressed', String(an));
        const f = el.querySelector('.vi4-wort small');
        f.textContent = k.kommt ? 'kommt' : k.kurz ? k.kurz() : (k.an ? (k.an() ? 'an' : 'aus') : '');
        f.classList.toggle('warn', !!(k.warn && k.warn()));
      }
    }

    wurzel.addEventListener('click', e => {
      const zu = e.target.closest('[data-vi4-zu]');
      if (zu) return setze(zu.dataset.vi4Zu, false);
      const el = e.target.closest('.vi4-knopf'); if (!el) return;
      const k = alle.find(x => x.id === el.dataset.vi4); if (!k || k.kommt) return;
      if (k.karte) {
        const war = offen(k.karte) && (k.istAktiv ? k.istAktiv() : aktiv[k.karte] === k.id);
        if (war && !k.immerOffen) return setze(k.karte, false);
        if (k.tun) k.tun();
        return setze(k.karte, true, k.id);
      }
      if (k.tun) k.tun();
      setTimeout(stand, 0);
    });
    document.addEventListener('keydown', e => {
      const feld = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if (e.key === 'Escape' && !(c.escFrei && !c.escFrei())) {
        if (offen('rechts')) setze('rechts', false); else if (offen('links')) setze('links', false);
      }
      if (e.key === '/' && !feld) {
        const k = alle.find(x => x.verb === 'suchen');
        if (k) { e.preventDefault(); wurzel.querySelector(`[data-vi4="${k.id}"]`).click(); }
      }
    });
    const beob = new MutationObserver(() => { clearTimeout(beob.t); beob.t = setTimeout(stand, 30); });
    for (const s of c.beobachte || []) { const el = $(s); if (el) beob.observe(el, { subtree: true, childList: true, characterData: true, attributes: true }); }
    const st = c.start || {};
    if (st.links) { const k = alle.find(x => x.karte === 'links'); setze('links', true, st.linksId || (k && k.id)); }
    if (st.rechts) { const k = alle.find(x => x.karte === 'rechts'); setze('rechts', true, st.rechtsId || (k && k.id)); }
    stand();
    return { stand, setze, offen };
  }

  // ===== MENÜLEISTE (Norm 0.4.0) =====
  // VI4Huelle.menue({ ziel, name, menues, verlauf, mitte, meldung, ansicht, schliessen, haupt, thema, beobachte }) baut in `ziel`
  // (leeres Element des Moduls) die acht Plätze in fester Reihenfolge:
  //   1 name:{ titel, zusatz() }          2 Datei · Bearbeiten · Einfügen · Ansicht · Darstellung · Hilfe (immer alle sechs)
  //   3 verlauf:{ zurueck:{tun,aus()}, vor:{…} } oder fehlt -> beide grau mit »kommt«
  //   4 mitte:[Wähler]  5 meldung:[Wähler]  (vorhandene Elemente des Moduls werden umgehängt; ihre IDs und Handler bleiben)
  //   6 ansicht:[{ wort, tun, an() }]     7 schliessen  8 haupt   je { el:Wähler, sichtbar() } oder { wort, verb, tun, sichtbar() }
  // menues: { datei:[…], … } Einträge { t, kbd, tun, aus(), an(), art:'haken'|'radio' } oder '-'.
  // Die Hülle ergänzt Standard-Einträge selbst: Bearbeiten = Rückgängig/Wiederholen, Darstellung = Hell/Dunkel/Automatisch
  // (thema:{ wahl(), setze(w) }), Hilfe = Tasten. Ein leeres Menü zeigt »Hier gibt es noch nichts«.
  const MENUES = [['datei', 'Datei'], ['bearbeiten', 'Bearbeiten'], ['einfuegen', 'Einfügen'], ['ansicht', 'Ansicht'], ['darstellung', 'Darstellung'], ['hilfe', 'Hilfe']];
  function menue(c) {
    const leiste = $(c.ziel);
    leiste.classList.add('vi4-menue'); leiste.setAttribute('aria-label', 'Menüleiste');
    const sym = v => `<i class="ph-light ${symbol(v)}" aria-hidden="true"></i>`;
    const vl = c.verlauf || {};
    leiste.innerHTML =
      `<button type="button" class="vi4-m-name" data-m="name"${c.name && c.name.menue ? ' aria-haspopup="menu" aria-expanded="false"' : ''}><b></b><span></span>${c.name && c.name.menue ? sym('aufklappen') : ''}</button>
       <span class="vi4-m-trenn" aria-hidden="true"></span>
       <button type="button" class="vi4-m-alle" data-m="alle" aria-haspopup="menu" aria-expanded="false">${sym('menue')}<span>Menü</span></button>
       <nav class="vi4-m-leiste" aria-label="Menüs">${MENUES.map(([id, w]) => `<button type="button" data-m="${id}" aria-haspopup="menu" aria-expanded="false">${w}</button>`).join('')}</nav>
       <span class="vi4-m-trenn" aria-hidden="true"></span>
       <button type="button" class="vi4-m-symbol" data-m="zurueck" aria-label="Rückgängig" title="Rückgängig · Strg Z${vl.zurueck ? '' : ' (kommt)'}">${sym('rueckgaengig')}</button>
       <button type="button" class="vi4-m-symbol" data-m="vor" aria-label="Wiederholen" title="Wiederholen · Strg Y${vl.vor ? '' : ' (kommt)'}">${sym('wiederholen')}</button>
       <div class="vi4-m-mitte"></div>
       <p class="vi4-m-meldung" role="status"></p>
       <div class="vi4-m-ansicht" role="group" aria-label="Ansicht"></div>
       <span class="vi4-m-platz" data-platz="schliessen"></span>
       <span class="vi4-m-platz" data-platz="haupt"></span>`;
    const liste = document.createElement('div');
    liste.className = 'vi4-m-liste'; liste.setAttribute('role', 'menu'); liste.hidden = true;
    document.body.appendChild(liste);
    const platz = s => leiste.querySelector(s);
    for (const s of c.mitte || []) { const el = $(s); if (el) platz('.vi4-m-mitte').appendChild(el); }
    for (const s of c.meldung || []) { const el = $(s); if (el) platz('.vi4-m-meldung').appendChild(el); }
    platz('.vi4-m-ansicht').innerHTML = (c.ansicht || []).map((a, i) => `<button type="button" data-a="${i}" aria-pressed="false">${esc(a.wort)}</button>`).join('');
    // Schließen + Hauptknopf: vorhandenes Element umhängen oder neu bauen
    const knopfIn = (art, k, klasse) => {
      if (!k) return null;
      const ort = platz(`[data-platz="${art}"]`);
      let el = k.el ? $(k.el) : null;
      if (!el) {
        el = document.createElement('button'); el.type = 'button';
        el.innerHTML = (k.verb ? sym(k.verb) : '') + `<span>${esc(k.wort)}</span>` + (k.kbd ? ` <kbd>${esc(k.kbd)}</kbd>` : '');
        if (k.tun) el.addEventListener('click', () => { k.tun(); setTimeout(stand, 0); });
      }
      el.classList.add(klasse); ort.replaceWith(el); return el;
    };
    const elZu = knopfIn('schliessen', c.schliessen, 'vi4-m-zu'), elHaupt = knopfIn('haupt', c.haupt, 'vi4-m-haupt');

    // Einträge je Menü: Modul + Standard der Hülle
    const th = c.thema;
    const eintraege = id => {
      let l = [...((c.menues || {})[id] || [])];
      if (id === 'bearbeiten') l = [{ t: 'Rückgängig', kbd: 'Strg Z', tun: vl.zurueck && vl.zurueck.tun, aus: () => !vl.zurueck || (vl.zurueck.aus && vl.zurueck.aus()) },
                                    { t: 'Wiederholen', kbd: 'Strg Y', tun: vl.vor && vl.vor.tun, aus: () => !vl.vor || (vl.vor.aus && vl.vor.aus()) }].concat(l.length ? ['-'] : [], l);
      if (id === 'darstellung' && th) l = l.concat(l.length ? ['-'] : [], [['auto', 'Wie das Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']]
        .map(([w, t]) => ({ t, art: 'radio', an: () => th.wahl() === w, tun: () => th.setze(w) })));
      if (id === 'hilfe') l = l.concat(l.length ? ['-'] : [], [{ t: 'Suchen', kbd: '/', aus: () => true }, { t: 'Karte oder Menü schließen', kbd: 'Esc', aus: () => true }]);
      if (id === 'name') l = [...(c.name.menue || [])];
      if (id === 'alle') l = MENUES.flatMap(([m, w]) => { const x = eintraege(m).filter(e => e !== '-'); return x.length ? [{ titel: w }, ...x] : []; });
      return l.length ? l : [{ t: 'Hier gibt es noch nichts', aus: () => true }];
    };
    let offen = null, aktuell = [];
    const zu = (fokus) => { if (!offen) return; const k = offen; offen = null; liste.hidden = true; liste.innerHTML = ''; k.setAttribute('aria-expanded', 'false'); if (fokus) k.focus(); };
    const auf = knopf => {
      if (offen === knopf) return zu(true);
      zu(); offen = knopf; aktuell = eintraege(knopf.dataset.m);
      liste.innerHTML = aktuell.map((e, i) => e === '-' ? '<div class="vi4-m-strich" role="separator"></div>'
        : e.titel ? `<div class="vi4-m-titel">${esc(e.titel)}</div>`
        : `<button type="button" class="vi4-m-eintrag" role="${e.art === 'radio' ? 'menuitemradio' : e.art === 'haken' ? 'menuitemcheckbox' : 'menuitem'}"`
          + (e.art ? ` aria-checked="${!!(e.an && e.an())}"` : '') + ((e.aus && e.aus()) || !e.tun ? ' disabled' : '') + ` data-i="${i}"><span>${esc(e.t)}</span>${e.kbd ? `<kbd>${esc(e.kbd)}</kbd>` : ''}</button>`).join('');
      liste.setAttribute('aria-label', knopf.textContent.trim());
      liste.hidden = false; knopf.setAttribute('aria-expanded', 'true');
      const r = knopf.getBoundingClientRect();
      liste.style.left = Math.max(8, Math.min(r.left, innerWidth - liste.offsetWidth - 8)) + 'px';
      liste.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - liste.offsetHeight - 8)) + 'px';
      const erster = liste.querySelector('.vi4-m-eintrag:not(:disabled)'); if (erster) erster.focus();
    };
    leiste.addEventListener('click', e => {
      const k = e.target.closest('[data-m]'); const a = e.target.closest('[data-a]');
      if (a) { const x = c.ansicht[+a.dataset.a]; if (x.tun) x.tun(); return setTimeout(stand, 0); }
      if (!k) return;
      const m = k.dataset.m;
      if (m === 'zurueck' || m === 'vor') { const v = vl[m]; if (v && v.tun) v.tun(); return setTimeout(stand, 0); }
      if (m === 'name' && !(c.name && c.name.menue)) return;
      auf(k);
    });
    liste.addEventListener('click', e => {
      const b = e.target.closest('.vi4-m-eintrag'); if (!b || b.disabled) return;
      const x = aktuell[+b.dataset.i]; zu(true); if (x && x.tun) x.tun(); setTimeout(stand, 0);
    });
    document.addEventListener('pointerdown', e => { if (offen && !liste.contains(e.target) && !offen.contains(e.target)) zu(); });
    // Esc und Pfeile im offenen Menü kommen vor allen anderen Tasten der Seite (Fangphase am Fenster)
    window.addEventListener('keydown', e => {
      if (!offen) return;
      const reihe = [...liste.querySelectorAll('.vi4-m-eintrag:not(:disabled)')], i = reihe.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); zu(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation();
        const n = reihe[(i + (e.key === 'ArrowDown' ? 1 : -1) + reihe.length) % reihe.length]; if (n) n.focus(); }
    }, true);
    window.addEventListener('resize', () => zu());

    function stand() {
      if (c.name) { platz('.vi4-m-name b').textContent = c.name.titel || ''; platz('.vi4-m-name span').textContent = c.name.zusatz ? c.name.zusatz() : ''; }
      for (const m of ['zurueck', 'vor']) { const v = vl[m]; platz(`[data-m="${m}"]`).disabled = !v || !!(v.aus && v.aus()); }
      (c.ansicht || []).forEach((a, i) => platz(`[data-a="${i}"]`).setAttribute('aria-pressed', String(!!(a.an && a.an()))));
      if (elZu) elZu.hidden = !!(c.schliessen.sichtbar && !c.schliessen.sichtbar());
      if (elHaupt) elHaupt.hidden = !!(c.haupt.sichtbar && !c.haupt.sichtbar());
    }
    const beob = new MutationObserver(() => { clearTimeout(beob.t); beob.t = setTimeout(stand, 30); });
    for (const s of c.beobachte || []) { const el = $(s); if (el) beob.observe(el, { subtree: true, childList: true, characterData: true, attributes: true }); }
    stand();
    return { stand, zu };
  }

  // symbole.json liegt neben huelle.js; baue() und menue() warten auf die Liste
  const hier = (document.currentScript && document.currentScript.src) || '';
  const bereit = fetch(new URL('symbole.json', hier || location.href)).then(r => r.json()).then(j => { SYMBOLE = j; });
  window.VI4Huelle = { baue: c => bereit.then(() => baue(c)), menue: c => bereit.then(() => menue(c)), version: '0.4.0' };
})();
