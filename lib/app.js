import { listDoctor } from "./antrean-bpjs.js";
import {
  changeKepesertaan,
  CheckNik,
  DashboardApi,
  forwardToPoli,
  getAntrean,
  hitungUsia,
  printQueueNumber,
  settings,
} from "./hit-api.js";
import { swalDefault, swalError, swalInfo, swalSuccess } from "./swal.js";
import fktpPalu from "../constants/fktp-palu.json" with { type: "json" };

const nikContent = document.getElementById("nikContent");
const myHeader = document.getElementById("myHeader");
const patientForm = document.getElementById("patientForm");
const nikInput = document.getElementById("nik");
const submitBtn = patientForm.querySelector("button[type='submit']");

// ── Global state ───────────────────────────────────────────────────────────
const state = {
  patient: null, // data dari response.detail.data
  poli: null, // data poli yang dipilih user
  kepesertaan: null,
  kode_faskes: "03190005",
};

// ── Cek user ───────────────────────────────────────────────────────────────
window.addEventListener("load", async () => {
  await DashboardApi();
});

// ── Hanya angka yang boleh diinput ────────────────────────────────────────
nikInput.addEventListener("input", () => {
  nikInput.value = nikInput.value.replace(/\D/g, "");
});

document.getElementById("btnSetting").addEventListener("click", () => {
  window.location.href = `/settings.html`;
});

// ── Loading state helpers ──────────────────────────────────────────────────
function setLoading(isLoading) {
  nikInput.disabled = isLoading;
  submitBtn.disabled = isLoading;

  if (isLoading) {
    submitBtn.innerHTML = `
      <svg
        class="animate-spin pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        width="28" height="28" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    `;
  } else {
    submitBtn.innerHTML = `
      <i class="ph ph-magnifying-glass pointer-events-none text-[30px]"></i>
    `;
  }
}

// ── Clipboard ──────────────────────────────────────────────────────────────
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => {
      swalSuccess("", "Berhasil disalin!", {
        toast: true,
        width: "fit-content",
        position: "top",
        timer: 800,
      });
    },
    (err) => {
      console.error("Gagal menyalin : ", err);
    },
  );
}
window.copyToClipboard = copyToClipboard;

// ── Detail pasien template ─────────────────────────────────────────────────
function detailPatientSection(patient) {
  return `<section
      id="detailPatient"
      aria-label="Data Pasien ${patient.nama}"
      class="flex flex-col border gap-y-4 border-brand-border rounded-md py-4 px-6 shadow-xs animate__animated"
    >
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-green-900 text-[13px]">Data Pasien</h2>
        <div class="flex items-center gap-x-2">
          <a
            target="_blank"
            href="https://smartpkm.medikaconnect.site/pasien/update/${patient.id_iup}"
            class="inline-flex items-center p-1 rounded-md border border-green-500/75 cursor-pointer transition duration-200 hover:bg-brand-bg/75"
          >
            <i class="ph ph-pencil-simple text-green-900 text-lg pointer-events-none"></i>
          </a>
          <button
            onclick="resetPatient()"
            class="inline-flex items-center p-1 rounded-md border border-green-500/75 cursor-pointer transition duration-200 hover:bg-brand-bg/75"
          >
            <i class="ph ph-arrows-clockwise text-green-900 text-lg pointer-events-none"></i>
          </button>
        </div>
      </div>

      <div class="space-y-2 border-t border-brand-border py-2">
        <div class="flex items-center gap-x-4 w-full justify-between">
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">Nama</label>
            <p class="w-full text-lg font-mono text-green-900 tracking-wider">${patient.nama}</p>
          </div>
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">Usia</label>
            <p class="w-full text-lg font-mono text-green-900">${hitungUsia(patient.tgl_lahir)}</p>
          </div>
        </div>

        <div class="flex items-center gap-x-4 w-full justify-between">
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">NIK</label>
            <p
              class="w-full text-lg font-mono text-green-900 tracking-wider cursor-pointer hover:text-green-900/75"
              onclick="copyToClipboard('${patient.nik}')"
            >${patient.nik}</p>
          </div>
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">No. HP</label>
            <p class="w-full text-lg font-mono text-green-900 tracking-wider">${patient.no_telpon ?? "-"}</p>
          </div>
        </div>

        <div class="flex items-center gap-x-4 w-full justify-between">
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">No. BPJS</label>
            <p
            class="w-full text-lg font-mono text-green-900 tracking-wider cursor-pointer hover:text-green-900/75"
            onclick="copyToClipboard('${patient.no_kartu_jaminan}')"
            >${patient.no_kartu_jaminan ?? "-"}</p>
          </div>
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">Status Peserta</label>
            <p class="w-full text-lg font-mono text-green-900 tracking-wider">${patient.ketAktif} &mdash; FASKES: ${patient.kdProviderPst.nmProvider}</p>
          </div>
        </div>

      </div>
    </section>`;
}

