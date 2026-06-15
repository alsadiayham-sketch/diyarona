(function () {
    'use strict';

    var SEED_PROPERTIES = [
        {
            title: 'شقة فاخرة في الماصيون',
            type: 'شقة',
            purpose: 'بيع',
            price: 450000,
            city: 'رام الله',
            area: 'الماصيون',
            size: 160,
            bedrooms: 3,
            bathrooms: 2,
            floor: 4,
            features: ['مصعد', 'بلكونة', 'تدفئة مركزية', 'موقف سيارات', 'إطلالة'],
            description: 'شقة فاخرة بإطلالة بانورامية على المدينة، تشطيب سوبر ديلوكس، 3 غرف نوم واسعة مع ماستر.',
            images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'],
            status: 'approved',
            ownerName: 'أحمد محمد',
            ownerPhone: '0599123456'
        },
        {
            title: 'فيلا مستقلة في عين مصباح',
            type: 'فيلا',
            purpose: 'بيع',
            price: 1200000,
            city: 'رام الله',
            area: 'عين مصباح',
            size: 350,
            bedrooms: 5,
            bathrooms: 4,
            floor: 0,
            features: ['حديقة', 'مسبح', 'موقف سيارات', 'أمن وحراسة', 'تكييف', 'إطلالة'],
            description: 'فيلا مستقلة فاخرة مع حديقة واسعة ومسبح خاص، تشطيب عالي الجودة، موقع هادئ ومميز.',
            images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop'],
            status: 'approved',
            ownerName: 'سامي العلي',
            ownerPhone: '0598765432'
        },
        {
            title: 'أرض تجارية في بيتونيا',
            type: 'أرض',
            purpose: 'بيع',
            price: 800000,
            city: 'رام الله',
            area: 'بيتونيا',
            size: 1000,
            bedrooms: 0,
            bathrooms: 0,
            floor: 0,
            features: [],
            description: 'أرض تجارية بموقع استراتيجي على الشارع الرئيسي، مناسبة لبناء مجمع تجاري أو سكني.',
            images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'خالد حسن',
            ownerPhone: '0597111222'
        },
        {
            title: 'شقة للإيجار في البيرة',
            type: 'شقة',
            purpose: 'إيجار',
            price: 2500,
            rentPeriod: 'شهري',
            city: 'رام الله',
            area: 'البيرة',
            size: 120,
            bedrooms: 2,
            bathrooms: 1,
            floor: 2,
            features: ['مصعد', 'بلكونة', 'تدفئة مركزية'],
            description: 'شقة مفروشة بالكامل، جاهزة للسكن الفوري، قريبة من الخدمات والمواصلات.',
            images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop'],
            status: 'approved',
            ownerName: 'مريم عبد الله',
            ownerPhone: '0596543210'
        },
        {
            title: 'مكتب تجاري في وسط نابلس',
            type: 'مكتب',
            purpose: 'إيجار',
            price: 3500,
            rentPeriod: 'شهري',
            city: 'نابلس',
            area: 'وسط المدينة',
            size: 80,
            bedrooms: 0,
            bathrooms: 1,
            floor: 3,
            features: ['مصعد', 'تكييف', 'موقف سيارات'],
            description: 'مكتب تجاري مجهز بالكامل في برج حديث، مناسب لشركات التكنولوجيا والمحاماة.',
            images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'ياسر نصر',
            ownerPhone: '0592345678'
        },
        {
            title: 'شقة جديدة في جبل النزهة',
            type: 'شقة',
            purpose: 'بيع',
            price: 320000,
            city: 'نابلس',
            area: 'جبل النزهة',
            size: 140,
            bedrooms: 3,
            bathrooms: 2,
            floor: 5,
            features: ['مصعد', 'بلكونة', 'تدفئة مركزية', 'إطلالة', 'طاقة شمسية'],
            description: 'شقة جديدة لم تسكن، إطلالة جبلية خلابة، بناء حديث بمواصفات عالية.',
            images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'],
            status: 'approved',
            ownerName: 'نادر جمال',
            ownerPhone: '0591234567'
        },
        {
            title: 'محل تجاري في الخليل',
            type: 'محل',
            purpose: 'بيع',
            price: 550000,
            city: 'الخليل',
            area: 'عين سارة',
            size: 100,
            bedrooms: 0,
            bathrooms: 1,
            floor: 0,
            features: ['موقف سيارات'],
            description: 'محل تجاري بموقع مميز على شارع رئيسي، مساحة واسعة مع واجهة زجاجية.',
            images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'عمر الخطيب',
            ownerPhone: '0593456789'
        },
        {
            title: 'شقة فاخرة في بيت لحم',
            type: 'شقة',
            purpose: 'بيع',
            price: 380000,
            city: 'بيت لحم',
            area: 'بيت ساحور',
            size: 150,
            bedrooms: 3,
            bathrooms: 2,
            floor: 3,
            features: ['مصعد', 'بلكونة', 'تدفئة مركزية', 'موقف سيارات', 'غرفة غسيل'],
            description: 'شقة فاخرة في منطقة هادئة، قريبة من المدارس والخدمات، تشطيب ممتاز.',
            images: ['https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop'],
            status: 'approved',
            ownerName: 'سارة يعقوب',
            ownerPhone: '0594567890'
        },
        {
            title: 'مزرعة في أريحا',
            type: 'مزرعة',
            purpose: 'بيع',
            price: 650000,
            city: 'أريحا',
            area: 'الديوك',
            size: 5000,
            bedrooms: 2,
            bathrooms: 1,
            floor: 0,
            features: ['حديقة', 'مسبح'],
            description: 'مزرعة خصبة مع بيت ريفي، أشجار مثمرة متنوعة، مصدر مياه خاص.',
            images: ['https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'فادي موسى',
            ownerPhone: '0595678901'
        },
        {
            title: 'عمارة سكنية في جنين',
            type: 'عمارة',
            purpose: 'بيع',
            price: 2500000,
            city: 'جنين',
            area: 'حي الناصرة',
            size: 800,
            bedrooms: 0,
            bathrooms: 0,
            floor: 0,
            features: ['مصعد', 'موقف سيارات', 'أمن وحراسة'],
            description: 'عمارة سكنية من 4 طوابق، 8 شقق، مدخول إيجار ممتاز، بناء حديث.',
            images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'محمود صالح',
            ownerPhone: '0596789012'
        },
        {
            title: 'شقة روف في طولكرم',
            type: 'شقة',
            purpose: 'بيع',
            price: 280000,
            city: 'طولكرم',
            area: 'المركز',
            size: 130,
            bedrooms: 3,
            bathrooms: 2,
            floor: 6,
            features: ['بلكونة', 'تكييف', 'إطلالة', 'طاقة شمسية'],
            description: 'شقة روف مع تراس واسع، إطلالة 360 درجة، مجهزة بالطاقة الشمسية.',
            images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'رامي حسن',
            ownerPhone: '0597890123'
        },
        {
            title: 'أرض سكنية في قلقيلية',
            type: 'أرض',
            purpose: 'بيع',
            price: 200000,
            city: 'قلقيلية',
            area: 'حي النور',
            size: 500,
            bedrooms: 0,
            bathrooms: 0,
            floor: 0,
            features: [],
            description: 'أرض سكنية مستوية في منطقة راقية، مرخصة للبناء 4 طوابق.',
            images: ['https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=600&h=400&fit=crop'],
            status: 'approved',
            ownerName: 'علي كمال',
            ownerPhone: '0598901234'
        }
    ];

    window.seedFirestoreData = function (force) {
        if (!force) {
            console.log('Call seedFirestoreData(true) to seed data');
            return;
        }

        console.log('Seeding ' + SEED_PROPERTIES.length + ' properties...');

        var promises = SEED_PROPERTIES.map(function (prop) {
            prop.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return db.collection('properties').add(prop);
        });

        Promise.all(promises).then(function () {
            console.log('✅ Successfully seeded ' + SEED_PROPERTIES.length + ' properties!');
        }).catch(function (err) {
            console.error('❌ Error seeding:', err);
        });
    };

    window.seedAdminAuth = function () {
        var hash = (function (str) {
            var h = 0;
            for (var i = 0; i < str.length; i++) {
                var c = str.charCodeAt(i);
                h = ((h << 5) - h) + c;
                h = h & h;
            }
            return 'h_' + Math.abs(h).toString(36);
        })('5555');

        rawDb.collection('admin_auth').doc('diyarona').set({
            username: 'diyarona',
            passwordHash: hash,
            sessionVersion: 1
        }).then(function () {
            console.log('✅ Admin auth seeded!');
        });
    };
})();
