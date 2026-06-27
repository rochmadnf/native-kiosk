import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.26.25/+esm";

export const optionsConstant = {
  outsideClickFalse: {
    allowOutsideClick: false,
    allowEscapeKey: false,
  },
};

export function swalDefault(title, text, icon, extraOptions = {}) {
  const defaultOptions = {
    title,
    text,
    icon,
    showConfirmButton: false,
    confirmButtonColor: "#008236",
    timer: 5000,
    timerProgressBar: true,
  };

  if ("optionsConstant" in extraOptions) {
    extraOptions = {
      ...extraOptions,
      ...optionsConstant[extraOptions["optionsConstant"]],
    };
  }

  return Swal.fire({ ...defaultOptions, ...extraOptions });
}

export function swalError(title, text, extraOptions = {}) {
  return swalDefault(title, text, "error", extraOptions);
}
