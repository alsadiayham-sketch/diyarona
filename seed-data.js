(function () {
    'use strict';

    var SEED_COMPOUNDS = [
        {
            id: 'compound_nakheel',
            name: 'النخيل',
            city: 'رام الله',
            area: 'عين مصباح',
            shortDescription: 'مجمع سكني فاخر يجمع بين الحداثة والطبيعة، وحدات متنوعة بتصاميم عصرية',
            description: 'مجمع النخيل هو مشروع سكني راقٍ من تطوير شركة ديارنا، يقع في منطقة عين مصباح الهادئة. يتميز بتصاميم معمارية حديثة تراعي الخصوصية والرفاهية، محاط بمساحات خضراء واسعة وأشجار النخيل. يضم المجمع مرافق متكاملة تشمل نادي رياضي، مسبح مشترك، ومنطقة ألعاب للأطفال.',
            totalUnits: 48,
            startingPrice: 320000,
            completionDate: '2025',
            amenities: ['نادي رياضي', 'مسبح', 'حدائق', 'أمن 24/7', 'موقف تحت أرضي', 'ملاعب أطفال', 'غرفة اجتماعات', 'كاميرات مراقبة'],
            images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'],
            order: 1
        },
        {
            id: 'compound_arz',
            name: 'الأرز',
            city: 'نابلس',
            area: 'رفيديا',
            shortDescription: 'مشروع سكني متكامل بإطلالات جبلية خلابة وتشطيبات فاخرة',
            description: 'مجمع الأرز يقع على أعلى نقطة في رفيديا بنابلس، يوفر إطلالات بانورامية على الجبال المحيطة. تم تصميم الوحدات بأعلى معايير الجودة مع مراعاة استغلال الإضاءة الطبيعية. المشروع مزود بأحدث أنظمة الطاقة الشمسية والعزل الحراري.',
            totalUnits: 36,
            startingPrice: 280000,
            completionDate: '2025',
            amenities: ['طاقة شمسية', 'إطلالة جبلية', 'حدائق معلقة', 'أمن وحراسة', 'مصاعد ذكية', 'موقف سيارات', 'صالة رياضية', 'روف مشترك'],
            images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400&h=300&fit=crop'],
            order: 2
        },
        {
            id: 'compound_laymoun',
            name: 'الليمون',
            city: 'بيت لحم',
            area: 'بيت ساحور',
            shortDescription: 'مشروع سكني عائلي بمساحات خضراء واسعة وأجواء هادئة',
            description: 'مجمع الليمون هو مشروع سكني مصمم للعائلات، يقع في بيت ساحور وسط بساتين الليمون. يتميز بوحدات واسعة بتصاميم مفتوحة، شرفات كبيرة مطلة على الحدائق، وممرات مشي آمنة. المشروع صديق للبيئة ومزود بأنظمة إعادة تدوير المياه.',
            totalUnits: 30,
            startingPrice: 250000,
            completionDate: '2026',
            amenities: ['حدائق واسعة', 'ممرات مشي', 'منطقة شواء', 'أمن وحراسة', 'موقف سيارات', 'ملاعب أطفال', 'مكتبة مشتركة', 'صديق للبيئة'],
            images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop'],
            order: 3
        }
    ];

    var SEED_COMPOUND_PROPERTIES = [
        // النخيل properties
        { title: 'شقة A1 - النخيل', type: 'شقة', purpose: 'بيع', price: 320000, city: 'رام الله', area: 'عين مصباح', size: 130, bedrooms: 3, bathrooms: 2, floor: 1, features: ['مصعد', 'موقف سيارات', 'بلكونة', 'تدفئة مركزية', 'أمن وحراسة'], description: 'شقة طابق أول في مجمع النخيل، 3 غرف نوم واسعة مع ماستر، صالون ومعيشة مفتوحة، مطبخ مجهز.', compound: 'compound_nakheel', images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'شقة B3 - النخيل', type: 'شقة', purpose: 'بيع', price: 380000, city: 'رام الله', area: 'عين مصباح', size: 155, bedrooms: 3, bathrooms: 2, floor: 3, features: ['مصعد', 'موقف سيارات', 'بلكونة', 'تدفئة مركزية', 'إطلالة', 'أمن وحراسة'], description: 'شقة طابق ثالث بإطلالة مميزة على الحدائق، مساحة واسعة مع تراس كبير.', compound: 'compound_nakheel', images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'دوبلكس D1 - النخيل', type: 'شقة', purpose: 'بيع', price: 520000, city: 'رام الله', area: 'عين مصباح', size: 220, bedrooms: 4, bathrooms: 3, floor: 4, features: ['مصعد', 'موقف سيارات', 'بلكونة', 'تدفئة مركزية', 'إطلالة', 'أمن وحراسة', 'تكييف'], description: 'دوبلكس فاخر في الطابقين الرابع والخامس مع روف خاص وإطلالة 360 درجة.', compound: 'compound_nakheel', images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'], status: 'approved' },

        // الأرز properties
        { title: 'شقة 201 - الأرز', type: 'شقة', purpose: 'بيع', price: 280000, city: 'نابلس', area: 'رفيديا', size: 125, bedrooms: 3, bathrooms: 2, floor: 2, features: ['مصعد', 'بلكونة', 'إطلالة', 'طاقة شمسية', 'تدفئة مركزية'], description: 'شقة بإطلالة جبلية ساحرة، تشطيب سوبر ديلوكس، نظام طاقة شمسية متكامل.', compound: 'compound_arz', images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'شقة 305 - الأرز', type: 'شقة', purpose: 'بيع', price: 310000, city: 'نابلس', area: 'رفيديا', size: 140, bedrooms: 3, bathrooms: 2, floor: 3, features: ['مصعد', 'بلكونة', 'إطلالة', 'طاقة شمسية', 'تدفئة مركزية', 'موقف سيارات'], description: 'شقة واسعة مع بلكونة مطلة على وادي نابلس، مواد بناء عالية الجودة.', compound: 'compound_arz', images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'بنتهاوس - الأرز', type: 'شقة', purpose: 'بيع', price: 450000, city: 'نابلس', area: 'رفيديا', size: 200, bedrooms: 4, bathrooms: 3, floor: 6, features: ['مصعد', 'بلكونة', 'إطلالة', 'طاقة شمسية', 'تدفئة مركزية', 'موقف سيارات', 'تكييف', 'مسبح'], description: 'بنتهاوس حصري في أعلى طابق مع مسبح خاص على السطح وإطلالة بانورامية.', compound: 'compound_arz', images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'], status: 'approved' },

        // الليمون properties
        { title: 'شقة عائلية 102 - الليمون', type: 'شقة', purpose: 'بيع', price: 250000, city: 'بيت لحم', area: 'بيت ساحور', size: 135, bedrooms: 3, bathrooms: 2, floor: 1, features: ['حديقة', 'موقف سيارات', 'بلكونة', 'تدفئة مركزية', 'غرفة غسيل'], description: 'شقة طابق أول مع حديقة خاصة، مثالية للعائلات، قريبة من المدارس.', compound: 'compound_laymoun', images: ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'شقة 204 - الليمون', type: 'شقة', purpose: 'بيع', price: 270000, city: 'بيت لحم', area: 'بيت ساحور', size: 145, bedrooms: 3, bathrooms: 2, floor: 2, features: ['مصعد', 'موقف سيارات', 'بلكونة', 'تدفئة مركزية'], description: 'شقة بتصميم مفتوح مع شرفة واسعة مطلة على بساتين الليمون.', compound: 'compound_laymoun', images: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'فيلا مستقلة - الليمون', type: 'فيلا', purpose: 'بيع', price: 650000, city: 'بيت لحم', area: 'بيت ساحور', size: 300, bedrooms: 5, bathrooms: 3, floor: 0, features: ['حديقة', 'موقف سيارات', 'مسبح', 'تكييف', 'أمن وحراسة', 'إطلالة'], description: 'فيلا مستقلة فاخرة مع حديقة ومسبح، 5 غرف نوم، تصميم عصري متكامل.', compound: 'compound_laymoun', images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop'], status: 'approved' }
    ];

    var SEED_PROPERTIES = [
        { title: 'شقة فاخرة في الماصيون', type: 'شقة', purpose: 'بيع', price: 450000, city: 'رام الله', area: 'الماصيون', size: 160, bedrooms: 3, bathrooms: 2, floor: 4, features: ['مصعد', 'بلكونة', 'تدفئة مركزية', 'موقف سيارات', 'إطلالة'], description: 'شقة فاخرة بإطلالة بانورامية، تشطيب سوبر ديلوكس.', images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'أرض تجارية في بيتونيا', type: 'أرض', purpose: 'بيع', price: 800000, city: 'رام الله', area: 'بيتونيا', size: 1000, bedrooms: 0, bathrooms: 0, floor: 0, features: [], description: 'أرض تجارية بموقع استراتيجي على الشارع الرئيسي.', images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'شقة للإيجار في البيرة', type: 'شقة', purpose: 'إيجار', price: 2500, rentPeriod: 'شهري', city: 'رام الله', area: 'البيرة', size: 120, bedrooms: 2, bathrooms: 1, floor: 2, features: ['مصعد', 'بلكونة', 'تدفئة مركزية'], description: 'شقة مفروشة جاهزة للسكن الفوري.', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'محل تجاري في الخليل', type: 'محل', purpose: 'إيجار', price: 4000, rentPeriod: 'شهري', city: 'الخليل', area: 'عين سارة', size: 100, bedrooms: 0, bathrooms: 1, floor: 0, features: ['موقف سيارات'], description: 'محل تجاري بموقع مميز على شارع رئيسي.', images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'مزرعة في أريحا', type: 'مزرعة', purpose: 'بيع', price: 650000, city: 'أريحا', area: 'الديوك', size: 5000, bedrooms: 2, bathrooms: 1, floor: 0, features: ['حديقة', 'مسبح'], description: 'مزرعة خصبة مع بيت ريفي، أشجار مثمرة.', images: ['https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&h=400&fit=crop'], status: 'approved' },
        { title: 'مكتب تجاري في نابلس', type: 'مكتب', purpose: 'إيجار', price: 42000, rentPeriod: 'سنوي', city: 'نابلس', area: 'وسط المدينة', size: 80, bedrooms: 0, bathrooms: 1, floor: 3, features: ['مصعد', 'تكييف', 'موقف سيارات'], description: 'مكتب تجاري مجهز في برج حديث.', images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop'], status: 'approved' }
    ];

    window.seedFirestoreData = function (force) {
        if (!force) { console.log('Call seedFirestoreData(true) to seed'); return; }

        console.log('Seeding compounds...');
        var compoundPromises = SEED_COMPOUNDS.map(function (c) {
            var id = c.id;
            delete c.id;
            c.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('compounds').doc(id).set(c);
        });

        console.log('Seeding compound properties...');
        var compPropPromises = SEED_COMPOUND_PROPERTIES.map(function (p) {
            p.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            p.ownerName = 'ديارنا';
            p.ownerPhone = '0569236758';
            p.submittedBy = 'admin';
            return db.collection('properties').add(p);
        });

        console.log('Seeding general properties...');
        var propPromises = SEED_PROPERTIES.map(function (p) {
            p.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            p.ownerName = 'مالك';
            p.ownerPhone = '0599000000';
            p.submittedBy = 'guest';
            return db.collection('properties').add(p);
        });

        Promise.all(compoundPromises.concat(compPropPromises).concat(propPromises)).then(function () {
            console.log('✅ Seeded: 3 compounds, ' + SEED_COMPOUND_PROPERTIES.length + ' compound units, ' + SEED_PROPERTIES.length + ' properties');
        }).catch(function (err) { console.error('❌ Error:', err); });
    };

    window.seedAdminAuth = function () {
        var hash = (function (str) {
            var h = 0;
            for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); h = ((h << 5) - h) + c; h = h & h; }
            return 'h_' + Math.abs(h).toString(36);
        })('5555');
        rawDb.collection('admin_auth').doc('diyarona').set({ username: 'diyarona', passwordHash: hash, sessionVersion: 1 })
            .then(function () { console.log('✅ Admin auth seeded'); });
    };
})();
