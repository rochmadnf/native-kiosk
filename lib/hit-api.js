export const theHeaders = {
  Authorization: "Basic c2lwZGlua2VzcGFsdTpDZUhjNUU4UXV2NmhOMUhy",
  "X-Token": localStorage.getItem("sian_token"),
  Versi: "0.1.2",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
};

export const API_BASE_ENDPOINT = "https://api.medikaconnect.site/v1";

export const settings = {
  IP_SERVER: localStorage.getItem("ip_server"),
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
  fetch(`${API_BASE_ENDPOINT}/dashboard/`, {
    method: "GET",
    headers: theHeaders,
  })
    .then(async (response) => {
      if (!response.ok) {
        if (
          localStorage.getItem("acct_username") &&
          localStorage.getItem("acct_password")
        ) {
          await LoginApi();
          window.location.href = `${location.protocol}//${location.host}`;
        } else {
          alert("Silahkan atur username dan password di halaman pengaturan.");
          throw new Error("Unauthorized access - Login required");
        }
      }
      return response.json();
    })
    .then((data) => {
      console.log("sukses login");
      //   console.log("Dashboard Response:", data);
    })
    .catch((error) => {
      console.error("Error fetching dashboard:", error);
    });
};

export const LoginApi = async () => {
  const formData = new URLSearchParams();
  formData.append("username", settings.USER_ACCOUNT.username);
  formData.append("password", settings.USER_ACCOUNT.password);

  await fetch("https://api.medikaconnect.site/v1/auth/login/", {
    method: "POST",
    headers: { Authorization: theHeaders.Authorization },
    body: formData,
  })
    .then(async (response) => {
      const res = await response.json();
      localStorage.setItem("sian_token", res.data.accessToken);
      return res;
    })
    .catch((error) => {
      console.error("Error fetching:", error);
    });
};

export const CheckNik = async (nik) => {
  // Step 1: Cek NIK (GET request)
  let resJson = null;
  try {
    const res = await fetch(`${API_BASE_ENDPOINT}/nabelo/cek-nik/${nik}`, {
      method: "GET",
      headers: theHeaders,
    });

    if (!res.ok) throw new Error("Cek NIK request failed");
    resJson = await res.json();
  } catch (err) {
    console.error("Error fetching NIK:", err);
    resJson = {
      status: false,
      message: `NIK: <strong>${nik}</strong> kemungkinan belum terdaftar.`,
    };
  }

  // Step 2: Get Layanan (GET request)
  let layananJson = null;
  try {
    const layanan = await fetch(`${API_BASE_ENDPOINT}/ruang-layanan`, {
      method: "GET",
      headers: theHeaders,
    });

    if (!layanan.ok) throw new Error("Get Layanan request failed");
    layananJson = await layanan.json();
  } catch (err) {
    console.error("Error fetching layanan:", err);
  }

  // Combined Response
  return {
    detail: resJson,
    layanan: layananJson,
  };
};

export const getAntrean = async ({ nik, id_ruang, dokter }) => {
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
        poli: id_ruang,
        dokter,
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