// ── Data tambahan per poli ─────────────────────────────────────────────────
const listPoli = [
  { id_poliklinik: 1, keterangan: "Untuk semua usia", icon: "gender-female" },
  { id_poliklinik: 2, keterangan: "Usia < 7 Tahun", icon: "baby-carriage" },
  { id_poliklinik: 3, keterangan: "Usia 7 - 18 Tahun", icon: "person-simple" },
  { id_poliklinik: 4, keterangan: "Usia 19 - 59 Tahun", icon: "ghost" },
  {
    id_poliklinik: 5,
    keterangan: "Usia 60 Tahun ke atas",
    icon: "person-simple-walk",
  },
  { id_poliklinik: 6, keterangan: "Untuk semua usia", icon: "tooth" },
  { id_poliklinik: 7, keterangan: "Untuk semua usia", icon: "stethoscope" },
];

// ── Cache data poli dari API untuk lookup via index ───────────────────────
let _poliCache = [];

// ── Pilih poli → simpan ke state ──────────────────────────────────────────
async function selectPoli(index) {
  state.poli = _poliCache[index];

  const faskesPeserta = state.kepesertaan.kdProviderPst;

  const isFaskesPalu = fktpPalu.find(
    (fktp) => fktp.kdppk === faskesPeserta.kdProvider,
  );

  // --- Blok konfirmasi: return false jika tidak dilanjutkan ---
  if (
    faskesPeserta.kdProvider === state.kode_faskes &&
    isFaskesPalu?.kdppk === state.kode_faskes &&
    state.kepesertaan.aktif
  ) {
    console.info(`Faskes ${faskesPeserta.nmProvider}`);
  } else if (
    state.kepesertaan.aktif === false &&
    faskesPeserta.kdProvider === state.kode_faskes
  ) {
    const result = await swalError("BPJS Non Aktif", "", {
      html: `Status BPJS kamu sedang <strong>Tidak Aktif</strong>. Apakah mau mendaftar sebagai <strong>Pasien Umum</strong>.?`,
      showConfirmButton: true,
      confirmButtonText: "Iya, Daftar Umum",
      showDenyButton: true,
      denyButtonText: "Tidak, Nanti saja",
      timer: undefined,
      optionsConstant: "outsideClickFalse",
    });

    if (result.isDenied) {
      window.location.href = settings.BASE_URL;
      return;
    }

    // User confirmed → tampilkan info biaya
    const infoRes = await swalInfo("Informasi", "", {
      html: `Kamu akan membayar biaya pendaftaran sebesar <strong>Rp9.000</strong>`,
      showConfirmButton: true,
      confirmButtonText: "Ya, Tidak Masalah",
      timer: undefined,
      showDenyButton: true,
      denyButtonText: "Nggak jadi deh!",
      optionsConstant: "outsideClickFalse",
    });

    if (infoRes.isDenied) {
      window.location.href = settings.BASE_URL;
      return;
    }
  } else if (isFaskesPalu) {
    const result = await swalError("FASKES LAIN (SATU WILAYAH)", "", {
      html: `Kamu terdaftar di Faskes <strong>${isFaskesPalu.nmppk}</strong>. Apakah mau mendaftar sebagai <strong>Pasien Umum</strong>.?`,
      showConfirmButton: true,
      confirmButtonText: "Iya, Daftar Umum",
      showDenyButton: true,
      denyButtonText: "Tidak, Nanti saja",
      timer: undefined,
      optionsConstant: "outsideClickFalse",
    });

    if (result.isDenied) {
      window.location.href = settings.BASE_URL;
      return;
    }

    // User confirmed → tampilkan info biaya
    const infoRes = await swalInfo("Informasi", "", {
      html: `Kamu akan membayar biaya pendaftaran sebesar <strong>Rp9.000</strong>`,
      showConfirmButton: true,
      confirmButtonText: "Ya, Tidak Masalah",
      timer: undefined,
      showDenyButton: true,
      denyButtonText: "Nggak jadi deh!",
      optionsConstant: "outsideClickFalse",
    });

    if (infoRes.isDenied) {
      window.location.href = settings.BASE_URL;
      return;
    }
  } else {
    await swalError(
      "FASKES LUAR WILAYAH PALU",
      "Kamu terdaftar di Faskes Luar Wilayah Kota Palu, Silakan ambil antrean melalui petugas resepsionis.",
      {
        showConfirmButton: true,
        confirmButtonText: "Baik, Terima kasih",
        timer: undefined,
      },
    );

    window.location.href = settings.BASE_URL;
    return;
  }

  // --- Semua konfirmasi selesai, baru ambil antrean ---
  const responseAtrean = await getAntrean({
    nik: state.patient.nik,
    poli: state.poli.kode_ruang,
    dokter_id: state.poli.id_dokter,
  });

  swalDefault(
    responseAtrean.status ? responseAtrean.data.nomor_antrian : "Gagal",
    responseAtrean.status
      ? responseAtrean.message
      : "Server gagal menerima permintaan.",
    responseAtrean.status ? "success" : "error",
  );

  if (responseAtrean.status) {
    let printBody = null;

    if (
      state.kepesertaan.aktif === true &&
      faskesPeserta.kdProvider === state.kode_faskes
    ) {
      printBody = responseAtrean.data;
    } else {
      // umum
      printBody = {
        ...responseAtrean.data,
        self_service: {
          status_bpjs: state.kepesertaan.aktif,
          faskes_match: faskesPeserta.kdProvider === state.kode_faskes,
          faskes_name: faskesPeserta.nmProvider,
        },
      };

      await changeKepesertaan(responseAtrean.data.id_kunjungan, "Umum");
    }

    const printStruck = await printQueueNumber(printBody);

    if (printStruck.status) {
      const fwPoli = await forwardToPoli(
        responseAtrean.data.id_kunjungan,
        state.poli.kode_ruang,
      );

      swalSuccess("Berhasil", fwPoli.message, { showConfirmButton: true }).then(
        () => {
          window.location.href = settings.BASE_URL;
        },
      );
    }
  }
}

