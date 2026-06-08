import { CheckNik, DashboardApi, hitungUsia } from "./hit-api.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.26.25/+esm";

const nikContent = document.getElementById("nikContent");
const myHeader = document.getElementById("myHeader");
const patientForm = document.getElementById("patientForm");

// cek user
window.addEventListener("load", async () => {
  await DashboardApi();
});

document.getElementById("btnSetting").addEventListener("click", () => {
  window.location.href = `/settings.html`;
});

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

// Helper: bersihkan semua class animasi dari elemen
function clearAnimations(el) {
  el.classList.remove(
    "animate__fadeOutLeft",
    "animate__fadeInLeft",
    "animate__fadeOutRight",
    "animate__fadeInRight",
  );
}

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

          clearAnimations(nikContent);

          nikContent.classList.remove("hidden");
          nikContent.classList.add("flex", "animate__fadeInLeft");
        }
      },
      { once: true },
    );
  }
}
window.resetPatient = resetPatient;

patientForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(patientForm);
  const nik = formData.get("nik").trim();

  const response = await CheckNik(nik);

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

  // ✅ Bersihkan sisa class animasi sebelum fade out
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
