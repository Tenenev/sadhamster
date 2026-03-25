(function () {
  "use strict";
  const COCKTAILS = JSON.parse(document.getElementById("payload").textContent);

  const slug = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-|-$/g, "") || "x";

  let deck = [];
  let deckPos = 0;
  let revealed = false;
  let randIdx = null;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function el(tag, cls, attrs) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    }
    return n;
  }

  function iceNode(c) {
    if (c.ice === true) {
      const s = el("span", "ice-badge ice-badge--yes", { title: "С льдом" });
      const t = el("span", "ice-badge__hint");
      t.textContent = "с льдом";
      s.appendChild(t);
      return s;
    }
    if (c.ice === false) {
      const s = el("span", "ice-badge ice-badge--no", { title: "Без льда" });
      const t = el("span", "ice-badge__hint");
      t.textContent = "без льда";
      s.appendChild(t);
      return s;
    }
    return null;
  }

  function fillBadges(container, c) {
    const ib = iceNode(c);
    if (ib) container.appendChild(ib);
    if (c.method) {
      const m = el("span", "badge method");
      m.textContent = c.method;
      container.appendChild(m);
    }
  }

  function fillIngredients(ul, c) {
    (c.ingredients || []).forEach((ing) => {
      const li = el("li");
      const n = el("span", "ing-name");
      n.textContent = ing.name || "";
      const a = el("span", "ing-amt");
      a.textContent = ing.amount || "";
      li.appendChild(n);
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  function buildCard(c) {
    const study = document.body.classList.contains("study-on");
    const article = el("article", "card");
    const wrap = el("div", "card-visual-wrap");
    const top = el("div", "card-top");
    const stack = el("div", "card-photo-stack");
    if (c.img) {
      stack.appendChild(
        el("img", "card-visual", {
          src: c.img,
          alt: c.glass || "Посуда",
          decoding: "async",
          width: "88",
          height: "88",
        })
      );
    }
    if (c.glass) {
      const cap = el("span", "glass-caption");
      cap.textContent = c.glass;
      stack.appendChild(cap);
    }
    top.appendChild(stack);
    const head = el("div", "card-head");
    const h3 = el("h3", "card-name");
    h3.textContent = c.name || "";
    head.appendChild(h3);
    if (c.id != null) {
      const num = el("span", "card-num");
      num.textContent = "#" + c.id;
      head.appendChild(num);
    }
    top.appendChild(head);
    wrap.appendChild(top);

    const badges = el("div", "badges badges-detail");
    fillBadges(badges, c);
    if (study) {
      const hid = el("div", "study-hide");
      hid.appendChild(badges);
      wrap.appendChild(hid);
    } else {
      wrap.appendChild(badges);
    }

    const ul = el("ul", "ingredients");
    fillIngredients(ul, c);
    if (study) {
      const hid = el("div", "study-hide");
      hid.appendChild(ul);
      wrap.appendChild(hid);
    } else {
      wrap.appendChild(ul);
    }

    if (c.garnish) {
      const g = el("div", "card-garnish");
      if (study) g.classList.add("study-hide");
      const strong = el("strong");
      strong.textContent = "Украшение:";
      g.appendChild(strong);
      g.appendChild(document.createTextNode(" " + c.garnish));
      wrap.appendChild(g);
    }

    if (study) {
      article.addEventListener("click", () => article.classList.toggle("revealed"));
    }
    article.appendChild(wrap);
    return article;
  }

  function renderReference() {
    const main = document.getElementById("ref-main");
    main.textContent = "";
    const nav = document.getElementById("ref-nav");
    nav.textContent = "";
    const cats = [];
    const seen = new Set();
    COCKTAILS.forEach((c) => {
      if (c.category && !seen.has(c.category)) {
        seen.add(c.category);
        cats.push(c.category);
      }
    });
    cats.forEach((cat) => {
      const a = el("a", null, { href: "#cat-" + slug(cat) });
      const sub = COCKTAILS.filter((x) => x.category === cat).length;
      a.textContent = cat + " · " + sub;
      nav.appendChild(a);
    });
    cats.forEach((cat) => {
      const sec = el("section", "block");
      sec.id = "cat-" + slug(cat);
      sec.appendChild((() => {
        const h2 = el("h2", "block-title");
        h2.textContent = cat;
        return h2;
      })());
      const sub = el("p", "block-sub");
      const list = COCKTAILS.filter((x) => x.category === cat);
      sub.textContent = list.length + " поз.";
      sec.appendChild(sub);
      const grid = el("div", "grid");
      list.forEach((c) => {
        const card = buildCard(c);
        card.dataset.q =
          (c.name || "") +
          " " +
          (c.category || "") +
          " " +
          (c.ingredients || []).map((i) => (i.name || "") + " " + (i.amount || "")).join(" ");
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      const pl = el("p", "top-link");
      const ta = el("a", null, { href: "#top" });
      ta.textContent = "↑ Наверх";
      pl.appendChild(ta);
      sec.appendChild(pl);
      main.appendChild(sec);
    });
  }

  function applySearch(q) {
    const qq = (q || "").trim().toLowerCase();
    document.querySelectorAll("#ref-main .card").forEach((card) => {
      const hay = (card.dataset.q || "").toLowerCase();
      card.hidden = !!(qq && !hay.includes(qq));
    });
    document.querySelectorAll("#ref-main .block").forEach((sec) => {
      const anyVis = [...sec.querySelectorAll(".card")].some((c) => !c.hidden);
      sec.hidden = !!(qq && !anyVis);
    });
  }

  function getDeckFilter() {
    const sel = document.getElementById("deck-cat");
    return sel ? sel.value : "";
  }

  function buildDeck() {
    let idx = COCKTAILS.map((_, i) => i);
    const cat = getDeckFilter();
    if (cat) idx = idx.filter((i) => COCKTAILS[i].category === cat);
    shuffle(idx);
    deck = idx;
    deckPos = 0;
    revealed = false;
    renderDeckFlash();
    updateDeckProgress();
  }

  function updateDeckProgress() {
    const eln = document.getElementById("deck-progress");
    if (!eln) return;
    if (!deck.length) {
      eln.textContent = "—";
      return;
    }
    eln.textContent = deckPos + 1 + " / " + deck.length;
  }

  function renderDeckFlash() {
    const root = document.getElementById("flash-root");
    root.textContent = "";
    if (!deck.length) {
      const p = el("p", null);
      p.style.cssText = "text-align:center;color:var(--muted)";
      p.textContent = "Нет позиций — выберите другую категорию.";
      root.appendChild(p);
      return;
    }
    const idx = deck[deckPos];
    renderFlashCard(root, COCKTAILS[idx]);
  }

  function renderRandFlash() {
    const root = document.getElementById("rand-root");
    root.textContent = "";
    if (randIdx === null) {
      randIdx = Math.floor(Math.random() * COCKTAILS.length);
    }
    renderFlashCard(root, COCKTAILS[randIdx]);
  }

  function renderFlashCard(root, c) {
    const box = el("div", "flash-card");
    const inner = el("div", "flash-inner");
    const top = el("div", "card-top");
    const stack = el("div", "card-photo-stack");
    if (c.img) {
      stack.appendChild(
        el("img", "card-visual", {
          src: c.img,
          alt: c.glass || "",
          width: "96",
          height: "96",
        })
      );
    }
    if (c.glass) {
      const cap = el("span", "glass-caption");
      cap.textContent = c.glass;
      stack.appendChild(cap);
    }
    top.appendChild(stack);
    const head = el("div", "card-head");
    const h3 = el("h3", "card-name");
    h3.textContent = c.name || "";
    head.appendChild(h3);
    if (c.category) {
      const catp = el("p", "flash-cat");
      catp.textContent = c.category;
      head.appendChild(catp);
    }
    top.appendChild(head);
    inner.appendChild(top);

    const ans = el("div", revealed ? "flash-answer is-visible" : "flash-answer");
    const badges = el("div", "badges badges-detail");
    fillBadges(badges, c);
    ans.appendChild(badges);
    const ul = el("ul", "ingredients");
    fillIngredients(ul, c);
    ans.appendChild(ul);
    if (c.garnish) {
      const g = el("div", "card-garnish");
      const st = el("strong");
      st.textContent = "Украшение:";
      g.appendChild(st);
      g.appendChild(document.createTextNode(" " + c.garnish));
      ans.appendChild(g);
    }
    inner.appendChild(ans);

    if (!revealed) {
      const veil = el("div", "flash-veil");
      const hint = el("p", "flash-hint");
      hint.textContent =
        "Вспомните состав, метод и посуду — затем «Показать ответ» (пробел в режиме карточек)";
      veil.appendChild(hint);
      inner.appendChild(veil);
    }
    box.appendChild(inner);
    root.appendChild(box);
  }

  function nextCard() {
    if (!deck.length) return;
    if (deckPos < deck.length - 1) {
      deckPos++;
      revealed = false;
    } else {
      buildDeck();
      return;
    }
    renderDeckFlash();
    updateDeckProgress();
  }

  document.getElementById("q").addEventListener("input", (e) => applySearch(e.target.value));
  document.getElementById("study-toggle").addEventListener("change", (e) => {
    document.body.classList.toggle("study-on", e.target.checked);
    renderReference();
    applySearch(document.getElementById("q").value);
  });

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.querySelectorAll(".mode-panel").forEach((p) => p.classList.add("hidden"));
      document.getElementById("panel-" + mode).classList.remove("hidden");
      if (mode === "cards" && deck.length === 0) buildDeck();
      if (mode === "rand" && randIdx === null) {
        revealed = false;
        renderRandFlash();
      }
    });
  });

  document.getElementById("btn-new-deck").addEventListener("click", () => buildDeck());
  document.getElementById("btn-reveal").addEventListener("click", () => {
    revealed = true;
    renderDeckFlash();
  });
  document.getElementById("btn-next").addEventListener("click", () => nextCard());
  document.getElementById("deck-cat").addEventListener("change", () => buildDeck());

  document.getElementById("btn-rand").addEventListener("click", () => {
    randIdx = null;
    revealed = false;
    renderRandFlash();
  });
  document.getElementById("btn-rand-reveal").addEventListener("click", () => {
    revealed = true;
    renderRandFlash();
  });

  document.addEventListener("keydown", (e) => {
    const cardsOn = !document.getElementById("panel-cards").classList.contains("hidden");
    if (!cardsOn) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (!revealed) {
        revealed = true;
        renderDeckFlash();
      } else {
        nextCard();
      }
    }
  });

  renderReference();
  updateDeckProgress();
})();
