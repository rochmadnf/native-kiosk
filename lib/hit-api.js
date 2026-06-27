import { swalError } from "./swal.js";

export const theHeaders = {
  "User-Agent": navigator.userAgent,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Authorization: "Basic c2lwZGlua2VzcGFsdTpDZUhjNUU4UXV2NmhOMUhy",
  versi: "0.1.2",
  "X-Token": localStorage.getItem("sian_token"),
};

export const API_BASE_ENDPOINT = "https://api.medikaconnect.site/v1";

export const settings = {
  BASE_URL: `${location.protocol}//${location.host}`,
  IP_SERVER: localStorage.getItem("ip_server"),
  ANTREAN: {
    cookie: localStorage.getItem("cookie_header_bpjs_antrean"),
    token: localStorage.getItem("token_bpjs_antrean"),
  },
  USER_ACCOUNT: {
    username: localStorage.getItem("acct_username"),
    password: localStorage.getItem("acct_password"),
  },
};

export const hitungUsia = (tgl_lahir) => {
  const today = new Date();
  const birthDate = new Date(tgl_lahir);

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  const days = today.getDate() - birthDate.getDate();

  // Koreksi jika belum lewat bulan/tanggal ulang tahun tahun ini
  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }

  // Koreksi jika hari belum lewat di bulan ini
  if (days < 0) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  return `${years} Tahun ${months} Bulan`;
};

export const DashboardApi = async () => {
  await fetch(`${API_BASE_ENDPOINT}/dashboard/`, {
    method: "GET",
    headers: theHeaders,
  })
    .then(async (response) => {
      if (!response.ok) {
        const pass = localStorage.getItem("acct_password");
        const user = localStorage.getItem("acct_username");

        if (pass && user) {
          const response = await LoginApi();

          if (response.status) {
            window.location.href = `${location.protocol}//${location.host}`;
          } else {
            swalError("Gagal", response.message, {
              showConfirmButton: true,
              confirmButtonText: `<span class="text-center align-middle">Ayo atur</span>`,
              timer: undefined,
              optionsConstant: "outsideClickFalse",
            }).then((result) => {
              if (result.isConfirmed) {
                window.localStorage.clear();
                window.location.href = `${location.protocol}//${location.host}/settings`;
              }
            });
          }
        } else {
          swalError("Gagal", "Username dan Password belum diatur.", {
            showConfirmButton: true,
            confirmButtonText: `<span class="text-center align-middle">Ayo atur</span>`,
            timer: undefined,
            optionsConstant: "outsideClickFalse",
          }).then((result) => {
            if (result.isConfirmed) {
              window.localStorage.clear();
              window.location.href = `${location.protocol}//${location.host}/settings`;
            }
          });
        }
      }
      return response.json();
    })
    .then((data) => {
      console.log("sukses login");
    })
    .catch((error) => {
      console.error("Error fetching dashboard:", error);
    });
};

export const LoginApi = async () => {
  const formData = new URLSearchParams();
  formData.append("username", localStorage.getItem("acct_username"));
  formData.append("password", localStorage.getItem("acct_password"));

  return await fetch(`${API_BASE_ENDPOINT}/auth/login/`, {
    method: "POST",
    headers: { Authorization: theHeaders.Authorization },
    body: formData,
  })
    .then(async (response) => {
      const res = await response.json();
      if (res.status) {
        localStorage.setItem("sian_token", res.data.accessToken);
      }
      return res;
    })
    .catch((error) => {
      console.error("Error fetching:", error);
    });
};

export const CheckNik = async (nik) => {
  // Step 1: Cek NIK (GET request)
  let resJson = null;

  const epn =
    API_BASE_ENDPOINT +
    (nik.length === 16 ? "/pasien/nik/" : "/nabelo/cek-nik/") +
    nik;

  try {
    const res = await fetch(epn, {
      method: "GET",
      headers: theHeaders,
    });

    if (!res.ok) throw new Error("Cek NIK request failed");
    resJson = await res.json();
  } catch (err) {
    console.error("Error fetching NIK:", err);
    resJson = {
      status: false,
      message: `<strong>${nik}</strong> kemungkinan belum terdaftar.`,
    };
  }

  if (!resJson.status) {
    return { detail: resJson };
  }

  // Step 2: Get Layanan (GET request)
  let layananJson = null;
  try {
    const layanan = await fetch(
      `${API_BASE_ENDPOINT}/ruang-layanan?limit=100&page=1`,
      {
        method: "GET",
        headers: theHeaders,
      },
    );

    if (!layanan.ok) throw new Error("Get Layanan request failed");
    layananJson = await layanan.json();
  } catch (err) {
    console.error("Error fetching layanan:", err);
  }

  let kepesertaanJson = null;
  try {
    kepesertaanJson = await checkStatusPesertaBpjs(resJson.data.nik);
    if (!kepesertaanJson.status)
      throw new Error("Get Status Kepersertaan request failed");
  } catch (err) {
    console.error("Error fetching Status Kepersertaan:", err);
  }

  // Combined Response
  return {
    detail: resJson,
    kepesertaan: kepesertaanJson,
    layanan: layananJson,
  };
};

export const getAntrean = async ({ nik, poli, dokter_id }) => {
  try {
    const response = await fetch(`${API_BASE_ENDPOINT}/antrean/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...theHeaders,
      },
      body: JSON.stringify({
        agent: "loket",
        nik,
        kode_faskes: "1070365",
        poli,
        dokter: dokter_id,
        screening: "0",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message);
      throw new Error(`Request failed with status ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error("Error ambil antrian:", error);
    throw error;
  }
};

export const getVisitorList = async (status = "", limit = 30) => {
  try {
    const response = await fetch(
      `${API_BASE_ENDPOINT}/antrean?search=&page=1&limit=${limit}&status=${status}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...theHeaders,
        },
      },
    ).then((res) => res.json());

    return response.data.data;
  } catch (err) {
    console.error("Error fetching:", err);
  }
};

export const forwardToPoli = async (id_kunjungan, poli) => {
  try {
    const response = await fetch(
      `${API_BASE_ENDPOINT}/antrean/confirm/${id_kunjungan}`,
      {
        method: "PATCH",
        body: JSON.stringify({ poli }),
        headers: {
          "Content-Type": "application/json",
          ...theHeaders,
        },
      },
    ).then((res) => res.json());

    return response.data;
  } catch (err) {
    console.error("Error fetching:", err);
  }
};

export const checkStatusPesertaBpjs = async (nik, kodeFaskes = "1070365") => {
  try {
    const response = await fetch(
      `${API_BASE_ENDPOINT}/bpjs/peserta/nik/${nik}?kode_faskes=${kodeFaskes}`,
      {
        method: "GET",
        headers: {
          ...theHeaders,
        },
      },
    ).then((res) => res.json());

    return response;
  } catch (err) {
    console.error("Error fetching:", err);
  }
};

export const changeKepesertaan = async (id_kunjungan, jenisJaminan) => {
  try {
    return await fetch(
      `${API_BASE_ENDPOINT}/antrean/kepesertaan/${id_kunjungan}`,
      {
        method: "PATCH",
        headers: {
          ...theHeaders,
        },
        referrer: "https://smartpkm.medikaconnect.site/",
        body: `{\"jenis_jaminan\":\"${jenisJaminan}\"}`,
        mode: "cors",
      },
    ).then((res) => res.json());
  } catch (err) {
    console.error("Error change jaminan:", err);
  }
};

export const printQueueNumber = async (data) => {
  const response = await fetch(`${settings.IP_SERVER}/api/print-struk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};
