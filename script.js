(function () {
    'use strict';

    var allProperties = [];
    var filteredProperties = [];
    var currentUser = null;
    var chatUnsubscribe = null;
    var uploadedImages = [];
    var activeFilters = { type: '', city: '', purpose: '' };
    var compoundDetailState = null;

    document.addEventListener('DOMContentLoaded', function () {
        checkUserSession();
        loadProperties();
        loadCompounds();

        // Fix property form submission
        var form = document.getElementById('listPropertyForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                submitProperty();
            });
        }

        var compoundOverlay = document.getElementById('compoundDetailOverlay');
        if (compoundOverlay) {
            compoundOverlay.addEventListener('click', function (e) {
                if (e.target === compoundOverlay) {
                    closeCompoundDetail();
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeCompoundDetail();
            }
        });
    });

    // ===== USER AUTH =====
    function checkUserSession() {
        var session = localStorage.getItem('diyarona_user');
        if (session) {
            try {
                currentUser = JSON.parse(session);
                showLoggedInState();
            } catch (e) {
                localStorage.removeItem('diyarona_user');
            }
        }
    }

    function showLoggedInState() {
        var authBtn = document.getElementById('authBtn');
        var userMenu = document.getElementById('userMenu');
        var userName = document.getElementById('userName');
        var chatBtn = document.getElementById('chatBtn');
        var chatFab = document.getElementById('chatFab');

        if (authBtn) authBtn.classList.add('hidden');
        if (userMenu) { userMenu.classList.remove('hidden'); userName.textContent = currentUser.name; }
        if (chatBtn) chatBtn.classList.remove('hidden');
        if (chatFab) chatFab.classList.remove('hidden');

        var ownerName = document.getElementById('propOwnerName');
        var ownerPhone = document.getElementById('propOwnerPhone');
        var ownerEmail = document.getElementById('propOwnerEmail');
        if (ownerName && currentUser.name) ownerName.value = currentUser.name;
        if (ownerPhone && currentUser.phone) ownerPhone.value = currentUser.phone;
        if (ownerEmail && currentUser.email) ownerEmail.value = currentUser.email;
    }

    window.openAuthModal = function () { document.getElementById('authModal').classList.remove('hidden'); };
    window.closeAuthModal = function () { document.getElementById('authModal').classList.add('hidden'); };

    window.switchAuthTab = function (tab) {
        var tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(function (t) { t.classList.remove('active'); });
        if (tab === 'login') {
            tabs[0].classList.add('active');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
        } else {
            tabs[1].classList.add('active');
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
        }
    };

    window.registerUser = function (e) {
        e.preventDefault();
        var name = document.getElementById('regName').value.trim();
        var phone = document.getElementById('regPhone').value.trim();
        var email = document.getElementById('regEmail').value.trim();
        var password = document.getElementById('regPassword').value;
        if (!name || !phone || !email || !password) { showToast('يرجى ملء جميع الحقول'); return; }

        db.collection('users').where('email', '==', email).get().then(function (snap) {
            if (!snap.empty) { showToast('البريد الإلكتروني مسجل مسبقاً'); return; }
            var userId = 'user_' + Date.now();
            return db.collection('users').doc(userId).set({
                id: userId, name: name, phone: phone, email: email,
                passwordHash: simpleHash(password),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'buyer'
            }).then(function () {
                currentUser = { id: userId, name: name, phone: phone, email: email, role: 'buyer' };
                localStorage.setItem('diyarona_user', JSON.stringify(currentUser));
                showLoggedInState();
                closeAuthModal();
                showToast('تم إنشاء الحساب بنجاح! مرحباً ' + name);
            });
        });
    };

    window.loginUser = function (e) {
        e.preventDefault();
        var emailOrPhone = document.getElementById('loginEmail').value.trim();
        var password = document.getElementById('loginPassword').value;
        if (!emailOrPhone || !password) { showToast('يرجى ملء جميع الحقول'); return; }
        var hash = simpleHash(password);

        db.collection('users').where('email', '==', emailOrPhone).get().then(function (snap) {
            if (snap.empty) return db.collection('users').where('phone', '==', emailOrPhone).get();
            return snap;
        }).then(function (snap) {
            if (!snap || snap.empty) { showToast('بيانات الدخول غير صحيحة'); return; }
            var data = snap.docs[0].data();
            if (data.passwordHash !== hash) { showToast('كلمة المرور غير صحيحة'); return; }
            currentUser = { id: data.id, name: data.name, phone: data.phone, email: data.email, role: data.role || 'buyer' };
            localStorage.setItem('diyarona_user', JSON.stringify(currentUser));
            showLoggedInState();
            closeAuthModal();
            showToast('مرحباً ' + data.name + '!');
        });
    };

    window.logoutUser = function () {
        currentUser = null;
        localStorage.removeItem('diyarona_user');
        if (chatUnsubscribe) chatUnsubscribe();
        document.getElementById('authBtn').classList.remove('hidden');
        document.getElementById('userMenu').classList.add('hidden');
        document.getElementById('chatBtn').classList.add('hidden');
        document.getElementById('chatFab').classList.add('hidden');
        document.getElementById('chatWidget').classList.add('hidden');
        showToast('تم تسجيل الخروج');
    };

    // ===== COMPOUNDS =====
    function loadCompounds() {
        db.collection('compounds').orderBy('order', 'asc').onSnapshot(function (snap) {
            var container = document.getElementById('compoundsShowcase');
            if (!container) return;
            if (snap.empty) { container.innerHTML = '<p class="no-compounds">قريباً... مشاريع جديدة</p>'; return; }

            var html = '';
            snap.forEach(function (doc) {
                var c = doc.data();
                c.id = doc.id;
                var coverImg = (c.images && c.images[0]) || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop';
                var slugMap = {'النخيل':'alnakheel','الأرز':'alarz','الليمون':'allaymoun'};
                var slug = slugMap[c.name] || doc.id;
                html += '<div class="compound-card" onclick="window.location.href=\'compound.html?slug='+slug+'\'">';
                html += '<div class="compound-card-image"><img src="' + coverImg + '" alt="' + c.name + '"><div class="compound-card-overlay"></div>';
                html += '<div class="compound-card-badge"><i class="fas fa-crown"></i> مشروع ديارنا</div></div>';
                html += '<div class="compound-card-content">';
                html += '<h3>' + c.name + '</h3>';
                html += '<p class="compound-location"><i class="fas fa-map-marker-alt"></i> ' + (c.city || '') + (c.area ? ' - ' + c.area : '') + '</p>';
                html += '<p class="compound-desc">' + (c.shortDescription || '') + '</p>';
                html += '<div class="compound-stats">';
                if (c.totalUnits) html += '<span><i class="fas fa-building"></i> ' + c.totalUnits + ' وحدة</span>';
                if (c.startingPrice) html += '<span><i class="fas fa-tag"></i> يبدأ من ' + formatPrice(c.startingPrice) + '</span>';
                html += '</div>';
                html += '<button class="btn-explore-compound">استكشف المشروع <i class="fas fa-arrow-left"></i></button>';
                html += '</div></div>';
            });
            container.innerHTML = html;
        });
    }

    function renderCompoundDetail() {
        var content = document.getElementById('compoundDetailContent');
        var compound;
        var images;
        var html;
        var i;

        if (!compoundDetailState || !content) {
            return;
        }

        compound = compoundDetailState.compound || {};
        images = compound.images && compound.images.length ? compound.images.slice(0, 4) : [];
        if (!images.length) {
            images.push('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=700&fit=crop');
        }
        while (images.length < 4) {
            images.push(images[images.length - 1]);
        }

        html = '';
        html += '<div class="compound-hero-gallery">';
        for (i = 0; i < images.length; i++) {
            html += '<img src="' + images[i] + '" alt="' + escapeHtml(compound.name || 'مجمع سكني') + '">';
        }
        html += '</div>';
        html += '<div class="compound-info-grid">';
        html += '<div>';
        html += '<h1>' + escapeHtml(compound.name || 'مجمع سكني') + '</h1>';
        html += '<p class="compound-detail-location"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml((compound.city || '') + (compound.area ? ' - ' + compound.area : '')) + '</p>';
        html += '<p class="compound-detail-desc">' + escapeHtml(compound.description || compound.shortDescription || 'تفاصيل المشروع ستتوفر قريباً.') + '</p>';
        html += '<div class="compound-stats">';
        if (compound.totalUnits) {
            html += '<div class="compound-stat"><span class="compound-stat-value">' + escapeHtml(compound.totalUnits) + '</span><span class="compound-stat-label">إجمالي الوحدات</span></div>';
        }
        if (compound.startingPrice) {
            html += '<div class="compound-stat"><span class="compound-stat-value">' + escapeHtml(formatPrice(compound.startingPrice)) + '</span><span class="compound-stat-label">سعر البداية</span></div>';
        }
        if (compound.completionDate) {
            html += '<div class="compound-stat"><span class="compound-stat-value">' + escapeHtml(compound.completionDate) + '</span><span class="compound-stat-label">موعد التسليم</span></div>';
        }
        if (compoundDetailState.properties.length) {
            html += '<div class="compound-stat"><span class="compound-stat-value">' + escapeHtml(compoundDetailState.properties.length) + '</span><span class="compound-stat-label">وحدة متاحة</span></div>';
        }
        html += '</div>';
        if (compound.amenities && compound.amenities.length) {
            html += '<div class="compound-amenities">';
            for (i = 0; i < compound.amenities.length; i++) {
                html += '<span class="compound-amenity">' + escapeHtml(compound.amenities[i]) + '</span>';
            }
            html += '</div>';
        }
        html += '</div>';
        html += '<div class="compound-sidebar-card">';
        html += '<h3>معلومات سريعة</h3>';
        html += '<ul class="compound-quick-list">';
        html += '<li><strong>المدينة:</strong> ' + escapeHtml(compound.city || '-') + '</li>';
        html += '<li><strong>المنطقة:</strong> ' + escapeHtml(compound.area || '-') + '</li>';
        html += '<li><strong>الوحدات المتاحة:</strong> ' + escapeHtml(compoundDetailState.properties.length || 0) + '</li>';
        html += '<li><strong>سعر البداية:</strong> ' + escapeHtml(compound.startingPrice ? formatPrice(compound.startingPrice) : 'حسب الطلب') + '</li>';
        html += '</ul>';
        html += '<div class="compound-actions">';
        html += '<button type="button" class="btn-request-visit" onclick="closeCompoundDetail();requestCompoundVisit(\'' + escapeJsString(compound.id) + '\',\'' + escapeJsString(compound.name || 'المشروع') + '\')"><i class="fas fa-calendar-check"></i> طلب زيارة</button>';
        html += '<button type="button" class="btn-whatsapp" onclick="whatsappCompound(\'' + escapeJsString(compound.name || 'المشروع') + '\')"><i class="fab fa-whatsapp"></i> واتساب</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="compound-properties-section">';
        html += '<div class="compound-properties-header"><h2>العقارات المتاحة داخل المشروع</h2><span id="compoundPropertiesSummary" class="compound-properties-summary"></span></div>';
        html += '<div class="compound-filter-bar">';
        html += '<select id="compoundBedroomsFilter"><option value="">كل الغرف</option><option value="1">1 غرفة</option><option value="2">2 غرف</option><option value="3">3 غرف</option><option value="4">4 غرف</option><option value="5">5+ غرف</option></select>';
        html += '<select id="compoundPriceFilter"><option value="">كل الأسعار</option><option value="0-250000">أقل من 250,000 ₪</option><option value="250000-400000">250,000 - 400,000 ₪</option><option value="400000-600000">400,000 - 600,000 ₪</option><option value="600000-99999999">أكثر من 600,000 ₪</option></select>';
        html += '<select id="compoundSizeFilter"><option value="">كل المساحات</option><option value="0-120">أقل من 120 م²</option><option value="120-160">120 - 160 م²</option><option value="160-220">160 - 220 م²</option><option value="220-99999">أكثر من 220 م²</option></select>';
        html += '</div>';
        html += '<div class="compound-properties-grid" id="compoundPropertiesGrid"></div>';
        html += '</div>';

        content.innerHTML = html;
        bindCompoundDetailFilters();
        applyCompoundPropertyFilters();
    }

    function bindCompoundDetailFilters() {
        var filterIds = ['compoundBedroomsFilter', 'compoundPriceFilter', 'compoundSizeFilter'];
        var i;
        var node;
        for (i = 0; i < filterIds.length; i++) {
            node = document.getElementById(filterIds[i]);
            if (node) {
                node.onchange = applyCompoundPropertyFilters;
            }
        }
    }

    function renderCompoundPropertyCards() {
        var grid = document.getElementById('compoundPropertiesGrid');
        var summary = document.getElementById('compoundPropertiesSummary');
        var html = '';
        var properties;
        var i;
        var buttons;

        if (!compoundDetailState || !grid) {
            return;
        }

        properties = compoundDetailState.filteredProperties || [];
        if (summary) {
            summary.textContent = properties.length + ' عقار';
        }

        if (!properties.length) {
            grid.innerHTML = '<div class="compound-empty">لا توجد وحدات مطابقة للفلاتر الحالية.</div>';
            return;
        }

        for (i = 0; i < properties.length; i++) {
            var property = properties[i];
            var image = property.images && property.images.length ? property.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
            html += '<div class="compound-property-card">';
            html += '<div class="compound-property-image"><img src="' + image + '" alt="' + escapeHtml(property.title || 'عقار') + '"></div>';
            html += '<div class="compound-property-body">';
            html += '<div class="compound-property-top">';
            html += '<h3>' + escapeHtml(property.title || 'وحدة متاحة') + '</h3>';
            html += '<span class="compound-property-price">' + escapeHtml(propertyPriceText(property)) + '</span>';
            html += '</div>';
            html += '<p class="compound-property-location"><i class="fas fa-map-marker-alt"></i> ' + escapeHtml((property.city || '') + (property.area ? ' - ' + property.area : '')) + '</p>';
            html += '<div class="compound-property-meta">';
            if (property.size) html += '<span><i class="fas fa-ruler-combined"></i> ' + escapeHtml(property.size) + ' م²</span>';
            if (property.bedrooms) html += '<span><i class="fas fa-bed"></i> ' + escapeHtml(property.bedrooms) + ' غرف</span>';
            if (property.bathrooms) html += '<span><i class="fas fa-bath"></i> ' + escapeHtml(property.bathrooms) + ' حمام</span>';
            html += '</div>';
            html += '<button type="button" class="btn-request-visit compound-visit-btn" data-property-id="' + escapeHtml(property.id) + '">طلب زيارة</button>';
            html += '</div>';
            html += '</div>';
        }

        grid.innerHTML = html;
        buttons = grid.querySelectorAll('.compound-visit-btn');
        for (i = 0; i < buttons.length; i++) {
            buttons[i].onclick = function () {
                var propertyId = this.getAttribute('data-property-id');
                closeCompoundDetail();
                requestVisit(propertyId);
            };
        }
    }

    function applyCompoundPropertyFilters() {
        var bedroomsFilter = document.getElementById('compoundBedroomsFilter');
        var priceFilter = document.getElementById('compoundPriceFilter');
        var sizeFilter = document.getElementById('compoundSizeFilter');
        var filtered = [];
        var i;

        if (!compoundDetailState) {
            return;
        }

        for (i = 0; i < compoundDetailState.properties.length; i++) {
            var property = compoundDetailState.properties[i];
            if (bedroomsFilter && bedroomsFilter.value) {
                var bedrooms = parseInt(bedroomsFilter.value, 10);
                if (bedrooms === 5 && (property.bedrooms || 0) < 5) {
                    continue;
                }
                if (bedrooms < 5 && (property.bedrooms || 0) !== bedrooms) {
                    continue;
                }
            }
            if (priceFilter && priceFilter.value) {
                var priceRange = priceFilter.value.split('-');
                var priceMin = parseInt(priceRange[0], 10);
                var priceMax = parseInt(priceRange[1], 10);
                if ((property.price || 0) < priceMin || (property.price || 0) > priceMax) {
                    continue;
                }
            }
            if (sizeFilter && sizeFilter.value) {
                var sizeRange = sizeFilter.value.split('-');
                var sizeMin = parseInt(sizeRange[0], 10);
                var sizeMax = parseInt(sizeRange[1], 10);
                if ((property.size || 0) < sizeMin || (property.size || 0) > sizeMax) {
                    continue;
                }
            }
            filtered.push(property);
        }

        compoundDetailState.filteredProperties = filtered;
        renderCompoundPropertyCards();
    }

    window.openCompoundDetail = function (id) {
        var overlay = document.getElementById('compoundDetailOverlay');
        var content = document.getElementById('compoundDetailContent');
        if (!overlay || !content) {
            return;
        }

        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        overlay.scrollTop = 0;
        content.innerHTML = '<div class="compound-loading"><i class="fas fa-spinner fa-spin"></i> جاري تحميل تفاصيل المشروع...</div>';

        db.collection('compounds').doc(id).get().then(function (doc) {
            if (!doc.exists) {
                throw new Error('compound-not-found');
            }
            var compound = doc.data() || {};
            compound.id = doc.id;
            return db.collection('properties').where('compound', '==', id).where('status', '==', 'approved').get().then(function (snap) {
                var properties = [];
                snap.forEach(function (propertyDoc) {
                    var property = propertyDoc.data() || {};
                    property.id = propertyDoc.id;
                    properties.push(property);
                });
                compoundDetailState = {
                    compound: compound,
                    properties: properties,
                    filteredProperties: properties.slice(0)
                };
                renderCompoundDetail();
            });
        }).catch(function () {
            content.innerHTML = '<div class="compound-empty">تعذر تحميل تفاصيل المشروع حالياً.</div>';
            showToast('تعذر تحميل تفاصيل المشروع');
        });
    };

    window.closeCompoundDetail = function () {
        var overlay = document.getElementById('compoundDetailOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        document.body.style.overflow = '';
    };

    window.closeCompoundModal = window.closeCompoundDetail;

    window.requestCompoundVisit = function (compoundId, compoundName) {
        document.getElementById('visitPropertyId').value = compoundId;
        document.getElementById('visitPropertyTitle').value = 'مشروع ' + compoundName;
        var guestFields = document.getElementById('visitGuestFields');
        if (currentUser) {
            guestFields.classList.add('hidden');
        } else {
            guestFields.classList.remove('hidden');
        }
        var today = new Date().toISOString().split('T')[0];
        document.getElementById('visitDate').min = today;
        document.getElementById('visitModal').classList.remove('hidden');
    };

    // ===== PROPERTIES =====
    function loadProperties() {
        var spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('hidden');

        db.collection('properties').where('status', '==', 'approved').onSnapshot(function (snap) {
            allProperties = [];
            snap.forEach(function (doc) {
                var d = doc.data();
                d.id = doc.id;
                if (!d.compound) {
                    allProperties.push(d);
                }
            });
            if (spinner) spinner.classList.add('hidden');
            document.getElementById('statProperties').textContent = allProperties.length;
            applyFiltersAndSort();
        });
    }

    window.heroSearch = function () {
        activeFilters.type = document.getElementById('heroType').value;
        activeFilters.city = document.getElementById('heroCity').value;
        activeFilters.purpose = document.getElementById('heroPurpose').value;
        document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
        applyFiltersAndSort();
    };

    window.applySort = function () { applyFiltersAndSort(); };

    function applyFiltersAndSort() {
        var priceFilter = document.getElementById('filterPrice') ? document.getElementById('filterPrice').value : '';
        var sizeFilter = document.getElementById('filterSize') ? document.getElementById('filterSize').value : '';
        var bedroomsFilter = document.getElementById('filterBedrooms') ? document.getElementById('filterBedrooms').value : '';

        filteredProperties = allProperties.filter(function (p) {
            if (activeFilters.type && p.type !== activeFilters.type) return false;
            if (activeFilters.city && p.city !== activeFilters.city) return false;
            if (activeFilters.purpose && p.purpose !== activeFilters.purpose) return false;
            if (priceFilter) {
                var range = priceFilter.split('-');
                var min = parseInt(range[0]); var max = parseInt(range[1]);
                if ((p.price || 0) < min || (p.price || 0) > max) return false;
            }
            if (sizeFilter) {
                var sr = sizeFilter.split('-');
                var smin = parseInt(sr[0]); var smax = parseInt(sr[1]);
                if ((p.size || 0) < smin || (p.size || 0) > smax) return false;
            }
            if (bedroomsFilter) {
                var bed = parseInt(bedroomsFilter);
                if (bed === 5 && (p.bedrooms || 0) < 5) return false;
                if (bed < 5 && (p.bedrooms || 0) !== bed) return false;
            }
            return true;
        });

        var sortBy = document.getElementById('sortBy') ? document.getElementById('sortBy').value : 'newest';
        filteredProperties.sort(function (a, b) {
            switch (sortBy) {
                case 'price-asc': return (a.price || 0) - (b.price || 0);
                case 'price-desc': return (b.price || 0) - (a.price || 0);
                case 'size-desc': return (b.size || 0) - (a.size || 0);
                case 'size-asc': return (a.size || 0) - (b.size || 0);
                default: // newest
                    var ta = a.createdAt ? (a.createdAt.seconds || 0) : 0;
                    var tb = b.createdAt ? (b.createdAt.seconds || 0) : 0;
                    return tb - ta;
            }
        });

        var countEl = document.getElementById('resultsCount');
        if (countEl) countEl.textContent = filteredProperties.length + ' نتيجة';
        renderProperties();
    }

    function renderProperties() {
        var grid = document.getElementById('propertiesGrid');
        var emptyState = document.getElementById('emptyState');
        if (!grid) return;
        if (filteredProperties.length === 0) { grid.innerHTML = ''; if (emptyState) emptyState.classList.remove('hidden'); return; }
        if (emptyState) emptyState.classList.add('hidden');

        var html = '';
        filteredProperties.forEach(function (p) {
            var image = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
            var badgeClass = p.purpose === 'إيجار' ? 'rent' : '';
            var badgeText = p.purpose === 'إيجار' ? 'للإيجار' : 'للبيع';
            var priceText = formatPrice(p.price);
            if (p.purpose === 'إيجار') { priceText += ' <span>' + (p.rentPeriod === 'سنوي' ? '/سنوي' : '/شهري') + '</span>'; }

            html += '<div class="property-card" onclick="openPropertyDetail(\'' + p.id + '\')">';
            html += '<div class="property-card-image"><img src="' + image + '" alt="' + (p.title || '') + '">';
            html += '<span class="property-badge ' + badgeClass + '">' + badgeText + '</span>';
            if (p.compound) html += '<span class="property-badge compound-badge"><i class="fas fa-crown"></i> ديارنا</span>';
            html += '</div><div class="property-card-content">';
            html += '<h3 class="property-card-title">' + (p.title || 'عقار') + '</h3>';
            html += '<p class="property-card-location"><i class="fas fa-map-marker-alt"></i> ' + (p.city || '') + (p.area ? ' - ' + p.area : '') + '</p>';
            html += '<div class="property-card-details">';
            if (p.size) html += '<span class="property-detail"><i class="fas fa-ruler-combined"></i> ' + p.size + ' م²</span>';
            if (p.bedrooms) html += '<span class="property-detail"><i class="fas fa-bed"></i> ' + p.bedrooms + '</span>';
            if (p.bathrooms) html += '<span class="property-detail"><i class="fas fa-bath"></i> ' + p.bathrooms + '</span>';
            html += '</div><div class="property-card-footer">';
            html += '<span class="property-price">' + priceText + '</span>';
            html += '<button class="btn-view-property">التفاصيل</button>';
            html += '</div></div></div>';
        });
        grid.innerHTML = html;
    }

    // ===== PROPERTY DETAIL =====
    function findPropertyById(id) {
        var i;
        for (i = 0; i < allProperties.length; i++) {
            if (allProperties[i].id === id) {
                return allProperties[i];
            }
        }
        if (compoundDetailState && compoundDetailState.properties) {
            for (i = 0; i < compoundDetailState.properties.length; i++) {
                if (compoundDetailState.properties[i].id === id) {
                    return compoundDetailState.properties[i];
                }
            }
        }
        return null;
    }

    window.openPropertyDetail = function (id) {
        var property = findPropertyById(id);
        if (!property) return;
        var content = document.getElementById('propertyModalContent');
        var images = property.images || ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop'];

        var html = '<div class="property-modal-gallery">';
        images.forEach(function (img, i) { html += '<img src="' + img + '" alt="" class="' + (i === 0 ? 'main-image' : '') + '">'; });
        html += '</div><div class="property-modal-info"><h2>' + (property.title || 'عقار') + '</h2>';
        html += '<div class="property-modal-meta">';
        html += '<span class="meta-item"><i class="fas fa-map-marker-alt"></i> ' + (property.city || '') + (property.area ? ' - ' + property.area : '') + '</span>';
        html += '<span class="meta-item"><i class="fas fa-tag"></i> ' + (property.type || '') + '</span>';
        html += '<span class="meta-item"><i class="fas fa-money-bill"></i> ' + formatPrice(property.price) + (property.purpose === 'إيجار' ? (property.rentPeriod === 'سنوي' ? ' /سنوي' : ' /شهري') : '') + '</span>';
        if (property.size) html += '<span class="meta-item"><i class="fas fa-ruler-combined"></i> ' + property.size + ' م²</span>';
        if (property.bedrooms) html += '<span class="meta-item"><i class="fas fa-bed"></i> ' + property.bedrooms + ' غرف</span>';
        if (property.bathrooms) html += '<span class="meta-item"><i class="fas fa-bath"></i> ' + property.bathrooms + ' حمام</span>';
        if (property.floor) html += '<span class="meta-item"><i class="fas fa-building"></i> طابق ' + property.floor + '</span>';
        html += '</div>';
        if (property.description) html += '<p class="property-modal-description">' + property.description + '</p>';
        if (property.features && property.features.length > 0) {
            html += '<div class="property-modal-features">';
            property.features.forEach(function (f) { html += '<span class="feature-tag">' + f + '</span>'; });
            html += '</div>';
        }
        html += '<div class="property-modal-actions">';
        html += '<button class="btn-request-visit" onclick="requestVisit(\'' + id + '\')"><i class="fas fa-calendar-check"></i> طلب معاينة</button>';
        html += '<button class="btn-whatsapp" onclick="whatsappProperty(\'' + id + '\')"><i class="fab fa-whatsapp"></i> واتساب</button>';
        html += '</div></div>';
        content.innerHTML = html;
        document.getElementById('propertyModal').classList.remove('hidden');
    };

    window.closePropertyModal = function () { document.getElementById('propertyModal').classList.add('hidden'); };

    window.requestVisit = function (propertyId) {
        var property = findPropertyById(propertyId);
        document.getElementById('visitPropertyId').value = propertyId;
        document.getElementById('visitPropertyTitle').value = property ? property.title : '';
        // Show/hide guest fields based on login
        var guestFields = document.getElementById('visitGuestFields');
        if (currentUser) {
            guestFields.classList.add('hidden');
        } else {
            guestFields.classList.remove('hidden');
        }
        // Set min date to today
        var today = new Date().toISOString().split('T')[0];
        document.getElementById('visitDate').min = today;
        document.getElementById('visitModal').classList.remove('hidden');
    };

    window.closeVisitModal = function () { document.getElementById('visitModal').classList.add('hidden'); };

    window.submitVisitRequest = function (e) {
        e.preventDefault();
        var propertyId = document.getElementById('visitPropertyId').value;
        var propertyTitle = document.getElementById('visitPropertyTitle').value;
        var date = document.getElementById('visitDate').value;
        var time = document.getElementById('visitTime').value;
        var name, phone, email;

        if (currentUser) {
            name = currentUser.name;
            phone = currentUser.phone;
            email = currentUser.email || '';
        } else {
            name = document.getElementById('visitName').value.trim();
            phone = document.getElementById('visitPhone').value.trim();
            email = document.getElementById('visitEmail').value.trim();
            if (!name || !phone) { showToast('يرجى إدخال الاسم ورقم الهاتف'); return; }
        }
        if (!date) { showToast('يرجى اختيار التاريخ'); return; }

        db.collection('visit_requests').add({
            propertyId: propertyId, propertyTitle: propertyTitle,
            propertyCity: '', userId: currentUser ? currentUser.id : 'guest',
            userName: name, userPhone: phone, userEmail: email,
            preferredDate: date, preferredTime: time,
            status: 'pending', type: 'property',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            scheduledDate: null, scheduledTime: null, employeeNotes: ''
        }).then(function () {
            showToast('تم إرسال طلب المعاينة! سنتواصل معك قريباً');
            closeVisitModal();
            closePropertyModal();
            document.getElementById('visitForm').reset();
        });
    };

    window.whatsappProperty = function (propertyId) {
        var property = findPropertyById(propertyId);
        var msg = 'مرحباً، أود الاستفسار عن العقار: ' + (property ? property.title : '') + ' في ' + (property ? property.city : '');
        window.open('https://wa.me/972569236758?text=' + encodeURIComponent(msg), '_blank');
    };

    window.whatsappCompound = function (compoundName) {
        var msg = 'مرحباً، أود الاستفسار عن مشروع ' + (compoundName || '');
        window.open('https://wa.me/972569236758?text=' + encodeURIComponent(msg), '_blank');
    };

    // ===== LIST PROPERTY =====
    window.toggleRentPeriod = function () {
        var row = document.getElementById('rentPeriodRow');
        if (document.getElementById('propPurpose').value === 'إيجار') row.classList.remove('hidden');
        else row.classList.add('hidden');
    };

    window.handleImageUpload = function (e) {
        var files = Array.from(e.target.files);
        if (uploadedImages.length + files.length > 10) { showToast('الحد الأقصى 10 صور'); return; }
        files.forEach(function (file) {
            if (file.size > 5 * 1024 * 1024) { showToast('حجم الصورة يجب أن يكون أقل من 5MB'); return; }
            var reader = new FileReader();
            reader.onload = function (ev) { uploadedImages.push(ev.target.result); renderImagePreviews(); };
            reader.readAsDataURL(file);
        });
    };

    function renderImagePreviews() {
        var grid = document.getElementById('imagePreviewGrid');
        if (!grid) return;
        var html = '';
        uploadedImages.forEach(function (img, idx) {
            html += '<div class="image-preview-item"><img src="' + img + '" alt="">';
            html += '<button type="button" class="remove-image" onclick="removeImage(' + idx + ')">×</button></div>';
        });
        grid.innerHTML = html;
    }

    window.removeImage = function (idx) { uploadedImages.splice(idx, 1); renderImagePreviews(); };

    function submitProperty() {
        var title = document.getElementById('propTitle').value.trim();
        var type = document.getElementById('propType').value;
        var purpose = document.getElementById('propPurpose').value;
        var price = document.getElementById('propPrice').value;
        var city = document.getElementById('propCity').value;
        var area = document.getElementById('propArea').value.trim();
        var size = document.getElementById('propSize').value;
        var ownerName = document.getElementById('propOwnerName').value.trim();
        var ownerPhone = document.getElementById('propOwnerPhone').value.trim();

        // Validation with specific feedback
        var missing = [];
        if (!title) missing.push('عنوان العقار');
        if (!type) missing.push('نوع العقار');
        if (!purpose) missing.push('الغرض');
        if (!price) missing.push('السعر');
        if (!city) missing.push('المدينة');
        if (!area) missing.push('الحي / المنطقة');
        if (!size) missing.push('المساحة');
        if (!ownerName) missing.push('الاسم الكامل');
        if (!ownerPhone) missing.push('رقم الهاتف');

        if (missing.length > 0) {
            showToast('يرجى ملء: ' + missing.join('، '));
            return;
        }

        var features = [];
        document.querySelectorAll('#featuresCheckboxes input:checked').forEach(function (cb) { features.push(cb.value); });

        var btn = document.getElementById('submitPropertyBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

        var propertyData = {
            title: title, type: type, purpose: purpose,
            price: parseInt(price) || 0,
            rentPeriod: purpose === 'إيجار' ? document.getElementById('propRentPeriod').value : null,
            city: city, area: area,
            address: document.getElementById('propAddress').value.trim(),
            size: parseInt(size) || 0,
            bedrooms: parseInt(document.getElementById('propBedrooms').value) || 0,
            bathrooms: parseInt(document.getElementById('propBathrooms').value) || 0,
            floor: parseInt(document.getElementById('propFloor').value) || 0,
            features: features, images: uploadedImages,
            description: document.getElementById('propDescription').value.trim(),
            submittedBy: ownerName,
            submitterPhone: ownerPhone,
            ownerName: ownerName, ownerPhone: ownerPhone,
            ownerEmail: document.getElementById('propOwnerEmail').value.trim(),
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('properties').add(propertyData).then(function () {
            showToast('تم إرسال عقارك بنجاح! سنراجعه ونتواصل معك ✓');
            document.getElementById('listPropertyForm').reset();
            uploadedImages = [];
            renderImagePreviews();
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> أرسل طلب العرض';
            window.scrollTo({ top: document.getElementById('list-property').offsetTop - 80, behavior: 'smooth' });
        }).catch(function (err) {
            showToast('حدث خطأ، يرجى المحاولة مرة أخرى');
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> أرسل طلب العرض';
        });
    }

    // ===== CHAT =====
    function setupRealtimeChat() {
        if (!currentUser) return;
        if (chatUnsubscribe) chatUnsubscribe();
        chatUnsubscribe = db.collection('chats').doc(currentUser.id).collection('messages')
            .orderBy('timestamp', 'asc').onSnapshot(function (snap) {
                var container = document.getElementById('chatMessages');
                if (!container) return;
                var html = ''; var unread = 0;
                snap.forEach(function (doc) {
                    var msg = doc.data();
                    var cls = msg.sender === 'user' ? 'user' : 'employee';
                    var time = msg.timestamp ? formatTime(msg.timestamp.toDate()) : '';
                    html += '<div class="chat-message ' + cls + '"><span>' + escapeHtml(msg.text) + '</span><span class="msg-time">' + time + '</span></div>';
                    if (msg.sender === 'employee' && !msg.readByUser) unread++;
                });
                container.innerHTML = html || '<div class="chat-welcome"><p>مرحباً! كيف يمكننا مساعدتك؟</p></div>';
                container.scrollTop = container.scrollHeight;
                updateChatBadge(unread);
            });
    }

    function updateChatBadge(count) {
        var badge = document.getElementById('chatBadge');
        var fabBadge = document.getElementById('fabBadge');
        if (count > 0) {
            if (badge) { badge.textContent = count; badge.classList.remove('hidden'); }
            if (fabBadge) { fabBadge.textContent = count; fabBadge.classList.remove('hidden'); }
        } else {
            if (badge) badge.classList.add('hidden');
            if (fabBadge) fabBadge.classList.add('hidden');
        }
    }

    window.sendMessage = function () {
        if (!currentUser) { showToast('يرجى تسجيل الدخول أولاً'); return; }
        var input = document.getElementById('chatInput');
        var text = input.value.trim();
        if (!text) return;
        db.collection('chats').doc(currentUser.id).set({
            userId: currentUser.id, userName: currentUser.name, userPhone: currentUser.phone,
            lastMessage: text, lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            unreadByEmployee: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
        db.collection('chats').doc(currentUser.id).collection('messages').add({
            text: text, sender: 'user', senderName: currentUser.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            readByUser: true, readByEmployee: false
        });
        input.value = '';
    };

    window.toggleChatWidget = function () {
        var widget = document.getElementById('chatWidget');
        if (widget.classList.contains('hidden')) {
            if (!currentUser) { openAuthModal(); return; }
            widget.classList.remove('hidden');
            setupRealtimeChat();
        } else { widget.classList.add('hidden'); }
    };

    // ===== CONTACT =====
    window.submitContact = function (e) {
        e.preventDefault();
        db.collection('contact_messages').add({
            name: document.getElementById('contactName').value.trim(),
            phone: document.getElementById('contactPhone').value.trim(),
            message: document.getElementById('contactMessage').value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'new'
        }).then(function () { showToast('تم إرسال رسالتك بنجاح!'); document.getElementById('contactForm').reset(); });
    };

    // ===== MOBILE MENU =====
    window.toggleMobileMenu = function () { document.getElementById('mobileMenu').classList.toggle('hidden'); };

    // ===== UTILITIES =====
    function formatPrice(price) {
        if (!price) return '0';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₪';
    }
    function formatTime(date) {
        if (!date) return '';
        var h = date.getHours(); var m = date.getMinutes();
        return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    }
    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function escapeJsString(str) { return String(str == null ? '' : str).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
    function propertyPriceText(property) {
        var text = formatPrice(property.price);
        if (property && property.purpose === 'إيجار') {
            text += property.rentPeriod === 'سنوي' ? ' /سنوي' : ' /شهري';
        }
        return text;
    }
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash = hash & hash; }
        return 'h_' + Math.abs(hash).toString(36);
    }
    function showToast(msg) {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg; toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 3500);
    }
})();
