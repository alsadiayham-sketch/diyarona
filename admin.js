(function () {
    'use strict';

    var SESSION_KEY = 'diyarona_admin';
    var ADMIN_USERNAME = 'diyarona';
    var ADMIN_PASSWORD_HASH = simpleHash('5555');

    var dashboardPropertiesUnsubscribe = null;
    var dashboardVisitsUnsubscribe = null;
    var dashboardChatsUnsubscribe = null;
    var dashboardUsersUnsubscribe = null;
    var dashboardEmployeesUnsubscribe = null;
    var compoundsUnsubscribe = null;
    var approvedPropertiesUnsubscribe = null;
    var pendingPropertiesUnsubscribe = null;
    var visitsUnsubscribe = null;
    var chatsUnsubscribe = null;
    var contactsUnsubscribe = null;
    var employeesUnsubscribe = null;
    var usersUnsubscribe = null;
    var analyticsVisitsUnsubscribe = null;
    var analyticsPropertiesUnsubscribe = null;
    var interestedCustomersUnsubscribe = null;
    var currentChatUnsubscribe = null;

    var currentSession = null;
    var pendingPasswordReset = null;
    var currentChatId = '';
    var currentVisitsFilter = 'all';
    var allVisits = [];
    var compoundsCache = [];
    var compoundsMap = {};
    var approvedPropertiesCache = [];
    var pendingPropertiesCache = [];
    var soldPropertiesCache = [];
    var analyticsVisitsCache = [];
    var analyticsPropertiesCache = [];
    var interestedCustomersCache = [];
    var employeesCache = [];
    var usersCache = [];
    var chatsCache = [];
    var contactMessagesCache = [];
    var compoundFileImages = [];
    var propertyFileImages = [];
    var analyticsFiltersBound = false;

    function el(id) {
        return document.getElementById(id);
    }

    function showElement(node, shouldShow) {
        if (!node) {
            return;
        }
        if (shouldShow) {
            if (node.classList) {
                node.classList.remove('hidden');
            }
            node.style.display = '';
        } else {
            if (node.classList) {
                node.classList.add('hidden');
            }
            node.style.display = 'none';
        }
    }

    function setText(ids, value) {
        var list = typeof ids === 'string' ? [ids] : ids;
        var i;
        for (i = 0; i < list.length; i++) {
            if (el(list[i])) {
                el(list[i]).textContent = value == null ? '' : String(value);
            }
        }
    }

    function setBadge(ids, value) {
        var list = typeof ids === 'string' ? [ids] : ids;
        var count = parseInt(value, 10) || 0;
        var i;
        for (i = 0; i < list.length; i++) {
            if (el(list[i])) {
                el(list[i]).textContent = String(count);
                showElement(el(list[i]), count > 0);
            }
        }
    }

    function getTrimmedValue(id) {
        var node = el(id);
        return node && typeof node.value === 'string' ? node.value.trim() : '';
    }

    function setInputValue(id, value) {
        if (el(id)) {
            el(id).value = value == null ? '' : value;
        }
    }

    function resetForm(formId) {
        var form = el(formId);
        if (form) {
            form.reset();
        }
    }

    function notify(message, isError) {
        var toast = el('adminToast');
        if (toast) {
            toast.textContent = message;
            toast.className = 'admin-toast ' + (isError ? 'error' : 'success');
            clearTimeout(toast._timer);
            toast._timer = setTimeout(function () {
                toast.className = 'admin-toast hidden';
            }, 4000);
        }
        if (window.console && console.log) {
            console.log((isError ? '[ERROR] ' : '[OK] ') + message);
        }
    }

    function handleError(context, error) {
        if (window.console && console.error) {
            console.error(context, error);
        }
        notify(context, true);
    }

    function simpleHash(str) {
        var hash = 0;
        var i;
        for (i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36);
    }

    function formatPrice(price) {
        var value = parseInt(price, 10);
        if (isNaN(value)) {
            value = 0;
        }
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₪';
    }

    function formatTime(date) {
        var d = toDateObject(date);
        var hours;
        var minutes;
        if (!d) {
            return '';
        }
        hours = d.getHours();
        minutes = d.getMinutes();
        return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function escapeJsString(str) {
        return String(str == null ? '' : str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function toDateObject(value) {
        var date;
        if (!value) {
            return null;
        }
        if (typeof value.toDate === 'function') {
            date = value.toDate();
        } else if (Object.prototype.toString.call(value) === '[object Date]') {
            date = value;
        } else {
            date = new Date(value);
        }
        if (!date || isNaN(date.getTime())) {
            return null;
        }
        return date;
    }

    function formatDateTime(value) {
        var date = toDateObject(value);
        if (!date) {
            return '-';
        }
        return date.toLocaleDateString('ar-EG') + ' ' + formatTime(date);
    }

    function toIntegerOrNull(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    function splitCsv(value) {
        var parts = String(value || '').split(',');
        var result = [];
        var i;
        for (i = 0; i < parts.length; i++) {
            if (parts[i].trim()) {
                result.push(parts[i].trim());
            }
        }
        return result;
    }

    function splitLines(value) {
        var parts = String(value || '').split(/\r?\n/);
        var result = [];
        var i;
        for (i = 0; i < parts.length; i++) {
            if (parts[i].trim()) {
                result.push(parts[i].trim());
            }
        }
        return result;
    }

    function generateOtp() {
        return String(Math.floor(100000 + (Math.random() * 900000)));
    }

    function sortByUpdatedDesc(items) {
        items.sort(function (a, b) {
            var aDate = toDateObject(a.updatedAt || a.createdAt);
            var bDate = toDateObject(b.updatedAt || b.createdAt);
            var aTime = aDate ? aDate.getTime() : 0;
            var bTime = bDate ? bDate.getTime() : 0;
            return bTime - aTime;
        });
        return items;
    }

    function roleLabel(role) {
        if (role === 'sales') {
            return 'مبيعات';
        }
        if (role === 'property_manager') {
            return 'مدير عقارات';
        }
        if (role === 'manager') {
            return 'مدير';
        }
        if (role === 'admin') {
            return 'مدير عام';
        }
        return role || '-';
    }

    function isAdminRole(role) {
        return role === 'admin' || role === 'manager';
    }

    function firstExistingId(ids) {
        var i;
        for (i = 0; i < ids.length; i++) {
            if (el(ids[i])) {
                return ids[i];
            }
        }
        return ids[0];
    }

    function getPropertyFormId() {
        return firstExistingId(['propertyForm', 'adminPropertyForm']);
    }

    function getPropertyModalId() {
        return firstExistingId(['addPropertyModal', 'adminPropertyModal']);
    }

    function getPropertyFieldId(name) {
        var map = {
            propertyId: ['propertyId', 'adminPropertyId'],
            propertyStatus: ['propertyStatus', 'adminPropertyStatus'],
            propertyTitle: ['propertyTitle', 'adminPropertyTitle'],
            propertyCompound: ['propertyCompound', 'adminPropertyCompound'],
            propertyType: ['propertyType', 'adminPropertyType'],
            propertyPurpose: ['propertyPurpose', 'adminPropertyPurpose'],
            propertyPrice: ['propertyPrice', 'adminPropertyPrice'],
            propertyRentPeriod: ['propertyRentPeriod', 'adminPropertyRentPeriod'],
            propertyCity: ['propertyCity', 'adminPropertyCity'],
            propertyArea: ['propertyArea', 'adminPropertyArea'],
            propertyAddress: ['propertyAddress', 'adminPropertyAddress'],
            propertySize: ['propertySize', 'adminPropertySize'],
            propertyBedrooms: ['propertyBedrooms', 'adminPropertyBedrooms'],
            propertyBathrooms: ['propertyBathrooms', 'adminPropertyBathrooms'],
            propertyFloor: ['propertyFloor', 'adminPropertyFloor'],
            propertyDescription: ['propertyDescription', 'adminPropertyDescription'],
            propertyAmenities: ['propertyAmenities', 'adminPropertyAmenities'],
            propertyImageFiles: ['propertyImageFiles', 'adminPropertyImageFiles'],
            propertyImageUrls: ['propertyImageUrls', 'adminPropertyImageUrls'],
            propertyImagesPreview: ['propertyImagesPreview', 'adminPropertyImagesPreview'],
            propertyRentPeriodRow: ['propertyRentPeriodRow', 'adminRentPeriodRow']
        };
        return firstExistingId(map[name] || [name]);
    }

    function getPropertyValue(name) {
        return getTrimmedValue(getPropertyFieldId(name));
    }

    function setPropertyValue(name, value) {
        setInputValue(getPropertyFieldId(name), value);
    }

    function purposeLabel(value) {
        if (value === 'rent' || value === 'إيجار') {
            return 'إيجار';
        }
        if (value === 'sale' || value === 'بيع') {
            return 'بيع';
        }
        return value || '-';
    }

    function propertyStatusLabel(status) {
        if (status === 'approved') {
            return 'معتمد';
        }
        if (status === 'pending') {
            return 'قيد الانتظار';
        }
        if (status === 'rejected') {
            return 'مرفوض';
        }
        if (status === 'sold') {
            return 'مباع';
        }
        return status || '-';
    }

    function getVisitArea(visit) {
        return visit.area || visit.propertyArea || visit.propertyCity || visit.city || '';
    }

    function getVisitPropertyId(visit) {
        return visit.propertyId || visit.property || visit.propertyDocId || '';
    }

    function getVisitSubmitterName(item) {
        return item.submittedByName || item.ownerName || item.userName || item.submittedBy || '-';
    }

    function getVisitSubmitterPhone(item) {
        return item.submitterPhone || item.ownerPhone || item.userPhone || '-';
    }

    function normalizePhoneNumber(phone) {
        return String(phone || '').replace(/[^0-9]/g, '');
    }

    function isWithinPeriod(value, period) {
        var date = toDateObject(value);
        var limitDate;
        var days;
        if (period === 'all' || !period) {
            return true;
        }
        if (!date) {
            return false;
        }
        days = parseInt(period, 10);
        if (isNaN(days) || days <= 0) {
            return true;
        }
        limitDate = new Date();
        limitDate.setHours(0, 0, 0, 0);
        limitDate.setDate(limitDate.getDate() - days);
        return date.getTime() >= limitDate.getTime();
    }

    function findPropertyById(id) {
        var collections = [approvedPropertiesCache, pendingPropertiesCache, soldPropertiesCache, analyticsPropertiesCache];
        var i;
        var j;
        if (!id) {
            return null;
        }
        for (i = 0; i < collections.length; i++) {
            for (j = 0; j < collections[i].length; j++) {
                if (collections[i][j].id === id) {
                    return collections[i][j];
                }
            }
        }
        return null;
    }

    function toggleFormRow(id, visible) {
        var row = el(id);
        if (!row) {
            return;
        }
        row.style.display = visible ? '' : 'none';
        if (row.classList) {
            if (visible) {
                row.classList.remove('hidden');
            } else {
                row.classList.add('hidden');
            }
        }
    }

    function applyRolePermissions() {
        var nodes = document.querySelectorAll('[data-role-only]');
        var i;
        var allowedRoles;
        var role = currentSession ? currentSession.role : '';
        for (i = 0; i < nodes.length; i++) {
            if (!currentSession || isAdminRole(role)) {
                showElement(nodes[i], true);
            } else {
                allowedRoles = nodes[i].getAttribute('data-role-only').split(',');
                showElement(nodes[i], allowedRoles.indexOf(role) !== -1);
            }
        }
    }

    function showScreen(screen) {
        showElement(el('employeeLoginScreen'), screen === 'login');
        showElement(el('employeePasswordResetScreen'), screen === 'reset');
        showElement(el('adminPanel'), screen === 'app');
    }

    function saveSession(session) {
        currentSession = session;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setText(['adminSessionName', 'currentAdminName', 'sidebarEmployeeName'], session.name || session.username || '');
        setText(['adminSessionRole', 'currentAdminRole', 'sidebarEmployeeRole'], roleLabel(session.role));
        applyRolePermissions();
    }

    function restoreSession() {
        var raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) {
            return false;
        }
        try {
            currentSession = JSON.parse(raw);
            if (!currentSession || !currentSession.role) {
                sessionStorage.removeItem(SESSION_KEY);
                currentSession = null;
                return false;
            }
            saveSession(currentSession);
            return true;
        } catch (error) {
            sessionStorage.removeItem(SESSION_KEY);
            currentSession = null;
            return false;
        }
    }

    function clearSession() {
        currentSession = null;
        sessionStorage.removeItem(SESSION_KEY);
    }

    function closeActiveChatListener() {
        if (typeof currentChatUnsubscribe === 'function') {
            currentChatUnsubscribe();
        }
        currentChatUnsubscribe = null;
    }

    function clearAllRealtimeListeners() {
        if (typeof dashboardPropertiesUnsubscribe === 'function') {
            dashboardPropertiesUnsubscribe();
        }
        if (typeof dashboardVisitsUnsubscribe === 'function') {
            dashboardVisitsUnsubscribe();
        }
        if (typeof dashboardChatsUnsubscribe === 'function') {
            dashboardChatsUnsubscribe();
        }
        if (typeof dashboardUsersUnsubscribe === 'function') {
            dashboardUsersUnsubscribe();
        }
        if (typeof dashboardEmployeesUnsubscribe === 'function') {
            dashboardEmployeesUnsubscribe();
        }
        if (typeof compoundsUnsubscribe === 'function') {
            compoundsUnsubscribe();
        }
        if (typeof approvedPropertiesUnsubscribe === 'function') {
            approvedPropertiesUnsubscribe();
        }
        if (typeof pendingPropertiesUnsubscribe === 'function') {
            pendingPropertiesUnsubscribe();
        }
        if (typeof visitsUnsubscribe === 'function') {
            visitsUnsubscribe();
        }
        if (typeof chatsUnsubscribe === 'function') {
            chatsUnsubscribe();
        }
        if (typeof contactsUnsubscribe === 'function') {
            contactsUnsubscribe();
        }
        if (typeof employeesUnsubscribe === 'function') {
            employeesUnsubscribe();
        }
        if (typeof usersUnsubscribe === 'function') {
            usersUnsubscribe();
        }
        if (typeof analyticsVisitsUnsubscribe === 'function') {
            analyticsVisitsUnsubscribe();
        }
        if (typeof analyticsPropertiesUnsubscribe === 'function') {
            analyticsPropertiesUnsubscribe();
        }
        if (typeof interestedCustomersUnsubscribe === 'function') {
            interestedCustomersUnsubscribe();
        }
        dashboardPropertiesUnsubscribe = null;
        dashboardVisitsUnsubscribe = null;
        dashboardChatsUnsubscribe = null;
        dashboardUsersUnsubscribe = null;
        dashboardEmployeesUnsubscribe = null;
        compoundsUnsubscribe = null;
        approvedPropertiesUnsubscribe = null;
        pendingPropertiesUnsubscribe = null;
        visitsUnsubscribe = null;
        chatsUnsubscribe = null;
        contactsUnsubscribe = null;
        employeesUnsubscribe = null;
        usersUnsubscribe = null;
        analyticsVisitsUnsubscribe = null;
        analyticsPropertiesUnsubscribe = null;
        interestedCustomersUnsubscribe = null;
        if (typeof logsUnsubscribe === 'function') {
            logsUnsubscribe();
        }
        logsUnsubscribe = null;
        closeActiveChatListener();
    }

    function touchAdminAuth(action) {
        if (!window.rawDb || typeof window.PROJECT_ID === 'undefined') {
            return;
        }
        rawDb.collection('admin_auth').doc(PROJECT_ID).set({
            lastAction: action,
            lastUsername: currentSession ? currentSession.username : ADMIN_USERNAME,
            lastRole: currentSession ? currentSession.role : 'admin',
            lastAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(function () {
        });
    }

    function switchTab(tab) {
        var contents = document.querySelectorAll('.tab-content, [data-tab-content]');
        var buttons = document.querySelectorAll('[data-tab]');
        var i;
        for (i = 0; i < contents.length; i++) {
            var contentTab = contents[i].getAttribute('data-tab-content') || contents[i].id;
            var visible = contentTab === tab || contents[i].id === tab + 'Tab' || contents[i].id === 'tab-' + tab;
            showElement(contents[i], visible);
            if (contents[i].classList) {
                if (visible) {
                    contents[i].classList.add('active');
                } else {
                    contents[i].classList.remove('active');
                }
            }
        }
        for (i = 0; i < buttons.length; i++) {
            if (buttons[i].classList) {
                if ((buttons[i].getAttribute('data-tab') || '') === tab) {
                    buttons[i].classList.add('active');
                } else {
                    buttons[i].classList.remove('active');
                }
            }
        }
    }

    function initAdminApp() {
        clearAllRealtimeListeners();
        showScreen('app');
        saveSession(currentSession);
        loadDashboardData();
        loadCompounds();
        loadApprovedProperties();
        loadPendingProperties();
        loadVisitRequests();
        loadChats();
        loadContacts();
        loadEmployees();
        loadUsers();
        loadAnalytics();
        loadInterestedCustomers();
        loadLogs();
        switchTab('dashboard');
    }

    function loginAdmin(event) {
        var username;
        var password;
        var passwordHash;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        username = getTrimmedValue('adminUsername');
        password = getTrimmedValue('adminPassword');
        if (!username || !password) {
            notify('يرجى إدخال اسم المستخدم وكلمة المرور', true);
            return;
        }
        passwordHash = simpleHash(password);
        if (username === ADMIN_USERNAME && passwordHash === ADMIN_PASSWORD_HASH) {
            saveSession({
                id: 'admin',
                name: 'مدير ديارونا',
                username: ADMIN_USERNAME,
                role: 'admin',
                isAdmin: true
            });
            touchAdminAuth('login');
            initAdminApp();
            return;
        }
        db.collection('employees').where('username', '==', username).limit(1).get().then(function (snapshot) {
            var data;
            if (snapshot.empty) {
                notify('بيانات الدخول غير صحيحة', true);
                return;
            }
            data = snapshot.docs[0].data() || {};
            data.id = snapshot.docs[0].id;
            if (data.status === 'otp_reset') {
                pendingPasswordReset = data;
                setText(['passwordResetName', 'passwordResetEmployeeName'], data.name || data.username || '');
                    setInputValue('employeeOtp', '');
                    setInputValue('employeeNewPassword', '');
                    setInputValue('employeeConfirmPassword', '');
                showScreen('reset');
                notify('يجب تعيين كلمة مرور جديدة لهذا الحساب');
                return;
            }
            if (data.passwordHash !== passwordHash) {
                notify('كلمة المرور غير صحيحة', true);
                return;
            }
            saveSession({
                id: data.id,
                name: data.name || data.username,
                username: data.username,
                role: data.role || 'sales',
                isAdmin: isAdminRole(data.role || 'sales')
            });
            initAdminApp();
        }).catch(function (error) {
            handleError('تعذر تسجيل الدخول', error);
        });
    }

    function submitNewPassword(event) {
        var otp;
        var newPassword;
        var confirmPassword;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        if (!pendingPasswordReset || !pendingPasswordReset.id) {
            notify('لا توجد عملية إعادة تعيين نشطة', true);
            showScreen('login');
            return;
        }
        otp = getTrimmedValue('employeeOtp');
        newPassword = getTrimmedValue('employeeNewPassword');
        confirmPassword = getTrimmedValue('employeeConfirmPassword');
        if (!otp || !newPassword || !confirmPassword) {
            notify('يرجى إكمال جميع الحقول', true);
            return;
        }
        if (newPassword !== confirmPassword) {
            notify('كلمتا المرور غير متطابقتين', true);
            return;
        }
        db.collection('employees').doc(pendingPasswordReset.id).get().then(function (doc) {
            var data;
            if (!doc.exists) {
                throw new Error('Employee not found');
            }
            data = doc.data() || {};
            if (data.status !== 'otp_reset') {
                notify('تم إلغاء طلب إعادة التعيين', true);
                showScreen('login');
                return null;
            }
            if (String(data.otp || '') !== otp) {
                notify('رمز OTP غير صحيح', true);
                return null;
            }
            return db.collection('employees').doc(doc.id).update({
                passwordHash: simpleHash(newPassword),
                status: 'active',
                otp: firebase.firestore.FieldValue.delete(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function () {
                saveSession({
                    id: doc.id,
                    name: data.name || data.username,
                    username: data.username,
                    role: data.role || 'sales',
                    isAdmin: isAdminRole(data.role || 'sales')
                });
                pendingPasswordReset = null;
                notify('تم تحديث كلمة المرور بنجاح');
                initAdminApp();
            });
        }).catch(function (error) {
            handleError('تعذر تحديث كلمة المرور', error);
        });
    }

    function logoutAdmin() {
        clearAllRealtimeListeners();
        closeCompoundModal();
        closeAddPropertyModal();
        closeScheduleModal();
        closeCompleteVisitModal();
        closeEmployeeModal();
        clearSession();
        touchAdminAuth('logout');
        showScreen('login');
    }

    function countUnreadChats(items) {
        var total = 0;
        var i;
        for (i = 0; i < items.length; i++) {
            total += parseInt(items[i].unreadAdminCount || items[i].unreadCount || 0, 10) || 0;
        }
        return total;
    }

    function loadDashboardData() {
        if (typeof dashboardPropertiesUnsubscribe === 'function') {
            dashboardPropertiesUnsubscribe();
        }
        if (typeof dashboardVisitsUnsubscribe === 'function') {
            dashboardVisitsUnsubscribe();
        }
        if (typeof dashboardChatsUnsubscribe === 'function') {
            dashboardChatsUnsubscribe();
        }
        if (typeof dashboardUsersUnsubscribe === 'function') {
            dashboardUsersUnsubscribe();
        }
        if (typeof dashboardEmployeesUnsubscribe === 'function') {
            dashboardEmployeesUnsubscribe();
        }

        dashboardPropertiesUnsubscribe = db.collection('properties').onSnapshot(function (propertySnap) {
            var approved = 0;
            var pending = 0;
            var total = 0;
            propertySnap.forEach(function (doc) {
                var data = doc.data() || {};
                total += 1;
                if (data.status === 'approved') {
                    approved += 1;
                } else if (data.status === 'pending') {
                    pending += 1;
                }
            });
            setText(['statApprovedProperties', 'dashboardApprovedProperties'], approved);
            setText(['statPendingProperties', 'dashboardPendingProperties', 'pendingPropertiesCount'], pending);
            setText(['totalPropertiesCount'], total);
            setBadge(['pendingPropertiesBadge', 'sidebarPendingPropertiesBadge'], pending);
        }, function (error) {
            handleError('تعذر تحميل إحصائيات العقارات', error);
        });

        dashboardVisitsUnsubscribe = db.collection('visit_requests').onSnapshot(function (visitSnap) {
            var pendingVisits = 0;
            visitSnap.forEach(function (doc) {
                var data = doc.data() || {};
                if (data.status === 'pending') {
                    pendingVisits += 1;
                }
            });
            setText(['statVisitRequests', 'dashboardVisitRequests', 'dashboardVisitsPending', 'pendingVisitsCount'], pendingVisits);
            setBadge(['visitRequestsBadge', 'sidebarVisitRequestsBadge', 'pendingVisitsBadge'], pendingVisits);
        }, function (error) {
            handleError('تعذر تحميل إحصائيات الزيارات', error);
        });

        dashboardChatsUnsubscribe = db.collection('chats').onSnapshot(function (chatSnap) {
            var items = [];
            chatSnap.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                items.push(data);
            });
            setText(['statChats', 'dashboardChats', 'dashboardChatsOpen', 'activeChatsCount'], items.length);
            setText(['statUnreadChats', 'dashboardUnreadChats'], countUnreadChats(items));
            setBadge(['chatBadge', 'sidebarChatBadge', 'activeChatsBadge'], countUnreadChats(items));
        }, function (error) {
            handleError('تعذر تحميل إحصائيات المحادثات', error);
        });

        dashboardUsersUnsubscribe = db.collection('users').onSnapshot(function (userSnap) {
            setText(['statUsers', 'dashboardUsers', 'totalUsersCount'], userSnap.size);
        }, function (error) {
            handleError('تعذر تحميل إحصائيات المستخدمين', error);
        });

        dashboardEmployeesUnsubscribe = db.collection('employees').onSnapshot(function (employeeSnap) {
            setText(['statEmployees', 'dashboardEmployees', 'totalEmployeesCount'], employeeSnap.size);
        }, function (error) {
            handleError('تعذر تحميل إحصائيات الموظفين', error);
        });
    }

    function normalizeCompound(item) {
        item.images = Array.isArray(item.images) ? item.images : [];
        item.amenities = Array.isArray(item.amenities) ? item.amenities : [];
        item.order = toIntegerOrNull(item.order) || 0;
        return item;
    }

    function populateCompoundDropdown() {
        var select = el(getPropertyFieldId('propertyCompound'));
        var i;
        if (!select) {
            return;
        }
        select.innerHTML = '<option value="">بدون مجمع</option>';
        for (i = 0; i < compoundsCache.length; i++) {
            select.innerHTML += '<option value="' + escapeHtml(compoundsCache[i].id) + '">' + escapeHtml(compoundsCache[i].name || 'مجمع') + '</option>';
        }
    }

    function renderCompounds() {
        var container = el('compoundsGrid');
        var html = '';
        var i;
        populateCompoundDropdown();
        if (!container) {
            return;
        }
        if (!compoundsCache.length) {
            container.innerHTML = '<div class="empty-state">لا توجد مجمعات حتى الآن</div>';
            return;
        }
        for (i = 0; i < compoundsCache.length; i++) {
            var item = compoundsCache[i];
            var image = item.images.length ? item.images[0] : '';
            html += '<div class="admin-card compound-card">';
            if (image) {
                html += '<div class="card-cover"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(item.name || '') + '"></div>';
            }
            html += '<div class="card-body">';
            html += '<h3>' + escapeHtml(item.name || 'بدون اسم') + '</h3>';
            html += '<p class="muted">' + escapeHtml((item.city || '') + (item.area ? ' - ' + item.area : '')) + '</p>';
            html += '<p>' + escapeHtml(item.shortDescription || item.description || '') + '</p>';
            html += '<div class="card-meta">';
            html += '<span>الوحدات: ' + escapeHtml(item.totalUnits || 0) + '</span>';
            html += '<span>السعر يبدأ من: ' + escapeHtml(formatPrice(item.startingPrice || 0)) + '</span>';
            html += '</div>';
            html += '<div class="card-actions">';
            html += '<button type="button" onclick="editCompound(\'' + escapeJsString(item.id) + '\')">تعديل</button>';
            html += '<button type="button" class="danger" onclick="deleteCompound(\'' + escapeJsString(item.id) + '\')">حذف</button>';
            html += '</div></div></div>';
        }
        container.innerHTML = html;
    }

    function loadCompounds() {
        if (typeof compoundsUnsubscribe === 'function') {
            compoundsUnsubscribe();
        }
        compoundsUnsubscribe = db.collection('compounds').onSnapshot(function (snapshot) {
            compoundsCache = [];
            compoundsMap = {};
            snapshot.forEach(function (doc) {
                var data = normalizeCompound(doc.data() || {});
                data.id = doc.id;
                compoundsCache.push(data);
                compoundsMap[doc.id] = data;
            });
            compoundsCache.sort(function (a, b) {
                if (a.order !== b.order) {
                    return a.order - b.order;
                }
                return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
            });
            renderCompounds();
            renderApprovedProperties();
            renderPendingProperties();
        }, function (error) {
            handleError('تعذر تحميل المجمعات', error);
        });
    }

    function openAddCompoundModal() {
        resetForm('compoundForm');
        setInputValue('compoundId', '');
        compoundFileImages = [];
        syncCompoundImagePreview();
        var form = el('compoundForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function closeCompoundModal() {
        resetForm('compoundForm');
        setInputValue('compoundId', '');
        compoundFileImages = [];
        syncCompoundImagePreview();
    }

    function collectImages(urlInputId, fileImages) {
        var urls = splitLines(getTrimmedValue(urlInputId));
        var images = urls.slice(0);
        var i;
        for (i = 0; i < fileImages.length; i++) {
            if (fileImages[i]) {
                images.push(fileImages[i]);
            }
        }
        return images;
    }

    function renderImagePreview(containerId, images) {
        var container = el(containerId);
        var html = '';
        var i;
        if (!container) {
            return;
        }
        for (i = 0; i < images.length; i++) {
            html += '<div class="preview-item"><img src="' + escapeHtml(images[i]) + '" alt="preview"></div>';
        }
        container.innerHTML = html;
    }

    function syncCompoundImagePreview() {
        renderImagePreview('compoundImagesPreview', collectImages('compoundImageUrls', compoundFileImages));
    }

    function syncPropertyImagePreview() {
        renderImagePreview(getPropertyFieldId('propertyImagesPreview'), collectImages(getPropertyFieldId('propertyImageUrls'), propertyFileImages));
    }

    function readFilesAsBase64(files, callback) {
        var results = [];
        var index = 0;
        function readNext() {
            var reader;
            if (index >= files.length) {
                callback(results);
                return;
            }
            reader = new FileReader();
            reader.onload = function (e) {
                results.push(e.target.result);
                index += 1;
                readNext();
            };
            reader.onerror = function () {
                index += 1;
                readNext();
            };
            reader.readAsDataURL(files[index]);
        }
        readNext();
    }

    function bindImageInputs() {
        var compoundInput = el('compoundImageFiles');
        var propertyInput = el(getPropertyFieldId('propertyImageFiles'));
        var compoundUrls = el('compoundImageUrls');
        var propertyUrls = el(getPropertyFieldId('propertyImageUrls'));
        if (compoundInput) {
            compoundInput.addEventListener('change', function () {
                readFilesAsBase64(compoundInput.files || [], function (images) {
                    compoundFileImages = images;
                    syncCompoundImagePreview();
                });
            });
        }
        if (propertyInput) {
            propertyInput.addEventListener('change', function () {
                readFilesAsBase64(propertyInput.files || [], function (images) {
                    propertyFileImages = images;
                    syncPropertyImagePreview();
                });
            });
        }
        if (compoundUrls) {
            compoundUrls.addEventListener('input', syncCompoundImagePreview);
        }
        if (propertyUrls) {
            propertyUrls.addEventListener('input', syncPropertyImagePreview);
        }
    }

    function saveCompound(event) {
        var compoundId;
        var payload;
        var promise;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        compoundId = getTrimmedValue('compoundId');
        payload = {
            id: compoundId || ('compound_' + Date.now()),
            name: getTrimmedValue('compoundName'),
            city: getTrimmedValue('compoundCity'),
            area: getTrimmedValue('compoundArea'),
            shortDescription: getTrimmedValue('compoundShortDescription'),
            description: getTrimmedValue('compoundDescription'),
            totalUnits: toIntegerOrNull(getTrimmedValue('compoundTotalUnits')) || 0,
            startingPrice: toIntegerOrNull(getTrimmedValue('compoundStartingPrice')) || 0,
            completionDate: getTrimmedValue('compoundCompletionDate'),
            amenities: splitCsv(getTrimmedValue('compoundAmenities')),
            images: collectImages('compoundImageUrls', compoundFileImages),
            order: toIntegerOrNull(getTrimmedValue('compoundOrder')) || 0,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!payload.name) {
            notify('يرجى إدخال اسم المجمع', true);
            return;
        }
        if (compoundId) {
            promise = db.collection('compounds').doc(compoundId).set(payload, { merge: true });
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            promise = db.collection('compounds').doc(payload.id).set(payload);
        }
        promise.then(function () {
            notify('تم حفظ المجمع بنجاح');
            closeCompoundModal();
        }).catch(function (error) {
            handleError('تعذر حفظ المجمع', error);
        });
    }

    function editCompound(id) {
        var item = compoundsMap[id];
        if (!item) {
            notify('المجمع غير موجود', true);
            return;
        }
        openAddCompoundModal();
        setInputValue('compoundId', item.id);
        setInputValue('compoundName', item.name || '');
        setInputValue('compoundCity', item.city || '');
        setInputValue('compoundArea', item.area || '');
        setInputValue('compoundShortDescription', item.shortDescription || '');
        setInputValue('compoundDescription', item.description || '');
        setInputValue('compoundTotalUnits', item.totalUnits || '');
        setInputValue('compoundStartingPrice', item.startingPrice || '');
        setInputValue('compoundCompletionDate', item.completionDate || '');
        setInputValue('compoundAmenities', (item.amenities || []).join(', '));
        setInputValue('compoundImageUrls', (item.images || []).join('\n'));
        setInputValue('compoundOrder', item.order || 0);
        compoundFileImages = [];
        syncCompoundImagePreview();
    }

    function deleteCompound(id) {
        if (!window.confirm('هل أنت متأكد من حذف هذا المجمع؟')) {
            return;
        }
        db.collection('compounds').doc(id).delete().then(function () {
            notify('تم حذف المجمع');
        }).catch(function (error) {
            handleError('تعذر حذف المجمع', error);
        });
    }

    function normalizeProperty(item) {
        item.images = Array.isArray(item.images) ? item.images : [];
        return item;
    }

    function renderApprovedProperties() {
        var body = el('approvedPropertiesTableBody') || el('propertiesTableBody');
        var html = '';
        var i;
        if (!body) {
            return;
        }
        if (!approvedPropertiesCache.length) {
            body.innerHTML = '<tr><td colspan="7">لا توجد عقارات معتمدة</td></tr>';
            return;
        }
        for (i = 0; i < approvedPropertiesCache.length; i++) {
            var item = approvedPropertiesCache[i];
            html += '<tr>';
            html += '<td>' + escapeHtml(item.title || '-') + '</td>';
            html += '<td>' + escapeHtml(item.type || '-') + '</td>';
            html += '<td>' + escapeHtml(item.city || '-') + '</td>';
            html += '<td>' + escapeHtml(formatPrice(item.price || 0)) + '</td>';
            html += '<td>' + escapeHtml((compoundsMap[item.compound] && compoundsMap[item.compound].name) || item.compoundName || '-') + '</td>';
            html += '<td><span class="status-badge status-approved">' + escapeHtml(propertyStatusLabel(item.status || 'approved')) + '</span></td>';
            html += '<td>';
            html += '<button type="button" class="btn-action edit" onclick="editProperty(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-pen"></i> تعديل</button> ';
            html += '<button type="button" class="btn-action complete" onclick="markPropertySold(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-handshake"></i> تم البيع</button> ';
            html += '<button type="button" class="btn-action delete" onclick="deleteProperty(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-trash"></i> حذف</button>';
            html += '</td>';
            html += '</tr>';
        }
        body.innerHTML = html;
    }

    function renderPendingProperties() {
        var container = el('pendingPropertiesList');
        var html = '';
        var i;
        if (!container) {
            return;
        }
        if (!pendingPropertiesCache.length) {
            container.innerHTML = '<div class="empty-state">لا توجد عقارات بانتظار المراجعة</div>';
            return;
        }
        for (i = 0; i < pendingPropertiesCache.length; i++) {
            var item = pendingPropertiesCache[i];
            var image = item.images.length ? item.images[0] : '';
            html += '<div class="admin-card property-card">';
            if (image) {
                html += '<div class="card-cover"><img src="' + escapeHtml(image) + '" alt="' + escapeHtml(item.title || '') + '"></div>';
            }
            html += '<div class="card-body">';
            html += '<h3>' + escapeHtml(item.title || 'بدون عنوان') + '</h3>';
            html += '<p>' + escapeHtml(item.city || '-') + ' - ' + escapeHtml(item.area || '-') + '</p>';
            html += '<p>' + escapeHtml(formatPrice(item.price || 0)) + '</p>';
            html += '<p><i class="fa-solid fa-ruler-combined"></i> ' + escapeHtml((item.size || '-') + ' م²') + ' | <i class="fa-solid fa-bed"></i> ' + escapeHtml(item.bedrooms || 0) + ' غرف | <i class="fa-solid fa-bath"></i> ' + escapeHtml(item.bathrooms || 0) + ' حمام</p>';
            html += '<p><i class="fa-solid fa-tag"></i> ' + escapeHtml(item.type || '-') + ' | ' + escapeHtml(purposeLabel(item.purpose)) + '</p>';
            html += '<p><i class="fa-solid fa-user"></i> ' + escapeHtml(getVisitSubmitterName(item)) + ' | <i class="fa-solid fa-phone"></i> ' + escapeHtml(getVisitSubmitterPhone(item)) + '</p>';
            html += '<div class="card-actions">';
            html += '<button type="button" class="btn-action approve" onclick="approveProperty(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-check"></i> اعتماد</button>';
            html += '<button type="button" class="btn-action edit" onclick="editProperty(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-pen"></i> تعديل</button>';
            html += '<button type="button" class="btn-action delete" onclick="deleteProperty(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-trash"></i> رفض</button>';
            html += '</div></div></div>';
        }
        container.innerHTML = html;
    }

    function loadApprovedProperties() {
        if (typeof approvedPropertiesUnsubscribe === 'function') {
            approvedPropertiesUnsubscribe();
        }
        approvedPropertiesUnsubscribe = db.collection('properties').where('status', '==', 'approved').onSnapshot(function (snapshot) {
            approvedPropertiesCache = [];
            snapshot.forEach(function (doc) {
                var data = normalizeProperty(doc.data() || {});
                data.id = doc.id;
                approvedPropertiesCache.push(data);
            });
            sortByUpdatedDesc(approvedPropertiesCache);
            renderApprovedProperties();
        }, function (error) {
            handleError('تعذر تحميل العقارات المعتمدة', error);
        });
    }

    function loadPendingProperties() {
        if (typeof pendingPropertiesUnsubscribe === 'function') {
            pendingPropertiesUnsubscribe();
        }
        pendingPropertiesUnsubscribe = db.collection('properties').where('status', '==', 'pending').onSnapshot(function (snapshot) {
            pendingPropertiesCache = [];
            snapshot.forEach(function (doc) {
                var data = normalizeProperty(doc.data() || {});
                data.id = doc.id;
                pendingPropertiesCache.push(data);
            });
            sortByUpdatedDesc(pendingPropertiesCache);
            renderPendingProperties();
            setBadge(['pendingPropertiesBadge'], pendingPropertiesCache.length);
        }, function (error) {
            handleError('تعذر تحميل العقارات المعلقة', error);
        });
    }

    function openAddPropertyModal() {
        resetForm(getPropertyFormId());
        setPropertyValue('propertyId', '');
        setPropertyValue('propertyStatus', 'approved');
        propertyFileImages = [];
        populateCompoundDropdown();
        syncPropertyImagePreview();
        toggleAdminRentPeriod();
        showElement(el(getPropertyModalId()), true);
    }

    function closeAddPropertyModal() {
        showElement(el(getPropertyModalId()), false);
    }

    function saveAdminProperty(event) {
        var propertyId;
        var compoundId;
        var compoundName;
        var payload;
        var promise;
        var purposeValue;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        propertyId = getPropertyValue('propertyId');
        compoundId = getPropertyValue('propertyCompound');
        compoundName = compoundsMap[compoundId] ? compoundsMap[compoundId].name : '';
        purposeValue = getPropertyValue('propertyPurpose');
        payload = {
            id: propertyId || ('property_' + Date.now()),
            title: getPropertyValue('propertyTitle'),
            type: getPropertyValue('propertyType'),
            purpose: purposeValue,
            price: toIntegerOrNull(getPropertyValue('propertyPrice')) || 0,
            rentPeriod: purposeValue === 'إيجار' ? getPropertyValue('propertyRentPeriod') : '',
            city: getPropertyValue('propertyCity'),
            area: getPropertyValue('propertyArea'),
            address: getPropertyValue('propertyAddress'),
            size: toIntegerOrNull(getPropertyValue('propertySize')) || 0,
            bedrooms: toIntegerOrNull(getPropertyValue('propertyBedrooms')) || 0,
            bathrooms: toIntegerOrNull(getPropertyValue('propertyBathrooms')) || 0,
            floor: toIntegerOrNull(getPropertyValue('propertyFloor')) || 0,
            description: getPropertyValue('propertyDescription'),
            amenities: splitCsv(getPropertyValue('propertyAmenities')),
            images: collectImages(getPropertyFieldId('propertyImageUrls'), propertyFileImages),
            compound: compoundId,
            compoundName: compoundName,
            status: getPropertyValue('propertyStatus') || 'approved',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!payload.title || !payload.type || !payload.purpose) {
            notify('يرجى تعبئة الحقول الأساسية للعقار', true);
            return;
        }
        if (propertyId) {
            promise = db.collection('properties').doc(propertyId).set(payload, { merge: true });
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            promise = db.collection('properties').doc(payload.id).set(payload);
        }
        promise.then(function () {
            notify('تم حفظ العقار بنجاح');
            closeAddPropertyModal();
        }).catch(function (error) {
            handleError('تعذر حفظ العقار', error);
        });
    }

    function approveProperty(id) {
        db.collection('properties').doc(id).set({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            reviewedBy: currentSession ? currentSession.username : '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function () {
            notify('تم اعتماد العقار');
            logActivity('property_approved', 'اعتماد عقار: ' + id);
        }).catch(function (error) {
            handleError('تعذر اعتماد العقار', error);
        });
    }

    function markPropertySold(id) {
        if (!window.confirm('هل تريد تأكيد أن هذا العقار تم بيعه؟')) {
            return;
        }
        db.collection('properties').doc(id).set({
            status: 'sold',
            soldAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function () {
            notify('تم تحديث العقار إلى مباع');
            logActivity('property_sold', 'بيع عقار: ' + id);
        }).catch(function (error) {
            handleError('تعذر تحديث حالة العقار', error);
        });
    }

    function deleteProperty(id) {
        db.collection('properties').doc(id).get().then(function (doc) {
            var data;
            if (!doc.exists) {
                notify('العقار غير موجود', true);
                return null;
            }
            data = doc.data() || {};
            if (data.status === 'pending') {
                if (!window.confirm('هل تريد رفض هذا العقار؟')) {
                    return null;
                }
                return db.collection('properties').doc(id).set({
                    status: 'rejected',
                    rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    reviewedBy: currentSession ? currentSession.username : '',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).then(function () {
                    notify('تم رفض العقار');
                    logActivity('property_rejected', 'رفض عقار: ' + (data.title || id));
                });
            }
            if (!window.confirm('هل تريد حذف هذا العقار؟')) {
                return null;
            }
            return db.collection('properties').doc(id).delete().then(function () {
                notify('تم حذف العقار');
            });
        }).catch(function (error) {
            handleError('تعذر حذف العقار', error);
        });
    }

    function editProperty(id) {
        db.collection('properties').doc(id).get().then(function (doc) {
            var item;
            if (!doc.exists) {
                notify('العقار غير موجود', true);
                return;
            }
            item = normalizeProperty(doc.data() || {});
            item.id = doc.id;
            openAddPropertyModal();
            setPropertyValue('propertyId', item.id);
            setPropertyValue('propertyStatus', item.status || 'approved');
            setPropertyValue('propertyTitle', item.title || '');
            setPropertyValue('propertyType', item.type || '');
            setPropertyValue('propertyPurpose', item.purpose || '');
            setPropertyValue('propertyPrice', item.price || '');
            setPropertyValue('propertyRentPeriod', item.rentPeriod || '');
            setPropertyValue('propertyCity', item.city || '');
            setPropertyValue('propertyArea', item.area || '');
            setPropertyValue('propertyAddress', item.address || '');
            setPropertyValue('propertySize', item.size || '');
            setPropertyValue('propertyBedrooms', item.bedrooms || '');
            setPropertyValue('propertyBathrooms', item.bathrooms || '');
            setPropertyValue('propertyFloor', item.floor || '');
            setPropertyValue('propertyDescription', item.description || '');
            setPropertyValue('propertyAmenities', (item.amenities || item.features || []).join(', '));
            setPropertyValue('propertyImageUrls', (item.images || []).join('\n'));
            setPropertyValue('propertyCompound', item.compound || '');
            propertyFileImages = [];
            toggleAdminRentPeriod();
            syncPropertyImagePreview();
        }).catch(function (error) {
            handleError('تعذر تحميل العقار', error);
        });
    }

    function toggleAdminRentPeriod() {
        var purpose = getPropertyValue('propertyPurpose');
        toggleFormRow(getPropertyFieldId('propertyRentPeriodRow'), purpose === 'إيجار');
    }

    function statusBadge(status) {
        var label = status;
        if (status === 'pending') {
            label = 'قيد الانتظار';
        } else if (status === 'accepted') {
            label = 'تمت الجدولة';
        } else if (status === 'completed') {
            label = 'مكتملة';
        } else if (status === 'cancelled') {
            label = 'ملغاة';
        }
        return '<span class="status-badge status-' + escapeHtml(status || 'pending') + '">' + escapeHtml(label || '-') + '</span>';
    }

    function loadVisitRequests() {
        if (typeof visitsUnsubscribe === 'function') {
            visitsUnsubscribe();
        }
        visitsUnsubscribe = db.collection('visit_requests').onSnapshot(function (snapshot) {
            var pendingCount = 0;
            var j;
            allVisits = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                allVisits.push(data);
            });
            sortByUpdatedDesc(allVisits);
            renderVisits();
            for (j = 0; j < allVisits.length; j++) {
                if (allVisits[j].status === 'pending') {
                    pendingCount += 1;
                }
            }
            setBadge(['pendingVisitsBadge'], pendingCount);
        }, function (error) {
            handleError('تعذر تحميل طلبات الزيارة', error);
        });
    }

    function filterVisits(status) {
        currentVisitsFilter = status || 'all';
        renderVisits();
    }

    function renderVisits() {
        var container = el('visitRequestsList');
        var html = '';
        var filtered = [];
        var i;
        if (!container) {
            return;
        }
        for (i = 0; i < allVisits.length; i++) {
            if (currentVisitsFilter === 'all' || allVisits[i].status === currentVisitsFilter) {
                filtered.push(allVisits[i]);
            }
        }
        if (!filtered.length) {
            container.innerHTML = '<div class="empty-state">لا توجد طلبات زيارة</div>';
            return;
        }
        for (i = 0; i < filtered.length; i++) {
            var visit = filtered[i];
            html += '<div class="admin-card visit-card">';
            html += '<div class="card-body">';
            html += '<div class="card-head"><h3>' + escapeHtml(visit.propertyTitle || 'عقار') + '</h3>' + statusBadge(visit.status) + '</div>';
            html += '<p><i class="fa-solid fa-user"></i> <strong>العميل:</strong> ' + escapeHtml(visit.userName || '-') + '</p>';
            html += '<p><i class="fa-solid fa-phone"></i> <strong>الهاتف:</strong> ' + escapeHtml(visit.userPhone || '-') + '</p>';
            html += '<p><i class="fa-solid fa-clock"></i> <strong>تم الطلب:</strong> ' + escapeHtml(formatDateTime(visit.createdAt)) + '</p>';
            if (visit.scheduledDate || visit.scheduledTime) {
                html += '<p><i class="fa-solid fa-calendar"></i> <strong>الموعد:</strong> ' + escapeHtml((visit.scheduledDate || '-') + ' ' + (visit.scheduledTime || '')) + '</p>';
            }
            if (visit.employeeNotes) {
                html += '<p><i class="fa-solid fa-note-sticky"></i> <strong>ملاحظات:</strong> ' + escapeHtml(visit.employeeNotes) + '</p>';
            }
            html += '<div class="card-actions">';
            if (visit.status === 'pending') {
                html += '<button type="button" class="btn-action schedule" onclick="openScheduleModal(\'' + escapeJsString(visit.id) + '\')"><i class="fa-solid fa-calendar-plus"></i> جدولة</button> ';
                html += '<button type="button" class="btn-action delete" onclick="cancelVisit(\'' + escapeJsString(visit.id) + '\')"><i class="fa-solid fa-ban"></i> إلغاء</button>';
            } else if (visit.status === 'accepted') {
                html += '<button type="button" class="btn-action complete" onclick="completeVisit(\'' + escapeJsString(visit.id) + '\')"><i class="fa-solid fa-circle-check"></i> إتمام</button> ';
                html += '<button type="button" class="btn-action delete" onclick="cancelVisit(\'' + escapeJsString(visit.id) + '\')"><i class="fa-solid fa-ban"></i> إلغاء</button>';
            }
            html += '</div></div></div>';
        }
        container.innerHTML = html;
    }

    function openScheduleModal(id) {
        setInputValue('scheduleVisitId', id);
        setInputValue('scheduleDate', '');
        setInputValue('scheduleTime', '');
        setInputValue('scheduleNotes', '');
        showElement(el('scheduleModal'), true);
    }

    function closeScheduleModal() {
        showElement(el('scheduleModal'), false);
    }

    function confirmSchedule(event) {
        var visitId;
        var date;
        var time;
        var notes;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        visitId = getTrimmedValue('scheduleVisitId');
        date = getTrimmedValue('scheduleDate');
        time = getTrimmedValue('scheduleTime');
        notes = getTrimmedValue('scheduleNotes');
        if (!visitId || !date || !time) {
            notify('يرجى تحديد التاريخ والوقت', true);
            return;
        }
        db.collection('visit_requests').doc(visitId).set({
            scheduledDate: date,
            scheduledTime: time,
            employeeNotes: notes,
            status: 'accepted',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function () {
            notify('تمت جدولة الزيارة');
            logActivity('visit_scheduled', 'جدولة زيارة بتاريخ ' + date + ' ' + time);
            closeScheduleModal();
        }).catch(function (error) {
            handleError('تعذر جدولة الزيارة', error);
        });
    }

    function completeVisit(id) {
        resetForm('completeVisitForm');
        setInputValue('completeVisitId', id);
        showElement(el('completeVisitModal'), true);
    }

    function closeCompleteVisitModal() {
        resetForm('completeVisitForm');
        setInputValue('completeVisitId', '');
        showElement(el('completeVisitModal'), false);
    }

    function submitCompleteVisit(event) {
        var visitId;
        var notes;
        var interestedInput;
        var payload;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        visitId = getTrimmedValue('completeVisitId');
        notes = getTrimmedValue('postVisitNotes');
        interestedInput = document.querySelector('input[name="clientInterested"]:checked');
        if (!visitId || !notes || !interestedInput) {
            notify('يرجى تعبئة جميع حقول إتمام الزيارة', true);
            return;
        }
        payload = {
            status: 'completed',
            postVisitNotes: notes,
            clientInterested: interestedInput.value === 'yes',
            interested: interestedInput.value === 'yes',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('visit_requests').doc(visitId).set(payload, { merge: true }).then(function () {
            notify('تم إتمام الزيارة بنجاح');
            logActivity('visit_completed', 'إتمام زيارة - العميل ' + (interestedInput.value === 'yes' ? 'مهتم' : 'غير مهتم'));
            closeCompleteVisitModal();
        }).catch(function (error) {
            handleError('تعذر إتمام الزيارة', error);
        });
    }

    function cancelVisit(id) {
        db.collection('visit_requests').doc(id).set({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function () {
            notify('تم إلغاء الزيارة');
            logActivity('visit_cancelled', 'إلغاء زيارة: ' + id);
        }).catch(function (error) {
            handleError('تعذر إلغاء الزيارة', error);
        });
    }

    function populateAnalyticsAreaFilter() {
        var select = el('analyticsAreaFilter');
        var areas = {};
        var selected;
        var keys;
        var i;
        var area;
        var options = '<option value="">كل المناطق</option>';
        if (!select) {
            return;
        }
        selected = select.value || '';
        for (i = 0; i < analyticsVisitsCache.length; i++) {
            area = getVisitArea(analyticsVisitsCache[i]);
            if (area) {
                areas[area] = true;
            }
        }
        for (i = 0; i < analyticsPropertiesCache.length; i++) {
            area = analyticsPropertiesCache[i].area || analyticsPropertiesCache[i].city || '';
            if (area) {
                areas[area] = true;
            }
        }
        keys = Object.keys(areas).sort(function (a, b) {
            return a.localeCompare(b, 'ar');
        });
        for (i = 0; i < keys.length; i++) {
            options += '<option value="' + escapeHtml(keys[i]) + '">' + escapeHtml(keys[i]) + '</option>';
        }
        select.innerHTML = options;
        select.value = selected;
    }

    function renderAnalytics() {
        var statsNode = el('analyticsStats');
        var tableBody = el('analyticsTableBody');
        var areaFilter = getTrimmedValue('analyticsAreaFilter');
        var statusFilter = getTrimmedValue('analyticsStatusFilter');
        var periodFilter = getTrimmedValue('analyticsPeriodFilter') || '30';
        var visitCounts = { pending: 0, accepted: 0, completed: 0, cancelled: 0 };
        var totalVisits = 0;
        var filteredVisits = 0;
        var interestedCount = 0;
        var soldCount = 0;
        var totalSalesValue = 0;
        var i;
        var visit;
        var property;
        var matchesArea;
        if (!statsNode || !tableBody) {
            return;
        }
        for (i = 0; i < analyticsVisitsCache.length; i++) {
            visit = analyticsVisitsCache[i];
            matchesArea = !areaFilter || getVisitArea(visit) === areaFilter;
            if (matchesArea && isWithinPeriod(visit.createdAt || visit.updatedAt, periodFilter)) {
                totalVisits += 1;
                if (visitCounts[visit.status] != null) {
                    visitCounts[visit.status] += 1;
                }
                if (!statusFilter || visit.status === statusFilter) {
                    filteredVisits += 1;
                }
                if (visit.interested === true || visit.clientInterested === true) {
                    interestedCount += 1;
                }
            }
        }
        for (i = 0; i < analyticsPropertiesCache.length; i++) {
            property = analyticsPropertiesCache[i];
            matchesArea = !areaFilter || property.area === areaFilter || property.city === areaFilter;
            if (property.status === 'sold' && matchesArea && isWithinPeriod(property.soldAt || property.updatedAt, periodFilter)) {
                soldCount += 1;
                totalSalesValue += parseInt(property.price, 10) || 0;
            }
        }
        statsNode.innerHTML = ''
            + '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-calendar-days"></i></div><div class="stat-info"><span class="stat-number">' + escapeHtml(totalVisits) + '</span><span class="stat-label">إجمالي الزيارات</span></div></div>'
            + '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-filter"></i></div><div class="stat-info"><span class="stat-number">' + escapeHtml(filteredVisits) + '</span><span class="stat-label">الزيارات حسب الفلتر</span></div></div>'
            + '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-house-circle-check"></i></div><div class="stat-info"><span class="stat-number">' + escapeHtml(soldCount) + '</span><span class="stat-label">العقارات المباعة</span></div></div>'
            + '<div class="stat-card"><div class="stat-icon"><i class="fa-solid fa-sack-dollar"></i></div><div class="stat-info"><span class="stat-number">' + escapeHtml(formatPrice(totalSalesValue)) + '</span><span class="stat-label">إجمالي قيمة المبيعات</span></div></div>';
        tableBody.innerHTML = ''
            + '<tr><td>قيد الانتظار</td><td>' + escapeHtml(visitCounts.pending) + '</td></tr>'
            + '<tr><td>مجدولة</td><td>' + escapeHtml(visitCounts.accepted) + '</td></tr>'
            + '<tr><td>مكتملة</td><td>' + escapeHtml(visitCounts.completed) + '</td></tr>'
            + '<tr><td>ملغاة</td><td>' + escapeHtml(visitCounts.cancelled) + '</td></tr>'
            + '<tr><td>العملاء المهتمون</td><td>' + escapeHtml(interestedCount) + '</td></tr>'
            + '<tr><td>العقارات المباعة</td><td>' + escapeHtml(soldCount) + '</td></tr>'
            + '<tr><td>إجمالي قيمة المبيعات</td><td>' + escapeHtml(formatPrice(totalSalesValue)) + '</td></tr>';
    }

    function bindAnalyticsFilters() {
        var ids = ['analyticsAreaFilter', 'analyticsStatusFilter', 'analyticsPeriodFilter'];
        var i;
        var node;
        if (analyticsFiltersBound) {
            return;
        }
        analyticsFiltersBound = true;
        for (i = 0; i < ids.length; i++) {
            node = el(ids[i]);
            if (node) {
                node.addEventListener('change', renderAnalytics);
            }
        }
    }

    function loadAnalytics() {
        if (typeof analyticsVisitsUnsubscribe === 'function') {
            analyticsVisitsUnsubscribe();
        }
        if (typeof analyticsPropertiesUnsubscribe === 'function') {
            analyticsPropertiesUnsubscribe();
        }
        bindAnalyticsFilters();
        analyticsVisitsUnsubscribe = db.collection('visit_requests').onSnapshot(function (snapshot) {
            analyticsVisitsCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                analyticsVisitsCache.push(data);
            });
            sortByUpdatedDesc(analyticsVisitsCache);
            populateAnalyticsAreaFilter();
            renderAnalytics();
        }, function (error) {
            handleError('تعذر تحميل تحليلات الزيارات', error);
        });
        analyticsPropertiesUnsubscribe = db.collection('properties').onSnapshot(function (snapshot) {
            analyticsPropertiesCache = [];
            soldPropertiesCache = [];
            snapshot.forEach(function (doc) {
                var data = normalizeProperty(doc.data() || {});
                data.id = doc.id;
                analyticsPropertiesCache.push(data);
                if (data.status === 'sold') {
                    soldPropertiesCache.push(data);
                }
            });
            sortByUpdatedDesc(analyticsPropertiesCache);
            sortByUpdatedDesc(soldPropertiesCache);
            populateAnalyticsAreaFilter();
            renderAnalytics();
            renderInterestedCustomers();
        }, function (error) {
            handleError('تعذر تحميل تحليلات العقارات', error);
        });
    }

    function renderInterestedCustomers() {
        var container = el('interestedCustomersList');
        var html = '';
        var i;
        var visit;
        var property;
        var phone;
        var priceValue;
        if (!container) {
            return;
        }
        if (!interestedCustomersCache.length) {
            container.innerHTML = '<div class="empty-state">لا يوجد عملاء مهتمون حالياً.</div>';
            return;
        }
        for (i = 0; i < interestedCustomersCache.length; i++) {
            visit = interestedCustomersCache[i];
            property = findPropertyById(getVisitPropertyId(visit));
            phone = normalizePhoneNumber(visit.userPhone || visit.phone || '');
            priceValue = visit.finalPrice || (property ? property.price : '');
            html += '<div class="admin-card interested-card">';
            html += '<div class="card-body">';
            html += '<div class="card-head"><h3>' + escapeHtml(visit.userName || 'عميل مهتم') + '</h3>' + (visit.dealClosed ? '<span class="status-badge status-completed">مغلق</span>' : '<span class="status-badge status-accepted">مهتم</span>') + '</div>';
            html += '<p><i class="fa-solid fa-phone"></i> ' + escapeHtml(visit.userPhone || '-') + '</p>';
            html += '<p><i class="fa-solid fa-house"></i> ' + escapeHtml(visit.propertyTitle || 'عقار') + '</p>';
            html += '<p><i class="fa-solid fa-note-sticky"></i> ' + escapeHtml(visit.postVisitNotes || '-') + '</p>';
            html += '<div class="price-edit"><label for="dealPrice_' + escapeJsString(visit.id) + '">السعر النهائي</label><input type="number" id="dealPrice_' + escapeJsString(visit.id) + '" value="' + escapeHtml(priceValue || '') + '" min="0"></div>';
            html += '<div class="card-actions">';
            if (phone) {
                html += '<a class="btn-action whatsapp" target="_blank" rel="noopener" href="https://wa.me/' + escapeHtml(phone) + '"><i class="fa-brands fa-whatsapp"></i> تواصل عبر واتساب</a> ';
            }
            html += '<button type="button" class="btn-action complete" onclick="completeInterestedSale(\'' + escapeJsString(visit.id) + '\')"' + (visit.dealClosed ? ' disabled' : '') + '><i class="fa-solid fa-handshake"></i> ' + (visit.dealClosed ? 'تم إغلاق البيع' : 'تم البيع') + '</button>';
            html += '</div></div></div>';
        }
        container.innerHTML = html;
    }

    function loadInterestedCustomers() {
        if (typeof interestedCustomersUnsubscribe === 'function') {
            interestedCustomersUnsubscribe();
        }
        interestedCustomersUnsubscribe = db.collection('visit_requests').where('interested', '==', true).where('status', '==', 'completed').onSnapshot(function (snapshot) {
            interestedCustomersCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                interestedCustomersCache.push(data);
            });
            sortByUpdatedDesc(interestedCustomersCache);
            renderInterestedCustomers();
        }, function (error) {
            handleError('تعذر تحميل العملاء المهتمين', error);
        });
    }

    function completeInterestedSale(visitId) {
        var i;
        var visit = null;
        var propertyId;
        var price;
        var propertyPayload = {
            status: 'sold',
            soldAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        for (i = 0; i < interestedCustomersCache.length; i++) {
            if (interestedCustomersCache[i].id === visitId) {
                visit = interestedCustomersCache[i];
                break;
            }
        }
        if (!visit) {
            notify('طلب الزيارة غير موجود', true);
            return;
        }
        propertyId = getVisitPropertyId(visit);
        if (!propertyId) {
            notify('لا يوجد عقار مرتبط بهذا الطلب', true);
            return;
        }
        price = toIntegerOrNull(getTrimmedValue('dealPrice_' + visitId));
        if (price != null) {
            propertyPayload.price = price;
        }
        db.collection('properties').doc(propertyId).set(propertyPayload, { merge: true }).then(function () {
            var visitPayload = {
                dealClosed: true,
                dealClosedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (price != null) {
                visitPayload.finalPrice = price;
            }
            return db.collection('visit_requests').doc(visitId).set(visitPayload, { merge: true });
        }).then(function () {
            notify('تم إغلاق الصفقة وتحديث حالة العقار');
        }).catch(function (error) {
            handleError('تعذر إغلاق الصفقة', error);
        });
    }

    function renderChats() {
        var container = el('chatList') || el('chatsList');
        var html = '';
        var i;
        if (!container) {
            return;
        }
        setText(['chatListCount'], chatsCache.length);
        if (!chatsCache.length) {
            container.innerHTML = '<div class="empty-state">لا توجد محادثات</div>';
            return;
        }
        for (i = 0; i < chatsCache.length; i++) {
            var chat = chatsCache[i];
            var unread = parseInt(chat.unreadAdminCount || chat.unreadCount || 0, 10) || 0;
            html += '<button type="button" class="chat-list-item' + (currentChatId === chat.id ? ' active' : '') + '" onclick="openChatConversation(\'' + escapeJsString(chat.id) + '\')">';
            html += '<div class="chat-list-main"><strong>' + escapeHtml(chat.userName || chat.customerName || 'عميل') + '</strong>';
            html += '<p>' + escapeHtml(chat.lastMessage || 'بدون رسائل') + '</p></div>';
            html += '<div class="chat-list-meta">';
            html += '<span>' + escapeHtml(formatTime(chat.updatedAt || chat.createdAt)) + '</span>';
            if (unread > 0) {
                html += '<span class="badge">' + unread + '</span>';
            }
            html += '</div></button>';
        }
        container.innerHTML = html;
    }

    function loadChats() {
        if (typeof chatsUnsubscribe === 'function') {
            chatsUnsubscribe();
        }
        chatsUnsubscribe = db.collection('chats').onSnapshot(function (snapshot) {
            chatsCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                chatsCache.push(data);
            });
            sortByUpdatedDesc(chatsCache);
            renderChats();
        }, function (error) {
            handleError('تعذر تحميل المحادثات', error);
        });
    }

    function renderConversationMessages(messages) {
        var container = el('chatMessages') || el('activeChatMessages');
        var html = '';
        var i;
        if (!container) {
            return;
        }
        showElement(el('noActiveChatState'), false);
        showElement(el('activeChatMessages'), true);
        showElement(el('chatReplyForm'), true);
        if (!messages.length) {
            container.innerHTML = '<div class="empty-state">ابدأ الرد على هذه المحادثة</div>';
            return;
        }
        for (i = 0; i < messages.length; i++) {
            var message = messages[i];
            var mine = message.sender === 'employee';
            html += '<div class="chat-message ' + (mine ? 'sent' : 'received') + '">';
            html += '<div class="chat-bubble">' + escapeHtml(message.text || message.message || '') + '</div>';
            html += '<div class="chat-time">' + escapeHtml(formatDateTime(message.createdAt)) + '</div>';
            html += '</div>';
        }
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    function openChatConversation(chatId) {
        var title = 'المحادثة';
        var i;
        currentChatId = chatId;
        closeActiveChatListener();
        renderChats();
        for (i = 0; i < chatsCache.length; i++) {
            if (chatsCache[i].id === chatId) {
                title = chatsCache[i].userName || chatsCache[i].customerName || 'المحادثة';
                break;
            }
        }
        setText(['chatWindowTitle', 'activeChatTitle', 'activeChatName'], title);
        setInputValue('activeChatId', chatId);
        currentChatUnsubscribe = db.collection('chats').doc(chatId).collection('messages').onSnapshot(function (snapshot) {
            var messages = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                messages.push(data);
            });
            messages.sort(function (a, b) {
                var aDate = toDateObject(a.createdAt);
                var bDate = toDateObject(b.createdAt);
                var aTime = aDate ? aDate.getTime() : 0;
                var bTime = bDate ? bDate.getTime() : 0;
                return aTime - bTime;
            });
            renderConversationMessages(messages);
            db.collection('chats').doc(chatId).set({
                unreadAdminCount: 0,
                unreadCount: 0,
                lastReadByAdminAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(function () {
            });
        }, function (error) {
            handleError('تعذر فتح المحادثة', error);
        });
    }

    function sendEmployeeMessage() {
        var input = el('chatReplyInput');
        var text;
        if (!currentChatId) {
            notify('اختر محادثة أولاً', true);
            return;
        }
        text = input && typeof input.value === 'string' ? input.value.trim() : '';
        if (!text) {
            return;
        }
        db.collection('chats').doc(currentChatId).collection('messages').add({
            text: text,
            message: text,
            sender: 'employee',
            senderName: currentSession ? (currentSession.name || currentSession.username) : 'Employee',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            return db.collection('chats').doc(currentChatId).set({
                lastMessage: text,
                lastSender: 'employee',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                unreadUserCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        }).then(function () {
            if (input) {
                input.value = '';
            }
        }).catch(function (error) {
            handleError('تعذر إرسال الرسالة', error);
        });
    }

    function renderContacts() {
        var body = el('contactsTableBody');
        var html = '';
        var i;
        if (!body) {
            return;
        }
        if (!contactMessagesCache.length) {
            body.innerHTML = '<tr><td colspan="5">لا توجد رسائل تواصل</td></tr>';
            return;
        }
        for (i = 0; i < contactMessagesCache.length; i++) {
            var item = contactMessagesCache[i];
            html += '<tr>';
            html += '<td>' + escapeHtml(item.name || '-') + '</td>';
            html += '<td>' + escapeHtml(item.phone || '-') + '</td>';
            html += '<td>' + escapeHtml(item.email || '-') + '</td>';
            html += '<td>' + escapeHtml(item.message || '-') + '</td>';
            html += '<td>' + escapeHtml(formatDateTime(item.createdAt)) + '</td>';
            html += '</tr>';
        }
        body.innerHTML = html;
    }

    function loadContacts() {
        if (typeof contactsUnsubscribe === 'function') {
            contactsUnsubscribe();
        }
        contactsUnsubscribe = db.collection('contact_messages').onSnapshot(function (snapshot) {
            contactMessagesCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                contactMessagesCache.push(data);
            });
            sortByUpdatedDesc(contactMessagesCache);
            renderContacts();
        }, function (error) {
            handleError('تعذر تحميل رسائل التواصل', error);
        });
    }

    function renderEmployees() {
        var body = el('employeesTableBody');
        var html = '';
        var i;
        if (!body) {
            return;
        }
        if (!currentSession || !isAdminRole(currentSession.role)) {
            body.innerHTML = '<tr><td colspan="5">ليس لديك صلاحية لعرض هذا القسم</td></tr>';
            return;
        }
        if (!employeesCache.length) {
            body.innerHTML = '<tr><td colspan="5">لا يوجد موظفون</td></tr>';
            return;
        }
        for (i = 0; i < employeesCache.length; i++) {
            var item = employeesCache[i];
            html += '<tr>';
            html += '<td>' + escapeHtml(item.name || '-') + '</td>';
            html += '<td>' + escapeHtml(item.username || '-') + '</td>';
            html += '<td>' + escapeHtml(roleLabel(item.role)) + '</td>';
            html += '<td><span class="status-badge ' + escapeHtml(item.status || 'active') + '">' + escapeHtml(item.status || 'active') + '</span></td>';
            html += '<td>';
            html += '<button type="button" class="btn-action edit" onclick="editEmployee(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-pen"></i> تعديل</button> ';
            html += '<button type="button" class="btn-action reset" onclick="resetEmployeePassword(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-key"></i> OTP</button> ';
            html += '<button type="button" class="btn-action delete" onclick="removeEmployee(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-trash"></i> حذف</button>';
            html += '</td>';
            html += '</tr>';
        }
        body.innerHTML = html;
    }

    function loadEmployees() {
        if (typeof employeesUnsubscribe === 'function') {
            employeesUnsubscribe();
        }
        employeesUnsubscribe = db.collection('employees').onSnapshot(function (snapshot) {
            employeesCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                employeesCache.push(data);
            });
            sortByUpdatedDesc(employeesCache);
            renderEmployees();
        }, function (error) {
            handleError('تعذر تحميل الموظفين', error);
        });
    }

    function openAddEmployeeModal() {
        resetForm('employeeForm');
        setInputValue('employeeId', '');
        showElement(el('employeeModal'), true);
    }

    function closeEmployeeModal() {
        showElement(el('employeeModal'), false);
    }

    function saveEmployee(event) {
        var employeeId;
        var name;
        var username;
        var password;
        var role;
        var basePayload;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        employeeId = getTrimmedValue('employeeId');
        name = getTrimmedValue('employeeName');
        username = getTrimmedValue('employeeUsername');
        password = getTrimmedValue('employeePassword');
        role = getTrimmedValue('employeeRole') || 'sales';
        if (!name || !username || (!employeeId && !password)) {
            notify('يرجى تعبئة الحقول المطلوبة', true);
            return;
        }
        basePayload = {
            id: employeeId || ('employee_' + Date.now()),
            name: name,
            username: username,
            role: role,
            status: 'active',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('employees').where('username', '==', username).get().then(function (snapshot) {
            var duplicate = false;
            snapshot.forEach(function (doc) {
                if (doc.id !== employeeId) {
                    duplicate = true;
                }
            });
            if (duplicate) {
                notify('اسم المستخدم مستخدم بالفعل', true);
                return null;
            }
            if (password) {
                basePayload.passwordHash = simpleHash(password);
            }
            if (employeeId) {
                return db.collection('employees').doc(employeeId).set(basePayload, { merge: true });
            }
            basePayload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('employees').doc(basePayload.id).set(basePayload);
        }).then(function (result) {
            if (result === null) {
                return;
            }
            notify('تم حفظ الموظف بنجاح');
            closeEmployeeModal();
        }).catch(function (error) {
            handleError('تعذر حفظ الموظف', error);
        });
    }

    function editEmployee(id) {
        var i;
        for (i = 0; i < employeesCache.length; i++) {
            if (employeesCache[i].id === id) {
                openAddEmployeeModal();
                setInputValue('employeeId', employeesCache[i].id || '');
                setInputValue('employeeName', employeesCache[i].name || '');
                setInputValue('employeeUsername', employeesCache[i].username || '');
                setInputValue('employeeRole', employeesCache[i].role || 'sales');
                setInputValue('employeePassword', '');
                return;
            }
        }
        notify('الموظف غير موجود', true);
    }

    function resetEmployeePassword(id) {
        var otp = generateOtp();
        db.collection('employees').doc(id).set({
            status: 'otp_reset',
            otp: otp,
            otpUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function () {
            window.alert('رمز OTP للموظف: ' + otp);
        }).catch(function (error) {
            handleError('تعذر إعادة تعيين كلمة مرور الموظف', error);
        });
    }

    function removeEmployee(id) {
        if (!window.confirm('هل تريد حذف هذا الموظف؟')) {
            return;
        }
        db.collection('employees').doc(id).delete().then(function () {
            notify('تم حذف الموظف');
        }).catch(function (error) {
            handleError('تعذر حذف الموظف', error);
        });
    }

    function renderUsers() {
        var body = el('usersTableBody');
        var html = '';
        var i;
        if (!body) {
            return;
        }
        if (!currentSession || !isAdminRole(currentSession.role)) {
            body.innerHTML = '<tr><td colspan="5">ليس لديك صلاحية لعرض هذا القسم</td></tr>';
            return;
        }
        if (!usersCache.length) {
            body.innerHTML = '<tr><td colspan="5">لا يوجد مستخدمون</td></tr>';
            return;
        }
        for (i = 0; i < usersCache.length; i++) {
            var item = usersCache[i];
            html += '<tr>';
            html += '<td>' + escapeHtml(item.name || '-') + '</td>';
            html += '<td>' + escapeHtml(item.phone || '-') + '</td>';
            html += '<td>' + escapeHtml(item.email || '-') + '</td>';
            html += '<td>' + escapeHtml(formatDateTime(item.createdAt)) + '</td>';
            html += '<td>';
            html += '<button type="button" class="btn-action reset" onclick="resetUserPassword(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-key"></i> OTP</button> ';
            html += '<button type="button" class="btn-action delete" onclick="removeUser(\'' + escapeJsString(item.id) + '\')"><i class="fa-solid fa-trash"></i> حذف</button>';
            html += '</td>';
            html += '</tr>';
        }
        body.innerHTML = html;
    }

    function loadUsers() {
        if (typeof usersUnsubscribe === 'function') {
            usersUnsubscribe();
        }
        usersUnsubscribe = db.collection('users').onSnapshot(function (snapshot) {
            usersCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                usersCache.push(data);
            });
            sortByUpdatedDesc(usersCache);
            renderUsers();
        }, function (error) {
            handleError('تعذر تحميل المستخدمين', error);
        });
    }

    function resetUserPassword(id) {
        var otp = generateOtp();
        db.collection('users').doc(id).set({
            status: 'otp_reset',
            otp: otp,
            otpUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function () {
            window.alert('رمز OTP للمستخدم: ' + otp);
        }).catch(function (error) {
            handleError('تعذر إعادة تعيين كلمة مرور المستخدم', error);
        });
    }

    function removeUser(id) {
        if (!window.confirm('هل تريد حذف هذا المستخدم؟')) {
            return;
        }
        db.collection('users').doc(id).delete().then(function () {
            notify('تم حذف المستخدم');
        }).catch(function (error) {
            handleError('تعذر حذف المستخدم', error);
        });
    }

    // ===== ACTIVITY LOGS =====
    var logsCache = [];
    var logsUnsubscribe = null;

    function logActivity(type, details, userName) {
        db.collection('activity_logs').add({
            type: type,
            details: details,
            userName: userName || (currentSession ? currentSession.name || currentSession.username : 'نظام'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    function loadLogs() {
        if (typeof logsUnsubscribe === 'function') {
            logsUnsubscribe();
        }
        logsUnsubscribe = db.collection('activity_logs').orderBy('createdAt', 'desc').limit(200).onSnapshot(function (snapshot) {
            logsCache = [];
            snapshot.forEach(function (doc) {
                var data = doc.data() || {};
                data.id = doc.id;
                logsCache.push(data);
            });
            renderLogs();
        }, function (error) {
            handleError('تعذر تحميل السجلات', error);
        });
    }

    function logTypeLabel(type) {
        var labels = {
            'property_submitted': 'عقار مقدم',
            'property_approved': 'عقار معتمد',
            'property_rejected': 'عقار مرفوض',
            'property_sold': 'عقار مباع',
            'visit_requested': 'طلب زيارة',
            'visit_scheduled': 'زيارة مجدولة',
            'visit_completed': 'زيارة مكتملة',
            'visit_cancelled': 'زيارة ملغاة',
            'user_registered': 'تسجيل مستخدم',
            'employee_added': 'إضافة موظف',
            'chat_message': 'رسالة محادثة',
            'contact_form': 'رسالة تواصل',
            'deal_closed': 'صفقة مغلقة'
        };
        return labels[type] || type || '-';
    }

    function renderLogs() {
        var body = el('logsTableBody');
        var typeFilter = getTrimmedValue('logsTypeFilter');
        var periodFilter = getTrimmedValue('logsPeriodFilter');
        var searchFilter = getTrimmedValue('logsSearchFilter').toLowerCase();
        var filtered = [];
        var now = new Date();
        var cutoff = null;
        var i;
        var html = '';

        if (!body) return;

        if (periodFilter && periodFilter !== 'all') {
            cutoff = new Date(now.getTime() - (parseInt(periodFilter) * 86400000));
        }

        for (i = 0; i < logsCache.length; i++) {
            var log = logsCache[i];
            if (typeFilter && log.type !== typeFilter) continue;
            if (cutoff) {
                var logDate = toDateObject(log.createdAt);
                if (logDate && logDate < cutoff) continue;
            }
            if (searchFilter && (log.details || '').toLowerCase().indexOf(searchFilter) === -1 && (log.userName || '').toLowerCase().indexOf(searchFilter) === -1) continue;
            filtered.push(log);
        }

        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="4" class="empty-row">لا توجد سجلات مطابقة.</td></tr>';
            return;
        }

        for (i = 0; i < filtered.length; i++) {
            var item = filtered[i];
            html += '<tr>';
            html += '<td>' + escapeHtml(formatDateTime(item.createdAt)) + '</td>';
            html += '<td><span class="status-badge status-' + escapeHtml(item.type || '') + '">' + escapeHtml(logTypeLabel(item.type)) + '</span></td>';
            html += '<td>' + escapeHtml(item.details || '-') + '</td>';
            html += '<td>' + escapeHtml(item.userName || '-') + '</td>';
            html += '</tr>';
        }
        body.innerHTML = html;
    }

    function filterLogs() {
        renderLogs();
    }

    function bindForms() {
        var loginForm = el('adminLoginForm') || el('employeeLoginForm');
        var passwordResetForm = el('passwordResetForm') || el('employeePasswordResetForm');
        var compoundForm = el('compoundForm');
        var propertyForm = el(getPropertyFormId());
        var scheduleForm = el('scheduleForm') || el('scheduleVisitForm');
        var employeeForm = el('employeeForm');
        var chatReplyForm = el('chatReplyForm');
        var chatSendButton = el('chatSendButton');
        var chatInput = el('chatReplyInput');
        var purposeSelect = el(getPropertyFieldId('propertyPurpose'));

        if (loginForm) {
            loginForm.addEventListener('submit', loginAdmin);
        }
        if (passwordResetForm) {
            passwordResetForm.addEventListener('submit', submitNewPassword);
        }
        if (compoundForm) {
            compoundForm.addEventListener('submit', saveCompound);
        }
        if (propertyForm) {
            propertyForm.addEventListener('submit', saveAdminProperty);
        }
        if (scheduleForm) {
            scheduleForm.addEventListener('submit', confirmSchedule);
        }
        if (employeeForm) {
            employeeForm.addEventListener('submit', saveEmployee);
        }
        if (chatReplyForm) {
            chatReplyForm.addEventListener('submit', function (event) {
                event.preventDefault();
                sendEmployeeMessage();
            });
        }
        if (chatSendButton) {
            chatSendButton.addEventListener('click', sendEmployeeMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    sendEmployeeMessage();
                }
            });
        }
        if (purposeSelect) {
            purposeSelect.addEventListener('change', toggleAdminRentPeriod);
        }
    }

    function init() {
        bindForms();
        bindImageInputs();
        toggleAdminRentPeriod();
        if (restoreSession()) {
            initAdminApp();
        } else {
            showScreen('login');
        }
    }

    window.simpleHash = simpleHash;
    window.formatPrice = formatPrice;
    window.formatTime = formatTime;
    window.escapeHtml = escapeHtml;
    window.switchTab = switchTab;
    window.loginAdmin = loginAdmin;
    window.submitNewPassword = submitNewPassword;
    window.logoutAdmin = logoutAdmin;
    window.loadDashboardData = loadDashboardData;
    window.loadCompounds = loadCompounds;
    window.openAddCompoundModal = openAddCompoundModal;
    window.closeCompoundModal = closeCompoundModal;
    window.saveCompound = saveCompound;
    window.editCompound = editCompound;
    window.deleteCompound = deleteCompound;
    window.loadApprovedProperties = loadApprovedProperties;
    window.loadPendingProperties = loadPendingProperties;
    window.openAddPropertyModal = openAddPropertyModal;
    window.closeAddPropertyModal = closeAddPropertyModal;
    window.saveAdminProperty = saveAdminProperty;
    window.approveProperty = approveProperty;
    window.deleteProperty = deleteProperty;
    window.editProperty = editProperty;
    window.toggleAdminRentPeriod = toggleAdminRentPeriod;
    window.loadVisitRequests = loadVisitRequests;
    window.filterVisits = filterVisits;
    window.renderVisits = renderVisits;
    window.openScheduleModal = openScheduleModal;
    window.closeScheduleModal = closeScheduleModal;
    window.confirmSchedule = confirmSchedule;
    window.completeVisit = completeVisit;
    window.closeCompleteVisitModal = closeCompleteVisitModal;
    window.submitCompleteVisit = submitCompleteVisit;
    window.cancelVisit = cancelVisit;
    window.markPropertySold = markPropertySold;
    window.loadAnalytics = loadAnalytics;
    window.loadInterestedCustomers = loadInterestedCustomers;
    window.completeInterestedSale = completeInterestedSale;
    window.loadChats = loadChats;
    window.openChatConversation = openChatConversation;
    window.sendEmployeeMessage = sendEmployeeMessage;
    window.loadContacts = loadContacts;
    window.loadEmployees = loadEmployees;
    window.openAddEmployeeModal = openAddEmployeeModal;
    window.closeEmployeeModal = closeEmployeeModal;
    window.saveEmployee = saveEmployee;
    window.editEmployee = editEmployee;
    window.resetEmployeePassword = resetEmployeePassword;
    window.removeEmployee = removeEmployee;
    window.loadUsers = loadUsers;
    window.resetUserPassword = resetUserPassword;
    window.removeUser = removeUser;

    // Aliases for HTML onclick/onsubmit references
    window.adminLogin = loginAdmin;
    window.completeOtpPasswordReset = submitNewPassword;
    window.switchAdminTab = switchTab;
    window.adminLogout = logoutAdmin;
    window.closePropertyModal = closeAddPropertyModal;
    window.openPropertyModal = openAddPropertyModal;
    window.openEmployeeModal = openAddEmployeeModal;
    window.saveProperty = saveAdminProperty;
    window.saveVisitSchedule = confirmSchedule;
    window.filterVisitRequests = filterVisits;
    window.filterLogs = filterLogs;
    window.loadLogs = loadLogs;
    window.logActivity = logActivity;
    window.sendAdminReply = function (event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        sendEmployeeMessage();
    };
    window.refreshAdminData = function () {
        loadDashboardData();
        loadCompounds();
        loadApprovedProperties();
        loadPendingProperties();
        loadVisitRequests();
        loadChats();
        loadContacts();
        loadEmployees();
        loadUsers();
        loadAnalytics();
        loadInterestedCustomers();
        loadLogs();
    };
    window.editCompoundByName = function (name) {
        var i;
        for (i = 0; i < compoundsCache.length; i++) {
            if (compoundsCache[i].name === name) {
                editCompound(compoundsCache[i].id);
                return;
            }
        }
        notify('المجمع "' + name + '" غير موجود في قاعدة البيانات', true);
    };
    window.resetCompoundForm = function () {
        resetForm('compoundForm');
        setInputValue('compoundId', '');
    };
    window.deleteSelectedCompound = function () {
        var editId = getTrimmedValue('compoundId');
        if (editId) {
            deleteCompound(editId);
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();
