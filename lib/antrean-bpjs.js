const HEADERS_BPJS_ANTREAN = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Content-Type": "application/json;charset=utf-8",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Priority: "u=0",
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
};

export const BASE_URL_BPJS_ANTREAN =
  "https://antrean.bpjs-kesehatan.go.id/antrean-faskes/rest";

export const listDoctor = [
  {
    kdpoli: "001",
    sian_id: "73123b9e-4427-45fd-86b5-c4bedd760344",
    kode: 12680460,
    nama: "dr. Yoseva Ni Made Stella Sarna (07:15 - 11:30)",
    kodedokter: 14601,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "001",
    sian_id: "b7bdc6cf-bfe5-4112-b5bc-c80d350c890b",
    kode: 12634218,
    nama: "dr. MELIYANA PERDANA SAFITRI (07:15 - 11:30)",
    kodedokter: 293027,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "001",
    sian_id: "c1110574-1e27-431b-936e-2d7a5bee38d5",
    kode: 12634242,
    nama: "dr. KHAIRUNNISA (07:15 - 11:30)",
    kodedokter: 421580,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "001",
    sian_id: "9f628746-eece-467c-bd97-9a22709854af",
    kode: 16596441,
    nama: "dr. KARINA SARISMADANI (07:15 - 11:30)",
    kodedokter: 526261,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "001",
    sian_id: "362ddf06-0c85-414e-823f-6b6dd1f4b7bd",
    kode: 20510250,
    nama: "dr. AINANI ADLINA NURRAMADHANI (07:15 - 11:30)",
    kodedokter: 620103,
    jampraktek: "07:15-11:30",
  },
  {
    kode: 22427333,
    sian_id: "0c90520e-3ede-48c7-bdda-0637680d0ed7",
    nama: "dr. ANDI HASRI AINUN ANISA (07:15 - 11:30)",
    kodedokter: 636026,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "001",
    sian_id: "ab047149-dfea-4e48-b1dd-b151b89d1892",
    kode: 20943600,
    nama: "dr. SITI HARTINA (07:15 - 11:30)",
    kodedokter: 440689,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "001",
    sian_id: "5c0aadd2-13c2-4598-877e-7dfef178802b",
    kode: 12634258,
    nama: "dr. DWI YUNISARI PRIYONO (07:15 - 11:30)",
    kodedokter: 486146,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "002",
    sian_id: "022f2398-f02e-4e18-b1f7-9bd161b3b14b",
    kode: 12634266,
    nama: "drg.lutfiah, M.Km (07:15 - 11:30)",
    kodedokter: 44697,
    jampraktek: "07:15-11:30",
  },
  {
    kdpoli: "002",
    sian_id: "c4d3feed-71f7-48dc-92aa-3648cf101fb3",
    kode: 12634274,
    nama: "drg. Nadila Ayu Naningtyas (07:15 - 11:30)",
    kodedokter: 52726,
    jampraktek: "07:15-11:30",
  },
];

export async function getNomorAntrean(bodyData) {
  return await fetch(`${BASE_URL_BPJS_ANTREAN}/app/getnomorantrian`, {
    credentials: "include",
    headers: {
      ...HEADERS_BPJS_ANTREAN,
      ...{
        "x-token": localStorage.getItem("token_bpjs_antrean"),
        "User-Agent": navigator.userAgent,
      },
    },
    referrer: "https://antrean.bpjs-kesehatan.go.id/antrean-faskes/",
    method: "POST",
    mode: "cors",
    body: JSON.stringify(bodyData),
  });
}
