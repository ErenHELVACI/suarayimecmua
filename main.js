// ============================
// ŞUARÂ-YI MECMUA — main.js
// ULTRA GELİŞMİŞ SÜRÜM
// ============================

// Firebase Ayarları
const firebaseConfig = {
  apiKey: "AIzaSyC45yc5_pgD7Pb9FNFLhKHjlpt4T19rQfc",
  authDomain: "suarayimecmua.firebaseapp.com",
  projectId: "suarayimecmua",
  storageBucket: "suarayimecmua.firebasestorage.app",
  messagingSenderId: "984768059887",
  appId: "1:984768059887:web:9456dea4067a70c234fe1a",
  measurementId: "G-Q2XYNT65HQ"
};
// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollAnimations();
    initNavbarState();
    setupMobileMenu();
    setupTypewriter();
    renderPoems(); // Şiirleri Firebase'den yükle
    
    // Klasikleri URL parametresi varsa ona göre filtreleyerek yükle
    if(window.location.pathname.includes('klasikler.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const sairParam = urlParams.get('sair');
        if(sairParam) {
            renderKlasikler(sairParam);
            setTimeout(() => {
                const btns = document.querySelectorAll('#klasikFilters .filter-btn');
                if(btns) {
                    btns.forEach(b => {
                        b.classList.remove('active');
                        if(b.innerText.includes(sairParam)) b.classList.add('active');
                    });
                }
            }, 100);
        } else {
            renderKlasikler();
        }
    } else {
        renderKlasikler();
    }
    
    // Şairleri yükle
    if(window.location.pathname.includes('sairler.html')) {
        renderSairler();
    }
    
    initFilters(); 
    initSearch(); // Arama çubuğunu aktifleştir
    initAuth(); // Üyelik butonlarını ayarla
    
    // Eğer eser.html sayfasındaysak eseri yükle
    if(window.location.pathname.includes('eser.html')) {
        loadEserSayfasi();
    }
    
    // Eğer yazar.html sayfasındaysak yazar detaylarını yükle
    if(window.location.pathname.includes('yazar.html')) {
        const params = new URLSearchParams(window.location.search);
        const isim = params.get('isim');
        if(isim) yukleYazarSayfasi(isim);
    }
});

