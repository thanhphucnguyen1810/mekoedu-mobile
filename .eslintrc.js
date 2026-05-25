// module.exports = {
//   root: true, // Chỉ định đây là file config gốc, không tìm kiếm lên các thư mục cha
//   extends: ['universe/native', 'plugin:react-hooks/recommended', 'expo'],
//   plugins: ['react', 'react-native'],
//   parserOptions: {
//     ecmaFeatures: {
//       jsx: true,
//     },
//   },
//   env: {
//     'react-native/react-native': true,
//   },
//   rules: {
//     // 1. Quy tắc React & Hooks
//     'react-hooks/rules-of-hooks': 'error',
//     'react-hooks/exhaustive-deps': 'warn',
//     'react/prop-types': 'off', // Dùng TypeScript nên không cần prop-types
//     'react/display-name': 'off',

//     // 2. Quy tắc React Native
//     'react-native/no-unused-styles': 'warn',
//     'react-native/no-inline-styles': 'warn', // Khuyến khích dùng StyleSheet thay vì inline style
//     'react-native/no-color-literals': 'warn', // Khuyến khích dùng theme colors

//     // 3. Quy tắc chung
//     'no-console': ['warn', { allow: ['warn', 'error'] }],
//     'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
//     semi: ['error', 'never'], // Không chấm phẩy
//     quotes: ['error', 'single'], // Dùng dấu nháy đơn
//     indent: ['error', 2, { SwitchCase: 1 }],
//     'comma-dangle': ['error', 'always-multiline'], // Cần thiết cho Git diff sạch
//     'object-curly-spacing': ['error', 'always'],
//     'arrow-spacing': ['error', { before: true, after: true }],
//   },
//   settings: {
//     react: {
//       version: 'detect', // Tự động nhận diện version React
//     },
//     'import/resolver': {
//       typescript: {}, // Giúp ESLint hiểu đường dẫn @/ của bạn
//     },
//   },
// }
