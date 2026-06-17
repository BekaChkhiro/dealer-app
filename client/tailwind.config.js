/** @type {import('tailwindcss').Config} */
export default {
  // Only the public pages use Tailwind; preflight is OFF so we never reset the
  // Bootstrap-based authenticated app. `important` lets utilities win over any
  // Bootstrap rule on the pages where Tailwind classes are used.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  important: true,
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: { 50:'#fff6ec',100:'#ffe9d2',200:'#ffd0a3',300:'#ffb06a',400:'#ff8a30',500:'#f9700b',600:'#e26009',700:'#bb4a0b',800:'#943c11',900:'#783313',950:'#411806' },
        accent: { 50:'#eef6ff',100:'#d9eaff',200:'#bcdbff',300:'#8ec4ff',400:'#59a3ff',500:'#327fff',600:'#1b5ff5',700:'#1749e1',800:'#193cb6',900:'#1a378f',950:'#152357' },
        ink: { 50:'#f6f6f7',100:'#ececee',200:'#d6d6da',300:'#b2b2b9',400:'#88888f',500:'#6a6a72',600:'#52525a',700:'#3e3e45',800:'#252529',900:'#161619',950:'#0b0b0d' },
        success: { 50:'#ecfdf3',100:'#d1fadf',200:'#a6f4c5',300:'#6ce9a6',400:'#32d583',500:'#12b76a',600:'#039855',700:'#027a48',800:'#05603a',900:'#054f31',950:'#022c1c' },
        warning: { 50:'#fffaeb',100:'#fef0c7',200:'#fedf89',300:'#fec84b',400:'#fdb022',500:'#f79009',600:'#dc6803',700:'#b54708',800:'#93370d',900:'#7a2e0e',950:'#4e1d09' },
        danger: { 50:'#fff1f1',100:'#ffdfe0',200:'#ffc5c7',300:'#ff9da1',400:'#ff5760',500:'#f51f2b',600:'#d80d1a',700:'#b50a15',800:'#910f18',900:'#78131a',950:'#42060a' },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Georgian', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Noto Sans Georgian', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontWeight: { 400:'400', 500:'500', 600:'600', 700:'700', 800:'800', 900:'900' },
      borderRadius: { field: '8px', btn: '10px', card: '14px', pill: '9999px' },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.3)',
        card: '0 4px 16px -4px rgba(0,0,0,0.5)',
        pop: '0 10px 30px -8px rgba(0,0,0,0.6)',
        float: '0 20px 50px -12px rgba(0,0,0,0.7)',
      },
      spacing: { '4.5': '1.125rem', '13': '3.25rem' },
    },
  },
  plugins: [],
}
