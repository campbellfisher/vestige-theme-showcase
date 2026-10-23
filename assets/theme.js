/* ============================================================
   VESTIGE — theme.js (vanilla JS, no dependencies)
   ============================================================ */
(function () {
  'use strict';

  var routes = window.themeRoutes || {};
  var strings = window.themeStrings || {};
  var settings = window.themeSettings || {};

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function money(cents) {
    var format = window.themeMoneyFormat || '${{amount}}';
    function fmt(n, decimals) {
      return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    var value = (cents / 100);
    return format
      .replace('{{amount}}', fmt(value, 2))
      .replace('{{amount_no_decimals}}', fmt(value, 0))
      .replace('{{amount_with_comma_separator}}', fmt(value, 2).replace('.', ','))
      .replace('{{amount_no_decimals_with_comma_separator}}', fmt(value, 0).replace('.', ','));
  }

  var focusTrap = {
    active: null,
    trap: function (container, e) {
      var focusables = $all('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', container)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  function showToast(message) {
    var toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- header hide on scroll ---------- */
  (function () {
    var header = $('.site-header');
    if (!header) return;
    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 140 && y > lastY) header.classList.add('site-header--hidden');
      else header.classList.remove('site-header--hidden');
      lastY = y;
    }, { passive: true });
  })();

  /* ---------- generic drawer/modal ---------- */
  function openOverlay(el) {
    el.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    el._lastFocus = document.activeElement;
    var focusable = el.querySelector('button, a[href], input');
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
    el.addEventListener('keydown', trapKeys);
  }
  function closeOverlay(el) {
    el.classList.remove('is-open');
    document.body.style.overflow = '';
    el.removeEventListener('keydown', trapKeys);
    if (el._lastFocus && el._lastFocus.focus) el._lastFocus.focus();
  }
  function trapKeys(e) {
    if (e.key === 'Tab') focusTrap.trap(e.currentTarget, e);
    if (e.key === 'Escape') closeOverlay(e.currentTarget);
  }
  $all('[data-open-drawer]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-open-drawer'));
      if (el) openOverlay(el);
    });
  });
  $all('[data-close-drawer]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = btn.closest('.mobile-nav, .cart-drawer, .search-modal, .overlay');
      if (el) closeOverlay(el);
    });
  });

  /* ---------- cart ---------- */
  var cartDrawer = null;

  function getCart() {
    return fetch(routes.rootUrl + 'cart.js', { headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); });
  }

  function updateCartCount(count) {
    $all('.cart-count').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
      el.setAttribute('aria-label', count + ' items in cart');
    });
  }

  function cartItemHTML(item) {
    var img = item.image
      ? '<img src="' + item.image.replace(/(\.[a-z]+)(\?.*)?$/i, '_180x$1') + '" alt="' + item.title.replace(/"/g, '&quot;') + '" loading="lazy" width="84" height="104">'
      : '';
    var variant = (item.variant_title && item.variant_title !== 'Default Title')
      ? '<p class="cart-item__variant">' + item.variant_title + '</p>' : '';
    var discounts = '';
    (item.discounts || []).forEach(function (d) {
      if (d.amount > 0) discounts += '<p class="cart-item__discount">' + d.title + ' (&minus;' + money(d.amount) + ')</p>';
    });
    var priceHTML = (item.original_line_price && item.original_line_price !== item.final_line_price)
      ? '<span class="price--compare">' + money(item.original_line_price) + '</span> <span class="price">' + money(item.final_line_price) + '</span>'
      : '<span class="price">' + money(item.final_line_price) + '</span>';
    return '' +
      '<div class="cart-item" data-key="' + item.key + '">' +
        '<a href="' + item.url + '" tabindex="-1" aria-hidden="true">' + img + '</a>' +
        '<div>' +
          '<p class="cart-item__title"><a href="' + item.url + '">' + item.product_title + '</a></p>' +
          variant +
          discounts +
          '<div class="cart-item__row">' +
            '<div class="qty" role="group" aria-label="' + strings.quantityLabel + '">' +
              '<button type="button" data-qty="-1" aria-label="Decrease quantity">&minus;</button>' +
              '<input type="number" value="' + item.quantity + '" min="0" aria-label="' + strings.quantityLabel + '" data-qty-input>' +
              '<button type="button" data-qty="1" aria-label="Increase quantity">+</button>' +
            '</div>' +
            priceHTML +
          '</div>' +
          '<button type="button" class="cart-item__remove" data-remove>' + strings.removeItem + '</button>' +
        '</div>' +
      '</div>';
  }

  function renderCartDrawer(cart) {
    cartDrawer = cartDrawer || $('#cart-drawer');
    if (!cartDrawer) return;
    updateCartCount(cart.item_count);
    var itemsEl = $('.cart-drawer__items', cartDrawer);
    var footEl = $('.cart-drawer__foot', cartDrawer);
    if (cart.item_count === 0) {
      itemsEl.innerHTML = '<div class="empty-state"><h2 class="h3">' + strings.cartEmpty + '</h2>' +
        '<a class="btn btn--secondary" href="' + routes.rootUrl + 'collections/all">' + strings.cartContinueShopping + '</a></div>';
      footEl.style.display = 'none';
      return;
    }
    footEl.style.display = '';
    itemsEl.innerHTML = cart.items.map(cartItemHTML).join('');

    // subtotal + free shipping bar
    var threshold = (settings.freeShippingThreshold || 0) * 100;
    var barHTML = '';
    if (threshold > 0) {
      var pct = Math.min(100, Math.round((cart.total_price / threshold) * 100));
      var msg = cart.total_price >= threshold
        ? strings.freeShippingUnlocked
        : strings.freeShippingRemaining.replace('{{ amount }}', money(threshold - cart.total_price));
      barHTML = '<div class="shipping-bar"><p>' + msg + '</p>' +
        '<div class="shipping-bar__track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><div class="shipping-bar__fill" style="width:' + pct + '%"></div></div></div>';
    }
    var discountHTML = cart.total_discount > 0
      ? '<div class="cart-subtotal"><span>' + strings.cartDiscount + '</span><span>&minus;' + money(cart.total_discount) + '</span></div>'
      : '';
    footEl.innerHTML = barHTML +
      discountHTML +
      '<div class="cart-subtotal"><span>' + strings.cartSubtotal + '</span><span>' + money(cart.total_price) + '</span></div>' +
      '<p class="cart-taxes">' + ($('.cart-taxes', footEl) ? $('.cart-taxes', footEl).textContent : '') + '</p>' +
      '<a href="' + routes.cartUrl + '" class="btn btn--full">' + strings.cartCheckout + '</a>' +
      '<p class="text-center small" style="margin-top:.75rem"><a class="btn--link" href="' + routes.cartUrl + '">' + strings.cartViewCart + '</a></p>';

    // wire qty + remove
    $all('[data-qty]', itemsEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.cart-item');
        var input = row.querySelector('[data-qty-input]');
        changeQty(row.getAttribute('data-key'), parseInt(input.value, 10) + parseInt(btn.getAttribute('data-qty'), 10));
      });
    });
    $all('[data-qty-input]', itemsEl).forEach(function (input) {
      input.addEventListener('change', function () {
        var row = input.closest('.cart-item');
        changeQty(row.getAttribute('data-key'), Math.max(0, parseInt(input.value, 10) || 0));
      });
    });
    $all('[data-remove]', itemsEl).forEach(function (btn) {
      btn.addEventListener('click', function () {
        changeQty(btn.closest('.cart-item').getAttribute('data-key'), 0);
      });
    });
  }

  function changeQty(key, qty) {
    fetch(routes.cartChangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) { renderCartDrawer(cart); document.dispatchEvent(new CustomEvent('vestige:cart-updated')); })
      .catch(function () { showToast(strings.loading); });
  }

  function addToCart(formData, onDone) {
    fetch(routes.cartAddUrl, { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error((res.json && res.json.description) || 'Error');
        return getCart();
      })
      .then(function (cart) {
        renderCartDrawer(cart);
        document.dispatchEvent(new CustomEvent('vestige:cart-updated'));
        showToast(strings.cartItemAdded);
        if (settings.cartType === 'drawer') {
          var d = $('#cart-drawer');
          if (d) openOverlay(d);
        } else {
          window.location.href = routes.cartUrl;
        }
        if (onDone) onDone();
      })
      .catch(function (err) { showToast(err.message || 'Error'); if (onDone) onDone(); });
  }

  // initial cart state
  getCart().then(renderCartDrawer).catch(function () {});

  // quick add buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-quick-add]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-quick-add');
    btn.disabled = true;
    var fd = new FormData();
    fd.append('id', id);
    fd.append('quantity', '1');
    addToCart(fd, function () { btn.disabled = false; });
  });

  /* ---------- product page ---------- */
  $all('[data-product-form]').forEach(function (form) {
    var section = form.closest('[data-product-section]');
    var variantData = null;
    try { variantData = JSON.parse($('#' + form.getAttribute('data-variants-id')).textContent); } catch (err) { variantData = []; }

    function currentVariant() {
      if (variantData.length <= 1) return variantData[0];
      var selected = [];
      $all('[data-option-input]:checked, [data-option-select]', form).forEach(function (input) {
        selected.push(input.value);
      });
      return variantData.find(function (v) {
        return v.options.every(function (opt, i) { return opt === selected[i]; });
      });
    }

    function updateVariant() {
      var variant = currentVariant();
      var idInput = form.querySelector('[name="id"]');
      var submitBtn = form.querySelector('[data-add-to-cart]');
      var priceEl = section ? section.querySelector('[data-product-price]') : null;
      if (!variant) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('span').textContent = strings.unavailable; }
        return;
      }
      if (idInput) idInput.value = variant.id;
      // swatch/pill active states
      $all('[data-option-value]', form).forEach(function (el) {
        var optIndex = parseInt(el.getAttribute('data-option-index'), 10);
        el.classList.toggle('is-active', variant.options[optIndex] === el.getAttribute('data-option-value'));
      });
      if (priceEl) {
        var compare = variant.compare_at_price > variant.price
          ? '<span class="price--compare">' + money(variant.compare_at_price) + '</span>' : '';
        priceEl.innerHTML = '<span class="price' + (variant.compare_at_price > variant.price ? ' price--sale' : '') + '">' + money(variant.price) + '</span>' + compare;
      }
      if (submitBtn) {
        if (variant.available) {
          submitBtn.disabled = false;
          submitBtn.querySelector('span').textContent = strings.addToCart;
        } else {
          submitBtn.disabled = true;
          submitBtn.querySelector('span').textContent = strings.soldOut;
        }
      }
      // update gallery to variant featured media
      if (variant.featured_media && section) {
        var target = section.querySelector('[data-media-id="' + variant.featured_media.id + '"]');
        if (target) setActiveMedia(section, target);
      }
      // pickup availability (from dedicated JSON, since variants JSON omits store_availabilities)
      var pickupEl = section ? section.querySelector('[data-pickup]') : null;
      if (pickupEl) {
        var pickupData = {};
        try { pickupData = JSON.parse(document.getElementById(form.id + '-pickup').textContent); } catch (e) { pickupData = {}; }
        var avail = pickupData[variant.id] || [];
        var pickable = avail.filter(function (a) { return a.pick_up_enabled; });
        if (pickable.length) {
          var first = pickable[0];
          var line = first.location + ' — ' + (first.available ? first.pick_up_time : strings.unavailable);
          pickupEl.querySelector('span').textContent = line;
          pickupEl.style.display = 'flex';
        } else { pickupEl.style.display = 'none'; }
      }
      // selling plans (per-variant allocations from dedicated JSON)
      var plansEl = form.querySelector('[data-selling-plans]');
      if (plansEl) {
        var plansData = {};
        try { plansData = JSON.parse(document.getElementById(form.id + '-selling-plans').textContent); } catch (e) { plansData = {}; }
        var allocations = plansData[variant.id] || [];
        plansEl.querySelectorAll('.selling-plan:not(.selling-plan--one-time)').forEach(function (el) { el.remove(); });
        allocations.forEach(function (a) {
          var label = document.createElement('label');
          label.className = 'selling-plan';
          var input = document.createElement('input');
          input.type = 'radio'; input.name = 'selling_plan'; input.value = a.id;
          var text = document.createElement('span'); text.className = 'selling-plan__text'; text.textContent = a.name;
          var price = document.createElement('span'); price.className = 'selling-plan__price'; price.textContent = money(a.price);
          label.appendChild(input); label.appendChild(text); label.appendChild(price);
          plansEl.appendChild(label);
        });
        var oneTimePrice = plansEl.querySelector('[data-one-time-price]');
        if (oneTimePrice) oneTimePrice.textContent = money(variant.price);
        var oneTimeInput = plansEl.querySelector('.selling-plan--one-time input');
        if (oneTimeInput) oneTimeInput.checked = true;
      }
    }

    form.addEventListener('change', function (e) {
      if (e.target.matches('[data-option-input], [data-option-select]')) updateVariant();
    });
    updateVariant();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[data-add-to-cart]');
      if (btn) btn.disabled = true;
      addToCart(new FormData(form), function () { if (btn) { btn.disabled = false; updateVariant(); } });
    });

    // gallery
    function setActiveMedia(sec, target) {
      $all('[data-media-item]', sec).forEach(function (m) { m.hidden = true; });
      target.hidden = false;
      var targetId = target.getAttribute('data-media-id');
      $all('[data-thumb]', sec).forEach(function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-thumb') === targetId);
      });
    }
    if (section) {
      $all('[data-thumb]', section).forEach(function (thumb) {
        thumb.addEventListener('click', function () {
          var target = section.querySelector('[data-media-id="' + thumb.getAttribute('data-thumb') + '"]');
          if (target) setActiveMedia(section, target);
        });
      });
      var mainMedia = section.querySelector('.product-gallery__main');
      if (mainMedia) {
        mainMedia.addEventListener('click', function () { mainMedia.classList.toggle('is-zoomed'); });
      }
    }

    // qty steppers (generic, page-wide)
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-stepper]');
    if (!btn) return;
    var input = btn.parentElement.querySelector('input');
    if (!input) return;
    var val = parseInt(input.value, 10) || 1;
    var min = parseInt(input.getAttribute('min') || '1', 10);
    input.value = Math.max(min, val + parseInt(btn.getAttribute('data-stepper'), 10));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- product recommendations (related + complementary) ---------- */
  $all('[data-recommendations]').forEach(function (el) {
    var url = el.getAttribute('data-url');
    if (!url) return;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var src = doc.querySelector('[data-recommendations-content]');
        var dst = el.querySelector('[data-recommendations-content]');
        if (src && dst && src.innerHTML.trim() !== '') dst.innerHTML = src.innerHTML;
      })
      .catch(function () {});
  });

  /* ---------- slideshow ---------- */
  $all('[data-slideshow]').forEach(function (slideshow) {
    var slides = $all('.slide', slideshow);
    if (slides.length < 2) return;
    var dots = $all('[data-dot]', slideshow);
    var index = 0;
    var autoplay = slideshow.getAttribute('data-autoplay') === 'true';
    var speed = parseInt(slideshow.getAttribute('data-speed') || '6000', 10);
    var timer = null;
    var toggle = slideshow.querySelector('[data-autoplay-toggle]');
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function isPaused() {
      return !toggle || toggle.getAttribute('aria-pressed') === 'true';
    }
    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      dots.forEach(function (d, n) {
        d.classList.toggle('is-active', n === index);
        d.setAttribute('aria-selected', n === index ? 'true' : 'false');
      });
      restart();
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (autoplay && !isPaused() && !reducedMotion) timer = setInterval(function () { go(index + 1); }, speed);
    }
    function setPaused(paused) {
      if (!toggle) return;
      toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      toggle.setAttribute('aria-label', paused ? toggle.getAttribute('data-label-play') : toggle.getAttribute('data-label-pause'));
      slideshow.classList.toggle('is-paused', paused);
      restart();
    }
    dots.forEach(function (d) {
      d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-dot'), 10)); });
    });
    $all('[data-prev]', slideshow).forEach(function (b) { b.addEventListener('click', function () { go(index - 1); }); });
    $all('[data-next]', slideshow).forEach(function (b) { b.addEventListener('click', function () { go(index + 1); }); });
    if (toggle) {
      toggle.addEventListener('click', function () { setPaused(!isPaused()); });
      if (reducedMotion && autoplay) setPaused(true);
    }
    slideshow.addEventListener('mouseenter', function () { if (timer) clearInterval(timer); });
    slideshow.addEventListener('mouseleave', restart);
    slideshow.addEventListener('focusin', function () { if (timer) clearInterval(timer); });
    slideshow.addEventListener('focusout', restart);
    restart();
  });

  /* ---------- predictive search ---------- */
  (function () {
    if (!settings.predictiveSearchEnabled) return;
    var modal = $('#search-modal');
    var input = modal ? modal.querySelector('[data-search-input]') : null;
    var resultsEl = modal ? modal.querySelector('[data-search-results]') : null;
    if (!modal || !input) return;
    var debounce = null;

    $all('[data-open-search]').forEach(function (btn) {
      btn.addEventListener('click', function () { openOverlay(modal); setTimeout(function () { input.focus(); }, 80); });
    });

    input.addEventListener('input', function () {
      clearTimeout(debounce);
      var q = input.value.trim();
      if (q.length < 2) { resultsEl.innerHTML = ''; return; }
      debounce = setTimeout(function () { runSearch(q); }, 280);
    });

    function runSearch(q) {
      resultsEl.innerHTML = '<p class="muted">' + strings.loading + '…</p>';
      var url = routes.predictiveSearchUrl + '.json?q=' + encodeURIComponent(q) +
        '&resources[type]=product,article,page&resources[limit]=6&section_id=predictive-search';
      fetch(url, { headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var doc = new DOMParser().parseFromString(data.resources.results_html || '', 'text/html');
          var section = doc.querySelector('#shopify-section-predictive-search');
          resultsEl.innerHTML = section ? section.innerHTML : '';
          var viewAll = resultsEl.querySelector('[data-view-all]');
          if (viewAll) viewAll.setAttribute('href', routes.rootUrl + 'search?q=' + encodeURIComponent(q));
        })
        .catch(function () { resultsEl.innerHTML = ''; });
    }
  })();

  /* ---------- collection filters (mobile toggle) ---------- */
  $all('[data-filter-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sidebar = document.getElementById(btn.getAttribute('data-filter-toggle'));
      if (sidebar) sidebar.classList.toggle('is-open');
    });
  });

  /* ---------- footer year ---------- */
  $all('[data-current-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
