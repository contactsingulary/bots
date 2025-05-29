export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="en" style={{background:"transparent"}}>
      <body style={{background:"transparent", margin:0, padding:0}}>{children}</body>
    </html>
  );
}
