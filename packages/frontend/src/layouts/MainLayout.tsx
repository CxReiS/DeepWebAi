import React from 'react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        backgroundColor: '#0f0f0f',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0'
      }}>
        {/* Logo/Brand */}
        <div style={{
          padding: '0 16px 24px 16px',
          borderBottom: '1px solid #2a2a2a',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              AI
            </div>
            <span style={{ fontWeight: '600', fontSize: '16px' }}>DeepWebAI</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '0 8px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#2a2a2a',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '16px' }}>💬</span>
              New Chat
            </button>
            
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#a0a0a0',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '16px' }}>🏠</span>
              Workspace
            </button>
            
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#a0a0a0',
              fontSize: '14px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              Search
            </button>
          </div>

          {/* Chat History */}
          <div style={{ marginTop: '24px' }}>
            <div style={{
              padding: '0 16px 8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#666666',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#a0a0a0',
                fontSize: '13px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Previous conversation...
              </button>
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #2a2a2a',
          marginTop: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#ff6b35',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ffffff'
            }}>
              U
            </div>
            <div style={{
              flex: 1,
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                User
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666666',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                user@example.com
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Bar */}
        <header style={{
          height: '60px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: '#1a1a1a'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <select style={{
              backgroundColor: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              <option>GPT-4o</option>
              <option>Claude-3.5</option>
              <option>Llama 3.2</option>
            </select>
            <button style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a0a0a0',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}>
              +
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a0a0a0',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px'
            }}>
              ⚙️
            </button>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#ff6b35',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#ffffff',
              cursor: 'pointer'
            }}>
              U
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children || (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto',
              width: '100%'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#000000',
                marginBottom: '24px'
              }}>
                AI
              </div>
              
              <h1 style={{
                fontSize: '32px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                DeepWebAI
              </h1>
              
              <p style={{
                fontSize: '18px',
                color: '#a0a0a0',
                margin: '0 0 48px 0'
              }}>
                How can I help you today?
              </p>

              {/* Suggestion Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                width: '100%',
                marginBottom: '48px'
              }}>
                {[
                  { title: 'Code Review', description: 'Analyze and improve your code' },
                  { title: 'Debug Issue', description: 'Help troubleshoot problems' },
                  { title: 'Generate Code', description: 'Create new functionality' },
                  { title: 'Explain Concept', description: 'Learn about technologies' }
                ].map((item, index) => (
                  <button
                    key={index}
                    style={{
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #3a3a3a',
                      borderRadius: '12px',
                      padding: '20px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3a3a3a';
                      e.currentTarget.style.borderColor = '#4a4a4a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                      e.currentTarget.style.borderColor = '#3a3a3a';
                    }}
                  >
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      marginBottom: '8px'
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#a0a0a0'
                    }}>
                      {item.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Input Area */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #2a2a2a'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <textarea
              placeholder="Send a message..."
              style={{
                width: '100%',
                minHeight: '52px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '12px',
                color: '#ffffff',
                padding: '16px 50px 16px 16px',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button style={{
              position: 'absolute',
              right: '12px',
              bottom: '12px',
              width: '32px',
              height: '32px',
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
