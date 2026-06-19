// src/config/appConfig.ts

export const AppConfig = {
  // Thông tin cửa hàng
  store: {
    name: "MekoStore",
    slogan: "",
    logo: require('@/src/assets/images/logo.png'),
    logoWidth: 300,
    logoHeight: 100,
  },

  tabs: {
    home: {
      label: "Trang chủ",
      icon: "home-outline",
    },
    courses: {
      label: "Cửa hàng",
      icon: "book-open-variant",
    },
    exams: {
      label: "Thi",
      icon: "file-document-edit-outline",
    },
    profile: {
      label: "Tài khoản",
      icon: "account-circle-outline",
    },
  },

  // ----- AppHeader -----
  header: {
    searchPlaceholder: "Tìm kiếm khóa học...",
    cartLabel: "Giỏ hàng",
    notificationLabel: "Thông báo",
  },

  // ----- Home -----
  home: {
    loading: "Đang tải...",
    sections: {
      featuredTitle: "Sản phẩm nổi bật",
      categoriesTitle: "Danh mục",
    },
    featuredCourses: {
      defaultTitle: "Sản phẩm nổi bật",
      viewAllLabel: "Xem tất cả",
      loadingLabel: "Đang tải...",
    },
    categories: {
      allLabel: "Tất cả",
      errorMessage: "Không thể tải danh mục",
      loadingLabel: "Đang tải danh mục...",
    },
    banners: {
      images: [
        require('@/src/assets/images/banner_01.png'),
        require('@/src/assets/images/banner_02.png'),
        require('@/src/assets/images/banner_03.png'),
        require('@/src/assets/images/banner_04.png'),
      ],
    },
  },

  // Text dùng chung
  common: {
    ok: "Đồng ý",
    cancel: "Huỷ",
    back: "Quay lại",
    loading: "Đang tải...",
  },

  welcome: {
    loginButton: "Đăng nhập",
    registerButton: "Đăng ký",
    authTitle: "ĐĂNG KÝ / ĐĂNG NHẬP",
    socialDivider: "Hoặc",
    supportText: "Bảo mật tuyệt đối · Hỗ trợ 24/7",
  },
  
  // ----- Màn hình Login -----
  login: {
    title: "Đăng nhập",
    emailLabel: "Email",
    emailPlaceholder: "ten@example.com",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "••••••••",
    loginButton: "Đăng nhập",
    loginButtonLoading: "Đang xử lý...",
    noAccount: "Chưa có tài khoản? ",
    signupLink: "Đăng ký ngay",
    showPasswordA11y: "Hiện mật khẩu",
    hidePasswordA11y: "Ẩn mật khẩu",
    // Các yêu cầu về mật khẩu
    passwordRequirements: {
      length: "8 ký tự trở lên",
      special: "Ít nhất 1 ký tự đặc biệt",
      upper: "Ít nhất 1 chữ hoa",
      number: "Ít nhất 1 chữ số",
    },
    // Thông báo lỗi (có thể dùng khi dispatch thất bại)
    errors: {
      invalidCredentials: "Email hoặc mật khẩu không đúng",
      networkError: "Lỗi kết nối, vui lòng thử lại",
      unknown: "Đăng nhập thất bại, vui lòng thử lại",
    },
    forgotPassword: "Quên mật khẩu?",
  },

  forgotPassword: {
    title: "Quên mật khẩu",
    description: "Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.",
    emailLabel: "Email",
    emailPlaceholder: "ten@example.com",
    sendButton: "Gửi yêu cầu",
    sendButtonLoading: "Đang gửi...",
    backToLogin: "Quay lại đăng nhập",
    successTitle: "Kiểm tra email",
    successMessage: (email: string) => `Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến ${email}.`,
    errors: {
      emailRequired: "Vui lòng nhập email",
      emailInvalid: "Email không hợp lệ",
      networkError: "Lỗi kết nối, vui lòng thử lại",
      userNotFound: "Không tìm thấy tài khoản với email này",
    },
  },

  // ----- Màn hình Register -----
  register: {
    title: "Tạo tài khoản mới",
    subTitle: "Đăng ký ngay để bắt đầu hành trình trải nghiệm",
    familyNameLabel: "Họ",
    familyNamePlaceholder: "Nguyễn",
    givenNameLabel: "Tên",
    givenNamePlaceholder: "An",
    nameLabel: "Họ và tên", // dùng trong review
    emailLabel: "Email",
    emailPlaceholder: "ten@example.com",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "••••••••",
    confirmPasswordLabel: "Xác nhận mật khẩu",
    confirmPasswordPlaceholder: "••••••••",
    registerButton: "Đăng ký",
    registerButtonLoading: "Đang xử lý...",
    haveAccount: "Đã có tài khoản? ",
    loginLink: "Đăng nhập",
    termsPrefix: "Bằng cách tiếp tục, bạn đồng ý với ",
    termsLink1: "Điều khoản",
    termsLink2: "Chính sách bảo mật",
    termsSuffix: " của MekoStore.",
    passwordRequirements: {
      length: "8 ký tự trở lên",
      special: "Ít nhất 1 ký tự đặc biệt",
      upper: "Ít nhất 1 chữ hoa",
      number: "Ít nhất 1 chữ số",
    },
    confirmMatchText: "Mật khẩu khớp",
    confirmNotMatchText: "Mật khẩu chưa khớp",
    errors: {
      familyNameRequired: "Vui lòng nhập họ",
      givenNameRequired: "Vui lòng nhập tên",
      emailInvalid: "Email không hợp lệ",
      passwordWeak: "Mật khẩu không đủ yêu cầu",
      passwordMismatch: "Mật khẩu xác nhận không khớp",
      emailExists: "Email đã được đăng ký",
      unknown: "Đăng ký thất bại, vui lòng thử lại",
    },
    steps: ["Cá nhân", "Tài khoản", "Xác nhận"],
    stepPersonalInfo: "Thông tin cá nhân",
    stepAccountInfo: "Thông tin tài khoản",
    stepConfirmInfo: "Xác nhận thông tin",
    stepBackButton: "Quay lại",
    stepNextButton: "Tiếp theo",
    reviewTitle: "Thông tin đăng ký",
    securityStatus: "Mật khẩu đã thiết lập",
  },
  
  courseCard: {
    showLogoOverlay: true,        // có hiển thị logo chồng lên ảnh không
    logoWidth: 28,                // kích thước logo nhỏ trên card
    logoHeight: 28,
    freeBadgeText: "Miễn phí",
    priceFormat: (price: number) => price === 0 ? "Miễn phí" : price.toLocaleString('vi-VN') + 'đ',
    // Các badge
    freeBadge: "Miễn phí",
    discountPrefix: "-",        // ví dụ "-20%"
    // Giá
    priceFree: "Miễn phí",
    // Toast messages
    addToCartSuccess: "Đã thêm vào giỏ hàng",
    addToCartError: "Không thể thêm vào giỏ",
    addToCartErrorDefault: "Đã xảy ra lỗi",
    // Nút thêm giỏ
    addButtonA11y: "Thêm vào giỏ hàng",
  },
  // ----- Màn hình Cart -----
  cart: {
    // Header
    title: "Giỏ hàng",
    clearAllLabel: "Xoá tất cả",
    deleteLabel: "Xoá",

    // Empty
    emptyTitle: "Giỏ hàng trống",
    emptyMessage: "Thêm sản phẩm vào giỏ để bắt đầu trải nghiệm với chúng tôi!",
    emptyButton: "Xem sản phẩm",

    // Confirm dialogs
    deleteConfirmTitle: "Xoá sản phẩm",
    deleteConfirmMessage: (name: string) => `Xoá "${name}" khỏi giỏ hàng?`,
    deleteAllConfirmTitle: "Xoá giỏ hàng",
    deleteAllConfirmMessage: "Xoá toàn bộ sản phẩm trong giỏ?",

    // Coupon
    couponPlaceholder: "Nhập mã giảm giá",
    couponApply: "Áp dụng",
    couponApplied: (code: string) => `Mã ${code} đã được áp dụng.`,
    couponInvalid: "Mã không hợp lệ",

    // Checkout bar
    totalLabel: "Tổng:",
    checkoutButton: "Mua hàng",
    checkoutButtonWithCount: (count: number) => `Mua hàng (${count})`,
    selectAll: "Tất cả",

    // Shop voucher
    shopVoucher: "Voucher Shop",

    // Platform voucher
    platformVoucherTitle: "Voucher MekoStore",
    platformVoucherSub: "Chọn mã để được giảm thêm",
    platformVoucherAction: "Chọn mã",

    // Order summary
    orderSummaryTitle: "Chi tiết thanh toán",
    subtotalLabel: "Tạm tính",
    productDiscountLabel: "Giảm giá sản phẩm",
    couponDiscountLabel: "Mã",
    finalTotalLabel: "Tổng tiền",
    savingsMessage: (amount: string) => `Bạn tiết kiệm được ${amount} cho đơn hàng này`,
  },
};
