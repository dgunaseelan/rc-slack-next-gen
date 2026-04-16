(() => {
  "use strict";

  const SECTIONS = [
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
      title: "Slack UI with AI Insights",
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
  const MOCKS = SECTIONS.flatMap(s => s.items);

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
        return `<${tag} class="bk-button${style}" type="button"${href}>${label}</${tag}>`;
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
        return `<button class="bk-overflow" aria-label="More options">⋯</button>`;
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
              <button class="modal-close" aria-label="Close">×</button>
            </div>
            <div class="modal-body">${blocksHtml}</div>
            <div class="modal-footer">
              ${payload.close ? `<button class="bk-button">${renderTextObject(payload.close)}</button>` : ""}
              ${payload.submit ? `<button class="bk-button primary">${renderTextObject(payload.submit)}</button>` : ""}
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
    let counter = 0;
    nav.innerHTML = SECTIONS.map(section => {
      const itemsHtml = section.items.map(m => {
        counter += 1;
        const num = String(counter).padStart(2, "0");
        return `<button class="nav-item" data-id="${m.id}">
          <span class="nav-num">${num}</span>
          <span class="nav-text">${escapeHtml(m.title)}<div class="nav-surface" id="ns-${m.id}">—</div></span>
        </button>`;
      }).join("");
      return `<div class="sidebar-section">
        <div class="sidebar-title">${escapeHtml(section.title)}</div>
        ${itemsHtml}
      </div>`;
    }).join("");
    nav.addEventListener("click", e => {
      const btn = e.target.closest(".nav-item");
      if (btn) selectMock(btn.dataset.id);
    });
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

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderSidebar();
    prefetchSurfaces();
    const hash = location.hash.replace("#", "");
    const initial = MOCKS.find(m => m.id === hash) ? hash : MOCKS[0].id;
    selectMock(initial);
    window.addEventListener("hashchange", () => {
      const h = location.hash.replace("#", "");
      if (MOCKS.find(m => m.id === h) && h !== activeId) selectMock(h);
    });
  });
})();
