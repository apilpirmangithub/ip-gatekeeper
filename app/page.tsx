"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import IPGatekeeperCartoon from '@/components/IPGatekeeperCartoon';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        opacity: 0.3
      }}>
        {/* Cloud 1 */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '100px',
          height: '40px',
          background: 'white',
          borderRadius: '100px',
          animation: 'float 20s infinite'
        }}>
          <div style={{
            position: 'absolute',
            width: '50px',
            height: '50px',
            background: 'white',
            borderRadius: '100px',
            top: '-25px',
            left: '10px'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '60px',
            height: '40px',
            background: 'white',
            borderRadius: '100px',
            top: '-15px',
            right: '10px'
          }}></div>
        </div>

        {/* Cloud 2 */}
        <div style={{
          position: 'absolute',
          top: '40%',
          right: '20%',
          width: '80px',
          height: '35px',
          background: 'white',
          borderRadius: '100px',
          animation: 'float 25s infinite reverse'
        }}>
          <div style={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            background: 'white',
            borderRadius: '100px',
            top: '-20px',
            left: '15px'
          }}></div>
          <div style={{
            position: 'absolute',
            width: '50px',
            height: '35px',
            background: 'white',
            borderRadius: '100px',
            top: '-10px',
            right: '15px'
          }}></div>
        </div>
      </div>

      {/* Main container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '2rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Simple Header */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto 3rem auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🛡️
            </div>
            <div>
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                IP Gatekeeper
              </h1>
              <p style={{
                fontSize: '12px',
                color: '#6B7280',
                margin: 0
              }}>
                Powered by Story Protocol
              </p>
            </div>
          </div>
          
          <div style={{
            transform: 'scale(0.9)'
          }}>
            <ConnectButton />
          </div>
        </nav>

        {/* Hero Text */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          maxWidth: '800px',
          margin: '0 auto 3rem auto'
        }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '1rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Protect Your Creative Assets
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: '1.6'
          }}>
            Advanced AI detection meets blockchain security. Register and protect your IP in minutes!
          </p>
        </div>

        {/* Main Application */}
        <IPGatekeeperCartoon />

        {/* Simple Footer */}
        <footer style={{
          marginTop: 'auto',
          paddingTop: '4rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '14px'
        }}>
          <p>© 2025 IP Gatekeeper. All rights reserved.</p>
        </footer>
      </div>

      {/* Add animations */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateX(0) translateY(0); }
          33% { transform: translateX(30px) translateY(-10px); }
          66% { transform: translateX(-20px) translateY(5px); }
          100% { transform: translateX(0) translateY(0); }
        }
      `}</style>
    </main>
  );
}
