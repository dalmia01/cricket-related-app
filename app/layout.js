import '../styles/globals.css'

export const metadata = {
  title: 'Cricket Signatures',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="top-thumb">
            <picture>
              <img src="/assets/images/thumb-logo.png" alt="logo" />
            </picture>
          </div>
        {children}
        <div className="thumb-wrap rand-rotate">
        </div>
          
      </body>
    </html>
  )
}
