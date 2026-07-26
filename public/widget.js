(function () {
  if (window.__shadyyWidgetLoaded) return;
  window.__shadyyWidgetLoaded = true;

  const currentScript = document.currentScript;
  const tenantId = currentScript?.getAttribute("data-tenant") || "shadyy";
  const resolveApiBase = () => {
    const explicitApiBase = currentScript?.getAttribute("data-api-base");
    if (explicitApiBase) return explicitApiBase.replace(/\/$/, "");

    const scriptOrigin = new URL(currentScript?.src || window.location.href).origin;
    const host = window.location.hostname.toLowerCase();

    if (host === "shadyy.org" || host === "www.shadyy.org") {
      return "https://shadyy.vercel.app";
    }

    return scriptOrigin;
  };
  const apiBase = resolveApiBase();

  const defaultSelectors = {
    productTitle: ["[data-product-title]", "h1"],
    price: ["[data-product-price]", "[itemprop='price']", ".price"],
    category: ["[data-category]", "[aria-label='breadcrumb']", ".breadcrumb"],
    searchInput: ["input[type='search']", "input[name='q']", "input[name='search']"],
    productCards: ["[data-product-card]", ".product-card"],
    addToCart: ["[data-add-to-cart]", "button[name='add']", "button", "a[href]"],
    customActions: ["[data-shadyy-action='true']"],
  };

  const defaultTenantConfig = {
    tenantId,
    brandName: "Shadyy",
    widget: {
      primaryColor: "#f97316",
      accentColor: "#ffffff",
      launcherText: "☺",
      logoUrl: "",
      starterPrompts: [
        "What can I do on this page?",
        "How do I use the Free AI PPT option?",
        "Which option should I open?",
        "Request a callback",
      ],
    },
    selectors: defaultSelectors,
    searchParams: ["q", "query", "search", "keyword"],
  };

  let tenantConfig = defaultTenantConfig;

  const state = {
    open: false,
    busy: false,
    leadOpen: false,
    leadSubmitting: false,
    leadDraft: null,
    chatId:
      window.localStorage.getItem("shadyy-widget-chat-id") ||
      "shadyy-" + Math.random().toString(36).slice(2) + Date.now().toString(36),
  };
  window.localStorage.setItem("shadyy-widget-chat-id", state.chatId);

  const mergeTenantConfig = (config) => ({
    ...defaultTenantConfig,
    ...config,
    widget: {
      ...defaultTenantConfig.widget,
      ...(config?.widget || {}),
      starterPrompts:
        config?.widget?.starterPrompts || defaultTenantConfig.widget.starterPrompts,
    },
    selectors: {
      ...defaultSelectors,
      ...(config?.selectors || {}),
    },
    searchParams: config?.searchParams || defaultTenantConfig.searchParams,
  });

  const resolveTenantConfig = () => tenantConfig;

  const applyTenantBranding = () => {
    if (!panel || !button) return;

    panel.style.setProperty(
      "--shadyy-widget-primary",
      tenantConfig.widget.primaryColor || defaultTenantConfig.widget.primaryColor
    );
    panel.style.setProperty(
      "--shadyy-widget-accent",
      tenantConfig.widget.accentColor || defaultTenantConfig.widget.accentColor
    );
    button.style.setProperty(
      "--shadyy-widget-primary",
      tenantConfig.widget.primaryColor || defaultTenantConfig.widget.primaryColor
    );
    button.style.setProperty(
      "--shadyy-widget-accent",
      tenantConfig.widget.accentColor || defaultTenantConfig.widget.accentColor
    );
    const markText = tenantConfig.widget.launcherText || defaultTenantConfig.widget.launcherText;
    const launcherIcons = button.querySelectorAll("[data-launcher-icon]");
    if (launcherIcons.length) {
      launcherIcons.forEach((icon) => {
        icon.textContent = markText;
      });
    } else {
      const mark = button.querySelector("[data-launcher-mark]");
      if (mark) mark.textContent = markText;
    }

    const title = panel.querySelector("[data-title]");
    if (title) title.textContent = `${tenantConfig.brandName || "Shadyy"} Assistant`;

    const avatar = panel.querySelector("[data-avatar]");
    if (avatar) {
      avatar.innerHTML = "";
      if (tenantConfig.widget.logoUrl) {
        const logo = document.createElement("img");
        logo.src = tenantConfig.widget.logoUrl;
        logo.alt = "";
        avatar.appendChild(logo);
      } else {
        avatar.textContent = tenantConfig.widget.launcherText || defaultTenantConfig.widget.launcherText;
      }
    }
  };

  const loadTenantConfig = async () => {
    try {
      const response = await fetch(
        `${apiBase}/api/shadyy-widget-config?tenant=${encodeURIComponent(
          tenantId
        )}&host=${encodeURIComponent(window.location.host)}`
      );

      if (!response.ok) return;

      const data = await response.json();
      if (data?.config) {
        tenantConfig = mergeTenantConfig(data.config);
        applyTenantBranding();
        renderStarterPrompts();
      }
    } catch {
      tenantConfig = defaultTenantConfig;
    }
  };

  const normalizeText = (value) => (value || "").replace(/\s+/g, " ").trim();

  const getAccessibleText = (element) =>
    normalizeText(
      element.innerText ||
        element.textContent ||
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        ""
    );

  const isVisible = (element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  };

  const normalizeUrl = (url) => {
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return "";
    }
  };

  const detectPageType = () => {
    const path = window.location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/templates")) return "templates";
    if (path.startsWith("/template")) return "template-detail";
    if (path.startsWith("/prompt-to-website")) return "prompt-to-website";
    if (path.startsWith("/mini-store")) return "mini-store";
    if (path.startsWith("/ppt")) return "ai-ppt";
    if (path.startsWith("/editor")) return "editor";
    if (path.startsWith("/contact")) return "contact";
    if (path.startsWith("/about")) return "about";
    if (path.startsWith("/privacy")) return "privacy";
    if (path.startsWith("/terms")) return "terms";
    return "general";
  };

  const querySelectorList = (selectors) =>
    selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));

  const readFirstVisibleText = (selectors) => {
    const element = querySelectorList(selectors).find(isVisible);
    return element ? getAccessibleText(element) : "";
  };

  const collectLinks = () => {
    const seen = new Set();
    return Array.from(document.querySelectorAll("a[href]"))
      .filter(isVisible)
      .map((link) => {
        const text = getAccessibleText(link);
        const url = normalizeUrl(link.getAttribute("href") || "");
        return { text, url };
      })
      .filter((link) => {
        if (!link.text || !link.url || seen.has(link.url)) return false;
        seen.add(link.url);
        return true;
      })
      .slice(0, 20);
  };

  const collectCtas = () => {
    const ctaWords =
      /buy|cart|checkout|contact|demo|preview|download|start|try|get|book|call|subscribe|sign|login|open|create|generate|request/i;
    const elements = Array.from(
      document.querySelectorAll("a[href], button, [role='button'], [data-shadyy-action='true']")
    );

    return elements
      .filter(isVisible)
      .map((element) => {
        const text = element.getAttribute("data-shadyy-action-text") || getAccessibleText(element);
        const href = element.getAttribute("data-shadyy-action-url") || element.getAttribute("href");
        return { text, url: href ? normalizeUrl(href) : "" };
      })
      .filter((cta) => cta.text && (cta.url || ctaWords.test(cta.text)))
      .slice(0, 12);
  };

  const getSearchQuery = (tenantConfig) => {
    const params = new URLSearchParams(window.location.search);
    for (const param of tenantConfig.searchParams) {
      const value = params.get(param);
      if (value) return value;
    }

    const input = querySelectorList(tenantConfig.selectors.searchInput).find(
      (element) => isVisible(element) && "value" in element
    );
    return input?.value?.trim?.() || "";
  };

  const collectProductCards = (tenantConfig) =>
    querySelectorList(tenantConfig.selectors.productCards)
      .filter(isVisible)
      .map((element) => {
        const title =
          element.getAttribute("data-product-title") ||
          element.querySelector("[data-product-title], h2, h3")?.textContent ||
          getAccessibleText(element);
        const price =
          element.getAttribute("data-product-price") ||
          element.querySelector("[data-product-price], [itemprop='price'], .price")?.textContent ||
          "";
        const link = element.querySelector("a[href]")?.getAttribute("href") || "";

        return {
          title: normalizeText(title).slice(0, 160),
          price: normalizeText(price).slice(0, 80),
          url: link ? normalizeUrl(link) : "",
        };
      })
      .filter((item) => item.title)
      .slice(0, 8);

  const collectTenantActions = (tenantConfig) =>
    querySelectorList([...tenantConfig.selectors.customActions, ...tenantConfig.selectors.addToCart])
      .filter(isVisible)
      .map((element) => {
        const text = element.getAttribute("data-shadyy-action-text") || getAccessibleText(element);
        const href = element.getAttribute("data-shadyy-action-url") || element.getAttribute("href");
        return { text, url: href ? normalizeUrl(href) : "" };
      })
      .filter((action) => action.text)
      .slice(0, 12);

  const collectPageContext = () => {
    const tenantConfig = resolveTenantConfig();
    const visibleRoot = document.querySelector("main") || document.body;
    const tenantContext = {
      tenantId: tenantConfig.tenantId,
      productTitle: readFirstVisibleText(tenantConfig.selectors.productTitle),
      price: readFirstVisibleText(tenantConfig.selectors.price),
      category: readFirstVisibleText(tenantConfig.selectors.category),
      searchQuery: getSearchQuery(tenantConfig),
      productCards: collectProductCards(tenantConfig),
      actions: collectTenantActions(tenantConfig),
    };

    return {
      tenantId: tenantConfig.tenantId,
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      pageType: detectPageType(),
      primaryHeading: normalizeText(document.querySelector("h1")?.textContent || ""),
      pageDescription:
        document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      visibleText: normalizeText(visibleRoot?.innerText || "").slice(0, 1200),
      links: collectLinks(),
      ctas: collectCtas(),
      tenantContext,
      updatedAt: new Date().toISOString(),
    };
  };

  const styles = `
    .shadyy-widget-shell, .shadyy-widget-shell * {
      box-sizing: border-box;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0;
    }
    .shadyy-widget-button {
      position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
      width: 108px; height: 108px; border: none; border-radius: 50%;
      background: var(--shadyy-widget-primary, #f97316);
      color: var(--shadyy-widget-accent, #ffffff);
      cursor: pointer; display: grid; place-content: center; overflow: hidden;
      padding: 0; font-size: 14px; font-weight: 850; line-height: 1;
      box-shadow: 0 24px 58px rgba(249, 115, 22, .34);
      transition: background 300ms, transform 200ms, box-shadow .18s ease, opacity .18s ease;
    }
    .shadyy-widget-button:hover {
      background: color-mix(in srgb, var(--shadyy-widget-primary, #f97316) 88%, #9a3412);
      transform: scale(1.05);
      box-shadow: 0 28px 70px rgba(249, 115, 22, .42);
    }
    .shadyy-widget-button:active { transform: translateY(0) scale(.98); }
    .shadyy-widget-button-text {
      position: absolute; inset: 0; margin: 0;
      pointer-events: none;
      animation: shadyy-widget-text-rotation 8s linear infinite;
    }
    .shadyy-widget-button-letter {
      position: absolute; left: 50%; top: 50%; z-index: 1;
      color: var(--shadyy-widget-accent, #ffffff);
      font-size: 12px; font-weight: 900; line-height: 1; white-space: nowrap;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-41px);
      transform-origin: center;
    }
    .shadyy-widget-button-mark {
      position: relative; z-index: 2; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: var(--shadyy-widget-accent, #ffffff);
      color: var(--shadyy-widget-primary, #f97316); font-size: 24px; font-weight: 850; line-height: 1;
      overflow: hidden;
    }
    .shadyy-widget-button-icon--copy {
      position: absolute;
      transform: translate(-150%, 150%);
    }
    .shadyy-widget-button:hover .shadyy-widget-button-icon,
    .shadyy-widget-button:focus-visible .shadyy-widget-button-icon {
      color: var(--shadyy-widget-primary, #f97316);
    }
    .shadyy-widget-button:hover .shadyy-widget-button-icon:first-child,
    .shadyy-widget-button:focus-visible .shadyy-widget-button-icon:first-child {
      transition: transform 0.3s ease-in-out;
      transform: translate(150%, -150%);
    }
    .shadyy-widget-button:hover .shadyy-widget-button-icon--copy,
    .shadyy-widget-button:focus-visible .shadyy-widget-button-icon--copy {
      transition: transform 0.3s ease-in-out 0.1s;
      transform: translate(0);
    }
    @keyframes shadyy-widget-text-rotation {
      to { rotate: 360deg; }
    }
    .shadyy-widget-panel {
      position: fixed; right: 24px; bottom: 148px; z-index: 2147483647;
      width: min(410px, calc(100vw - 32px)); height: min(660px, calc(100vh - 176px));
      display: none; overflow: hidden; border-radius: 28px;
      color: #101827;
      background:
        linear-gradient(135deg, rgba(255,255,255,.72), rgba(255,255,255,.48)),
        radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--shadyy-widget-accent, #2563eb) 28%, transparent), transparent 34%),
        radial-gradient(circle at 92% 20%, color-mix(in srgb, var(--shadyy-widget-primary, #111827) 18%, transparent), transparent 30%);
      box-shadow: 0 30px 90px rgba(15, 23, 42, .3), inset 0 1px 0 rgba(255,255,255,.82);
      border: 1px solid rgba(255, 255, 255, .58);
      backdrop-filter: blur(28px) saturate(170%); -webkit-backdrop-filter: blur(28px) saturate(170%);
      transform-origin: bottom right;
      opacity: 0; transform: translateY(10px) scale(.97);
      transition: opacity .18s ease, transform .18s ease;
    }
    .shadyy-widget-panel[data-open="true"] { display: flex; flex-direction: column; opacity: 1; transform: translateY(0) scale(1); }
    .shadyy-widget-header {
      position: relative; padding: 16px; display: flex; justify-content: space-between; align-items: center;
      color: #101827; border-bottom: 1px solid rgba(255,255,255,.54);
      background: rgba(255,255,255,.32);
    }
    .shadyy-widget-brand { display: flex; min-width: 0; align-items: center; gap: 11px; }
    .shadyy-widget-avatar {
      width: 38px; height: 38px; border-radius: 15px; display: grid; place-items: center;
      color: white; font-weight: 900; font-size: 16px;
      background: linear-gradient(135deg, var(--shadyy-widget-accent, #2563eb), var(--shadyy-widget-primary, #111827));
      box-shadow: 0 12px 24px rgba(15,23,42,.18), inset 0 1px 0 rgba(255,255,255,.5);
      overflow: hidden;
    }
    .shadyy-widget-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .shadyy-widget-title { font-weight: 820; font-size: 15px; line-height: 1.1; color: #111827; }
    .shadyy-widget-subtitle { margin-top: 3px; font-size: 12px; color: rgba(17,24,39,.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .shadyy-widget-actions { display: flex; gap: 8px; }
    .shadyy-widget-icon {
      border: 1px solid rgba(255,255,255,.72); background: rgba(255,255,255,.48); color: #111827; border-radius: 12px;
      min-width: 34px; height: 34px; cursor: pointer; font-size: 15px; font-weight: 800;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
    }
    .shadyy-widget-icon:hover { background: rgba(255,255,255,.72); }
    .shadyy-widget-messages {
      flex: 1; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    .shadyy-widget-message {
      max-width: 88%; padding: 12px 13px; border-radius: 18px; line-height: 1.45; font-size: 14px;
      white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .shadyy-widget-message[data-role="assistant"] {
      align-self: flex-start; background: rgba(255,255,255,.66); color: #111827; border: 1px solid rgba(255,255,255,.72);
      box-shadow: 0 10px 28px rgba(15,23,42,.08), inset 0 1px 0 rgba(255,255,255,.72);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    }
    .shadyy-widget-message[data-role="user"] {
      align-self: flex-end; background: linear-gradient(135deg, var(--shadyy-widget-accent, #2563eb), color-mix(in srgb, var(--shadyy-widget-primary, #111827) 72%, var(--shadyy-widget-accent, #2563eb)));
      color: white; box-shadow: 0 12px 24px rgba(37,99,235,.2);
    }
    .shadyy-widget-typing {
      display: inline-flex; align-items: center; gap: 5px; min-width: 68px;
    }
    .shadyy-widget-typing span {
      width: 7px; height: 7px; border-radius: 99px; background: color-mix(in srgb, var(--shadyy-widget-primary, #111827) 60%, white);
      animation: shadyy-widget-pulse 1s infinite ease-in-out;
    }
    .shadyy-widget-typing span:nth-child(2) { animation-delay: .14s; }
    .shadyy-widget-typing span:nth-child(3) { animation-delay: .28s; }
    @keyframes shadyy-widget-pulse {
      0%, 80%, 100% { transform: translateY(0); opacity: .38; }
      40% { transform: translateY(-4px); opacity: 1; }
    }
    .shadyy-widget-starters {
      display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 14px;
    }
    .shadyy-widget-starter {
      border: 1px solid rgba(255,255,255,.66); background: rgba(255,255,255,.54); color: #172033;
      border-radius: 999px; padding: 8px 10px; font-size: 12px; line-height: 1; cursor: pointer;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
    }
    .shadyy-widget-starter:hover { background: rgba(255,255,255,.78); }
    .shadyy-widget-lead {
      display: none; margin: 0 16px 12px; padding: 12px; border-radius: 18px;
      border: 1px solid rgba(255,255,255,.68); background: rgba(255,255,255,.56);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
    }
    .shadyy-widget-lead[data-open="true"] { display: block; }
    .shadyy-widget-lead-title { font-weight: 800; font-size: 13px; color: #111827; margin-bottom: 9px; }
    .shadyy-widget-lead-grid { display: grid; gap: 8px; }
    .shadyy-widget-lead input, .shadyy-widget-lead textarea {
      width: 100%; border: 1px solid rgba(17,24,39,.12); border-radius: 12px;
      background: rgba(255,255,255,.7); padding: 9px 10px; font-size: 13px; color: #111827; outline: none;
    }
    .shadyy-widget-lead textarea { min-height: 58px; resize: vertical; }
    .shadyy-widget-lead-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 9px; }
    .shadyy-widget-secondary, .shadyy-widget-primary {
      border: 0; border-radius: 12px; padding: 9px 11px; font-size: 12px; font-weight: 800; cursor: pointer;
    }
    .shadyy-widget-secondary { background: rgba(255,255,255,.66); color: #172033; }
    .shadyy-widget-primary { background: var(--shadyy-widget-primary, #111827); color: white; }
    .shadyy-widget-composer {
      padding: 12px; border-top: 1px solid rgba(255,255,255,.54); background: rgba(255,255,255,.38);
    }
    .shadyy-widget-form {
      display: flex; gap: 8px; align-items: center;
    }
    .shadyy-widget-input {
      flex: 1; min-width: 0; border: 1px solid rgba(255,255,255,.68); border-radius: 16px; padding: 12px 13px; font-size: 14px;
      outline: none; background: rgba(255,255,255,.68); color: #111827;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
    }
    .shadyy-widget-input::placeholder { color: rgba(17,24,39,.42); }
    .shadyy-widget-send {
      border: 0; border-radius: 16px; background: linear-gradient(135deg, var(--shadyy-widget-accent, #2563eb), var(--shadyy-widget-primary, #111827));
      color: white; width: 46px; height: 43px; font-weight: 850; cursor: pointer; display: grid; place-items: center;
      box-shadow: 0 12px 24px rgba(37,99,235,.22), inset 0 1px 0 rgba(255,255,255,.34);
    }
    .shadyy-widget-send:disabled { cursor: not-allowed; opacity: .58; }
    .shadyy-widget-send svg { width: 18px; height: 18px; }
    .shadyy-widget-status {
      min-height: 16px; padding-top: 7px; font-size: 11px; color: rgba(17,24,39,.54);
    }
    .shadyy-widget-footer {
      padding: 0 12px 10px; text-align: center; font-size: 11px; color: rgba(17,24,39,.5); background: transparent;
    }
    @media (max-width: 520px) {
      .shadyy-widget-panel {
        right: 10px; left: 10px; bottom: 126px; width: auto; height: min(650px, calc(100dvh - 148px));
        border-radius: 24px;
      }
      .shadyy-widget-button { right: 16px; bottom: 16px; width: 98px; height: 98px; font-size: 12px; }
      .shadyy-widget-button-mark { width: 38px; height: 38px; font-size: 22px; }
      .shadyy-widget-button-letter { font-size: 11px; transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-37px); }
      .shadyy-widget-message { max-width: 92%; }
      .shadyy-widget-starters { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 12px; }
      .shadyy-widget-starter { white-space: nowrap; }
    }
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .shadyy-widget-panel { background: rgba(248,250,252,.96); }
      .shadyy-widget-message[data-role="assistant"], .shadyy-widget-lead, .shadyy-widget-input { background: white; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = styles;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.className = "shadyy-widget-shell shadyy-widget-button";
  button.type = "button";
  button.setAttribute("aria-label", "Open Shadyy assistant");
  button.innerHTML = `
    <p class="shadyy-widget-button-text" aria-hidden="true">
      <span class="shadyy-widget-button-letter" style="--angle: -34deg;">C</span>
      <span class="shadyy-widget-button-letter" style="--angle: -18deg;">L</span>
      <span class="shadyy-widget-button-letter" style="--angle: -4deg;">I</span>
      <span class="shadyy-widget-button-letter" style="--angle: 12deg;">C</span>
      <span class="shadyy-widget-button-letter" style="--angle: 28deg;">K</span>
      <span class="shadyy-widget-button-letter" style="--angle: 156deg;">M</span>
      <span class="shadyy-widget-button-letter" style="--angle: 180deg;">E</span>
      <span class="shadyy-widget-button-letter" style="--angle: 204deg;">!</span>
    </p>
    <span class="shadyy-widget-button-mark" data-launcher-mark>
      <span class="shadyy-widget-button-icon" data-launcher-icon>☺</span>
      <span class="shadyy-widget-button-icon shadyy-widget-button-icon--copy" data-launcher-icon>☺</span>
    </span>
  `;

  const panel = document.createElement("section");
  panel.className = "shadyy-widget-shell shadyy-widget-panel";
  panel.setAttribute("aria-label", "Shadyy assistant");
  panel.innerHTML = `
    <div class="shadyy-widget-header">
      <div class="shadyy-widget-brand">
        <div class="shadyy-widget-avatar" data-avatar>☺</div>
        <div>
          <div class="shadyy-widget-title" data-title>Shadyy Assistant</div>
          <div class="shadyy-widget-subtitle" data-subtitle>Ready to help on this page</div>
        </div>
      </div>
      <div class="shadyy-widget-actions">
        <button class="shadyy-widget-icon" type="button" data-reset aria-label="Reset chat" title="Reset chat">↻</button>
        <button class="shadyy-widget-icon" type="button" data-close aria-label="Close chat" title="Close chat">×</button>
      </div>
    </div>
    <div class="shadyy-widget-messages" data-messages></div>
    <div class="shadyy-widget-starters" data-starters></div>
    <div class="shadyy-widget-lead" data-lead-panel>
      <div class="shadyy-widget-lead-title">Share callback details</div>
      <div class="shadyy-widget-lead-grid">
        <input data-lead-name placeholder="Name" autocomplete="name" />
        <input data-lead-contact placeholder="Phone or email" autocomplete="email" />
        <input data-lead-product-page placeholder="Product or page" autocomplete="off" />
        <input data-lead-budget placeholder="Budget" autocomplete="off" />
        <textarea data-lead-interest placeholder="Interest"></textarea>
        <textarea data-lead-objection placeholder="Objection or confusion"></textarea>
        <textarea data-lead-note placeholder="Extra note"></textarea>
      </div>
      <div class="shadyy-widget-lead-actions">
        <button class="shadyy-widget-secondary" type="button" data-lead-cancel>Cancel</button>
        <button class="shadyy-widget-primary" type="button" data-lead-save>Capture lead</button>
      </div>
    </div>
    <div class="shadyy-widget-composer">
      <form class="shadyy-widget-form" data-form>
        <input class="shadyy-widget-input" data-input placeholder="Ask about this page..." autocomplete="off" />
        <button class="shadyy-widget-send" type="submit" data-send aria-label="Send message">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      </form>
      <div class="shadyy-widget-status" data-status></div>
    </div>
    <div class="shadyy-widget-footer">Powered by Shadyy</div>
  `;

  document.body.appendChild(panel);
  document.body.appendChild(button);

  const messages = panel.querySelector("[data-messages]");
  const starters = panel.querySelector("[data-starters]");
  const form = panel.querySelector("[data-form]");
  const input = panel.querySelector("[data-input]");
  const sendButton = panel.querySelector("[data-send]");
  const status = panel.querySelector("[data-status]");
  const leadPanel = panel.querySelector("[data-lead-panel]");
  const leadName = panel.querySelector("[data-lead-name]");
  const leadContact = panel.querySelector("[data-lead-contact]");
  const leadProductPage = panel.querySelector("[data-lead-product-page]");
  const leadBudget = panel.querySelector("[data-lead-budget]");
  const leadInterest = panel.querySelector("[data-lead-interest]");
  const leadObjection = panel.querySelector("[data-lead-objection]");
  const leadNote = panel.querySelector("[data-lead-note]");
  const leadSave = panel.querySelector("[data-lead-save]");

  const scrollMessages = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const addMessage = (role, text, options = {}) => {
    const node = document.createElement("div");
    node.className = "shadyy-widget-message";
    node.dataset.role = role;
    if (options.html) {
      node.innerHTML = text;
    } else {
      node.textContent = text;
    }
    messages.appendChild(node);
    scrollMessages();
    return node;
  };

  const addTypingMessage = () =>
    addMessage(
      "assistant",
      `<span class="shadyy-widget-typing" aria-label="Typing"><span></span><span></span><span></span></span>`,
      { html: true }
    );

  const setBusy = (busy) => {
    state.busy = busy;
    if (sendButton) sendButton.disabled = busy;
    if (input) input.disabled = busy;
    if (status) status.textContent = busy ? "Reading this page and preparing an answer..." : "";
  };

  const setLeadOpen = (open) => {
    state.leadOpen = open;
    leadPanel.dataset.open = String(open);
    if (open) {
      const context = collectPageContext();
      const productTitle = context.tenantContext?.productTitle || context.primaryHeading || context.title;
      if (leadProductPage && !leadProductPage.value) {
        leadProductPage.value = productTitle || context.url;
      }
      if (leadInterest && !leadInterest.value) {
        leadInterest.value = normalizeText(input?.value || "");
      }
      setTimeout(() => leadName.focus(), 0);
    }
  };

  const setLeadSubmitting = (submitting) => {
    state.leadSubmitting = submitting;
    if (leadSave) {
      leadSave.disabled = submitting;
      leadSave.textContent = submitting ? "Sending..." : "Capture lead";
    }
  };

  const renderStarterPrompts = () => {
    const prompts = tenantConfig.widget.starterPrompts || defaultTenantConfig.widget.starterPrompts;
    starters.innerHTML = "";

    prompts.slice(0, 5).forEach((prompt) => {
      const item = document.createElement("button");
      item.className = "shadyy-widget-starter";
      item.type = "button";
      item.textContent = prompt;
      item.addEventListener("click", () => {
        const lowered = prompt.toLowerCase();
        if (lowered.includes("callback") || lowered.includes("lead")) {
          setOpen(true);
          setLeadOpen(true);
          return;
        }
        submitMessage(prompt);
      });
      starters.appendChild(item);
    });
  };

  const setOpen = (open) => {
    state.open = open;
    panel.dataset.open = String(open);
    if (open && !messages.children.length) {
      addMessage(
        "assistant",
        `Hi, I’m ${tenantConfig.brandName || "Shadyy"}. I can help with the page you’re viewing.`
      );
    }
  };

  const resetChat = () => {
    state.chatId = "shadyy-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    state.leadDraft = null;
    setLeadSubmitting(false);
    window.localStorage.setItem("shadyy-widget-chat-id", state.chatId);
    messages.innerHTML = "";
    setLeadOpen(false);
    setBusy(false);
    addMessage("assistant", "Fresh chat started. What would you like help with on this page?");
  };

  const conversationSummary = () =>
    Array.from(messages.querySelectorAll(".shadyy-widget-message"))
      .map((node) => `${node.dataset.role || "message"}: ${normalizeText(node.textContent || "")}`)
      .filter((line) => line.length > 12)
      .slice(-10)
      .join("\n")
      .slice(0, 2200);

  const saveLeadDraft = async () => {
    if (state.leadSubmitting) return;

    const pageContext = collectPageContext();
    const payload = {
      tenantId,
      chatId: state.chatId,
      name: leadName.value.trim(),
      contact: leadContact.value.trim(),
      productPage: leadProductPage.value.trim(),
      budget: leadBudget.value.trim(),
      interest: leadInterest.value.trim() || leadNote.value.trim(),
      objection: leadObjection.value.trim(),
      conversationSummary: conversationSummary() || leadNote.value.trim(),
      pageContext,
    };

    if (!payload.name || !payload.contact) {
      if (status) status.textContent = "Add a name and phone or email to capture the lead.";
      return;
    }

    setLeadSubmitting(true);
    if (status) status.textContent = "Capturing lead...";

    try {
      const response = await fetch(apiBase + "/api/shadyy-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!data.ok) throw new Error(data.message || "Lead capture failed.");

      state.leadDraft = payload;
      setLeadOpen(false);
      if (status) status.textContent = "";
      addMessage(
        "assistant",
        "Done. I captured your details and sent them to the Shadyy lead dashboard."
      );
    } catch (error) {
      if (status) {
        status.textContent =
          error instanceof Error ? error.message : "Lead capture failed.";
      }
    } finally {
      setLeadSubmitting(false);
    }
  };

  const submitMessage = async (question) => {
    if (state.busy) return;

    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    setOpen(true);
    input.value = "";
    addMessage("user", cleanQuestion);
    const pending = addTypingMessage();
    setBusy(true);

    try {
      const response = await fetch(apiBase + "/api/shadyy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          chatId: state.chatId,
          message: cleanQuestion,
          context: collectPageContext(),
          leadDraft: state.leadDraft,
        }),
      });

      const data = await response.json();
      pending.textContent =
        data.text || "I could not answer that from the current page context yet.";
    } catch {
      pending.textContent = "I could not reach the Shadyy assistant right now.";
    } finally {
      setBusy(false);
      scrollMessages();
    }
  };

  button.addEventListener("click", () => setOpen(!state.open));
  panel.querySelector("[data-close]").addEventListener("click", () => setOpen(false));
  panel.querySelector("[data-reset]").addEventListener("click", resetChat);
  panel.querySelector("[data-lead-cancel]").addEventListener("click", () => setLeadOpen(false));
  panel.querySelector("[data-lead-save]").addEventListener("click", saveLeadDraft);
  applyTenantBranding();
  renderStarterPrompts();
  loadTenantConfig();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitMessage(input.value);
  });
})();
