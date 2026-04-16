(() => {
  "use strict";

  // ============================================================
  // Interactive flow definition — chains mocks together so buttons
  // actually navigate, mimicking the real Slack experience.
  // ============================================================
  const FLOW_SEQ = [
    { id: "02_browse_products",     label: "Browse Catalog",    channel: "#deal-acme-q2" },
    { id: "03_product_details",     label: "Product Details",   channel: "#deal-acme-q2" },
    { id: "04_create_quote_step1",  label: "Quote Terms",       channel: "New Quote" },
    { id: "04_create_quote_step2",  label: "Line Items",        channel: "New Quote · Acme" },
    { id: "04d_configure_line",     label: "Configure Line",    channel: "Configure line" },
    { id: "04_create_quote_step3",  label: "Review + AI",       channel: "Review quote" },
    { id: "06_approval_request",    label: "Approval Request",  channel: "Alex Chen · DM" },
    { id: "06_approval_status",     label: "Approved",          channel: "#deal-acme-q2" }
  ];
  const FLOW_MAIN_IDS = FLOW_SEQ.map(s => s.id);
  // When the user is on a side-overlay mock, which main step it "belongs" to.
  const OVERLAY_PARENT = {
    "04a_add_product_search": "04_create_quote_step2",
    "04b_add_bundle":         "04_create_quote_step2",
    "04c_ai_suggest_addons":  "04_create_quote_step2",
    "04e_configure_bundle":   "04_create_quote_step2",
    "05_apply_discount":      "04_create_quote_step3"
  };
  // Per-mock interception rules. Keys are action_ids; modal submit/close use the
  // pseudo-ids "modal-submit" / "modal-close". Value "__toast__" means: don't
  // navigate, just flash a toast (the action fires but the UI state is stable).
  const FLOW_RULES = {
    "02_browse_products": {
      "view_product":              "03_product_details",
      "start_quote_with_selected": "04_create_quote_step1",
      "refine_search":             "__toast__",
      "ask_ai":                    "__toast__",
      "category_filter":           "__toast__",
      "sort_by":                   "__toast__",
      "pricebook":                 "__toast__"
    },
    "03_product_details": {
      "add_to_quote":     "04_create_quote_step1",
      "add_bundle":       "04_create_quote_step1",
      "compare_product":  "__toast__",
      "product_overflow": "__toast__"
    },
    "04_create_quote_step1": {
      "modal-submit": "04_create_quote_step2",
      "modal-close":  "03_product_details"
    },
    "04_create_quote_step2": {
      "modal-submit":      "04_create_quote_step3",
      "modal-close":       "04_create_quote_step1",
      "add_product":       "04a_add_product_search",
      "add_bundle":        "04b_add_bundle",
      "ai_suggest_addons": "04c_ai_suggest_addons",
      "line_1_configure":  "04d_configure_line",
      "line_1_menu":       "04d_configure_line",
      "line_2_menu":       "__toast__",
      "line_3_menu":       "__toast__"
    },
    "04a_add_product_search": {
      "modal-submit": "04_create_quote_step2",
      "modal-close":  "04_create_quote_step2"
    },
    "04b_add_bundle": {
      "modal-submit": "04_create_quote_step2",
      "modal-close":  "04_create_quote_step2"
    },
    "04c_ai_suggest_addons": {
      "modal-submit":    "04_create_quote_step2",
      "modal-close":     "04_create_quote_step2",
      "ai_feedback_bad": "__toast__",
      "ai_reasoning":    "__toast__"
    },
    "04d_configure_line": {
      "modal-submit":    "04_create_quote_step2",
      "modal-close":     "04_create_quote_step2",
      "apply_ai_config": "__toast__"
    },
    "04_create_quote_step3": {
      "modal-submit": "06_approval_request",
      "modal-close":  "04_create_quote_step2"
    },
    "05_apply_discount": {
      "modal-submit": "04_create_quote_step3",
      "modal-close":  "04_create_quote_step3"
    },
    "06_approval_request": {
      "approve":          "06_approval_status",
      "reject":           "__toast__",
      "request_changes":  "__toast__",
      "approval_overflow": "__toast__"
    },
    "06_approval_status": {
      "send_customer":  "__toast__",
      "generate_order": "__toast__",
      "view_audit":     "__toast__"
    }
  };

  const SECTIONS = [
    {
      title: "▶ Interactive Demo",
      items: [
        { id: "__flow__", title: "Quote-to-Cash end-to-end", channel: "Click-through demo", flow: true }
      ]
    },
    {
      title: "Agent & Slack Experience",
      items: [
        { id: "11_assistant_quote_chat",           title: "Create quote",      channel: "Assistant panel" },
        { id: "12_assistant_renewal_nudge_chat",   title: "Renewal at risk",   channel: "Assistant panel" },
        { id: "13_assistant_invoice_dispute_chat", title: "Invoice dispute",   channel: "Assistant panel" },
        { id: "14_assistant_ar_collection_chat",   title: "Overdue AR loop",   channel: "Assistant panel" },
        { id: "15_assistant_gbb_packager_chat",    title: "Good / Better / Best", channel: "Assistant panel" },
        { id: "16_assistant_usage_order_chat",     title: "Usage-based order", channel: "Assistant panel" }
      ]
    },
    {
      title: "Interactive UI with AI Insights",
      items: [
        { id: "01_home_tab",           title: "Home dashboard",        channel: "App Home · Sales Rep" },
        { id: "02_browse_products",    title: "Browse Products",       channel: "#deal-acme-q2" },
        { id: "03_product_details",    title: "Product Details",       channel: "#deal-acme-q2" },
        { id: "04_create_quote_step1", title: "Create Quote · Step 1", channel: "New Quote" },
        { id: "04_create_quote_step2", title: "Create Quote · Step 2", channel: "New Quote" },
        { id: "04a_add_product_search", title: "↳ Add Product (overlay)", channel: "Add product" },
        { id: "04b_add_bundle",         title: "↳ Add Bundle (overlay)",  channel: "Add bundle" },
        { id: "04c_ai_suggest_addons",  title: "↳ AI Suggest Add-ons",    channel: "AI · Suggested add-ons" },
        { id: "04d_configure_line",     title: "↳ Configure Line",        channel: "Configure line" },
        { id: "04e_configure_bundle",   title: "↳ Configure Bundle",      channel: "Configure bundle" },
        { id: "04_create_quote_step3", title: "Create Quote · Step 3", channel: "Review quote" },
        { id: "05_apply_discount",     title: "Apply Discount",        channel: "Apply discount" },
        { id: "06_approval_request",   title: "Approval Request",      channel: "Alex Chen · DM" },
        { id: "06_approval_status",    title: "Approval Status",       channel: "#deal-acme-q2" },
        { id: "07_invoice_canvas",     title: "Invoice Canvas",        channel: "Canvas · INV-9012" },
        { id: "07_invoice_card",       title: "Invoice Card",          channel: "#deal-acme-q2" },
        { id: "08_collect_payment",    title: "Collect Payment",       channel: "Collect payment" },
        { id: "09_ai_assistant_plan",  title: "AI Assistant Plan",     channel: "RevFlow AI" },
        { id: "10_ai_suggestion_card", title: "AI Proactive Nudge",    channel: "Meredith · DM" }
      ]
    }
  ];
  const MOCKS = SECTIONS.flatMap(s => s.items).filter(m => !m.flow);

  // ============================================================
  // Emoji shortcode map (subset — covers what the mocks use)
  // ============================================================
  const EMOJI = {
    ":sunny:": "☀️",
    ":sparkles:": "✨",
    ":mag:": "🔍",
    ":star:": "⭐",
    ":star2:": "🌟",
    ":computer:": "💻",
    ":package:": "📦",
    ":bulb:": "💡",
    ":heavy_plus_sign:": "➕",
    ":zap:": "⚡",
    ":pushpin:": "📌",
    ":clipboard:": "📋",
    ":bell:": "🔔",
    ":email:": "📧",
    ":envelope:": "✉️",
    ":page_facing_up:": "📄",
    ":bookmark_tabs:": "📑",
    ":calendar:": "📅",
    ":zzz:": "💤",
    ":tada:": "🎉",
    ":moneybag:": "💰",
    ":credit_card:": "💳",
    ":bank:": "🏦",
    ":receipt:": "🧾",
    ":warning:": "⚠️",
    ":lock:": "🔒",
    ":pencil:": "✏️",
    ":briefcase:": "💼",
    ":chart_with_upwards_trend:": "📈",
    ":small_green_triangle:": "🔺",
    ":red_circle:": "🔴",
    ":white_circle:": "⚪",
    ":black_circle:": "⚫",
    ":large_green_circle:": "🟢",
    ":large_yellow_circle:": "🟡",
    ":large_blue_circle:": "🔵",
    ":white_check_mark:": "✅",
    ":x:": "❌",
    ":thumbsup:": "👍",
    ":thumbsdown:": "👎",
    ":link:": "🔗",
    ":hourglass_flowing_sand:": "⏳",
    ":mag_right:": "🔎"
  };
  function renderEmoji(text) {
    return text.replace(/:[a-z0-9_+-]+:/g, s => EMOJI[s] || s);
  }

  // ============================================================
  // HTML escape
  // ============================================================
  function escapeHtml(text) {
    if (text == null) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ============================================================
  // mrkdwn → HTML (subset)
  // ============================================================
  function renderMrkdwn(text) {
    if (!text) return "";
    let s = escapeHtml(text);
    // Code block (triple backtick)
    s = s.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c}</code></pre>`);
    // Inline code
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    // Bold *...* (Slack mrkdwn uses single asterisks)
    s = s.replace(/(^|\s)\*([^\*\n]+)\*/g, "$1<strong>$2</strong>");
    // Italic _..._
    s = s.replace(/(^|\s)_([^_\n]+)_/g, "$1<em>$2</em>");
    // Strike ~...~
    s = s.replace(/(^|\s)~([^~\n]+)~/g, "$1<del>$2</del>");
    // Links <url|label>
    s = s.replace(/&lt;(https?:\/\/[^|&]+|fakeurl\.com|[^|&\s]+\.[a-z]{2,})\|([^&]+)&gt;/gi,
      '<a href="$1" target="_blank" rel="noopener">$2</a>');
    // User mentions <@U123>
    s = s.replace(/&lt;@([A-Z0-9]+)&gt;/g, '<span class="mention">@$1</span>');
    // @name style mentions
    s = s.replace(/(^|\s)@([a-z0-9_-]+)/gi, '$1<span class="mention">@$2</span>');
    // Emoji shortcodes
    s = renderEmoji(s);
    // Newlines
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  // ============================================================
  // Standard markdown (for `markdown` block, Feb 2025 GA)
  // ============================================================
  function renderMarkdown(text) {
    if (!text) return "";
    let s = escapeHtml(text);

    // GitHub-style tables: detect a header row, an alignment/separator row, and body rows.
    s = s.replace(
      /(^|\n)((?:\|[^\n]*\|\s*\n))((?:\|\s*:?-+:?\s*)+\|\s*\n)((?:\|[^\n]*\|\s*(?:\n|$))+)/g,
      (_m, pre, header, sep, body) => {
        const cells = row => row.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map(c => c.trim());
        const aligns = cells(sep).map(a => {
          if (/^:-+:$/.test(a)) return "center";
          if (/^-+:$/.test(a)) return "right";
          return "left";
        });
        const th = cells(header).map((c, i) =>
          `<th style="text-align:${aligns[i] || "left"}">${c}</th>`).join("");
        const rows = body.trim().split("\n").map(r => {
          const cs = cells(r);
          return `<tr>${cs.map((c, i) => `<td style="text-align:${aligns[i] || "left"}">${c}</td>`).join("")}</tr>`;
        }).join("");
        return `${pre}<div class="bk-table-wrap"><table class="bk-table"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    );

    s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    s = s.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    s = s.replace(/^---$/gm, "<hr>");
    s = s.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c}</code></pre>`);
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^\*\n]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^\*])\*([^\*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/(^|\n)([-\*] .+(?:\n[-\*] .+)*)/g, (m, pre, block) => {
      const items = block.split("\n").map(line => `<li>${line.replace(/^[-\*] /, "")}</li>`).join("");
      return `${pre}<ul>${items}</ul>`;
    });
    s = renderEmoji(s);
    s = s.split(/\n\n+/).map(p => {
      if (/^\s*<(h\d|ul|ol|pre|hr|blockquote|div|table)/.test(p)) return p;
      if (!p.trim()) return "";
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
    return s;
  }

  // ============================================================
  // Text object (plain_text | mrkdwn)
  // ============================================================
  function renderTextObject(t) {
    if (!t) return "";
    if (typeof t === "string") return escapeHtml(renderEmoji(t));
    if (t.type === "plain_text") return escapeHtml(renderEmoji(t.text || ""));
    if (t.type === "mrkdwn") return renderMrkdwn(t.text || "");
    return escapeHtml(t.text || "");
  }

  // ============================================================
  // Rich text rendering
  // ============================================================
  function renderRichTextElement(el) {
    if (el.type === "text") {
      let t = escapeHtml(renderEmoji(el.text || ""));
      const st = el.style || {};
      if (st.code) t = `<code>${t}</code>`;
      if (st.bold) t = `<strong>${t}</strong>`;
      if (st.italic) t = `<em>${t}</em>`;
      if (st.strike) t = `<del>${t}</del>`;
      return t.replace(/\n/g, "<br>");
    }
    if (el.type === "emoji") return EMOJI[`:${el.name}:`] || `:${el.name}:`;
    if (el.type === "link") return `<a href="${escapeHtml(el.url)}" target="_blank" rel="noopener">${escapeHtml(el.text || el.url)}</a>`;
    if (el.type === "user") return `<span class="mention">@${escapeHtml(el.user_id)}</span>`;
    if (el.type === "channel") return `<span class="mention">#${escapeHtml(el.channel_id)}</span>`;
    return "";
  }
  function renderRichTextSection(section) {
    return (section.elements || []).map(renderRichTextElement).join("");
  }
  function renderRichText(block) {
    const out = [];
    for (const el of block.elements || []) {
      if (el.type === "rich_text_section") {
        out.push(`<div>${renderRichTextSection(el)}</div>`);
      } else if (el.type === "rich_text_list") {
        const tag = el.style === "ordered" ? "ol" : "ul";
        const items = (el.elements || []).map(it => `<li>${renderRichTextSection(it)}</li>`).join("");
        out.push(`<${tag}>${items}</${tag}>`);
      } else if (el.type === "rich_text_quote") {
        out.push(`<div class="bk-richtext-quote">${renderRichTextSection(el)}</div>`);
      } else if (el.type === "rich_text_preformatted") {
        out.push(`<div class="bk-richtext-preformatted">${renderRichTextSection(el)}</div>`);
      }
    }
    return `<div class="bk-richtext">${out.join("")}</div>`;
  }

  // ============================================================
  // Element rendering (buttons, selects, inputs)
  // ============================================================
  function renderElement(el) {
    if (!el) return "";
    switch (el.type) {
      case "button": {
        const style = el.style === "primary" ? " primary" : el.style === "danger" ? " danger" : "";
        const label = renderTextObject(el.text);
        const tag = el.url ? "a" : "button";
        const href = el.url ? ` href="${escapeHtml(el.url)}" target="_blank" rel="noopener"` : "";
        const aid = el.action_id ? ` data-action-id="${escapeHtml(el.action_id)}"` : "";
        const val = el.value ? ` data-action-value="${escapeHtml(el.value)}"` : "";
        return `<${tag} class="bk-button${style}" type="button"${href}${aid}${val}>${label}</${tag}>`;
      }
      case "static_select":
      case "external_select": {
        const options = (el.options || []).map(o => {
          const txt = renderTextObject(o.text);
          const selected = el.initial_option && o.value === el.initial_option.value ? " selected" : "";
          return `<option${selected}>${txt}</option>`;
        }).join("");
        const placeholder = el.placeholder ? renderTextObject(el.placeholder) : "Select…";
        const selectedLabel = el.initial_option ? renderTextObject(el.initial_option.text) : placeholder;
        // Use a styled "fake" select that reflects initial_option visually
        return `<div class="bk-select" role="button" tabindex="0">${selectedLabel} ▾</div>`;
      }
      case "multi_static_select":
      case "multi_external_select": {
        const placeholder = el.placeholder ? renderTextObject(el.placeholder) : "Select multiple…";
        return `<div class="bk-select" role="button" tabindex="0">${placeholder} ▾</div>`;
      }
      case "users_select":
      case "channels_select":
      case "conversations_select": {
        const placeholder = el.placeholder ? renderTextObject(el.placeholder) : "Select…";
        return `<div class="bk-select" role="button" tabindex="0">${placeholder} ▾</div>`;
      }
      case "datepicker": {
        return `<input class="bk-datepicker" type="date" value="${escapeHtml(el.initial_date || "")}">`;
      }
      case "timepicker": {
        return `<input class="bk-datepicker" type="time" value="${escapeHtml(el.initial_time || "")}">`;
      }
      case "number_input": {
        return `<input class="bk-number-input" type="number" value="${escapeHtml(el.initial_value || "")}" placeholder="${escapeHtml(el.placeholder ? el.placeholder.text : "")}" ${el.min_value ? `min="${el.min_value}"` : ""} ${el.max_value ? `max="${el.max_value}"` : ""}>`;
      }
      case "plain_text_input": {
        const val = escapeHtml(el.initial_value || "");
        const ph = el.placeholder ? escapeHtml(el.placeholder.text) : "";
        if (el.multiline) {
          return `<textarea class="bk-text-input bk-text-input-multiline" placeholder="${ph}">${val}</textarea>`;
        }
        return `<input class="bk-text-input" type="text" value="${val}" placeholder="${ph}">`;
      }
      case "email_text_input": {
        return `<input class="bk-text-input" type="email" value="${escapeHtml(el.initial_value || "")}" placeholder="${el.placeholder ? escapeHtml(el.placeholder.text) : ""}">`;
      }
      case "url_text_input": {
        return `<input class="bk-text-input" type="url" value="${escapeHtml(el.initial_value || "")}" placeholder="${el.placeholder ? escapeHtml(el.placeholder.text) : ""}">`;
      }
      case "checkboxes": {
        return renderChoiceList(el, "checkbox");
      }
      case "radio_buttons": {
        return renderChoiceList(el, "radio");
      }
      case "overflow": {
        const aid = el.action_id ? ` data-action-id="${escapeHtml(el.action_id)}"` : "";
        const opts = encodeURIComponent(JSON.stringify((el.options || []).map(o => ({
          text: (o.text && o.text.text) || "",
          value: o.value || ""
        }))));
        return `<button class="bk-overflow" aria-label="More options"${aid} data-overflow-options="${opts}">⋯</button>`;
      }
      case "image": {
        return `<div class="bk-image" style="width:72px;height:72px"><img src="${escapeHtml(el.image_url)}" alt="${escapeHtml(el.alt_text || "")}" onerror="this.style.display='none'"></div>`;
      }
      default:
        return `<span class="bk-button" style="opacity:0.5">[${escapeHtml(el.type)}]</span>`;
    }
  }

  function renderChoiceList(el, kind) {
    const selectedVals = new Set();
    if (el.initial_option) selectedVals.add(el.initial_option.value);
    if (el.initial_options) el.initial_options.forEach(o => selectedVals.add(o.value));
    // For radio buttons, mark first as selected if no initial
    const opts = (el.options || []).map((o, i) => {
      const isSelected = selectedVals.has(o.value) || (kind === "radio" && selectedVals.size === 0 && i === 0);
      const selectedCls = isSelected ? " selected" : "";
      const desc = o.description ? `<div class="bk-choice-description">${renderTextObject(o.description)}</div>` : "";
      return `
        <div class="bk-choice ${kind}${selectedCls}">
          <div class="bk-choice-mark"></div>
          <div class="bk-choice-body">
            <div class="bk-choice-text">${renderTextObject(o.text)}</div>
            ${desc}
          </div>
        </div>`;
    }).join("");
    return `<div class="bk-choice-list">${opts}</div>`;
  }

  // ============================================================
  // Block rendering
  // ============================================================
  function renderBlock(block) {
    switch (block.type) {
      case "header": {
        return `<div class="bk-block"><h2 class="bk-header">${renderTextObject(block.text)}</h2></div>`;
      }
      case "divider": {
        return `<div class="bk-block"><div class="bk-divider"></div></div>`;
      }
      case "context": {
        const parts = (block.elements || []).map(el => {
          if (el.type === "image") {
            return `<img src="${escapeHtml(el.image_url)}" alt="${escapeHtml(el.alt_text || "")}" onerror="this.outerHTML='<span class=\\'context-avatar\\'>${(el.alt_text || "?")[0]}</span>'">`;
          }
          return `<span class="bk-text">${renderTextObject(el)}</span>`;
        }).join("");
        return `<div class="bk-block"><div class="bk-context">${parts}</div></div>`;
      }
      case "section": {
        const body = [];
        if (block.text) body.push(`<div class="bk-text">${renderTextObject(block.text)}</div>`);
        if (block.fields && block.fields.length) {
          const fields = block.fields.map(f => `<div class="bk-field bk-text">${renderTextObject(f)}</div>`).join("");
          body.push(`<div class="bk-fields">${fields}</div>`);
        }
        let accessory = "";
        if (block.accessory) {
          accessory = `<div class="bk-section-accessory">${renderElement(block.accessory)}</div>`;
        }
        return `<div class="bk-block"><div class="bk-section"><div class="bk-section-body">${body.join("")}</div>${accessory}</div></div>`;
      }
      case "actions": {
        const els = (block.elements || []).map(renderElement).join("");
        return `<div class="bk-block"><div class="bk-actions">${els}</div></div>`;
      }
      case "input": {
        const label = block.label ? renderTextObject(block.label) : "";
        const optional = block.optional ? '<span class="bk-input-optional">(optional)</span>' : "";
        const hint = block.hint ? `<div class="bk-input-hint">${renderTextObject(block.hint)}</div>` : "";
        const control = renderElement(block.element || {});
        return `<div class="bk-block bk-input">
          <div class="bk-input-label">${label} ${optional}</div>
          ${control}
          ${hint}
        </div>`;
      }
      case "image": {
        const title = block.title ? `<div class="bk-image-title">${renderTextObject(block.title)}</div>` : "";
        // If we have a known-good local fallback for this chart, load that directly.
        const src = block._fallback || block.image_url;
        return `<div class="bk-block bk-image-block">
          ${title}
          <img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt_text || "")}" onerror="this.style.display='none'">
        </div>`;
      }
      case "rich_text": {
        return `<div class="bk-block">${renderRichText(block)}</div>`;
      }
      case "markdown": {
        return `<div class="bk-block"><div class="bk-markdown">${renderMarkdown(block.text || "")}</div></div>`;
      }
      case "table": {
        const rows = block.rows || [];
        if (!rows.length) return "";
        const [headerRow, ...bodyRows] = rows;
        const thead = `<thead><tr>${headerRow.map(c => `<th>${renderCell(c)}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${renderCell(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
        return `<div class="bk-block"><div class="bk-table-wrap"><table class="bk-table">${thead}${tbody}</table></div></div>`;
      }
      case "plan": {
        const titleStr = typeof block.title === "string" ? block.title : (block.title?.text || "");
        const title = titleStr ? `<div class="bk-plan-title">${escapeHtml(titleStr)}</div>` : "";
        const tasks = block.tasks || block.task_cards || [];
        const cards = tasks.map(tc => {
          const status = tc.status || "pending";
          const taskTitle = typeof tc.title === "string" ? tc.title : (tc.title?.text || "");
          let body = "";
          if (tc.output) body = `<div class="bk-taskcard-desc">${renderBlock(tc.output)}</div>`;
          else if (tc.details) body = `<div class="bk-taskcard-desc">${renderBlock(tc.details)}</div>`;
          else if (tc.description) body = `<div class="bk-taskcard-desc">${escapeHtml(renderEmoji(tc.description))}</div>`;
          return `<div class="bk-taskcard">
            <div class="bk-taskcard-status ${status}"></div>
            <div class="bk-taskcard-body">
              <div class="bk-taskcard-title">${escapeHtml(renderEmoji(taskTitle))}</div>
              ${body}
            </div>
          </div>`;
        }).join("");
        return `<div class="bk-block"><div class="bk-plan">${title}${cards}</div></div>`;
      }
      case "video":
      case "file":
        return `<div class="bk-block"><div class="bk-context"><span class="bk-text">[${block.type} block — rendered in Slack client]</span></div></div>`;
      default:
        return `<div class="bk-block"><div class="bk-context"><span class="bk-text">[unknown block type: ${escapeHtml(block.type)}]</span></div></div>`;
    }
  }

  function renderCell(cell) {
    if (!cell) return "";
    if (cell.type === "raw_text") return escapeHtml(renderEmoji(cell.text || "")).replace(/\n/g, "<br>");
    if (cell.type === "rich_text") return renderRichText(cell);
    return "";
  }

  // ============================================================
  // Inject chart asset fallbacks for image blocks whose URLs are external
  // ============================================================
  function patchImageFallbacks(blocks, chartAsset) {
    if (!chartAsset) return blocks;
    // Find first image block with a fakeurl and attach _fallback hint
    function walk(arr) {
      for (const b of arr) {
        if (b && b.type === "image" && typeof b.image_url === "string" && b.image_url.includes("revflow.example.com")) {
          b._fallback = chartAsset;
        }
      }
    }
    walk(blocks);
    return blocks;
  }

  // ============================================================
  // Surface chrome
  // ============================================================
  function renderSurface(payload, mockInfo) {
    const meta = payload._meta || {};
    const surface = meta.surface || "message";
    const channel = mockInfo && mockInfo.channel;

    // Patch chart fallbacks before rendering.
    // _meta.chart_asset paths are relative to the mock JSON (mocks/bkb/*).
    // Translate to be relative to this page (renderer/*).
    let blocks = payload.blocks || [];
    if (meta.chart_asset) {
      const rel = meta.chart_asset.replace(/^\.\.\//, "../mocks/");
      blocks = patchImageFallbacks(blocks, rel);
    }

    const blocksHtml = blocks.map(renderBlock).join("");

    let inner;
    switch (surface) {
      case "home":
        inner = `
          <div class="surface-header">
            <span class="surface-header-tab">Home</span>
            <span style="color:var(--ink-3);font-size:13px;margin-left:auto">Messages · About</span>
          </div>
          <div class="slack-surface">${blocksHtml}</div>`;
        break;
      case "modal":
        inner = `
          <div class="slack-surface">
            <div class="modal-title">
              <span>${renderTextObject(payload.title)}</span>
              <button class="modal-close" aria-label="Close" data-flow-action="modal-close">×</button>
            </div>
            <div class="modal-body">${blocksHtml}</div>
            <div class="modal-footer">
              ${payload.close ? `<button class="bk-button" data-flow-action="modal-close">${renderTextObject(payload.close)}</button>` : ""}
              ${payload.submit ? `<button class="bk-button primary" data-flow-action="modal-submit">${renderTextObject(payload.submit)}</button>` : ""}
            </div>
          </div>`;
        break;
      case "canvas":
        inner = `
          <div class="surface-header">
            <span>📄 Canvas</span> · <span style="font-weight:700">${escapeHtml(channel || "Invoice canvas")}</span>
          </div>
          <div class="slack-surface">${blocksHtml}</div>`;
        break;
      case "assistant":
        inner = `
          <div class="surface-header">
            <div class="surface-header-title">✨ RevFlow AI</div>
            <span style="font-size:12px;color:var(--ink-3)">Assistant</span>
          </div>
          <div class="slack-surface">${blocksHtml}</div>`;
        break;
      case "dm":
        inner = `
          <div class="surface-header">
            <span class="surface-hash">@</span>
            <span class="surface-channel">${escapeHtml(channel || "Direct message")}</span>
          </div>
          <div class="slack-surface">
            <div class="slack-message">
              <div class="message-avatar">R</div>
              <div class="message-meta">
                <span class="message-author">RevFlow</span>
                <span class="app-badge">App</span>
                <span class="message-time">Today at 2:45 PM</span>
              </div>
              ${blocksHtml}
            </div>
          </div>`;
        break;
      case "message":
      default:
        inner = `
          <div class="surface-header">
            <span class="surface-hash">#</span>
            <span class="surface-channel">${escapeHtml((channel || "channel").replace(/^#/, ""))}</span>
          </div>
          <div class="slack-surface">
            <div class="slack-message">
              <div class="message-avatar">R</div>
              <div class="message-meta">
                <span class="message-author">RevFlow</span>
                <span class="app-badge">App</span>
                <span class="message-time">Today at 9:03 AM</span>
              </div>
              ${blocksHtml}
            </div>
          </div>`;
    }

    return { html: inner, surface };
  }

  // ============================================================
  // App shell
  // ============================================================
  let activeId = null;

  function renderSidebar() {
    const nav = document.getElementById("mock-nav");
    const homeBtn = `<button class="nav-item nav-home" data-id="home">
      <span class="nav-num">⌂</span>
      <span class="nav-text">Home<div class="nav-surface">OVERVIEW</div></span>
    </button>`;
    let counter = 0;
    const sectionsHtml = SECTIONS.map(section => {
      const isFlowSection = section.items.some(i => i.flow);
      const itemsHtml = section.items.map(m => {
        if (m.flow) {
          return `<button class="nav-item nav-item--flow" data-id="${m.id}">
            <span class="nav-num">▶</span>
            <span class="nav-text">${escapeHtml(m.title)}<div class="nav-surface">${escapeHtml(m.channel || "")}</div></span>
          </button>`;
        }
        counter += 1;
        const num = String(counter).padStart(2, "0");
        return `<button class="nav-item" data-id="${m.id}">
          <span class="nav-num">${num}</span>
          <span class="nav-text">${escapeHtml(m.title)}<div class="nav-surface" id="ns-${m.id}">—</div></span>
        </button>`;
      }).join("");
      const cls = isFlowSection ? "sidebar-section sidebar-section--flow" : "sidebar-section";
      return `<div class="${cls}">
        <div class="sidebar-title">${escapeHtml(section.title)}</div>
        ${itemsHtml}
      </div>`;
    }).join("");
    nav.innerHTML = homeBtn + sectionsHtml;
    nav.addEventListener("click", e => {
      const btn = e.target.closest(".nav-item");
      if (!btn) return;
      const id = btn.dataset.id;
      if (id === "home") {
        if (flowMode) exitFlowMode({ navigate: false });
        renderHome();
      } else if (id === "__flow__") {
        enterFlowMode();
      } else {
        if (flowMode) exitFlowMode({ navigate: false });
        selectMock(id);
      }
    });
  }

  const HOME_HTML = `
    <div class="home">
      <header class="home-hero">
        <div class="home-eyebrow">RevFlow · 2026 Prototype</div>
        <h1 class="home-title">
          Reimagining <span class="home-title-accent">Revenue Cloud</span><br>
          inside Slack.
        </h1>
        <p class="home-lede">
          Sales, AR, and CS teams already spend their day in Slack.<br>
          What if they never had to leave it to run revenue?
        </p>
      </header>

      <section class="home-vision">
        <p>
          Every quote, renewal, invoice, approval, and collection already lands
          in Slack — as a notification. Then you bounce out: a browser tab,
          Salesforce, a CPQ form, a billing console, a DocuSign link, back to
          inbox. This prototype asks a simpler question:
          <strong>what if the work itself happened inside Slack — and the
          notification was just the start, not the end?</strong>
          Two surfaces, one place to run the whole revenue operation.
        </p>
      </section>

      <section class="home-cards">
        <a href="#11_assistant_quote_chat" class="home-card home-card-agent">
          <div>
            <span class="home-card-tag">Section 01 · 6 conversations</span>
            <h2>Agent &amp; Slack Experience</h2>
            <p class="home-card-lede">The revenue AI as a full coworker — not a chatbot.</p>
          </div>
          <ul class="home-card-bullets">
            <li><strong>Proactive.</strong> It pings you when a renewal is at risk, an invoice is disputed, or an account trips a usage threshold — before you ask.</li>
            <li><strong>Reactive.</strong> Paste discovery notes, forward a dispute email, ask <em>"what's overdue on my book?"</em> It streams back reasoning, pulls from Salesforce + billing + email, hands you compact cards with rich action buttons.</li>
            <li><strong>Not verbose.</strong> Every step is a tap, not a paragraph. No <em>"reply YES to confirm."</em> No 400-word AI essays. Buttons replace the chat, the chat replaces the worklist.</li>
          </ul>
          <div class="home-card-cta">Start with the chat-to-quote flow <span class="arrow">→</span></div>
        </a>

        <a href="#01_home_tab" class="home-card home-card-ui">
          <div>
            <span class="home-card-tag">Section 02 · 19 screens</span>
            <h2>Interactive UI with AI Insights</h2>
            <p class="home-card-lede">The full Revenue Cloud UX, rendered inside Slack.</p>
          </div>
          <ul class="home-card-bullets">
            <li><strong>Native surfaces.</strong> Home tabs, product browsers, multi-step quote forms, approval modals, invoice canvases, payment collectors — all inside Slack. No iframe, no web wrapper.</li>
            <li><strong>Slash-command entry.</strong> <em>/quote new</em>, <em>/discount acme</em>, <em>/approve</em> — type a command, get a full interactive UI that walks you through the rest.</li>
            <li><strong>AI in the margins.</strong> Margin warnings, attach-rate hints, suggested add-ons, proactive nudges — baked into every screen so the AI lives <em>inside</em> the form, not beside it.</li>
          </ul>
          <div class="home-card-cta">Start with the home dashboard <span class="arrow">→</span></div>
        </a>
      </section>

      <section class="home-stats">
        <div class="home-stat">
          <div class="home-stat-num">6–8</div>
          <div class="home-stat-label">tools opened per deal. Each context switch costs ~23 minutes of focus.</div>
        </div>
        <div class="home-stat">
          <div class="home-stat-num">3×</div>
          <div class="home-stat-label">faster AR dispute resolution when the record, invoice, and email sit in one surface.</div>
        </div>
        <div class="home-stat">
          <div class="home-stat-num">0</div>
          <div class="home-stat-label">new tools to learn. It's the Slack you already have — it just knows your pipeline.</div>
        </div>
      </section>

      <footer class="home-footer">
        <div class="home-footer-row">
          <div>
            <div class="home-footer-label">Built on</div>
            <div>Slack Block Kit 2026 · Assistant API · Agentforce</div>
          </div>
          <div>
            <div class="home-footer-label">Covers</div>
            <div>CPQ · Contracts · Amendments · Billing · Collections · Usage</div>
          </div>
          <div>
            <div class="home-footer-label">Prototype by</div>
            <div>Dinesh Gunaseelan</div>
          </div>
        </div>
      </footer>
    </div>
  `;

  function renderHome() {
    activeId = "home";
    location.hash = "home";
    document.querySelectorAll(".nav-item").forEach(b => {
      b.classList.toggle("active", b.dataset.id === "home");
    });
    document.querySelector(".stage-bar").style.display = "none";
    document.getElementById("stage-description").style.display = "none";
    const vp = document.getElementById("viewport");
    vp.dataset.surface = "landing";
    vp.innerHTML = HOME_HTML;
  }

  // Convert AI-surface-only block types (plan, markdown) into BKB-compatible
  // shapes so "Open in Block Kit Builder" doesn't silently reject the payload.
  // Slack's public Block Kit Builder validator only knows the classic set:
  // section, divider, image, actions, context, header, input, file, video,
  // rich_text. Unknown types crash the preview.
  function downgradeForBkb(blocks) {
    const out = [];
    for (const b of blocks) {
      if (b.type === "plan") {
        const title = typeof b.title === "string" ? b.title : (b.title && b.title.text) || "Thinking…";
        const lines = (b.tasks || []).map(t => {
          const mark = t.status === "complete" ? ":white_check_mark:" : t.status === "in_progress" ? ":hourglass_flowing_sand:" : ":white_circle:";
          return `${mark} ${t.title}`;
        });
        const body = lines.length ? `:sparkles: _${title}_\n${lines.join("\n")}` : `:sparkles: _${title}_`;
        out.push({ type: "section", text: { type: "mrkdwn", text: body } });
        continue;
      }
      if (b.type === "markdown") {
        out.push({
          type: "section",
          text: { type: "mrkdwn", text: b.text || "" }
        });
        continue;
      }
      out.push(b);
    }
    return out;
  }

  async function selectMock(id) {
    activeId = id;
    document.querySelectorAll(".nav-item").forEach(b => {
      b.classList.toggle("active", b.dataset.id === id);
    });
    location.hash = id;
    document.querySelector(".stage-bar").style.display = "";
    document.getElementById("stage-description").style.display = "";

    const info = MOCKS.find(m => m.id === id);
    try {
      const res = await fetch(`../mocks/bkb/${id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const meta = payload._meta || {};

      document.getElementById("stage-title").textContent = meta.title || info.title;
      const surfaceLabel = (meta.surface || "message").toUpperCase();
      const surfaceEl = document.getElementById("stage-surface");
      surfaceEl.textContent = surfaceLabel;
      surfaceEl.dataset.surface = meta.surface || "message";

      document.getElementById("stage-description").textContent = meta.description || "";

      // Update sidebar surface labels
      const ns = document.getElementById(`ns-${id}`);
      if (ns) ns.textContent = (meta.surface || "message").toUpperCase();

      // Generate Block Kit Builder URL — strip _meta and downgrade AI-surface
      // block types (plan, markdown) that the public BKB validator rejects.
      const bkbPayload = { ...payload, blocks: downgradeForBkb(payload.blocks || []) };
      delete bkbPayload._meta;
      const bkbUrl = `https://app.slack.com/block-kit-builder#${encodeURIComponent(JSON.stringify(bkbPayload))}`;
      document.getElementById("open-in-bkb").href = bkbUrl;
      document.getElementById("view-json").href = `../mocks/bkb/${id}.json`;

      const { html, surface } = renderSurface(payload, info);
      const vp = document.getElementById("viewport");
      vp.dataset.surface = surface;
      vp.innerHTML = html;
    } catch (err) {
      document.getElementById("viewport").innerHTML = `<div style="padding:30px;color:var(--danger)">Failed to load mock: ${escapeHtml(err.message)}<br><br>This file needs to be served over HTTP. Run <code>python3 -m http.server</code> in the repo root, then open <code>http://localhost:8000/renderer/</code>.</div>`;
    }
  }

  // ============================================================
  // Interactive flow mode
  // ============================================================
  let flowMode = false;
  let flowCurrentId = null; // id of the mock currently visible (main or overlay)

  function isMainStep(id)   { return FLOW_MAIN_IDS.includes(id); }
  function mainStepIdxFor(id) {
    if (isMainStep(id)) return FLOW_MAIN_IDS.indexOf(id);
    const parent = OVERLAY_PARENT[id];
    return parent ? FLOW_MAIN_IDS.indexOf(parent) : -1;
  }

  function enterFlowMode(startId) {
    flowMode = true;
    document.body.classList.add("flow-mode");
    document.getElementById("flow-bar").hidden = false;
    document.getElementById("flow-actions").hidden = false;
    document.getElementById("stage-actions").hidden = true;
    // Sidebar activation: mark the interactive-demo entry active
    document.querySelectorAll(".nav-item").forEach(b => {
      b.classList.toggle("active", b.dataset.id === "__flow__");
    });
    const first = startId && (isMainStep(startId) || OVERLAY_PARENT[startId]) ? startId : FLOW_SEQ[0].id;
    location.hash = `flow/${first}`;
    loadFlowStep(first);
  }

  function exitFlowMode(opts = {}) {
    flowMode = false;
    flowCurrentId = null;
    document.body.classList.remove("flow-mode");
    document.getElementById("flow-bar").hidden = true;
    document.getElementById("flow-actions").hidden = true;
    document.getElementById("stage-actions").hidden = false;
    hideOverflowPopover();
    if (opts.navigate !== false) renderHome();
  }

  async function loadFlowStep(id) {
    flowCurrentId = id;
    location.hash = `flow/${id}`;
    document.querySelector(".stage-bar").style.display = "";
    document.getElementById("stage-description").style.display = "";
    renderFlowStepper();
    const info = (MOCKS.find(m => m.id === id)) || { id, title: id, channel: "" };
    try {
      const res = await fetch(`../mocks/bkb/${id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const meta = payload._meta || {};
      document.getElementById("stage-title").textContent = meta.title || info.title;
      const surfaceEl = document.getElementById("stage-surface");
      surfaceEl.textContent = (meta.surface || "message").toUpperCase();
      surfaceEl.dataset.surface = meta.surface || "message";
      document.getElementById("stage-description").textContent = meta.description || "";
      const { html, surface } = renderSurface(payload, info);
      const vp = document.getElementById("viewport");
      vp.dataset.surface = surface;
      vp.innerHTML = html;
      vp.classList.remove("flow-transition");
      void vp.offsetWidth; // reflow so the transition re-triggers
      vp.classList.add("flow-transition");
    } catch (err) {
      document.getElementById("viewport").innerHTML =
        `<div style="padding:30px;color:var(--danger)">Failed to load: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderFlowStepper() {
    const stepper = document.getElementById("flow-stepper");
    const activeIdx = mainStepIdxFor(flowCurrentId);
    const overlayLabel = OVERLAY_PARENT[flowCurrentId]
      ? (MOCKS.find(m => m.id === flowCurrentId)?.title || flowCurrentId)
      : null;
    stepper.innerHTML = FLOW_SEQ.map((step, i) => {
      const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
      const connector = i < FLOW_SEQ.length - 1 ? `<span class="flow-connector ${i < activeIdx ? "done" : ""}"></span>` : "";
      return `<button class="flow-step ${state}" data-flow-jump="${step.id}" type="button" title="${escapeHtml(step.label)}">
          <span class="flow-step-dot">${i < activeIdx ? "✓" : i + 1}</span>
          <span class="flow-step-label">${escapeHtml(step.label)}</span>
        </button>${connector}`;
    }).join("");
    // Overlay banner
    const hint = document.getElementById("flow-hint");
    if (overlayLabel) {
      hint.innerHTML = `<span class="flow-hint-dot overlay"></span><span class="flow-hint-text"><strong>Overlay:</strong> ${escapeHtml(overlayLabel)} · Cancel/Save returns to Line items.</span>`;
    } else {
      hint.innerHTML = `<span class="flow-hint-dot"></span><span class="flow-hint-text">Click any button inside the mock to advance. Non-navigating actions fire a toast below.</span>`;
    }
    // Prev/Next enablement
    const prevBtn = document.getElementById("flow-prev");
    const nextBtn = document.getElementById("flow-next");
    prevBtn.disabled = activeIdx <= 0;
    nextBtn.disabled = activeIdx >= FLOW_SEQ.length - 1 || activeIdx < 0;
  }

  function flowNavigate(targetId, actionLabel) {
    showToast(`→ ${actionLabel || "Navigating"}`, "nav");
    loadFlowStep(targetId);
  }

  function handleFlowClick(e) {
    if (!flowMode) return;
    // Stepper jump
    const jumpEl = e.target.closest("[data-flow-jump]");
    if (jumpEl) {
      e.preventDefault();
      loadFlowStep(jumpEl.dataset.flowJump);
      return;
    }
    // Find a relevant actionable element inside the viewport
    const vp = document.getElementById("viewport");
    if (!vp.contains(e.target)) return;
    const actionable = e.target.closest("[data-action-id],[data-flow-action],.bk-overflow");
    if (!actionable) return;
    e.preventDefault();
    e.stopPropagation();

    // Overflow: pop menu instead of immediately firing
    if (actionable.classList.contains("bk-overflow") && actionable.dataset.overflowOptions) {
      openOverflowPopover(actionable);
      return;
    }

    const rules = FLOW_RULES[flowCurrentId] || {};
    const actionId = actionable.dataset.actionId || actionable.dataset.flowAction;
    const target = rules[actionId];
    const value = actionable.dataset.actionValue ? ` · value=${actionable.dataset.actionValue}` : "";
    if (!target || target === "__toast__") {
      showToast(`${actionId || "action"} fired${value}`, "action");
      return;
    }
    flowNavigate(target, `${actionId} → ${stepLabelFor(target)}`);
  }

  function stepLabelFor(id) {
    const main = FLOW_SEQ.find(s => s.id === id);
    if (main) return main.label;
    const mock = MOCKS.find(m => m.id === id);
    return mock ? mock.title : id;
  }

  // ----- Overflow popover -----
  function openOverflowPopover(anchor) {
    const pop = document.getElementById("overflow-popover");
    const opts = JSON.parse(decodeURIComponent(anchor.dataset.overflowOptions || "%5B%5D"));
    const actionId = anchor.dataset.actionId || "";
    pop.innerHTML = opts.map(o =>
      `<button type="button" class="overflow-option" data-pop-action="${escapeHtml(actionId)}" data-pop-value="${escapeHtml(o.value)}">
         ${escapeHtml(renderEmoji(o.text))}
       </button>`).join("") || `<div class="overflow-empty">No options</div>`;
    const rect = anchor.getBoundingClientRect();
    pop.style.top  = `${rect.bottom + window.scrollY + 4}px`;
    pop.style.left = `${Math.max(8, rect.right + window.scrollX - 240)}px`;
    pop.hidden = false;
  }
  function hideOverflowPopover() {
    const pop = document.getElementById("overflow-popover");
    if (pop) pop.hidden = true;
  }

  // ----- Toast -----
  let toastSeq = 0;
  function showToast(msg, kind) {
    const host = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = `toast toast-${kind || "action"}`;
    el.textContent = msg;
    el.dataset.id = ++toastSeq;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    setTimeout(() => {
      el.classList.remove("in");
      el.classList.add("out");
      setTimeout(() => el.remove(), 240);
    }, 2200);
  }

  // ----- Flow controls wiring -----
  function initFlowControls() {
    document.getElementById("flow-prev").addEventListener("click", () => {
      const idx = mainStepIdxFor(flowCurrentId);
      if (idx > 0) loadFlowStep(FLOW_SEQ[idx - 1].id);
    });
    document.getElementById("flow-next").addEventListener("click", () => {
      const idx = mainStepIdxFor(flowCurrentId);
      if (idx >= 0 && idx < FLOW_SEQ.length - 1) loadFlowStep(FLOW_SEQ[idx + 1].id);
    });
    document.getElementById("flow-restart").addEventListener("click", () => loadFlowStep(FLOW_SEQ[0].id));
    document.getElementById("flow-exit").addEventListener("click", exitFlowMode);
    // Viewport + stepper interception (delegated, survives innerHTML swaps)
    document.addEventListener("click", e => {
      // Dismiss overflow popover on outside click; allow option clicks inside it
      const pop = document.getElementById("overflow-popover");
      if (pop && !pop.hidden) {
        const opt = e.target.closest(".overflow-option");
        if (opt) {
          e.preventDefault();
          const actionId = opt.dataset.popAction;
          const value = opt.dataset.popValue;
          hideOverflowPopover();
          if (flowMode) {
            const rules = FLOW_RULES[flowCurrentId] || {};
            const target = rules[actionId];
            if (target && target !== "__toast__") {
              flowNavigate(target, `${actionId}:${value} → ${stepLabelFor(target)}`);
            } else {
              showToast(`${actionId} · ${value}`, "action");
            }
          }
          return;
        }
        if (!e.target.closest(".bk-overflow")) hideOverflowPopover();
      }
      handleFlowClick(e);
    });
  }

  // Eagerly fetch metadata for each mock to populate sidebar surface labels
  async function prefetchSurfaces() {
    await Promise.all(MOCKS.map(async m => {
      try {
        const res = await fetch(`../mocks/bkb/${m.id}.json`);
        if (!res.ok) return;
        const payload = await res.json();
        const surface = (payload._meta && payload._meta.surface) || "message";
        const el = document.getElementById(`ns-${m.id}`);
        if (el) el.textContent = surface.toUpperCase();
      } catch (_) { /* noop */ }
    }));
  }

  // Theme toggle
  function initTheme() {
    const btn = document.getElementById("theme-toggle");
    if (!localStorage.getItem("revflow-theme-v2")) {
      localStorage.removeItem("revflow-theme");
      localStorage.setItem("revflow-theme-v2", "1");
    }
    document.documentElement.dataset.theme = localStorage.getItem("revflow-theme") || "light";
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("revflow-theme", next);
    });
  }

  function parseFlowHash(h) {
    if (h === "flow") return { flow: true, id: FLOW_SEQ[0].id };
    if (h.startsWith("flow/")) {
      const id = h.slice(5);
      const valid = isMainStep(id) || OVERLAY_PARENT[id];
      return { flow: true, id: valid ? id : FLOW_SEQ[0].id };
    }
    return null;
  }

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderSidebar();
    prefetchSurfaces();
    initFlowControls();
    const hash = location.hash.replace("#", "");
    const flowReq = parseFlowHash(hash);
    if (flowReq) {
      enterFlowMode(flowReq.id);
    } else if (!hash || hash === "home") {
      renderHome();
    } else if (MOCKS.find(m => m.id === hash)) {
      selectMock(hash);
    } else {
      renderHome();
    }
    window.addEventListener("hashchange", () => {
      const h = location.hash.replace("#", "");
      const fr = parseFlowHash(h);
      if (fr) {
        if (!flowMode) enterFlowMode(fr.id);
        else if (fr.id !== flowCurrentId) loadFlowStep(fr.id);
        return;
      }
      if (flowMode) exitFlowMode({ navigate: false });
      if ((h === "" || h === "home") && activeId !== "home") renderHome();
      else if (MOCKS.find(m => m.id === h) && h !== activeId) selectMock(h);
    });
  });
})();
