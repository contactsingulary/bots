export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="en">
      <body style={{background:"#111"}}>{children}</body>
    </html>
  );
}
