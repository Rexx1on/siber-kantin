"use strict";

// KİŞİSEL BİLGİLER: okul numaranın son rakamını ve adını değiştir.
const OKUL_NO_SON_RAKAM = 0;
const OGRENCI_ADI = "OGRENCI";
const YEMEK_LIMITI = OKUL_NO_SON_RAKAM + 6;

let tepsi = guvenliTepsiOku();
let vitrinYemekleri = [];
let indirim = 1;

function guvenliTepsiOku() {
  try {
    const kayit = JSON.parse(localStorage.getItem("kampusTepsi") || "[]");
    return Array.isArray(kayit) ? kayit.filter(y => y && y.ad) : [];
  } catch (_) { return []; }
}

$(document).ready(function () {
  $("#kuponAdi, #ogrenciLogo").text(OGRENCI_ADI);
  $("#duyuruBtn").on("click", function () { $("#gizliKuponKutusu").slideToggle(400); });
  sayacGuncelle();
  yemekleriGetir();
  tabloyuCiz();
});

async function yemekleriGetir() {
  const liste = document.getElementById("yemek-listesi");
  if (!liste) return;
  const durum = document.getElementById("yuklemeDurumu");
  durum.textContent = "Günün tarifleri yükleniyor…";
  try {
    const cevap = await fetch(`https://dummyjson.com/recipes?limit=${YEMEK_LIMITI}`);
    if (!cevap.ok) throw new Error("Tarif servisine ulaşılamadı");
    const veri = await cevap.json();
    vitrinYemekleri = Array.isArray(veri.recipes) ? veri.recipes : [];
    durum.textContent = "DummyJSON tarif kataloğu · Fiyatlar kalori değerine göre hesaplanır.";
  } catch (_) {
    vitrinYemekleri = ornekYemekler();
    durum.textContent = "Canlı tarif servisine ulaşılamadı; örnek menü gösteriliyor.";
  }
  vitrineBas(vitrinYemekleri);
}

