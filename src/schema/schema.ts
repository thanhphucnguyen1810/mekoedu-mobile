import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email không được để trống")
    .email("Email không hợp lệ"),

  password: yup
    .string()
    .required("Mật khẩu không được để trống")
    .min(2, "Mật khẩu tối thiểu 6 ký tự"),
});

export const registerSchema = yup.object({
  familyName: yup.string().trim().required("Vui lòng nhập họ"),
  givenName: yup.string().trim().required("Vui lòng nhập tên"),
  email: yup
    .string()
    .trim()
    .email("Email không hợp lệ")
    .required("Vui lòng nhập email"),
  password: yup
    .string()
    .min(8, "Tối thiểu 8 ký tự")
    .matches(/[A-Z]/, "Cần có ít nhất 1 chữ hoa")
    .matches(/[0-9]/, "Cần có ít nhất 1 chữ số")
    .required("Vui lòng nhập mật khẩu"),
  confirm: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu không khớp")
    .required("Vui lòng xác nhận mật khẩu"),
});
