import '../styles/globals.css'

export const metadata = {
  title: 'Cricket Signatures',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="thumb-wrap">
        </div>
      </body>
    </html>
  )
}
