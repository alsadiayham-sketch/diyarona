(function () {
    'use strict';

    var allProperties = [];
    var filteredProperties = [];
    var currentUser = null;
    var chatUnsubscribe = null;
    var uploadedImages = [];

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        checkUserSession();
        loadProperties();
        setupRealtimeChat();
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
        if (userMenu) {
            userMenu.classList.remove('hidden');
            userName.textContent = currentUser.name;
        }
        if (chatBtn) chatBtn.classList.remove('hidden');
        if (chatFab) chatFab.classList.remove('hidden');

        // Pre-fill property form if logged in
        var ownerName = document.getElementById('propOwnerName');
        var ownerPhone = document.getElementById('propOwnerPhone');
        var ownerEmail = document.getElementById('propOwnerEmail');
        if (ownerName && currentUser.name) ownerName.value = currentUser.name;
        if (ownerPhone && currentUser.phone) ownerPhone.value = currentUser.phone;
        if (ownerEmail && currentUser.email) ownerEmail.value = currentUser.email;
    }

    window.openAuthModal = function () {
        document.getElementById('authModal').classList.remove('hidden');
    };

    window.closeAuthModal = function () {
        document.getElementById('authModal').classList.add('hidden');
    };

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

        if (!name || !phone || !email || !password) {
            showToast('يرجى ملء جميع الحقول');
            return;
        }

        // Check if user exists
        db.collection('users').where('email', '==', email).get().then(function (snap) {
            if (!snap.empty) {
                showToast('البريد الإلكتروني مسجل مسبقاً');
                return;
            }

            var userId = 'user_' + Date.now();
            var userData = {
                id: userId,
                name: name,
                phone: phone,
                email: email,
                passwordHash: simpleHash(password),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'buyer'
            };

            db.collection('users').doc(userId).set(userData).then(function () {
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

        if (!emailOrPhone || !password) {
            showToast('يرجى ملء جميع الحقول');
            return;
        }

        var hash = simpleHash(password);

        // Try email first, then phone
        db.collection('users').where('email', '==', emailOrPhone).get().then(function (snap) {
            if (snap.empty) {
                return db.collection('users').where('phone', '==', emailOrPhone).get();
            }
            return snap;
        }).then(function (snap) {
            if (snap.empty) {
                showToast('بيانات الدخول غير صحيحة');
                return;
            }

            var doc = snap.docs[0];
            var data = doc.data();

            if (data.passwordHash !== hash) {
                showToast('كلمة المرور غير صحيحة');
                return;
            }

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

        var authBtn = document.getElementById('authBtn');
        var userMenu = document.getElementById('userMenu');
        var chatBtn = document.getElementById('chatBtn');
        var chatFab = document.getElementById('chatFab');
        var chatWidget = document.getElementById('chatWidget');

        if (authBtn) authBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        if (chatBtn) chatBtn.classList.add('hidden');
        if (chatFab) chatFab.classList.add('hidden');
        if (chatWidget) chatWidget.classList.add('hidden');

        showToast('تم تسجيل الخروج');
    };

    // ===== PROPERTIES =====
    function loadProperties() {
        var spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.classList.remove('hidden');

        db.collection('properties').where('status', '==', 'approved').onSnapshot(function (snap) {
            allProperties = [];
            snap.forEach(function (doc) {
                var data = doc.data();
                data.id = doc.id;
                allProperties.push(data);
            });

            if (spinner) spinner.classList.add('hidden');
            updatePropertyCount();
            applyFilters();
        });
    }

    function updatePropertyCount() {
        var stat = document.getElementById('statProperties');
        if (stat) stat.textContent = allProperties.length;
    }

    window.toggleRentPeriod = function () {
        var purpose = document.getElementById('propPurpose').value;
        var row = document.getElementById('rentPeriodRow');
        if (purpose === 'إيجار') {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    };

    window.applyFilters = function () {
        var type = document.getElementById('filterType').value;
        var city = document.getElementById('filterCity').value;
        var purpose = document.getElementById('filterPurpose').value;
        var price = document.getElementById('filterPrice').value;
        var bedrooms = document.getElementById('filterBedrooms').value;

        filteredProperties = allProperties.filter(function (p) {
            if (type && p.type !== type) return false;
            if (city && p.city !== city) return false;
            if (purpose && p.purpose !== purpose) return false;
            if (bedrooms) {
                var bed = parseInt(bedrooms);
                if (bed === 5 && (p.bedrooms || 0) < 5) return false;
                if (bed < 5 && (p.bedrooms || 0) !== bed) return false;
            }
            if (price) {
                var range = price.split('-');
                var min = parseInt(range[0]);
                var max = parseInt(range[1]);
                if (p.price < min || p.price > max) return false;
            }
            return true;
        });

        renderProperties();
    };

    window.resetFilters = function () {
        document.getElementById('filterType').value = '';
        document.getElementById('filterCity').value = '';
        document.getElementById('filterPurpose').value = '';
        document.getElementById('filterPrice').value = '';
        document.getElementById('filterBedrooms').value = '';
        applyFilters();
    };

    window.heroSearch = function () {
        var type = document.getElementById('heroType').value;
        var city = document.getElementById('heroCity').value;
        var purpose = document.getElementById('heroPurpose').value;

        document.getElementById('filterType').value = type;
        document.getElementById('filterCity').value = city;
        document.getElementById('filterPurpose').value = purpose;

        document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
        applyFilters();
    };

    function renderProperties() {
        var grid = document.getElementById('propertiesGrid');
        var emptyState = document.getElementById('emptyState');

        if (!grid) return;

        if (filteredProperties.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        var html = '';
        filteredProperties.forEach(function (p) {
            var image = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';
            var badgeClass = p.purpose === 'إيجار' ? 'rent' : '';
            var badgeText = p.purpose === 'إيجار' ? 'للإيجار' : 'للبيع';
            var priceText = formatPrice(p.price);
            if (p.purpose === 'إيجار') {
                var period = p.rentPeriod === 'سنوي' ? '/سنوي' : '/شهري';
                priceText += ' <span>' + period + '</span>';
            }

            html += '<div class="property-card" onclick="openPropertyDetail(\'' + p.id + '\')">';
            html += '<div class="property-card-image">';
            html += '<img src="' + image + '" alt="' + (p.title || '') + '" onerror="this.src=\'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop\'">';
            html += '<span class="property-badge ' + badgeClass + '">' + badgeText + '</span>';
            html += '</div>';
            html += '<div class="property-card-content">';
            html += '<h3 class="property-card-title">' + (p.title || 'عقار') + '</h3>';
            html += '<p class="property-card-location"><i class="fas fa-map-marker-alt"></i> ' + (p.city || '') + (p.area ? ' - ' + p.area : '') + '</p>';
            html += '<div class="property-card-details">';
            if (p.size) html += '<span class="property-detail"><i class="fas fa-ruler-combined"></i> ' + p.size + ' م²</span>';
            if (p.bedrooms) html += '<span class="property-detail"><i class="fas fa-bed"></i> ' + p.bedrooms + ' غرف</span>';
            if (p.bathrooms) html += '<span class="property-detail"><i class="fas fa-bath"></i> ' + p.bathrooms + ' حمام</span>';
            html += '</div>';
            html += '<div class="property-card-footer">';
            html += '<span class="property-price">' + priceText + '</span>';
            html += '<button class="btn-view-property" onclick="event.stopPropagation();openPropertyDetail(\'' + p.id + '\')">التفاصيل</button>';
            html += '</div></div></div>';
        });

        grid.innerHTML = html;
    }

    // ===== PROPERTY DETAIL =====
    window.openPropertyDetail = function (id) {
        var property = allProperties.find(function (p) { return p.id === id; });
        if (!property) return;

        var content = document.getElementById('propertyModalContent');
        var images = property.images || ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop'];

        var html = '<div class="property-modal-gallery">';
        html += '<img class="main-image" src="' + images[0] + '" alt="">';
        if (images[1]) html += '<img src="' + images[1] + '" alt="">';
        if (images[2]) html += '<img src="' + images[2] + '" alt="">';
        html += '</div>';

        html += '<div class="property-modal-info">';
        html += '<h2>' + (property.title || 'عقار') + '</h2>';
        html += '<div class="property-modal-meta">';
        html += '<span class="meta-item"><i class="fas fa-map-marker-alt"></i> ' + (property.city || '') + (property.area ? ' - ' + property.area : '') + '</span>';
        html += '<span class="meta-item"><i class="fas fa-tag"></i> ' + (property.type || '') + '</span>';
        html += '<span class="meta-item"><i class="fas fa-money-bill"></i> ' + formatPrice(property.price) + ' ₪' + (property.purpose === 'إيجار' ? (property.rentPeriod === 'سنوي' ? ' /سنوي' : ' /شهري') : '') + '</span>';
        if (property.size) html += '<span class="meta-item"><i class="fas fa-ruler-combined"></i> ' + property.size + ' م²</span>';
        if (property.bedrooms) html += '<span class="meta-item"><i class="fas fa-bed"></i> ' + property.bedrooms + ' غرف نوم</span>';
        if (property.bathrooms) html += '<span class="meta-item"><i class="fas fa-bath"></i> ' + property.bathrooms + ' حمامات</span>';
        if (property.floor) html += '<span class="meta-item"><i class="fas fa-building"></i> الطابق ' + property.floor + '</span>';
        html += '</div>';

        if (property.description) {
            html += '<p class="property-modal-description">' + property.description + '</p>';
        }

        if (property.features && property.features.length > 0) {
            html += '<div class="property-modal-features">';
            property.features.forEach(function (f) {
                html += '<span class="feature-tag">' + f + '</span>';
            });
            html += '</div>';
        }

        html += '<div class="property-modal-actions">';
        html += '<button class="btn-request-visit" onclick="requestVisit(\'' + id + '\')"><i class="fas fa-calendar-check"></i> طلب معاينة</button>';
        html += '<button class="btn-whatsapp" onclick="whatsappProperty(\'' + id + '\')"><i class="fab fa-whatsapp"></i> واتساب</button>';
        html += '</div></div>';

        content.innerHTML = html;
        document.getElementById('propertyModal').classList.remove('hidden');
    };

    window.closePropertyModal = function () {
        document.getElementById('propertyModal').classList.add('hidden');
    };

    window.requestVisit = function (propertyId) {
        if (!currentUser) {
            showToast('يرجى تسجيل الدخول أولاً');
            openAuthModal();
            return;
        }

        var property = allProperties.find(function (p) { return p.id === propertyId; });

        var request = {
            propertyId: propertyId,
            propertyTitle: property ? property.title : '',
            propertyCity: property ? property.city : '',
            userId: currentUser.id,
            userName: currentUser.name,
            userPhone: currentUser.phone,
            userEmail: currentUser.email,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            scheduledDate: null,
            scheduledTime: null,
            employeeNotes: ''
        };

        db.collection('visit_requests').add(request).then(function () {
            showToast('تم إرسال طلب المعاينة! سنتواصل معك قريباً');
            closePropertyModal();
        });
    };

    window.whatsappProperty = function (propertyId) {
        var property = allProperties.find(function (p) { return p.id === propertyId; });
        var msg = 'مرحباً، أود الاستفسار عن العقار: ' + (property ? property.title : '') + ' في ' + (property ? property.city : '');
        window.open('https://wa.me/972569236758?text=' + encodeURIComponent(msg), '_blank');
    };

    // ===== LIST PROPERTY =====
    window.handleImageUpload = function (e) {
        var files = Array.from(e.target.files);
        if (uploadedImages.length + files.length > 10) {
            showToast('الحد الأقصى 10 صور');
            return;
        }

        files.forEach(function (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('حجم الصورة يجب أن يكون أقل من 5MB');
                return;
            }

            var reader = new FileReader();
            reader.onload = function (ev) {
                uploadedImages.push(ev.target.result);
                renderImagePreviews();
            };
            reader.readAsDataURL(file);
        });
    };

    function renderImagePreviews() {
        var grid = document.getElementById('imagePreviewGrid');
        if (!grid) return;

        var html = '';
        uploadedImages.forEach(function (img, idx) {
            html += '<div class="image-preview-item">';
            html += '<img src="' + img + '" alt="">';
            html += '<button class="remove-image" onclick="removeImage(' + idx + ')">×</button>';
            html += '</div>';
        });
        grid.innerHTML = html;
    }

    window.removeImage = function (idx) {
        uploadedImages.splice(idx, 1);
        renderImagePreviews();
    };

    window.submitProperty = function (e) {
        e.preventDefault();

        var features = [];
        document.querySelectorAll('.features-checkboxes input:checked').forEach(function (cb) {
            features.push(cb.value);
        });

        var propertyData = {
            title: document.getElementById('propTitle').value.trim(),
            type: document.getElementById('propType').value,
            purpose: document.getElementById('propPurpose').value,
            price: parseInt(document.getElementById('propPrice').value) || 0,
            rentPeriod: document.getElementById('propPurpose').value === 'إيجار' ? document.getElementById('propRentPeriod').value : null,
            city: document.getElementById('propCity').value,
            area: document.getElementById('propArea').value.trim(),
            address: document.getElementById('propAddress').value.trim(),
            size: parseInt(document.getElementById('propSize').value) || 0,
            bedrooms: parseInt(document.getElementById('propBedrooms').value) || 0,
            bathrooms: parseInt(document.getElementById('propBathrooms').value) || 0,
            floor: parseInt(document.getElementById('propFloor').value) || 0,
            features: features,
            images: uploadedImages,
            description: document.getElementById('propDescription').value.trim(),
            ownerName: document.getElementById('propOwnerName').value.trim(),
            ownerPhone: document.getElementById('propOwnerPhone').value.trim(),
            ownerEmail: document.getElementById('propOwnerEmail').value.trim(),
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            submittedBy: currentUser ? currentUser.id : 'guest'
        };

        db.collection('properties').add(propertyData).then(function () {
            showToast('تم إرسال عقارك بنجاح! سنراجعه ونتواصل معك');
            document.getElementById('listPropertyForm').reset();
            uploadedImages = [];
            renderImagePreviews();
        }).catch(function (err) {
            showToast('حدث خطأ، يرجى المحاولة مرة أخرى');
            console.error(err);
        });
    };

    // ===== CHAT =====
    function setupRealtimeChat() {
        if (!currentUser) return;

        var chatId = currentUser.id;
        if (chatUnsubscribe) chatUnsubscribe();

        chatUnsubscribe = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(function (snap) {
                var container = document.getElementById('chatMessages');
                if (!container) return;

                var html = '';
                var unreadCount = 0;

                snap.forEach(function (doc) {
                    var msg = doc.data();
                    var cls = msg.sender === 'user' ? 'user' : 'employee';
                    var time = msg.timestamp ? formatTime(msg.timestamp.toDate()) : '';
                    html += '<div class="chat-message ' + cls + '">';
                    html += '<span>' + escapeHtml(msg.text) + '</span>';
                    html += '<span class="msg-time">' + time + '</span>';
                    html += '</div>';

                    if (msg.sender === 'employee' && !msg.readByUser) {
                        unreadCount++;
                    }
                });

                if (html) {
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<div class="chat-welcome"><p>مرحباً! كيف يمكننا مساعدتك؟</p></div>';
                }

                container.scrollTop = container.scrollHeight;
                updateChatBadge(unreadCount);
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
        if (!currentUser) {
            showToast('يرجى تسجيل الدخول أولاً');
            return;
        }

        var input = document.getElementById('chatInput');
        var text = input.value.trim();
        if (!text) return;

        var chatId = currentUser.id;

        // Ensure chat doc exists with user info
        db.collection('chats').doc(chatId).set({
            userId: currentUser.id,
            userName: currentUser.name,
            userPhone: currentUser.phone,
            lastMessage: text,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
            unreadByEmployee: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });

        // Add message
        db.collection('chats').doc(chatId).collection('messages').add({
            text: text,
            sender: 'user',
            senderName: currentUser.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            readByUser: true,
            readByEmployee: false
        });

        input.value = '';
    };

    window.openChat = function () {
        var widget = document.getElementById('chatWidget');
        if (widget) widget.classList.remove('hidden');
        if (!currentUser) {
            openAuthModal();
            return;
        }
        setupRealtimeChat();
        markMessagesAsRead();
    };

    window.toggleChatWidget = function () {
        var widget = document.getElementById('chatWidget');
        if (!widget) return;

        if (widget.classList.contains('hidden')) {
            if (!currentUser) {
                openAuthModal();
                return;
            }
            widget.classList.remove('hidden');
            setupRealtimeChat();
            markMessagesAsRead();
        } else {
            widget.classList.add('hidden');
        }
    };

    function markMessagesAsRead() {
        if (!currentUser) return;
        var chatId = currentUser.id;

        db.collection('chats').doc(chatId).collection('messages')
            .where('readByUser', '==', false)
            .get().then(function (snap) {
                var batch = rawDb.batch();
                snap.forEach(function (doc) {
                    batch.update(doc.ref, { readByUser: true });
                });
                if (!snap.empty) batch.commit();
            });
    }

    // ===== CONTACT FORM =====
    window.submitContact = function (e) {
        e.preventDefault();
        var name = document.getElementById('contactName').value.trim();
        var phone = document.getElementById('contactPhone').value.trim();
        var message = document.getElementById('contactMessage').value.trim();

        db.collection('contact_messages').add({
            name: name,
            phone: phone,
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'new'
        }).then(function () {
            showToast('تم إرسال رسالتك بنجاح!');
            document.getElementById('contactForm').reset();
        });
    };

    // ===== MOBILE MENU =====
    window.toggleMobileMenu = function () {
        var menu = document.getElementById('mobileMenu');
        if (menu) menu.classList.toggle('hidden');
    };

    // ===== UTILITIES =====
    function formatPrice(price) {
        if (!price) return '0';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₪';
    }

    function formatTime(date) {
        if (!date) return '';
        var h = date.getHours();
        var m = date.getMinutes();
        return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    function showToast(msg) {
        var toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(function () {
            toast.classList.add('hidden');
        }, 3500);
    }
})();