window.selectPoli = selectPoli;

// ── Template card poli ────────────────────────────────────────────────────
function poliCardTemplate(item, index) {
  const extraItem = listPoli.find(
    (poli) => poli.id_poliklinik === item.kode_ruang,
  );

  return `
    <button
      onclick="selectPoli(${index})"
      class="flex flex-col text-green-900 cursor-pointer text-left gap-2 px-4 py-2 rounded-md border border-brand-border transition duration-200 hover:bg-brand-bg/75"
    >
      <div class="flex items-center justify-between border-b border-b-brand-border pb-4">
        <i class="ph ph-${extraItem?.icon ?? "house-line"} text-2xl pointer-events-none"></i>
        <span
          title="Ruang ${item.kode_ruang}"
          class="size-5 rounded-full font-semibold border border-brand-old inline-flex p-2 items-center justify-center font-mono text-sm"
        >${item.kode_ruang}</span>
      </div>

      <span class="font-bold text-[17px]">${item.nama_pemeriksaan}</span>

      <div class="flex items-center">
        <i class="ph ph-stethoscope text-[17px] mr-1 pointer-events-none"></i>
        <span>${item.nama_dokter}</span>
      </div>

      <p class="italic font-light text-xs">${extraItem?.keterangan ?? ""}</p>
    </button>`;
}

