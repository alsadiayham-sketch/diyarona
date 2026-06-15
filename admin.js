(function () {
    'use strict';

    var ADMIN_USER = 'diyarona';
    var ADMIN_PASS_HASH = '';
    var currentTab = 'dashboard';
    var activeChatId = null;
    var chatMsgUnsubscribe = null;
    var adminImageUploads = [];

    // Compute password hash on load
    ADMIN_PASS_HASH = simpleHash('5555');

    document.addEventListener('DOMContentLoaded', function () {
        if (sessionStorage.getItem('diyarona_admin')) {
            showAdminPanel();
        }
    });

    // ===== AUTH =====
    window.adminLogin = function (e) {
        e.preventDefault();
        var user = document.getElementById('adminUsername').value.trim();
        var pass = document.getElementById('adminPassword').value;

        if (user === ADMIN_USER && simpleHash(pass) === ADMIN_PASS_HASH) {
            sessionStorage.setItem('diyarona_admin', 'true');
            showAdminPanel();
        } else {
            alert('بيانات الدخول غير صحيحة');
        }
    };

    window.adminLogout = function () {
        sessionStorage.removeItem('diyarona_admin');
        location.reload();
    };

    function showAdminPanel() {
        document.getElementById('employeeLoginScreen').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        loadDashboardData();
        loadApprovedProperties();
        loadPendingProperties();
        loadVisitRequests();
        loadChats();
        loadContacts();
        loadUsers();
    }

    // ===== TAB SWITCHING =====
    window.switchTab = function (tab) {
        currentTab = tab;
        document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        document.getElementById('tab-' + tab).classList.add('active');
        document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    };

    // ===== DASHBOARD =====
    function loadDashboardData() {
        db.collection('properties').where('status', '==', 'approved').onSnapshot(function (snap) {
            document.getElementById('dashTotalProperties').textContent = snap.size;
        });
        db.collection('properties').where('status', '==', 'pending').onSnapshot(function (snap) {
            document.getElementById('dashPendingProperties').textContent = snap.size;
            document.getElementById('pendingBadge').textContent = snap.size;
        });
        db.collection('visit_requests').where('status', '==', 'pending').onSnapshot(function (snap) {
            document.getElementById('dashPendingVisits').textContent = snap.size;
            document.getElementById('visitsBadge').textContent = snap.size;
        });
        db.collection('chats').onSnapshot(function (snap) {
            var unread = 0;
            snap.forEach(function (doc) {
                var data = doc.data();
                if (data.unreadByEmployee && data.unreadByEmployee > 0) unread++;
            });
            document.getElementById('dashActiveChats').textContent = snap.size;
            document.getElementById('chatsBadge').textContent = unread;
        });
        db.collection('users').onSnapshot(function (snap) {
            document.getElementById('dashTotalUsers').textContent = snap.size;
        });
    }

    // ===== APPROVED PROPERTIES =====
    function loadApprovedProperties() {
        db.collection('properties').where('status', '==', 'approved').onSnapshot(function (snap) {
            var tbody = document.getElementById('propertiesTableBody');
            var html = '';
            snap.forEach(function (doc) {
                var p = doc.data();
                html += '<tr>';
                html += '<td>' + (p.title || '-') + '</td>';
                html += '<td>' + (p.type || '-') + '</td>';
                html += '<td>' + (p.city || '-') + '</td>';
                html += '<td>' + formatPrice(p.price) + '</td>';
                html += '<td>' + (p.purpose === 'إيجار' ? 'إيجار' : 'بيع') + '</td>';
                html += '<td>';
                html += '<button class="btn-action edit" onclick="editProperty(\'' + doc.id + '\')">تعديل</button>';
                html += '<button class="btn-action delete" onclick="deleteProperty(\'' + doc.id + '\')">حذف</button>';
                html += '</td></tr>';
            });
            tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;padding:30px">لا توجد عقارات</td></tr>';
        });
    }

    // ===== PENDING PROPERTIES =====
    function loadPendingProperties() {
        db.collection('properties').where('status', '==', 'pending').orderBy('createdAt', 'desc').onSnapshot(function (snap) {
            var grid = document.getElementById('pendingPropertiesGrid');
            var html = '';
            snap.forEach(function (doc) {
                var p = doc.data();
                html += '<div class="admin-card">';
                html += '<h4>' + (p.title || 'عقار بدون عنوان') + '</h4>';
                html += '<div class="admin-card-meta">';
                html += '<span><i class="fas fa-tag"></i> ' + (p.type || '-') + ' - ' + (p.purpose || '-') + '</span>';
                html += '<span><i class="fas fa-map-marker-alt"></i> ' + (p.city || '-') + (p.area ? ' - ' + p.area : '') + '</span>';
                html += '<span><i class="fas fa-money-bill"></i> ' + formatPrice(p.price) + '</span>';
                html += '<span><i class="fas fa-ruler-combined"></i> ' + (p.size || '-') + ' م²</span>';
                html += '<span><i class="fas fa-user"></i> ' + (p.ownerName || '-') + ' - ' + (p.ownerPhone || '-') + '</span>';
                if (p.description) html += '<span><i class="fas fa-info-circle"></i> ' + p.description.substring(0, 100) + '</span>';
                html += '</div>';
                html += '<div class="admin-card-actions">';
                html += '<button class="btn-action approve" onclick="approveProperty(\'' + doc.id + '\')"><i class="fas fa-check"></i> اعتماد</button>';
                html += '<button class="btn-action edit" onclick="editProperty(\'' + doc.id + '\')"><i class="fas fa-edit"></i> تعديل</button>';
                html += '<button class="btn-action delete" onclick="deleteProperty(\'' + doc.id + '\')"><i class="fas fa-trash"></i> رفض</button>';
                html += '</div></div>';
            });
            grid.innerHTML = html || '<p style="text-align:center;padding:40px;color:#718096">لا توجد عقارات معلقة</p>';
        });
    }

    window.approveProperty = function (id) {
        if (!confirm('هل تريد اعتماد هذا العقار؟')) return;
        db.collection('properties').doc(id).update({ status: 'approved' });
    };

    window.deleteProperty = function (id) {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        db.collection('properties').doc(id).delete();
    };

    window.editProperty = function (id) {
        db.collection('properties').doc(id).get().then(function (doc) {
            var p = doc.data();
            document.getElementById('editPropertyId').value = id;
            document.getElementById('propertyModalTitle').textContent = 'تعديل العقار';
            document.getElementById('adminPropTitle').value = p.title || '';
            document.getElementById('adminPropType').value = p.type || 'شقة';
            document.getElementById('adminPropPurpose').value = p.purpose || 'بيع';
            document.getElementById('adminPropPrice').value = p.price || '';
            document.getElementById('adminPropCity').value = p.city || 'رام الله';
            document.getElementById('adminPropArea').value = p.area || '';
            document.getElementById('adminPropSize').value = p.size || '';
            document.getElementById('adminPropBedrooms').value = p.bedrooms || '';
            document.getElementById('adminPropBathrooms').value = p.bathrooms || '';
            document.getElementById('adminPropFloor').value = p.floor || '';
            document.getElementById('adminPropDescription').value = p.description || '';
            document.getElementById('adminPropImages').value = (p.images || []).join('\n');
            // Handle rent period
            var rentRow = document.getElementById('adminRentPeriodRow');
            if (p.purpose === 'إيجار') {
                rentRow.classList.remove('hidden');
                document.getElementById('adminPropRentPeriod').value = p.rentPeriod || 'شهري';
            } else {
                rentRow.classList.add('hidden');
            }
            adminImageUploads = p.images || [];
            renderAdminImagePreviews();
            document.getElementById('addPropertyModal').classList.remove('hidden');
        });
    };

    window.openAddPropertyModal = function () {
        document.getElementById('editPropertyId').value = '';
        document.getElementById('propertyModalTitle').textContent = 'إضافة عقار جديد';
        document.getElementById('adminPropertyForm').reset();
        document.getElementById('adminRentPeriodRow').classList.add('hidden');
        adminImageUploads = [];
        renderAdminImagePreviews();
        document.getElementById('addPropertyModal').classList.remove('hidden');
    };

    window.closeAddPropertyModal = function () {
        document.getElementById('addPropertyModal').classList.add('hidden');
    };

    window.toggleAdminRentPeriod = function () {
        var purpose = document.getElementById('adminPropPurpose').value;
        var row = document.getElementById('adminRentPeriodRow');
        if (purpose === 'إيجار') {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    };

    window.handleAdminImageUpload = function (e) {
        var files = Array.from(e.target.files);
        files.forEach(function (file) {
            var reader = new FileReader();
            reader.onload = function (ev) {
                adminImageUploads.push(ev.target.result);
                renderAdminImagePreviews();
            };
            reader.readAsDataURL(file);
        });
    };

    function renderAdminImagePreviews() {
        var container = document.getElementById('adminImagePreviews');
        if (!container) return;
        var html = '';
        adminImageUploads.forEach(function (img) {
            if (img.startsWith('data:') || img.startsWith('http')) {
                html += '<img src="' + img + '" alt="">';
            }
        });
        container.innerHTML = html;
    }

    window.saveAdminProperty = function (e) {
        e.preventDefault();
        var id = document.getElementById('editPropertyId').value;
        var imagesText = document.getElementById('adminPropImages').value.trim();
        var images = adminImageUploads.slice();
        if (imagesText) {
            imagesText.split('\n').forEach(function (url) {
                url = url.trim();
                if (url && images.indexOf(url) === -1) images.push(url);
            });
        }

        var data = {
            title: document.getElementById('adminPropTitle').value.trim(),
            type: document.getElementById('adminPropType').value,
            purpose: document.getElementById('adminPropPurpose').value,
            price: parseInt(document.getElementById('adminPropPrice').value) || 0,
            rentPeriod: document.getElementById('adminPropPurpose').value === 'إيجار' ? document.getElementById('adminPropRentPeriod').value : null,
            city: document.getElementById('adminPropCity').value,
            area: document.getElementById('adminPropArea').value.trim(),
            size: parseInt(document.getElementById('adminPropSize').value) || 0,
            bedrooms: parseInt(document.getElementById('adminPropBedrooms').value) || 0,
            bathrooms: parseInt(document.getElementById('adminPropBathrooms').value) || 0,
            floor: parseInt(document.getElementById('adminPropFloor').value) || 0,
            description: document.getElementById('adminPropDescription').value.trim(),
            images: images,
            status: 'approved'
        };

        if (id) {
            db.collection('properties').doc(id).update(data).then(function () {
                closeAddPropertyModal();
            });
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            data.submittedBy = 'admin';
            db.collection('properties').add(data).then(function () {
                closeAddPropertyModal();
            });
        }
    };

    // ===== VISIT REQUESTS =====
    var allVisits = [];
    var visitsFilter = 'all';

    function loadVisitRequests() {
        db.collection('visit_requests').orderBy('createdAt', 'desc').onSnapshot(function (snap) {
            allVisits = [];
            snap.forEach(function (doc) {
                var data = doc.data();
                data.id = doc.id;
                allVisits.push(data);
            });
            renderVisits();
        });
    }

    window.filterVisits = function (filter) {
        visitsFilter = filter;
        document.querySelectorAll('.visit-filter').forEach(function (b) { b.classList.remove('active'); });
        event.target.classList.add('active');
        renderVisits();
    };

    function renderVisits() {
        var grid = document.getElementById('visitsGrid');
        var filtered = visitsFilter === 'all' ? allVisits : allVisits.filter(function (v) { return v.status === visitsFilter; });

        var html = '';
        filtered.forEach(function (v) {
            var statusText = { pending: 'معلقة', accepted: 'مقبولة', completed: 'مكتملة', cancelled: 'ملغاة' };
            html += '<div class="admin-card">';
            html += '<h4>' + (v.propertyTitle || 'عقار') + ' <span class="status-badge ' + v.status + '">' + (statusText[v.status] || v.status) + '</span></h4>';
            html += '<div class="admin-card-meta">';
            html += '<span><i class="fas fa-user"></i> ' + (v.userName || '-') + '</span>';
            html += '<span><i class="fas fa-phone"></i> ' + (v.userPhone || '-') + '</span>';
            html += '<span><i class="fas fa-map-marker-alt"></i> ' + (v.propertyCity || '-') + '</span>';
            if (v.scheduledDate) html += '<span><i class="fas fa-calendar"></i> ' + v.scheduledDate + ' الساعة ' + (v.scheduledTime || '') + '</span>';
            if (v.employeeNotes) html += '<span><i class="fas fa-sticky-note"></i> ' + v.employeeNotes + '</span>';
            var date = v.createdAt ? new Date(v.createdAt.seconds * 1000).toLocaleDateString('ar') : '-';
            html += '<span><i class="fas fa-clock"></i> ' + date + '</span>';
            html += '</div>';
            html += '<div class="admin-card-actions">';
            if (v.status === 'pending') {
                html += '<button class="btn-action schedule" onclick="openScheduleModal(\'' + v.id + '\')"><i class="fas fa-calendar-check"></i> جدولة</button>';
                html += '<button class="btn-action delete" onclick="cancelVisit(\'' + v.id + '\')"><i class="fas fa-times"></i> إلغاء</button>';
            }
            if (v.status === 'accepted') {
                html += '<button class="btn-action complete" onclick="completeVisit(\'' + v.id + '\')"><i class="fas fa-check"></i> تمت المعاينة</button>';
                html += '<button class="btn-action delete" onclick="cancelVisit(\'' + v.id + '\')"><i class="fas fa-times"></i> إلغاء</button>';
            }
            html += '<a class="btn-action edit" href="https://wa.me/' + (v.userPhone || '').replace(/^0/, '972') + '" target="_blank"><i class="fab fa-whatsapp"></i> تواصل</a>';
            html += '</div></div>';
        });

        grid.innerHTML = html || '<p style="text-align:center;padding:40px;color:#718096">لا توجد طلبات معاينة</p>';
    }

    window.openScheduleModal = function (visitId) {
        document.getElementById('scheduleVisitId').value = visitId;
        document.getElementById('scheduleModal').classList.remove('hidden');
    };

    window.closeScheduleModal = function () {
        document.getElementById('scheduleModal').classList.add('hidden');
    };

    window.confirmSchedule = function (e) {
        e.preventDefault();
        var id = document.getElementById('scheduleVisitId').value;
        var date = document.getElementById('scheduleDate').value;
        var time = document.getElementById('scheduleTime').value;
        var notes = document.getElementById('scheduleNotes').value.trim();

        db.collection('visit_requests').doc(id).update({
            status: 'accepted',
            scheduledDate: date,
            scheduledTime: time,
            employeeNotes: notes
        }).then(function () {
            closeScheduleModal();
        });
    };

    window.completeVisit = function (id) {
        if (!confirm('هل تمت المعاينة بنجاح؟')) return;
        db.collection('visit_requests').doc(id).update({ status: 'completed' });
    };

    window.cancelVisit = function (id) {
        if (!confirm('هل تريد إلغاء هذا الطلب؟')) return;
        db.collection('visit_requests').doc(id).update({ status: 'cancelled' });
    };

    // ===== CHATS =====
    function loadChats() {
        db.collection('chats').orderBy('lastMessageTime', 'desc').onSnapshot(function (snap) {
            var list = document.getElementById('chatList');
            var html = '';
            snap.forEach(function (doc) {
                var chat = doc.data();
                var unread = chat.unreadByEmployee > 0;
                html += '<div class="chat-list-item' + (doc.id === activeChatId ? ' active' : '') + '" onclick="openChatConversation(\'' + doc.id + '\')">';
                html += '<h5>' + (chat.userName || 'مستخدم') + (unread ? ' <span class="unread-dot"></span>' : '') + '</h5>';
                html += '<p>' + (chat.lastMessage || '') + '</p>';
                html += '</div>';
            });
            list.innerHTML = html || '<p class="empty-chat-list">لا توجد محادثات</p>';
        });
    }

    window.openChatConversation = function (chatId) {
        activeChatId = chatId;

        // Mark all items and highlight active
        document.querySelectorAll('.chat-list-item').forEach(function (item) { item.classList.remove('active'); });
        event.currentTarget.classList.add('active');

        // Show input
        document.getElementById('chatWindowInput').classList.remove('hidden');

        // Update header
        db.collection('chats').doc(chatId).get().then(function (doc) {
            var data = doc.data();
            document.getElementById('chatWindowHeader').innerHTML = '<h4>' + (data.userName || 'مستخدم') + '</h4><p>' + (data.userPhone || '') + '</p>';
        });

        // Reset unread
        db.collection('chats').doc(chatId).update({ unreadByEmployee: 0 });

        // Listen to messages
        if (chatMsgUnsubscribe) chatMsgUnsubscribe();
        chatMsgUnsubscribe = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(function (snap) {
                var container = document.getElementById('chatWindowMessages');
                var html = '';
                snap.forEach(function (doc) {
                    var msg = doc.data();
                    var cls = msg.sender === 'user' ? 'from-user' : 'from-employee';
                    var time = msg.timestamp ? formatTime(msg.timestamp.toDate()) : '';
                    html += '<div class="chat-msg ' + cls + '">';
                    html += '<span>' + escapeHtml(msg.text) + '</span>';
                    html += '<span class="msg-time">' + time + '</span>';
                    html += '</div>';
                });
                container.innerHTML = html;
                container.scrollTop = container.scrollHeight;

                // Mark as read by employee
                snap.forEach(function (doc) {
                    var msg = doc.data();
                    if (!msg.readByEmployee) {
                        doc.ref.update({ readByEmployee: true });
                    }
                });
            });
    };

    window.sendEmployeeMessage = function () {
        if (!activeChatId) return;
        var input = document.getElementById('employeeChatInput');
        var text = input.value.trim();
        if (!text) return;

        db.collection('chats').doc(activeChatId).collection('messages').add({
            text: text,
            sender: 'employee',
            senderName: 'فريق المبيعات',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            readByUser: false,
            readByEmployee: true
        });

        db.collection('chats').doc(activeChatId).update({
            lastMessage: text,
            lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
        });

        input.value = '';
    };

    // ===== CONTACTS =====
    function loadContacts() {
        db.collection('contact_messages').orderBy('createdAt', 'desc').onSnapshot(function (snap) {
            var tbody = document.getElementById('contactsTableBody');
            var html = '';
            snap.forEach(function (doc) {
                var c = doc.data();
                var date = c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('ar') : '-';
                html += '<tr>';
                html += '<td>' + (c.name || '-') + '</td>';
                html += '<td>' + (c.phone || '-') + '</td>';
                html += '<td>' + (c.message || '-').substring(0, 80) + '</td>';
                html += '<td>' + date + '</td>';
                html += '<td><span class="status-badge ' + (c.status || 'pending') + '">' + (c.status === 'read' ? 'مقروءة' : 'جديدة') + '</span></td>';
                html += '</tr>';
            });
            tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;padding:30px">لا توجد رسائل</td></tr>';
        });
    }

    // ===== USERS =====
    function loadUsers() {
        db.collection('users').orderBy('createdAt', 'desc').onSnapshot(function (snap) {
            var tbody = document.getElementById('usersTableBody');
            var html = '';
            snap.forEach(function (doc) {
                var u = doc.data();
                var date = u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('ar') : '-';
                html += '<tr>';
                html += '<td>' + (u.name || '-') + '</td>';
                html += '<td>' + (u.phone || '-') + '</td>';
                html += '<td>' + (u.email || '-') + '</td>';
                html += '<td>' + date + '</td>';
                html += '</tr>';
            });
            tbody.innerHTML = html || '<tr><td colspan="4" style="text-align:center;padding:30px">لا يوجد مستخدمين</td></tr>';
        });
    }

    // ===== UTILITIES =====
    function formatPrice(price) {
        if (!price) return '0 ₪';
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
})();