function ornekYemekler() {
  return [
    { id: 1, name: "Akdeniz Nohut Kasesi", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", caloriesPerServing: 380, prepTimeMinutes: 20, rating: 4.8 },
    { id: 2, name: "Izgara Sebzeli Tavuk", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80", caloriesPerServing: 520, prepTimeMinutes: 30, rating: 4.7 },
    { id: 3, name: "Renkli Tahıl Salatası", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80", caloriesPerServing: 340, prepTimeMinutes: 15, rating: 4.6 },
    { id: 4, name: "Sebzeli Makarna", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80", caloriesPerServing: 460, prepTimeMinutes: 25, rating: 4.9 },
    { id: 5, name: "Mercimek Güç Kasesi", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80", caloriesPerServing: 410, prepTimeMinutes: 18, rating: 4.5 },
    { id: 6, name: "Meyveli Yoğurt", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80", caloriesPerServing: 290, prepTimeMinutes: 8, rating: 4.8 }
  ];
}

function vitrineBas(yemekler) {
  const alan = $("#yemek-listesi").empty();
  if (!yemekler.length) {
    alan.html('<div class="col-12"><div class="alert alert-secondary">Menüde gösterilecek tarif bulunamadı.</div></div>');
    return;
  }
  yemekler.forEach(yemek => {
    const fiyat = Math.round(Number(yemek.caloriesPerServing) / 4);
    let rozetRenk;
    if (Number(yemek.caloriesPerServing) > 400) rozetRenk = "bg-danger";
    else rozetRenk = "bg-success";
    const ad = htmlGuvenli(yemek.name || "Kampüs yemeği");
    const resim = htmlGuvenli(yemek.image || "");
    const kart = `<div class="col-12 col-md-6 col-lg-4"><article class="card bg-black text-light h-100 meal-card"><div class="position-relative"><span class="badge ${rozetRenk} position-absolute top-0 end-0 m-2">${Number(yemek.caloriesPerServing) || 0} kcal</span><img src="${resim}" class="card-img-top meal-photo" alt="${ad}" loading="lazy"></div><div class="card-body d-flex flex-column"><h3 class="h5 card-title text-success fw-bold">${ad}</h3><p class="text-secondary small">⏱️ Hazırlanma: ${Number(yemek.prepTimeMinutes) || 0} dk · ⭐ ${Number(yemek.rating) || "—"}</p><div class="d-flex justify-content-between align-items-center mt-auto pt-3"><span class="meal-price">${fiyat} TL</span><button onclick="tepsiyeEkle(${Number(yemek.id)})" class="btn btn-success btn-sm fw-bold"><i class="fa-solid fa-plus"></i> Tepsiye ekle</button></div></div></article></div>`;
    alan.append(kart);
  });
}

function tepsiyeEkle(id) {
  const secilen = vitrinYemekleri.find(y => Number(y.id) === Number(id));
  if (!secilen) return;
  tepsi.push({ id: secilen.id, ad: secilen.name, resim: secilen.image, kalori: Number(secilen.caloriesPerServing) || 0, sure: Number(secilen.prepTimeMinutes) || 0, fiyat: Math.round((Number(secilen.caloriesPerServing) || 0) / 4) });
  tepsiKaydet();
  sayacGuncelle();
}

function tepsiKaydet() { localStorage.setItem("kampusTepsi", JSON.stringify(tepsi)); }
function sayacGuncelle() { $("#tepsiSayaci").text(tepsi.length); }

function tabloyuCiz() {
  const govde = document.getElementById("tepsiTabloGovdesi");
  if (!govde) return;
  const alan = $(govde).empty();
  let topKalori = 0, topSure = 0, topFiyat = 0;
  if (!tepsi.length) alan.html('<tr><td colspan="6" class="text-secondary py-4">Tepsin boş. Menüden yemek ekleyebilirsin.</td></tr>');
  tepsi.forEach((urun, index) => {
    topKalori += Number(urun.kalori) || 0;
    topSure += Number(urun.sure) || 0;
    topFiyat += Number(urun.fiyat) || 0;
    const ad = htmlGuvenli(urun.ad);
    const resim = htmlGuvenli(urun.resim || "");
    alan.append(`<tr><td><img src="${resim}" alt="${ad}" width="68" height="52" class="rounded object-fit-cover"></td><td class="fw-bold">${ad}</td><td>${Number(urun.kalori) || 0} kcal</td><td>${Number(urun.sure) || 0} dk</td><td class="text-warning fw-bold">${Number(urun.fiyat) || 0} TL</td><td><button onclick="urunSil(${index})" class="btn btn-sm btn-danger" aria-label="${ad} yemeğini sil"><i class="fa-solid fa-trash"></i></button></td></tr>`);
  });
  $("#toplamKalori").text(`${topKalori} kcal`);
  $("#toplamSure").text(`${topSure} dk`);
  $("#toplamFiyat").text(`${Math.round(topFiyat * indirim)} TL`);
}

function urunSil(index) {
  tepsi.splice(index, 1);
  tepsiKaydet();
  tabloyuCiz();
  sayacGuncelle();
}

function indirimYap() {
  const girilen = String($("#kuponInput").val() || "").trim().toLocaleUpperCase("tr-TR");
  if (girilen === OGRENCI_ADI) {
    indirim = 0.75;
    $("#indirimMesaj").html('<div class="alert alert-success py-1 small">✅ %25 öğrenci indirimi uygulandı!</div>');
  } else {
    indirim = 1;
    $("#indirimMesaj").html('<div class="alert alert-danger py-1 small">❌ Geçersiz kod. Ana menüde görünen kişisel kodu kullan.</div>');
  }
  tabloyuCiz();
}

function siparisVer(e) {
  e.preventDefault();
  if (!tepsi.length) { alert("Tepsin boş! Önce menüden yemek ekle."); return; }
  alert("Siparişin onaylandı! Afiyet olsun.");
  tepsi = [];
  localStorage.removeItem("kampusTepsi");
  window.location.href = "index.html";
}

function htmlGuvenli(deger) {
  return String(deger).replace(/[&<>"']/g, karakter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[karakter]);
}