// --- AUTH (ÜYELİK SİSTEMİ) ---
function initAuth() {
    const navLinks = document.querySelector('.nav-links');
    const navMobile = document.getElementById('navMobile');
    
    if(navLinks) {
        const authLi = document.createElement('li');
        authLi.id = "authDesktop";
        navLinks.appendChild(authLi);
    }
    
    if(navMobile) {
        const authDiv = document.createElement('div');
        authDiv.id = "authMobile";
        authDiv.style.marginTop = "1.5rem";
        navMobile.appendChild(authDiv);
    }

    auth.onAuthStateChanged((user) => {
        const desktop = document.getElementById('authDesktop');
        const mobile = document.getElementById('authMobile');
        
        if(user) {
            const html = `<a href="profil.html" class="btn btn-outline" style="padding:0.4rem 1rem; border-radius:var(--r); font-size:0.9rem; border-color:var(--gold); color:var(--gold);">Profilim</a>`;
            if(desktop) desktop.innerHTML = html;
            if(mobile) mobile.innerHTML = html;
            
            // Eğer profil sayfasındaysak bilgileri çek
            if(window.location.pathname.includes('profil.html')) {
                yukleProfil(user);
            }
        } else {
            const html = `<a href="auth.html" class="btn btn-primary" style="padding:0.4rem 1rem; border-radius:var(--r); font-size:0.9rem;">Giriş / Kayıt</a>`;
            if(desktop) desktop.innerHTML = html;
            if(mobile) mobile.innerHTML = html;
            
            // Profil sayfasında ama giriş yapmamışsa anasayfaya at
            if(window.location.pathname.includes('profil.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if(tab === 'giris') {
        document.getElementById('tabGiris').classList.add('active');
        document.getElementById('formGiris').classList.add('active');
    } else {
        document.getElementById('tabKayit').classList.add('active');
        document.getElementById('formKayit').classList.add('active');
    }
}

async function kayitOl(event) {
    event.preventDefault();
    const btn = document.getElementById('btnReg');
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    
    btn.innerHTML = 'Kayıt Olunuyor...';
    btn.disabled = true;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        
        // E-posta doğrulama gönder (İstediğiniz özellik)
        await userCredential.user.sendEmailVerification();
        
        // Kullanıcı profilini veritabanına kaydet
        await db.collection("Kullanicilar").doc(userCredential.user.uid).set({
            isim: name,
            email: email,
            kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Kayıt Başarılı!', 'E-posta adresinize doğrulama linki gönderildi. Lütfen onaylayın.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        
    } catch(err) {
        btn.innerHTML = 'Hesap Oluştur';
        btn.disabled = false;
        showToast('Hata', err.message, 'error');
    }
}

async function girisYap(event) {
    event.preventDefault();
    const btn = document.getElementById('btnLogin');
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    
    btn.innerHTML = 'Giriş Yapılıyor...';
    btn.disabled = true;
    
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        showToast('Hoş Geldiniz', 'Başarıyla giriş yapıldı.', 'success');
        setTimeout(() => { window.location.href = 'paylasim.html'; }, 1500);
    } catch(err) {
        btn.innerHTML = 'Sisteme Gir';
        btn.disabled = false;
        showToast('Hata', 'E-posta veya şifre hatalı!', 'error');
    }
}

function cikisYap(event) {
    if(event) event.preventDefault();
    auth.signOut().then(() => {
        showToast('Çıkış', 'Hesabınızdan çıkış yapıldı.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    });
}

// --- PROFİL VE ADMİN İŞLEMLERİ ---
async function activeAI() {
    const panel = document.getElementById('aiPanel');
    const btn = document.getElementById('btnAI');
    const analysisText = document.getElementById('aiAnalysisText');
    const aiImg = document.getElementById('aiGeneratedImg');
    const aiLoader = document.getElementById('aiLoader');
    const verseDiv = document.getElementById('aiVerseAnalysis');

    if(!panel) return;

    panel.style.display = 'block';
    panel.classList.add('active');
    btn.disabled = true;
    btn.innerHTML = '<span>⌛</span> Analiz Ediliyor...';

    const title = document.getElementById('eTitle').innerText;
    const author = document.getElementById('eAuthor').innerText;
    const fullText = document.getElementById('eText').innerText;
    
    // 1. Cümlesel Anlam Analizi (Tüm Mısralar)
    // Şiiri mısralara böl ve her birinin "anlamını" oluştur
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    
    // Genel edebi şerh şablonları
    const sherhTemplates = [
        "Bu mısrada şair, içsel bir huzursuzluğun ve arayışın altını çizmektedir.",
        "Şair burada doğa olayları üzerinden insan ruhunun derinliklerine atıfta bulunur.",
        "Bu dize, eserin genelindeki hüzün atmosferini pekiştiren bir anlam taşır.",
        "Kullanılan kelimeler, somut bir durumdan soyut bir duyguya geçişi simgeler.",
        "Burada toplumsal bir durumun birey üzerindeki sarsıcı etkisi dile getirilmiştir.",
        "Şair, karşıt kavramları bir araya getirerek anlamı derinleştirmeyi hedeflemiştir."
    ];

    const lineMeanings = lines.map((line, index) => {
        // Popüler şiirler için spesifik anlamlar (Opsiyonel)
        if(line.includes("Mona Rosa")) return "Şair sevgilisine hitap ederek ona olan özlemini ve aşkının büyüklüğünü ifade ediyor.";
        if(line.includes("Kırmızı bir kuştur")) return "Ruhun heyecanını ve yaşama olan tutkusunu canlı bir imgeyle açıklıyor.";
        
        // Genel anlam üretimi
        return sherhTemplates[index % sherhTemplates.length];
    });

    // 2. Görsel Seçimi
    const aiAssets = [
        "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1516339901600-2e1a62d0ed5c?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80&w=600"
    ];
    const assetImg = aiAssets[Math.floor(Math.random() * aiAssets.length)];

    // AI Bekleme Simülasyonu
    await new Promise(r => setTimeout(r, 1500));

    aiLoader.style.display = 'none';
    aiImg.src = assetImg + "&sig=" + Math.random(); 
    aiImg.style.display = 'block';

    // Mısra Anlamlarını Yazdır
    verseDiv.innerHTML = '';
    lines.forEach((line, i) => {
        const item = document.createElement('div');
        item.style.marginBottom = "1.5rem";
        item.innerHTML = `<p style="color:var(--text-soft); font-weight:600; margin-bottom:6px; font-size:1.05rem;">${line}</p>
                          <p style="font-size:0.95rem; color:var(--gold-dark); padding-left:1.2rem; border-left:3px solid var(--gold-glow); line-height:1.6;">${lineMeanings[i]}</p>`;
        verseDiv.appendChild(item);
    });

    btn.innerHTML = '<span>✨</span> Analiz Tamamlandı';
}

async function yukleProfil(user) {
    const pName = document.getElementById('profilName');
    const pEmail = document.getElementById('profilEmail');
    const pRole = document.getElementById('profilRole');
    const adminPanel = document.getElementById('adminPanel');
    const myGrid = document.getElementById('myPoemsGrid');
    const likedGrid = document.getElementById('likedPoemsGrid');
    
    // İstatistik elementleri
    const totalViewsEl = document.getElementById('totalViews');
    const totalLikesEl = document.getElementById('totalLikes');
    const poemCountEl = document.getElementById('poemCount');

    if(!pName) return; 
    
    try {
        const userDoc = await db.collection("Kullanicilar").doc(user.uid).get();
        if(userDoc.exists) {
            const data = userDoc.data();
            pName.innerText = data.isim || "İsimsiz Yazar";
            pEmail.innerText = user.email;
            
            if(data.rol === "admin") {
                pRole.innerText = "Yönetici (Admin)";
                pRole.style.color = "var(--gold)";
                adminPanel.style.display = "block";
            }
        } else {
            pName.innerText = "Misafir Yazar";
            pEmail.innerText = user.email;
        }
        
        // 1. Kendi Eserlerim ve İstatistik Hesaplama
        const mySnapshot = await db.collection("Eserler").where("sahipUid", "==", user.uid).get();
        myGrid.innerHTML = '';
        
        let totalViews = 0;
        let totalLikes = 0;
        
        if(mySnapshot.empty) {
            myGrid.innerHTML = '<p style="grid-column: 1/-1; color:var(--text-muted);">Henüz bir eser tescillemediniz.</p>';
        } else {
            mySnapshot.forEach(doc => {
                const eser = doc.data();
                const eserLikes = (eser.likes || []).length;
                totalViews += (eser.goruntulenme || 0);
                totalLikes += eserLikes;
                renderPoemCard(myGrid, doc.id, eser);
            });
        }
        
        // İstatistikleri yazdır
        if(totalViewsEl) totalViewsEl.innerText = totalViews;
        if(totalLikesEl) totalLikesEl.innerText = totalLikes;
        if(poemCountEl) poemCountEl.innerText = mySnapshot.size;

        // 2. Beğenilen Eserler (Klasikler ve Eserler)
        likedGrid.innerHTML = '';
        
        // Klasiklerden beğendikleri
        const likedKlasik = await db.collection("Klasikler").where("likes", "array-contains", user.uid).get();
        // Topluluktan beğendikleri
        const likedEser = await db.collection("Eserler").where("likes", "array-contains", user.uid).get();
        
        if(likedKlasik.empty && likedEser.empty) {
            likedGrid.innerHTML = '<p style="grid-column: 1/-1; color:var(--text-muted);">Henüz bir eseri beğenmediniz.</p>';
        } else {
            likedKlasik.forEach(doc => renderPoemCard(likedGrid, doc.id, doc.data(), true));
            likedEser.forEach(doc => renderPoemCard(likedGrid, doc.id, doc.data()));
        }

        // 3. Eserlerime Gelen Yorumlar
        const commentsDiv = document.getElementById('myRecentComments');
        if(commentsDiv) {
            commentsDiv.innerHTML = '';
            let commentFound = false;

            // Kendi eserlerimizin yorumlarını topla
            const commentPromises = mySnapshot.docs.map(async (doc) => {
                const eser = doc.data();
                const eserId = doc.id;
                const cSnapshot = await db.collection("Eserler").doc(eserId).collection("Yorumlar").orderBy("tarih", "desc").limit(3).get();
                
                cSnapshot.forEach(cDoc => {
                    commentFound = true;
                    const cData = cDoc.data();
                    const cDiv = document.createElement('div');
                    cDiv.className = 'reveal active';
                    cDiv.style.background = 'var(--bg-color-alt)';
                    cDiv.style.padding = '1.2rem';
                    cDiv.style.borderRadius = 'var(--r)';
                    cDiv.style.borderLeft = '4px solid var(--gold)';
                    cDiv.style.marginBottom = '10px';
                    cDiv.style.cursor = 'pointer';
                    cDiv.onclick = () => { window.location.href = 'eser.html?id=' + eserId; };
                    
                    const tarihStr = cData.tarih && cData.tarih.toDate ? cData.tarih.toDate().toLocaleDateString('tr-TR') : '';

                    cDiv.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.85rem; align-items:center;">
                            <strong style="color:var(--gold-dark);">${cData.yazar}</strong>
                            <span style="color:var(--text-muted); font-size:0.75rem;">${tarihStr}</span>
                        </div>
                        <p style="font-size:0.95rem; color:var(--text-soft); line-height:1.5; margin-bottom:0.5rem;">${cData.metin}</p>
                        <div style="text-align:right; font-size:0.75rem; color:var(--gold); font-style:italic;">"${eser.baslik}" eserine yapıldı</div>
                    `;
                    commentsDiv.appendChild(cDiv);
                });
            });

            await Promise.all(commentPromises);

            if(!commentFound) {
                commentsDiv.innerHTML = '<p style="color:var(--text-muted); font-style:italic;">Henüz eserlerinize yorum yapılmamış.</p>';
            }
        }

    } catch(err) {
        console.error("Profil yükleme hatası:", err);
        pName.innerText = "Hata oluştu.";
    }
}

// Yardımcı fonksiyon: Profil kartlarını oluşturur
function renderPoemCard(container, id, eser, isKlasik = false) {
    let kisaMetin = eser.metin;
    const misralar = eser.metin.split('<br>');
    if(misralar.length > 3) {
        kisaMetin = misralar.slice(0, 3).join('<br>') + '...';
    }

    const card = document.createElement('div');
    card.className = 'poem-card reveal active';
    card.style.cursor = 'pointer';
    card.onclick = () => { window.location.href = 'eser.html?id=' + id; };
    
    card.innerHTML = `
        <div class="poem-card-tag" style="${isKlasik ? 'background:rgba(212,175,55,0.15); color:var(--gold);' : ''}">${isKlasik ? 'Klasik Eser' : (eser.tur || 'Eser')} ${isKlasik ? '' : ('— ' + id)}</div>
        <h3 class="poem-card-title" style="font-size:1.1rem; margin-bottom:0.5rem; margin-top:0.5rem;">${eser.baslik}</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem; line-height:1.4;">${kisaMetin}</p>
        <div class="poem-card-footer" style="margin-top:auto; padding-top:0.8rem; border-top:1px solid var(--border-soft); font-size:0.75rem; display:flex; gap:15px; color:var(--text-muted);">
            <span style="display:flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> ${eser.goruntulenme || 0}</span>
            <span style="display:flex; align-items:center; gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="var(--red-accent)" stroke="var(--red-accent)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> ${(eser.likes || []).length}</span>
            <span style="margin-left:auto; font-style:italic;">${eser.yazar || 'Bilinmiyor'}</span>
        </div>
    `;
    container.appendChild(card);
}

async function topluSiirYukle() {
    const fileInput = document.getElementById('bulkUploadFile');
    const targetSelect = document.getElementById('bulkUploadTarget');
    const btn = document.getElementById('btnBulkUpload');
    
    if(!fileInput.files.length) {
        showToast('Uyarı', 'Lütfen bir JSON dosyası seçin.', 'error');
        return;
    }
    
    const targetCol = targetSelect ? targetSelect.value : "Klasikler";
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const siirler = JSON.parse(e.target.result);
            if(!Array.isArray(siirler)) throw new Error("Dizi formatında değil");
            
            btn.innerHTML = 'Kontrol Ediliyor...';
            btn.disabled = true;

            // 1. Mevcut koleksiyonu çek (kopya kontrolü için)
            const snapshot = await db.collection(targetCol).get();
            const existingTexts = new Set();
            snapshot.forEach(doc => {
                const text = doc.data().metin || "";
                const clean = text.replace(/<br>/g, '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
                if(clean) existingTexts.add(clean);
            });

            const batch = db.batch();
            let addedCount = 0;
            let skippedCount = 0;
            const currentUser = auth.currentUser;

            // 2. Yeni şiirleri filtrele ve batch'e ekle
            siirler.forEach((eser) => {
                const cleanNew = (eser.metin || "").replace(/<br>/g, '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
                
                if (existingTexts.has(cleanNew)) {
                    skippedCount++;
                } else {
                    const randid = Math.floor(100000 + Math.random() * 900000);
                    let docId, finalEser;

                    if(targetCol === "Klasikler") {
                        docId = "KLASIK-BULK-" + randid;
                        finalEser = { ...eser };
                    } else {
                        // Eserler (Topluluk) için tescil kodu üret
                        const regId = "TM-2025-" + Math.floor(10000 + Math.random() * 90000);
                        docId = regId;
                        finalEser = {
                            ...eser,
                            id: regId,
                            sahipUid: currentUser ? currentUser.uid : "ADMIN_UPLOAD",
                            tarih: firebase.firestore.FieldValue.serverTimestamp(),
                            tur: eser.tur || "Şiir",
                            likes: []
                        };
                    }

                    const docRef = db.collection(targetCol).doc(docId);
                    batch.set(docRef, finalEser);
                    existingTexts.add(cleanNew); 
                    addedCount++;
                }
            });

            if(addedCount > 0) {
                await batch.commit();
                showToast('Başarılı', `${addedCount} eser ${targetCol} koleksiyonuna eklendi. (${skippedCount} mükerrer atlandı)`, 'success');
            } else {
                showToast('Bilgi', 'Eklenecek yeni eser bulunamadı (Hepsi mükerrer).', 'info');
            }
            
            btn.innerHTML = 'Toplu Şiir Yükle';
            btn.disabled = false;
            fileInput.value = '';
            
        } catch(err) {
            console.error(err);
            showToast('Hata', 'Dosya işlenirken hata oluştu: ' + err.message, 'error');
            btn.innerHTML = 'Toplu Şiir Yükle';
            btn.disabled = false;
        }
    };
    reader.readAsText(file);
}

// --- ŞİİR VERİTABANI (TÜRK ŞAİRLER SİMÜLASYONU) ---
const turkSiirleri = [
    {
        id: "TM-2024-00101",
        baslik: "Sessiz Gemi",
        tur: "Şiir",
        yazar: "Yahya Kemal Beyatlı",
        kisaltma: "YK",
        metin: "Artık demir almak günü gelmişse zamandan,<br>Meçhule giden bir gemi kalkar bu limandan."
    },
    {
        id: "TM-2024-00102",
        baslik: "Anlatamıyorum",
        tur: "Serbest Şiir",
        yazar: "Orhan Veli Kanık",
        kisaltma: "OV",
        metin: "Ağlasam sesimi duyar mısınız,<br>Mısralarımda;<br>Dokunabilir misiniz,<br>Gözyaşlarıma, ellerinizle?"
    },
    {
        id: "TM-2024-00103",
        baslik: "Beklenen",
        tur: "Şiir",
        yazar: "Necip Fazıl Kısakürek",
        kisaltma: "NF",
        metin: "Ne hasta bekler sabahı,<br>Ne taze ölüyü mezar.<br>Ne de şeytan, bir günahı,<br>Seni beklediğim kadar."
    },
    {
        id: "TM-2024-00104",
        baslik: "Desem Ki",
        tur: "Serbest Şiir",
        yazar: "Cahit Sıtkı Tarancı",
        kisaltma: "CS",
        metin: "Desem ki vakitlerden bir nisan akşamıdır,<br>Rüzgârların en ferahlatıcısı senden esiyor..."
    },
    {
        id: "TM-2024-00105",
        baslik: "Sevgilerde",
        tur: "Şiir",
        yazar: "Behçet Necatigil",
        kisaltma: "BN",
        metin: "Sevgileri yarınlara bıraktınız<br>Çekingen, tutuk, saygılı."
    },
    {
        id: "TM-2024-00106",
        baslik: "Üçüncü Şahsın Şiiri",
        tur: "Şiir",
        yazar: "Attilâ İlhan",
        kisaltma: "Aİ",
        metin: "Gözlerin gözlerime değince<br>Felâketim olurdu ağlardım..."
    },
    {
        id: "TM-2024-00107",
        baslik: "Sevi Şiiri",
        tur: "Serbest Şiir",
        yazar: "Ümit Yaşar Oğuzcan",
        kisaltma: "ÜO",
        metin: "Ben senin en çok sesini sevdim<br>Buğulu, çoğu zaman taze bir ekmek gibi..."
    },
    {
        id: "TM-2024-00108",
        baslik: "Mona Roza",
        tur: "Şiir",
        yazar: "Sezai Karakoç",
        kisaltma: "SK",
        metin: "Mona Roza siyah güller, ak güller<br>Geyve'nin gülleri ve beyaz yatak..."
    }
];

async function renderPoems(filtre = "Tümü") {
    const grid = document.getElementById('poemsGrid');
    if(!grid) return;
    
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); font-size:1.1rem; padding: 3rem 0;">Veritabanından Eserler Yükleniyor...</p>';
    
    try {
        const snapshot = await db.collection("Eserler").orderBy("tarih", "desc").get();
        
        // Eğer veritabanı tamamen boşsa, varsayılan (Türk şairler) dizisini veritabanına otomatik yükleyelim (Seed)
        if(snapshot.empty && turkSiirleri.length > 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--gold); font-size:1.1rem; padding: 3rem 0;">Veritabanı kuruluyor, eserler aktarılıyor...</p>';
            const batch = db.batch();
            turkSiirleri.forEach(eser => {
                const docRef = db.collection("Eserler").doc(eser.id);
                batch.set(docRef, {
                    ...eser,
                    tarih: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            turkSiirleri.length = 0; // Bir daha girmemesi için
            return renderPoems(filtre); // Yeniden çağır
        }

        grid.innerHTML = '';
        const eserler = [];
        snapshot.forEach(doc => eserler.push(doc.data()));
        
        const filtrelenmis = filtre === "Tümü" ? eserler : eserler.filter(e => e.tur === filtre);
        
        if(filtrelenmis.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); font-size:1.1rem; font-style:italic; padding: 3rem 0;">Bu kategoride henüz eser tescillenmedi.</p>';
            return;
        }

        filtrelenmis.forEach((eser, index) => {
            const gecikme = index * 0.1;
            
            let kisaMetin = eser.metin;
            const misralar = eser.metin.split('<br>');
            if(misralar.length > 4) {
                kisaMetin = misralar.slice(0, 4).join('<br>') + '<br><span style="color:var(--gold); font-style:italic; font-size:0.9rem;">...devamını oku</span>';
            }

            const card = document.createElement('div');
            card.className = 'poem-card reveal active';
            card.style.transitionDelay = gecikme + 's';
            card.style.cursor = 'pointer';
            card.onclick = () => { window.location.href = 'eser.html?id=' + eser.id; };
            
            card.innerHTML = `
                <div class="poem-card-tag">${eser.tur}</div>
                <h3 class="poem-card-title">${eser.baslik}</h3>
                <div class="poem-excerpt"><p>${kisaMetin}</p></div>
                <div class="poem-card-footer">
                  <div class="poem-card-author"><div class="author-avatar">${eser.kisaltma || eser.yazar.charAt(0).toUpperCase()}</div><span>${eser.yazar}</span></div>
                  <span class="poem-card-code">${eser.id}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(err) {
        console.error("Firebase Hatası:", err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--red-accent);">Bağlantı hatası: Veritabanına ulaşılamadı.</p>';
    }
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if(filterBtns.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = e.target.parentElement;
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Filtre tıklandığında aramayı da sıfırla
            const sInput = document.getElementById('searchInput');
            if(sInput) sInput.value = '';
            
            if(container.id === 'klasikFilters') {
                const filterText = e.target.innerText.trim();
                renderKlasikler(filterText);
            } else {
                renderPoems(e.target.innerText);
            }
        });
    });
}

// --- ARAMA İŞLEVİ (HIZLI DOM FİLTRELEME) ---
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    if(!searchInput || !searchBtn) return;
    
    function executeSearch() {
        const q = searchInput.value.trim().toLowerCase();
        const grid = document.getElementById('poemsGrid') || document.getElementById('klasiklerGrid');
        if(!grid) return;
        
        const cards = grid.querySelectorAll('.poem-card');
        
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            if(text.includes(q)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    searchBtn.addEventListener('click', executeSearch);
    searchInput.addEventListener('keyup', executeSearch); // Harf girdikçe otomatik arasın
}

// --- TEMA (DARK/LIGHT MODE) ---
function initTheme() {
    const themeBtn = document.getElementById('themeToggle');
    if(!themeBtn) return;
    
    // SVG Icons
    const moonIcon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    const sunIcon = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

    let currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeBtn.querySelector('svg').innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;

    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        themeBtn.querySelector('svg').innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;
    });
}

// --- NAVBAR SCROLL STATE ---
function initNavbarState() {
    const nav = document.getElementById('navbar');
    if(!nav) return;
    window.addEventListener('scroll', () => {
        if(window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// --- MOBIL MENÜ ---
function setupMobileMenu() {
    const toggles = document.querySelectorAll('.nav-toggle');
    const navMobile = document.getElementById('navMobile');
    
    if(!navMobile || toggles.length === 0) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);

    function toggleMenu() {
        toggles.forEach(t => t.classList.toggle('open'));
        navMobile.classList.toggle('open');
        overlay.classList.toggle('open');
        document.body.style.overflow = navMobile.classList.contains('open') ? 'hidden' : '';
    }

    toggles.forEach(toggle => {
        toggle.addEventListener('click', toggleMenu);
    });
    overlay.addEventListener('click', toggleMenu);
}

// --- SCROLL ANIMATIONS (AOS Alternative) ---
function initScrollAnimations() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    reveals.forEach(el => observer.observe(el));
}

// --- TOAST NOTIFICATIONS ---
function showToast(title, message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconStr = type === 'success' ? '✓' : '✕';
    
    toast.innerHTML = `
        <div class="toast-icon">${iconStr}</div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-msg">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --- TESCİL SORGULA (ANASAYFA) ---
async function sorguTescil() {
    const input = document.getElementById('tescilInput');
    const sonucBox = document.getElementById('tescilSonuc');
    const loader = document.getElementById('tescilLoader');
    
    if (!input || !sonucBox || !loader) return;

    const val = input.value.trim().toUpperCase();
    if (val === '') {
        showToast('Hata', 'Lütfen bir tescil kodu girin.', 'error');
        return;
    }

    sonucBox.style.display = 'none';
    loader.style.display = 'block';

    try {
        const docRef = await db.collection("Eserler").doc(val).get();
        loader.style.display = 'none';
        sonucBox.style.display = 'block';
        
        if (docRef.exists) {
            sonucBox.innerHTML = '<span style="color:var(--green-ok); font-weight:600;">✓ KORUMA ALTINDA:</span> Bu kod doğrulanmış bir edebi esere aittir.';
            showToast('Başarılı', 'Eser kaydı bulundu.', 'success');
        } else {
            sonucBox.innerHTML = '<span style="color:var(--red-accent); font-weight:600;">✕ KAYIT BULUNAMADI:</span> Girdiğiniz koda ait tescil tespit edilemedi.';
            showToast('Bulunamadı', 'Geçersiz veya hatalı kod.', 'error');
        }
    } catch(err) {
        loader.style.display = 'none';
        showToast('Hata', 'Sorgu sırasında veritabanına ulaşılamadı.', 'error');
    }
}

// --- DETAYLI TESCİL SORGULA (SAYFA) ---
async function detayliSorguTescil() {
    const input = document.getElementById('tescilInputBig');
    const resultBox = document.getElementById('tescilResultBox');
    const btn = document.getElementById('detayliBtn');
    
    if(!input || !resultBox) return;
    
    const val = input.value.trim().toUpperCase();
    if(val === '') {
        showToast('Eksik Bilgi', 'Tescil kodu alanı boş bırakılamaz.', 'error');
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Aranıyor...';
    btn.style.opacity = '0.7';
    resultBox.style.display = 'none';
    
    try {
        const docRef = await db.collection("Eserler").doc(val).get();
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        
        if(docRef.exists) {
            const eser = docRef.data();
            const tarihStr = eser.tarih ? eser.tarih.toDate().toLocaleString('tr-TR') : 'Bilinmiyor';
            
            resultBox.innerHTML = `
                <h3 class="result-title">Tescil Kaydı Bulundu</h3>
                <div class="result-row"><div class="result-key">Eser Adı</div><div class="result-val">${eser.baslik}</div></div>
                <div class="result-row"><div class="result-key">Şair / Yazar Adı</div><div class="result-val">${eser.yazar}</div></div>
                <div class="result-row"><div class="result-key">Tescil Tarihi</div><div class="result-val" style="font-family: var(--font-sans); font-size:1rem;">${tarihStr}</div></div>
                <div class="result-row"><div class="result-key">Eser Türü</div><div class="result-val">${eser.tur}</div></div>
                <div class="result-row"><div class="result-key">Mülkiyet Durumu</div><div class="result-val"><span class="result-badge-ok">DOĞRULANDI VE KORUMA ALTINDA</span></div></div>
            `;
            
            resultBox.style.display = 'block';
            showToast('Eser Bulundu', 'Tescil kaydı başarıyla getirildi.', 'success');
        } else {
            showToast('Kayıt Yok', 'Sistemde böyle bir tescil kodu bulunamadı.', 'error');
        }
    } catch(err) {
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        showToast('Hata', 'Sorgu sırasında veritabanına ulaşılamadı.', 'error');
    }
}

// --- ESER PAYLAŞIM FORMU ---
async function submitEser(event) {
    event.preventDefault();
    
    // OTURUM KONTROLÜ
    const user = auth.currentUser;
    if(!user) {
        showToast('Yetkisiz İşlem', 'Eser tescil etmek için önce giriş yapmalısınız.', 'error');
        setTimeout(() => { window.location.href = 'auth.html'; }, 2000);
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    // Form verilerini al
    const form = event.target;
    const baslik = form.querySelector('input[placeholder="Örn: Sessiz Gemi"]').value.trim();
    const yazar = form.querySelector('input[placeholder="Kendi adınız veya mahlasınız"]').value.trim();
    const tur = form.querySelector('select').value;
    const metin = form.querySelector('textarea').value.trim();
    
    if(!baslik || !yazar || !metin) {
        showToast('Eksik Bilgi', 'Lütfen tüm alanları doldurun.', 'error');
        return;
    }
    
    btn.innerHTML = 'İntihal Taraması Yapılıyor...';
    btn.style.opacity = '0.7';
    
    // --- İNTİHAL (KOPYA) KONTROL SİSTEMİ ---
    try {
        const cleanMetin = metin.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
        let intihalKodu = null;
        
        // 1. Eserler (Kullanıcı Tescilleri) Taraması
        const eserlerSnap = await db.collection("Eserler").get();
        eserlerSnap.forEach(doc => {
            const rawOld = doc.data().metin || "";
            const cleanOld = rawOld.replace(/<br>/g, '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
            // Eğer boşluksuz/noktalamasız metinler tamamen aynıysa, veya biri diğerinin içinde geçiyorsa
            if(cleanOld === cleanMetin || (cleanMetin.includes(cleanOld) && cleanOld.length > 20) || (cleanOld.includes(cleanMetin) && cleanMetin.length > 20)) {
                intihalKodu = doc.id;
            }
        });
        
        // 2. Klasikler Taraması
        if(!intihalKodu) {
            const klasiklerSnap = await db.collection("Klasikler").get();
            klasiklerSnap.forEach(doc => {
                const rawOld = doc.data().metin || "";
                const cleanOld = rawOld.replace(/<br>/g, '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
                if(cleanOld === cleanMetin || (cleanMetin.includes(cleanOld) && cleanOld.length > 20) || (cleanOld.includes(cleanMetin) && cleanMetin.length > 20)) {
                    intihalKodu = doc.id;
                }
            });
        }
        
        // Eğer kopya bulunduysa kaydetmeyi reddet
        if(intihalKodu) {
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            showToast('İntihal Tespit Edildi!', `Bu eser zaten sistemimizde [${intihalKodu}] koduyla tescillidir. Başkasının eserini alamazsınız.`, 'error');
            return;
        }
    } catch(err) {
        console.error("İntihal Taraması Hatası:", err);
    }

    btn.innerHTML = 'Tescilleniyor...';
    
    // Benzersiz Tescil Kodu
    const tescilKodu = "TM-2025-" + Math.floor(10000 + Math.random() * 90000);
    
    try {
        await db.collection("Eserler").doc(tescilKodu).set({
            id: tescilKodu,
            baslik: baslik,
            yazar: yazar,
            tur: tur,
            metin: metin.replace(/\n/g, '<br>'), // satır atlamalarını koru
            kisaltma: yazar.charAt(0).toUpperCase(),
            tarih: firebase.firestore.FieldValue.serverTimestamp(),
            sahipUid: user.uid,       // Eseri yükleyen kişinin Firebase kimliği
            sahipEmail: user.email    // Eseri yükleyen kişinin e-postası
        });
        
        // --- EMAILJS İLE TESCİL MAİLİ GÖNDERME ---
        try {
            emailjs.init("xCey005-FS4NnPHWS");
            await emailjs.send("service_73nxjfr", "template_ueem53r", {
                user_email: user.email,
                user_name: yazar,
                eser_baslik: baslik,
                tescil_kodu: tescilKodu
            });
            console.log("Tescil maili başarıyla gönderildi!");
        } catch (mailErr) {
            console.error("Mail gönderim hatası:", mailErr);
        }
        
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        showToast('Tescil Başarılı', 'Eseriniz kaydedildi ve tescil kodunuz e-postanıza gönderildi!', 'success');
        form.reset();
        
    } catch(err) {
        console.error("Kayıt Hatası:", err);
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        showToast('Hata', 'Kayıt sırasında sunucu hatası oluştu.', 'error');
    }
}

// --- TYPEWRITER EFFECT ---
function setupTypewriter() {
    const tw = document.querySelector('.typewriter');
    if(!tw) return;
    
    const text = tw.getAttribute('data-text');
    tw.innerHTML = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            tw.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 50);
        }
    }
    
    setTimeout(type, 500);
}

// --- USTA ŞAİRLER (KLASİKLER) VERİTABANI ---

async function renderKlasikler(filtre = "Tümü") {
    const grid = document.getElementById('klasiklerGrid');
    if(!grid) return;
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); font-size:1.1rem; padding: 3rem 0;">Ölümsüz eserler veritabanından getiriliyor...</p>';
    
    try {
        const snapshot = await db.collection("Klasikler").get();

        grid.innerHTML = '';
        const eserler = [];
        snapshot.forEach(doc => {
            let data = doc.data();
            data.id = doc.id; // Firebase doküman ID'sini al
            eserler.push(data);
        });
        
        let filtrelenmis = eserler;
        if(filtre !== "Tümü") {
            const searchVal = filtre.toLowerCase().trim();
            filtrelenmis = eserler.filter(s => {
                if(!s.yazar) return false;
                return s.yazar.toLowerCase().includes(searchVal) || searchVal.includes(s.yazar.toLowerCase());
            });
        }
        
        if(filtrelenmis.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); font-size:1.1rem; font-style:italic; padding: 3rem 0;">Eser bulunamadı.</p>';
            return;
        }
        
        filtrelenmis.forEach((eser, index) => {
            const gecikme = index * 0.1;
            
            let kisaMetin = eser.metin;
            const misralar = eser.metin.split('<br>');
            if(misralar.length > 4) {
                kisaMetin = misralar.slice(0, 4).join('<br>') + '<br><span style="color:var(--gold); font-style:italic; font-size:0.9rem;">...devamını oku</span>';
            }

            const card = document.createElement('div');
            card.className = 'poem-card reveal active';
            card.style.transitionDelay = gecikme + 's';
            card.style.cursor = 'pointer';
            card.onclick = () => { window.location.href = 'eser.html?id=' + eser.id; };
            
            card.innerHTML = `
                <div class="klasik-badge">Ölümsüz Eser</div>
                <h3 class="poem-card-title" style="margin-top:1rem;">${eser.baslik}</h3>
                <div class="poem-excerpt"><p>${kisaMetin}</p></div>
                <div class="poem-card-footer">
                  <div class="poem-card-author">
                    <div class="author-avatar">${eser.yazar.charAt(0)}</div>
                    <span style="font-weight:600; color:var(--gold)">${eser.yazar}</span>
                  </div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch(err) {
        console.error("Klasikler Hatası:", err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--red-accent);">Bağlantı hatası: Veritabanına ulaşılamadı.</p>';
    }
}

// --- TEKİL ESER GÖRÜNTÜLEME (eser.html) ---
async function loadEserSayfasi() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if(!id) {
        document.getElementById('eTitle').innerText = "Eser Bulunamadı";
        document.getElementById('eText').innerText = "URL'de tescil veya eser kodu eksik.";
        return;
    }
    
    try {
        let docRef;
        const colName = id.startsWith("KLASIK") ? "Klasikler" : "Eserler";
        const ref = db.collection(colName).doc(id);
        
        try {
            await ref.update({ goruntulenme: firebase.firestore.FieldValue.increment(1) });
        } catch(e) {}
        
        docRef = await ref.get();
        
        if(!docRef.exists) {
            document.getElementById('eTitle').innerText = "Hata 404";
            document.getElementById('eText').innerText = "Sistemimizde bu koda ait bir eser bulunmamaktadır.";
            return;
        }
        
        const eser = docRef.data();
        document.getElementById('eTitle').innerText = eser.baslik;
        document.getElementById('eAuthor').innerText = eser.yazar;
        document.getElementById('eText').innerHTML = eser.metin;
        document.getElementById('eCode').innerText = id;
        
        const viewEl = document.getElementById('viewCountText');
        if(viewEl) viewEl.innerText = (eser.goruntulenme || 1);
        
        if(eser.tarih && eser.tarih.toDate) {
            document.getElementById('eDate').innerText = eser.tarih.toDate().toLocaleDateString('tr-TR');
        } else {
            document.getElementById('eDate').innerText = "Arşiv Kaydı";
        }
        
        // Navigasyon Ayarları
        setupPoemNavigation(colName, eser.yazar, id);

        // BEĞENİ SİSTEMİ
        const likes = eser.likes || [];
        const likeCountEl = document.getElementById('likeCount');
        const btnLike = document.getElementById('btnLike');
        const likeIcon = document.getElementById('likeIcon');
        
        likeCountEl.innerText = likes.length;
        
        auth.onAuthStateChanged(user => {
            if(user && likes.includes(user.uid)) {
                likeIcon.setAttribute('fill', 'var(--red-accent)');
            }
            
            btnLike.onclick = async () => {
                if(!user) {
                    showToast('Hata', 'Eserleri beğenmek için giriş yapmalısınız.', 'error');
                    return;
                }
                
                if(btnLike.getAttribute('data-processing') === 'true') return;
                btnLike.setAttribute('data-processing', 'true');
                btnLike.style.opacity = '0.7';
                
                try {
                    const colName = id.startsWith("KLASIK") ? "Klasikler" : "Eserler";
                    const ref = db.collection(colName).doc(id);
                    
                    // Beğeni işlemini (Like/Unlike) yap
                    if(likes.includes(user.uid)) {
                        await ref.set({ likes: firebase.firestore.FieldValue.arrayRemove(user.uid) }, { merge: true });
                        likeIcon.setAttribute('fill', 'none');
                        // Tekrar kontrol: başkası tıklamış olabilir, yerel listeyi güvenli güncelle
                        const idx = likes.indexOf(user.uid);
                        if(idx > -1) likes.splice(idx, 1);
                    } else {
                        await ref.set({ likes: firebase.firestore.FieldValue.arrayUnion(user.uid) }, { merge: true });
                        likeIcon.setAttribute('fill', 'var(--red-accent)');
                        if(!likes.includes(user.uid)) likes.push(user.uid);
                    }
                    likeCountEl.innerText = likes.length;
                } catch(err) {
                    console.error("Beğeni eklenirken hata:", err);
                    showToast('Hata', 'İşlem başarısız oldu.', 'error');
                } finally {
                    btnLike.setAttribute('data-processing', 'false');
                    btnLike.style.opacity = '1';
                }
            };
        });
        
        // Yetki kontrolü (Silme işlemi için)
        checkAdminSil(id, eser);
        
        // Yorumları Yükle
        yukleYorumlar(colName, id);
        
        auth.onAuthStateChanged(user => {
            const warn = document.getElementById('commentAuthWarning');
            const inp = document.getElementById('commentInputArea');
            if(warn && inp) {
                if(user) {
                    warn.style.display = 'none';
                    inp.style.display = 'block';
                } else {
                    warn.style.display = 'block';
                    inp.style.display = 'none';
                }
            }
        });
        
    } catch(err) {
        console.error("Eser yüklenirken hata:", err);
        document.getElementById('eTitle').innerText = "Bağlantı Koptu";
        document.getElementById('eText').innerText = "Veritabanından eser çekilemedi. Lütfen sayfayı yenileyin.";
    }
}

// --- AYNI YAZARIN DİĞER ŞİİRLERİ ARASINDA GEÇİŞ ---
async function setupPoemNavigation(colName, yazar, currentId) {
    const navDiv = document.getElementById('poemNavigation');
    const prevBtn = document.getElementById('prevPoem');
    const nextBtn = document.getElementById('nextPoem');

    if(!navDiv || !prevBtn || !nextBtn) return;

    try {
        // Aynı yazarın tüm eserlerini çek (basitlik için tarihe veya başlığa göre sıralanabilir)
        const snapshot = await db.collection(colName).where("yazar", "==", yazar).get();
        if(snapshot.size <= 1) {
            navDiv.style.display = 'none';
            return;
        }

        const poems = [];
        snapshot.forEach(doc => {
            poems.push({ id: doc.id, ...doc.data() });
        });

        // Mevcut şiirin indeksini bul
        const currentIndex = poems.findIndex(p => p.id === currentId);

        if(currentIndex > 0) {
            const prev = poems[currentIndex - 1];
            prevBtn.href = `eser.html?id=${prev.id}`;
            prevBtn.style.opacity = '1';
            prevBtn.style.pointerEvents = 'auto';
            prevBtn.title = prev.baslik;
        } else {
            prevBtn.style.opacity = '0.3';
            prevBtn.style.pointerEvents = 'none';
        }

        if(currentIndex < poems.length - 1) {
            const next = poems[currentIndex + 1];
            nextBtn.href = `eser.html?id=${next.id}`;
            nextBtn.style.opacity = '1';
            nextBtn.style.pointerEvents = 'auto';
            nextBtn.title = next.baslik;
        } else {
            nextBtn.style.opacity = '0.3';
            nextBtn.style.pointerEvents = 'none';
        }

        navDiv.style.display = 'flex';

    } catch(err) {
        console.error("Navigasyon yüklenemedi:", err);
        navDiv.style.display = 'none';
    }
}

// --- ADMİN VEYA ESER SAHİBİ SİLME İŞLEMİ ---
function checkAdminSil(eserId, eserData) {
    auth.onAuthStateChanged(async (user) => {
        if(user) {
            let yetkili = false;
            
            // Eserin sahibi mi?
            if(eserData && eserData.sahipUid === user.uid) {
                yetkili = true;
            }
            
            // Eğer eserin sahibi değilse, admin mi diye kontrol et
            if(!yetkili) {
                const userDoc = await db.collection("Kullanicilar").doc(user.uid).get();
                if(userDoc.exists && userDoc.data().rol === "admin") {
                    yetkili = true;
                }
            }
            
            if(yetkili) {
                const actionContainer = document.getElementById('adminActionContainer');
                if(actionContainer) {
                    if(eserData && eserData.sahipUid === user.uid) {
                        const p = actionContainer.querySelector('p');
                        if(p) p.innerText = "Bu eser size ait olduğu için onu veritabanından silebilirsiniz.";
                    }
                    actionContainer.style.display = 'block';
                    document.getElementById('btnSil').onclick = async () => {
                        const onay = confirm("Bu eseri KALICI olarak silmek istediğinize emin misiniz? (Bu işlem geri alınamaz)");
                        if(onay) {
                            try {
                                const colName = eserId.startsWith("KLASIK") ? "Klasikler" : "Eserler";
                                await db.collection(colName).doc(eserId).delete();
                                showToast('Silindi', 'Eser veritabanından kalıcı olarak kaldırıldı.', 'success');
                                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                            } catch(err) {
                                console.error(err);
                                showToast('Hata', 'Silme işlemi başarısız oldu.', 'error');
                            }
                        }
                    };
                }
            }
        }
    });
}

// --- RESİM OLARAK İNDİR (INSTAGRAM İÇİN) ---
function indirResim() {
    if (typeof window.html2canvas === 'undefined') {
        showToast('Hata', 'Görsel motoru yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.', 'error');
        return;
    }

    const box = document.getElementById('eserReaderBox');
    const btnContainer = box.querySelector('.eser-actions');
    const adminContainer = document.getElementById('adminActionContainer');
    
    if(!box) return;

    showToast('Hazırlanıyor...', 'Eser resme dönüştürülüyor, lütfen bekleyin...', 'success');

    // Admin/Sil butonunun resim çekilmeden önceki görünürlük durumu
    const adminGorunurMu = adminContainer && adminContainer.style.display !== 'none';

    // Resimde butonların çıkmaması için geçici olarak gizle
    if(btnContainer) btnContainer.style.display = 'none';
    if(adminContainer) adminContainer.style.display = 'none';
    
    // Rengi sabitle (css variable boşluklarını temizleyerek)
    const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#ffffff';
    const bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-body').trim() || '#ffffff';
    box.style.background = cardColor;
    
    html2canvas(box, {
        scale: 2, // 2x yüksek çözünürlük
        useCORS: true,
        backgroundColor: bodyColor,
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'suarayimecmua-eser.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link); // Firefox ve eski Chrome uyumluluğu
        link.click();
        document.body.removeChild(link);
        
        // Butonları resim işlemi bittikten sonra eski haline getir
        if(btnContainer) btnContainer.style.display = 'flex';
        if(adminGorunurMu) adminContainer.style.display = 'block';
        
        showToast('Başarılı', 'Şiir cihazınıza mükemmel kalitede kaydedildi!', 'success');
    }).catch(err => {
        console.error("Resim oluşturma hatası:", err);
        showToast('Hata', 'Resim oluşturulamadı. Sorun tarayıcınızdan kaynaklanıyor olabilir.', 'error');
        if(btnContainer) btnContainer.style.display = 'flex';
        if(adminGorunurMu) adminContainer.style.display = 'block';
    });
}


// --- ŞAİRLER (YAZARLAR) LİSTESİNİ OLUŞTUR ---
async function renderSairler() {
    const grid = document.getElementById('poetsGrid');
    if(!grid) return;
    
    try {
        const snapshot = await db.collection("Klasikler").get();
        if(snapshot.empty) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted);">Henüz şair bulunmuyor.</p>';
            return;
        }
        
        const yazarlarSet = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            if(data.yazar) yazarlarSet.add(data.yazar);
        });
        
        const yazarlar = Array.from(yazarlarSet).sort();
        
        grid.innerHTML = '';
        
        yazarlar.forEach((yazar, i) => {
            const gecikme = i * 0.1;
            const basHarfler = yazar.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'poet-card';
            card.style.animation = `fadeUp 0.6s ease ${gecikme}s forwards`;
            card.style.opacity = '0';
            card.onclick = () => { location.href = 'yazar.html?isim=' + encodeURIComponent(yazar); };
            
            card.innerHTML = `
                <div class="poet-avatar">${basHarfler}</div>
                <h3 class="poet-name">${yazar}</h3>
                <p class="poet-desc">Klasik Şair</p>
            `;
            grid.appendChild(card);
        });
        
        // Tüm Şiirler kartı
        const allCard = document.createElement('div');
        allCard.className = 'poet-card';
        allCard.style.animation = `fadeUp 0.6s ease ${yazarlar.length * 0.1}s forwards`;
        allCard.style.opacity = '0';
        allCard.onclick = () => { location.href = 'klasikler.html'; };
        allCard.innerHTML = `
            <div class="poet-avatar" style="background:var(--red-accent)">+</div>
            <h3 class="poet-name">Tüm Eserler</h3>
            <p class="poet-desc">Klasiklerin Tamamını Keşfet</p>
        `;
        grid.appendChild(allCard);
        
    } catch(err) {
        console.error("Şairler yüklenirken hata:", err);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--red-accent);">Şairler yüklenirken hata oluştu.</p>';
    }
}

// --- YORUM SİSTEMİ ---
async function yukleYorumlar(colName, eserId) {
    const list = document.getElementById('commentsList');
    if(!list) return;

    try {
        const snapshot = await db.collection(colName).doc(eserId).collection("Yorumlar").orderBy("tarih", "desc").get();
        if(snapshot.empty) {
            list.innerHTML = '<p style="color:var(--text-muted); font-style:italic;">Henüz yorum yapılmamış. İlk değerlendirmeyi siz yapın.</p>';
            return;
        }

        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            div.style.padding = "1.5rem";
            div.style.borderLeft = "2px solid var(--gold)";
            div.style.background = "var(--bg-color-alt)";
            div.style.borderRadius = "0 var(--r) var(--r) 0";
            
            const tarihStr = data.tarih && data.tarih.toDate ? data.tarih.toDate().toLocaleDateString('tr-TR') : '';
            
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; align-items:center;">
                    <strong style="color:var(--gold-dark); font-size:1.1rem;">${data.yazar}</strong>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${tarihStr}</span>
                </div>
                <p style="color:var(--text-soft); line-height:1.6;">${data.metin.replace(/\\n/g, '<br>')}</p>
            `;
            list.appendChild(div);
        });
    } catch(err) {
        list.innerHTML = '<p style="color:var(--red-accent);">Yorumlar yüklenirken bir hata oluştu.</p>';
    }
}

async function gonderYorum() {
    const text = document.getElementById('commentText').value.trim();
    if(!text) {
        showToast('Hata', 'Yorum boş olamaz.', 'error');
        return;
    }

    const user = auth.currentUser;
    if(!user) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const colName = id.startsWith("KLASIK") ? "Klasikler" : "Eserler";
    
    const btn = document.getElementById('btnSubmitComment');
    btn.disabled = true;
    btn.innerText = "Gönderiliyor...";

    try {
        const userDoc = await db.collection("Kullanicilar").doc(user.uid).get();
        let isim = "İsimsiz Okur";
        if(userDoc.exists) isim = userDoc.data().isim || isim;

        await db.collection(colName).doc(id).collection("Yorumlar").add({
            uid: user.uid,
            yazar: isim,
            metin: text,
            tarih: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Başarılı', 'Yorumunuz eklendi!', 'success');
        document.getElementById('commentText').value = '';
        yukleYorumlar(colName, id);
    } catch(err) {
        showToast('Hata', 'Yorum gönderilirken hata oluştu.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = "Yorumu Gönder";
    }
}

// --- YAZAR DETAY SAYFASI (yazar.html) ---
async function yukleYazarSayfasi(isim) {
    const yName = document.getElementById('yName');
    const yAvatar = document.getElementById('yAvatar');
    const yCount = document.getElementById('yCount');
    const yGrid = document.getElementById('yazarGrid');
    
    if(!yName || !yGrid) return;
    
    yName.innerText = isim;
    yAvatar.innerText = isim.charAt(0).toUpperCase();
    
    try {
        const snapshot = await db.collection("Klasikler").where("yazar", "==", isim).get();
        yGrid.innerHTML = '';
        
        if(snapshot.empty) {
            yGrid.innerHTML = '<p style="grid-column:1/-1; color:var(--text-muted);">Bu şaire ait henüz bir eser bulunamadı.</p>';
            yCount.innerText = "0";
            return;
        }
        
        yCount.innerText = snapshot.size;
        
        snapshot.forEach((doc, index) => {
            const eser = doc.data();
            const id = doc.id;
            const gecikme = index * 0.1;

            let kisaMetin = eser.metin;
            const misralar = eser.metin.split('<br>');
            if(misralar.length > 4) {
                kisaMetin = misralar.slice(0, 4).join('<br>') + '<br><span style="color:var(--gold); font-style:italic; font-size:0.9rem;">...devamını oku</span>';
            }

            const card = document.createElement('div');
            card.className = 'poem-card reveal active';
            card.style.transitionDelay = gecikme + 's';
            card.onclick = () => { window.location.href = 'eser.html?id=' + id; };
            
            card.innerHTML = `
                <div class="klasik-badge">Klasik Eser</div>
                <h3 class="poem-card-title" style="margin-top:1rem;">${eser.baslik}</h3>
                <div class="poem-excerpt"><p>${kisaMetin}</p></div>
                <div class="poem-card-footer">
                  <div class="poem-card-author">
                    <div class="author-avatar">${eser.yazar.charAt(0)}</div>
                    <span style="font-weight:600; color:var(--gold)">${eser.yazar}</span>
                  </div>
                </div>
            `;
            yGrid.appendChild(card);
        });
    } catch(err) {
        console.error("Yazar sayfası hatası:", err);
        yGrid.innerHTML = '<p style="color:var(--red-accent);">Bilgiler yüklenirken hata oluştu.</p>';
    }
}
