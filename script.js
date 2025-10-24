const formNik = document.getElementById("formNik");

import {
  CheckNik,
  DashboardApi,
  getAntrean,
  hitungUsia,
  settings,
} from "./lib/hit-api.js";
const API_BASE = `${location.protocol}//${location.host}`;

const listPoli = [
  {
    id_poliklinik: 1,
    nama_ruang: "Ruang 1",
    nama_pemeriksaan: "Ibu Hamil, Bersalin & Nifas",
    keterangan: "Untuk semua usia",
    kode_poli: 1,
  },
  {
    id_poliklinik: 2,
    nama_ruang: "Ruang 2",
    nama_pemeriksaan: "Bayi, Balita, & Anak Prasekolah",
    keterangan: "Usia < 7 Tahun",
    kode_poli: 2,
  },
  {
    id_poliklinik: 3,
    nama_ruang: "Ruang 3",
    nama_pemeriksaan: "Anak Usia Sekolah & Remaja",
    keterangan: "Usia 7 - 18 Tahun",
    kode_poli: 3,
  },
  {
    id_poliklinik: 4,
    nama_ruang: "Ruang 4",
    nama_pemeriksaan: "Dewasa",
    keterangan: "Usia 19 - 59 Tahun",
    kode_poli: 4,
  },
  {
    id_poliklinik: 5,
    nama_ruang: "Ruang 5",
    nama_pemeriksaan: "Lanjut Usia",
    keterangan: "Usia 60 Tahun ke atas",
    kode_poli: 5,
  },
  {
    id_poliklinik: 6,
    nama_ruang: "Ruang 6",
    nama_pemeriksaan: "Pemeriksaan Gigi & Mulut",
    keterangan: "Untuk semua usia",
    kode_poli: 6,
  },
  {
    id_poliklinik: 7,
    nama_ruang: "Ruang 7",
    nama_pemeriksaan: "Dewasa (K)",
    keterangan: "Untuk semua usia",
    kode_poli: 7,
  },
];

window.addEventListener("load", async () => {
  await DashboardApi();
});

formNik.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertContainer.innerHTML = "";
  layananList.innerHTML = "";

  const formData = new FormData(formNik);
  const nik = formData.get("nik");
  const baseUrl = `${location.protocol}//${location.host}`;

  // Validasi panjang NIK
  if (nik.length < 10 && nik.length > 16) {
    alertContainer.innerHTML = `
                    <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100">
                        ⚠️ Minimal 10 Digit dan Maksimal 16 Digit.
                    </div>
                `;
    return;
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Memuat...";

  try {
    const response = await CheckNik(nik);
    const data = response;

    if (data.detail?.status === true) {
      const detail = data.detail.data;
      const layanan = data.layanan?.data.data ?? [];

      alertContainer.innerHTML = `
                          <div class="p-4 mb-1.5 text-sm text-green-800 rounded-lg bg-green-100">
                              ✅ ${data.detail.message || "Data ditemukan"} 
                          </div>
                          <div class="mb-8 border border-green-300 rounded-md p-4">
                            <div class="w-full grid grid-cols-6 gap-x-4">
                              <div class="col-span-2 font-medium">Pasien</div>
                              <div class="col-span-4 font-bold">${
                                detail.nama
                              }</div>
                            </div>

                            <div class="w-full grid grid-cols-6 gap-x-4">
                              <div class="col-span-2 font-medium">NIK</div>
                              <div class="col-span-4 font-bold">${
                                detail.nik
                              }</div>
                            </div>

                            <div class="w-full grid grid-cols-6 gap-x-4">
                              <div class="col-span-2 font-medium">Usia/Umur</div>
                              <div class="col-span-4 font-bold">${hitungUsia(
                                detail.tgl_lahir
                              )}</div>
                            </div>
                            
                          </div>
                      `;

      // layanan
      // console.log(layanan);
      layananList.innerHTML = layanan
        .map((l) => {
          const poli = listPoli.filter(
            (poli) => l.kode_ruang === poli.kode_poli
          )[0];
          return `
                          <div class="layanan-card p-4 bg-white border border-gray-300 rounded-lg shadow hover:bg-blue-50 cursor-pointer transition"
                               data-id_ruang="${l.kode_ruang}"
                               data-id_dokter="${l.id_dokter}"
                               data-nik="${detail.nik}">
                              <h3 class="font-bold text-lg mb-1">${l.nama_pemeriksaan}</h3>
                              <p class="text-sm text-gray-600">Ruang: ${l.no_ruang}</p>
                              <p class="text-sm text-gray-600">Dokter: <span class="font-medium text-gray-900">${l.nama_dokter}</span></p>
                              <p class="text-sm text-gray-800 italic mt-3">${poli.keterangan}</p>
                          </div>
                      `;
        })
        .join("");

      document.querySelectorAll(".layanan-card").forEach((card) => {
        card.addEventListener("click", async () => {
          const id_ruang = card.dataset.id_ruang;
          const id_dokter = card.dataset.id_dokter;
          const nik = card.dataset.nik;

          // Highlight kartu yang diklik
          card.classList.add("bg-blue-100");

          card.innerHTML += `<p class="mt-2 text-xs text-blue-700">Mengambil antrian...</p>`;

          try {
            const res = await getAntrean({ nik, id_ruang, dokter: id_dokter });

            const result = res;

            // console.log(result, "ini result <----");
            if (result.status === true) {
              alertContainer.innerHTML = `
                                        <div class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-100">
                                            🎫 Antrian berhasil diambil: <strong>${
                                              result.data.nomor_antrian ||
                                              "(nomor tidak tersedia)"
                                            }</strong> | PIN: <strong>${
                result.data.pin || "(pin tidak tersedia)"
              }</strong>
                                        </div>
                                    `;

              const afterNumber = await fetch(
                `${settings.IP_SERVER}/api/print-struk`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(result),
                }
              ).then((res) => res.json());
              // console.log(afterNumber);
              if (afterNumber.status == 200) {
                window.location.href = baseUrl;
              }
            } else {
              alertContainer.innerHTML = `
                                        <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100">
                                            ⚠️ Gagal mengambil antrian: ${
                                              result.message ||
                                              "Terjadi kesalahan"
                                            }
                                        </div>
                                    `;
            }
          } catch (err) {
            alertContainer.innerHTML = `
                                    <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100">
                                        ❌ Gagal koneksi ke server.
                                    </div>
                                `;
            console.error(err);
          }
        });
      });
    } else {
      alertContainer.innerHTML = `
                        <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100">
                            ⚠️ ${data.detail?.message}
                        </div>
                    `;
    }
  } catch (error) {
    alertContainer.innerHTML = `
                    <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100">
                        ❌ Terjadi kesalahan saat memproses permintaan.
                    </div>
                `;
    console.error("Fetch error:", error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
