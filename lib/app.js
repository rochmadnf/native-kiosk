import { CheckNik, DashboardApi, hitungUsia } from "./hit-api.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.26.25/+esm";

const nikContent = document.getElementById("nikContent");
const myHeader = document.getElementById("myHeader");
const patientForm = document.getElementById("patientForm");
const nikInput = document.getElementById("nik");
const submitBtn = patientForm.querySelector("button[type='submit']");

// cek user
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
      Swal.fire({
        toast: true,
        text: "Berhasil disalin",
        icon: "success",
        width: "fit-content",
        position: "top",
        showConfirmButton: false,
        timer: 800,
        timerProgressBar: true,
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
  return ` <section
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
            <i
              class="ph ph-pencil-simple text-green-900 text-lg pointer-events-none"
            ></i>
          </a>
          <button
            onclick="resetPatient()"
            class="inline-flex items-center p-1 rounded-md border border-green-500/75 cursor-pointer transition duration-200 hover:bg-brand-bg/75"
          >
            <i
              class="ph ph-arrows-clockwise text-green-900 text-lg pointer-events-none"
            ></i>
          </button>
        </div>
      </div>

      <div class="space-y-2 border-t border-brand-border py-2">
        <div class="flex items-center gap-x-4 w-full justify-between">
          <div class="w-full">
            <label for="name" class="text-xs text-green-900 font-semibold"
              >Nama</label
            >
            <p class="w-full text-lg font-mono text-green-900 tracking-wider">
              ${patient.nama}
            </p>
          </div>

          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">Usia</label>
            <p class="w-full text-lg font-mono text-green-900">
              ${hitungUsia(patient.tgl_lahir)}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-x-4 w-full justify-between">
          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">NIK</label>
            <p
              class="w-full text-lg font-mono text-green-900 tracking-wider cursor-pointer hover:text-green-900/75"
              onclick="copyToClipboard('${patient.nik}')"
            >
              ${patient.nik}
            </p>
          </div>

          <div class="w-full">
            <label class="text-xs text-green-900 font-semibold">No. HP</label>
            <p class="w-full text-lg font-mono text-green-900 tracking-wider">
              ${patient.no_telpon ?? "-"}
            </p>
          </div>
        </div>

        <div>
          <label class="text-xs text-green-900 font-semibold">No. BPJS</label>
          <p
            class="w-full text-lg font-mono text-green-900 tracking-wider cursor-pointer hover:text-green-900/75"
            onclick="copyToClipboard('${patient.no_kartu_jaminan}')"
          >
            ${patient.no_kartu_jaminan ?? "-"}
          </p>
        </div>
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
  const detailSection = document.getElementById("detailPatient");
  if (detailSection) {
    detailSection.classList.add("animate__fadeOutLeft");

    detailSection.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName === "fadeOutLeft") {
          detailSection.remove();
          patientForm.reset();
          setLoading(false); // pastikan tombol kembali normal

          clearAnimations(nikContent);
          nikContent.classList.remove("hidden");
          nikContent.classList.add("flex", "animate__fadeInLeft");

          // fokus kembali ke input NIK setelah animasi masuk
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

  Swal.fire({
    toast: true,
    html: response.detail.message,
    icon: response.detail.status ? "success" : "error",
    width: "fit-content",
    position: "top",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  if (response.detail.status !== true) return;

  clearAnimations(nikContent);
  nikContent.classList.add("animate__fadeOutLeft");

  nikContent.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName === "fadeOutLeft") {
        nikContent.classList.remove("flex");
        nikContent.classList.add("hidden");

        myHeader.insertAdjacentHTML(
          "afterend",
          detailPatientSection(response.detail.data),
        );

        document
          .getElementById("detailPatient")
          .classList.add("animate__fadeInRight");
      }
    },
    { once: true },
  );
});