// ── List poli section template ────────────────────────────────────────────
function listPoliSection(poliList) {
  // Simpan ke cache agar selectPoli(index) bisa lookup data lengkap
  _poliCache = poliList.data;

  return `
    <section
      id="listPoli"
      aria-label="Daftar Poli"
      class="flex flex-col border gap-y-4 border-brand-border rounded-md py-4 px-6 shadow-xs animate__animated"
    >
      <h2 class="font-semibold text-green-900 text-[13px]">Daftar Poli</h2>

      <div class="grid grid-cols-3 gap-4 border-t border-brand-border py-4">
        ${_poliCache.map(poliCardTemplate).join("")}
      </div>
    </section>`;
}

// ── Animation helpers ──────────────────────────────────────────────────────
function clearAnimations(el) {
  el.classList.remove(
    "animate__fadeOutLeft",
    "animate__fadeInLeft",
    "animate__fadeOutRight",
    "animate__fadeInRight",
  );
}

// ── Reset ke form NIK ──────────────────────────────────────────────────────
function resetPatient() {
  // Reset global state
  state.patient = null;
  state.poli = null;
  state.kepesertaan = null;

  const detailSection = document.getElementById("detailPatient");
  const poliSection = document.getElementById("listPoli");

  // Animasikan keluar semua section yang aktif
  [detailSection, poliSection].forEach((el) => {
    if (el) el.classList.add("animate__fadeOutLeft");
  });

  // Tunggu animasi detailPatient selesai sebagai anchor, lalu bersihkan semua
  if (detailSection) {
    detailSection.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName === "fadeOutLeft") {
          detailSection.remove();
          poliSection?.remove();
          patientForm.reset();
          setLoading(false);

          clearAnimations(nikContent);
          nikContent.classList.remove("hidden");
          nikContent.classList.add("flex", "animate__fadeInLeft");

          nikContent.addEventListener("animationend", () => nikInput.focus(), {
            once: true,
          });
        }
      },
      { once: true },
    );
  }
}
window.resetPatient = resetPatient;

// ── Submit form ────────────────────────────────────────────────────────────
patientForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nik = nikInput.value.trim();

  setLoading(true);
  const response = await CheckNik(nik);
  setLoading(false);

  swalDefault("", "", response.detail.status ? "success" : "error", {
    toast: true,
    html: response.detail.message,
    width: "fit-content",
    position: "top",
    timer: 3000,
  });

  if (!response.detail.status) return;

  // ── Simpan data pasien ke global state ──────────────────────────────────
  state.patient = response.detail.data;
  state.kepesertaan = response.kepesertaan.data;

  clearAnimations(nikContent);
  nikContent.classList.add("animate__fadeOutLeft");

  nikContent.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName === "fadeOutLeft") {
        nikContent.classList.remove("flex");
        nikContent.classList.add("hidden");

        // Insert listPoli dulu (tampil di bawah), lalu detailPatient (tampil di atas)
        myHeader.insertAdjacentHTML(
          "afterend",
          listPoliSection(response.layanan.data),
        );
        myHeader.insertAdjacentHTML(
          "afterend",
          detailPatientSection({
            ...response.detail.data,
            ...response.kepesertaan.data,
          }),
        );

        const detailEl = document.getElementById("detailPatient");
        const poliEl = document.getElementById("listPoli");

        // Animasi masuk detailPatient langsung
        detailEl.classList.add("animate__fadeInRight");

        // Animasi masuk listPoli dengan sedikit delay agar berurutan
        poliEl.style.animationDelay = "150ms";
        poliEl.classList.add("animate__fadeInRight");

        // Bersihkan delay setelah animasi selesai agar tidak mengganggu animasi berikutnya
        poliEl.addEventListener(
          "animationend",
          () => {
            poliEl.style.animationDelay = "";
          },
          { once: true },
        );
      }
    },
    { once: true },
  );
});
